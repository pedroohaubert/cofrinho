-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  monthly_amount DECIMAL(10,2) NOT NULL CHECK (monthly_amount > 0),
  start_date DATE NOT NULL,
  end_date DATE,
  category_id UUID NOT NULL REFERENCES categories(id),
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_start_date ON subscriptions (start_date);
CREATE INDEX idx_subscriptions_end_date ON subscriptions (end_date);
CREATE INDEX idx_subscriptions_category ON subscriptions (category_id);
CREATE INDEX idx_subscriptions_payment_method ON subscriptions (payment_method_id);

-- Add constraint to ensure end_date is after start_date if provided
ALTER TABLE subscriptions 
ADD CONSTRAINT chk_subscription_date_order 
CHECK (end_date IS NULL OR end_date > start_date);

-- Create unique constraint for active subscription names (case insensitive)
CREATE UNIQUE INDEX idx_subscriptions_name_active 
ON subscriptions (LOWER(name)) 
WHERE status = 'active';

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 