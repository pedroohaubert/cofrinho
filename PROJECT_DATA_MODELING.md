# Cofrinho Expense Tracker – Data Modeling

## 1. Core Entities

### 1.1 Transaction
**Purpose**: Records all individual financial movements (income/expenses)

**Attributes**:
- `id`: Unique identifier
- `date`: Transaction date
- `amount`: Monetary value (positive for income, negative for expenses)
- `category_id`: Reference to category
- `payment_method_id`: Reference to payment method
- `description`: Optional note/description
- `type`: ENUM ('income', 'expense')
- `source_type`: ENUM ('manual', 'installment', 'subscription')
- `source_id`: Reference to installment or subscription (if applicable)
- `created_at`: Record creation timestamp
- `updated_at`: Record update timestamp

### 1.2 Category
**Purpose**: Classifies transactions for reporting and organization

**Attributes**:
- `id`: Unique identifier
- `name`: Category name (e.g., "Groceries", "Salary", "Utilities")
- `type`: ENUM ('income', 'expense', 'both')
- `color`: UI color code (optional)
- `is_active`: Boolean flag for soft deletion

### 1.3 Payment Method
**Purpose**: Tracks how transactions are paid

**Attributes**:
- `id`: Unique identifier
- `name`: Method name (e.g., "Cash", "Bank Transfer", "Credit Card")
- `type`: ENUM ('cash', 'bank', 'credit_card')
- `is_active`: Boolean flag

### 1.4 Installment Plan
**Purpose**: Manages multi-payment purchases

**Attributes**:
- `id`: Unique identifier
- `total_amount`: Total purchase amount
- `purchase_date`: Original purchase date
- `installment_count`: Total number of installments
- `monthly_amount`: Amount per installment
- `description`: Purchase description
- `payment_method_id`: Reference to payment method
- `category_id`: Reference to category
- `status`: ENUM ('active', 'completed', 'cancelled')
- `created_at`: Record creation timestamp

### 1.5 Subscription
**Purpose**: Manages recurring monthly payments

**Attributes**:
- `id`: Unique identifier
- `name`: Subscription name (e.g., "Netflix", "Spotify")
- `monthly_amount`: Amount charged per month
- `start_date`: When subscription begins
- `end_date`: When subscription ends (nullable)
- `category_id`: Reference to category
- `payment_method_id`: Reference to payment method
- `status`: ENUM ('active', 'cancelled', 'paused')
- `created_at`: Record creation timestamp

### 1.6 Savings Bucket
**Purpose**: Manages goal-based savings allocations

**Attributes**:
- `id`: Unique identifier
- `name`: Bucket name (e.g., "Vacation Fund", "Emergency Savings")
- `target_amount`: Goal amount (nullable)
- `current_balance`: Current bucket balance
- `description`: Optional bucket description
- `is_active`: Boolean flag
- `created_at`: Record creation timestamp

### 1.7 Bucket Transfer
**Purpose**: Tracks money movements in/out of savings buckets

**Attributes**:
- `id`: Unique identifier
- `bucket_id`: Reference to savings bucket
- `amount`: Transfer amount (positive = into bucket, negative = out of bucket)
- `transfer_date`: Date of transfer
- `description`: Optional transfer note
- `created_at`: Record creation timestamp

## 2. Entity Relationships

```
Transaction
├── belongs_to: Category
├── belongs_to: Payment Method
├── belongs_to: Installment Plan (optional)
└── belongs_to: Subscription (optional)

Installment Plan
├── has_many: Transactions
├── belongs_to: Category
└── belongs_to: Payment Method

Subscription
├── has_many: Transactions
├── belongs_to: Category
└── belongs_to: Payment Method

Savings Bucket
└── has_many: Bucket Transfers

Category
├── has_many: Transactions
├── has_many: Installment Plans
└── has_many: Subscriptions

Payment Method
├── has_many: Transactions
├── has_many: Installment Plans
└── has_many: Subscriptions
```

## 3. Key Workflows and Data Interactions

### 3.1 Add One-Off Transaction
**Data Flow**:
1. User inputs: date, amount, category, payment method, description
2. Create new Transaction record with `source_type = 'manual'`
3. Update relevant monthly totals for reporting

**Database Operations**:
- INSERT into transactions table
- SELECT categories and payment_methods for dropdowns

### 3.2 Record Installment Purchase
**Data Flow**:
1. User inputs: total amount, purchase date, installment count, category, payment method
2. Create Installment Plan record
3. Generate N Transaction records:
   - First transaction: purchase month
   - Remaining transactions: subsequent months
4. Link all transactions to installment plan via `source_id`

**Database Operations**:
- INSERT into installment_plans table
- BULK INSERT into transactions table (N records)
- SET `source_type = 'installment'` and `source_id = installment_plan.id`

### 3.3 Set Up Subscription
**Data Flow**:
1. User inputs: name, amount, start date, category, payment method
2. Create Subscription record with `status = 'active'`
3. Schedule background job to generate monthly transactions

**Database Operations**:
- INSERT into subscriptions table
- Automated monthly: INSERT into transactions table with `source_type = 'subscription'`

### 3.4 Generate Monthly Reports
**Data Flow**:
1. Query transactions for specified month
2. Group by category and payment method
3. Calculate totals, averages, and trends
4. Generate charts and summaries

**Database Operations**:
- SELECT transactions WHERE date BETWEEN month_start AND month_end
- GROUP BY category_id for breakdown analysis
- SUM amounts for income vs expense totals

### 3.5 Manage Savings Buckets
**Data Flow**:
1. **Create Bucket**: User inputs name, target amount
2. **Transfer Money**: User specifies bucket and amount
3. **Track Balance**: Update bucket balance based on transfers

**Database Operations**:
- INSERT into savings_buckets table
- INSERT into bucket_transfers table
- UPDATE current_balance in savings_buckets

### 3.6 View Yearly Overview
**Data Flow**:
1. Query all transactions for the year
2. Group by month and category
3. Calculate cumulative totals and trends
4. Identify top spending/income categories

**Database Operations**:
- SELECT transactions WHERE YEAR(date) = target_year
- GROUP BY MONTH(date), category_id
- ORDER BY amount DESC for top categories

## 4. Data Validation Rules

### Transaction Rules
- Amount cannot be zero
- Date cannot be in the future (configurable)
- Category and payment method must exist and be active

### Installment Rules
- Installment count must be > 1
- Monthly amount must equal total_amount / installment_count
- Cannot create installments with past purchase dates

### Subscription Rules
- Monthly amount must be positive
- End date must be after start date (if provided)
- Cannot have duplicate active subscriptions with same name

### Bucket Rules
- Bucket names must be unique among active buckets
- Transfer amount cannot make bucket balance negative
- Target amount must be positive (if provided)

## 5. Performance Considerations

### Indexing Strategy
- Primary keys on all tables
- Index on `transaction.date` for monthly/yearly queries
- Index on `transaction.category_id` for category reports
- Index on `installment_plan.status` and `subscription.status`
- Composite index on `(transaction.source_type, transaction.source_id)`

### Query Optimization
- Use date range queries with proper indexes
- Pre-calculate monthly summaries for faster reporting
- Implement pagination for transaction lists
- Consider materialized views for complex yearly reports

## 6. Data Migration Considerations

### Initial Setup
- Create default categories (Income: Salary, Gift; Expense: Groceries, Utilities, Entertainment)
- Create default payment methods (Cash, Bank Transfer, Credit Card)
- Set up system for monthly subscription processing

