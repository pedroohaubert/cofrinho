-- Create savings_buckets table
CREATE TABLE IF NOT EXISTS savings_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(10,2) CHECK (target_amount IS NULL OR target_amount > 0),
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (current_balance >= 0),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_savings_buckets_active ON savings_buckets (is_active);
CREATE INDEX idx_savings_buckets_balance ON savings_buckets (current_balance);

-- Create unique constraint for active bucket names (case insensitive)
CREATE UNIQUE INDEX idx_savings_buckets_name_active 
ON savings_buckets (LOWER(name)) 
WHERE is_active = true;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_savings_buckets_updated_at 
  BEFORE UPDATE ON savings_buckets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 