-- Create installment_plans table
CREATE TABLE IF NOT EXISTS installment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  purchase_date DATE NOT NULL,
  installment_count INTEGER NOT NULL CHECK (installment_count > 1),
  monthly_amount DECIMAL(10,2) NOT NULL CHECK (monthly_amount > 0),
  description TEXT,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_installment_plans_status ON installment_plans (status);
CREATE INDEX idx_installment_plans_purchase_date ON installment_plans (purchase_date);
CREATE INDEX idx_installment_plans_payment_method ON installment_plans (payment_method_id);
CREATE INDEX idx_installment_plans_category ON installment_plans (category_id);

-- Add constraint to ensure monthly_amount * installment_count = total_amount
ALTER TABLE installment_plans 
ADD CONSTRAINT chk_installment_amount_consistency 
CHECK (ABS(monthly_amount * installment_count - total_amount) < 0.01);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_installment_plans_updated_at 
  BEFORE UPDATE ON installment_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 