-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount != 0),
  category_id UUID NOT NULL REFERENCES categories(id),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  source_type VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'installment', 'subscription')),
  source_id UUID, -- References installment_plans.id or subscriptions.id
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance (critical for reporting queries)
CREATE INDEX idx_transactions_date ON transactions (date);
CREATE INDEX idx_transactions_type ON transactions (type);
CREATE INDEX idx_transactions_category ON transactions (category_id);
CREATE INDEX idx_transactions_payment_method ON transactions (payment_method_id);
CREATE INDEX idx_transactions_source ON transactions (source_type, source_id);
CREATE INDEX idx_transactions_amount ON transactions (amount);

-- Create composite indexes for common query patterns
CREATE INDEX idx_transactions_date_type ON transactions (date, type);
CREATE INDEX idx_transactions_date_category ON transactions (date, category_id);
CREATE INDEX idx_transactions_month_year ON transactions (EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));

-- Add constraint to ensure income transactions have positive amounts and expenses have negative amounts
ALTER TABLE transactions 
ADD CONSTRAINT chk_transaction_amount_type 
CHECK (
  (type = 'income' AND amount > 0) OR 
  (type = 'expense' AND amount < 0)
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update bucket balance when bucket transfers are recorded
CREATE OR REPLACE FUNCTION update_bucket_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the bucket balance when a transfer is inserted
  IF TG_OP = 'INSERT' THEN
    UPDATE savings_buckets 
    SET current_balance = current_balance + NEW.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.bucket_id;
    RETURN NEW;
  END IF;
  
  -- Update balance when transfer is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE savings_buckets 
    SET current_balance = current_balance - OLD.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.bucket_id;
    RETURN OLD;
  END IF;
  
  -- Update balance when transfer amount is updated
  IF TG_OP = 'UPDATE' THEN
    UPDATE savings_buckets 
    SET current_balance = current_balance - OLD.amount + NEW.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.bucket_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply the trigger to bucket_transfers table
CREATE TRIGGER update_bucket_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bucket_transfers
  FOR EACH ROW 
  EXECUTE FUNCTION update_bucket_balance(); 