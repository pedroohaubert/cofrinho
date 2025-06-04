-- Create bucket_transfers table
CREATE TABLE IF NOT EXISTS bucket_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id UUID NOT NULL REFERENCES savings_buckets(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount != 0), -- Positive = into bucket, negative = out of bucket
  transfer_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_bucket_transfers_bucket_id ON bucket_transfers (bucket_id);
CREATE INDEX idx_bucket_transfers_date ON bucket_transfers (transfer_date);
CREATE INDEX idx_bucket_transfers_amount ON bucket_transfers (amount);

-- Create composite index for bucket balance calculations
CREATE INDEX idx_bucket_transfers_bucket_date ON bucket_transfers (bucket_id, transfer_date); 