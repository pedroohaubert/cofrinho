-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast lookups by type and active status
CREATE INDEX idx_payment_methods_type_active ON payment_methods (type, is_active);

-- Create unique constraint for active payment method names
CREATE UNIQUE INDEX idx_payment_methods_name_active ON payment_methods (LOWER(name)) WHERE is_active = true;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 