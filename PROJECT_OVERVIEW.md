# Cofrinho Expense Tracker – Project Overview

## 1. Introduction
The Cofrinho Expense Tracker is a personal finance application that helps users record, categorize, and review every incoming and outgoing transaction. It natively supports multi-installment credit-card purchases, recurring subscriptions, monthly and yearly summaries, and “savings buckets” for goal-based fund allocation.

## 2. Core Objectives
- Provide a simple, intuitive interface for logging all cash, bank, and credit-card transactions.
- Automate installment-based purchases so future payments appear in the correct months.
- Track recurring subscriptions (e.g. Netflix, Spotify) until the user cancels them.
- Offer clean, separate monthly income/expense reports and an aggregate yearly overview.
- Allow users to create and manage customizable “funds” or “buckets” for savings goals or investments.

## 3. Key Features

### 3.1 Transaction Logging
- Manual entry of income and expenses, with:
  - Date
  - Amount
  - Category (e.g. Groceries, Salary, Utilities)
  - Payment method (Cash, Bank, Credit Card)
  - Optional note or receipt attachment

### 3.2 Installment Purchases
- When recording a credit-card purchase split into N installments:
  1. User enters the total amount, purchase date, and number of installments.
  2. The system immediately creates N equal (or custom) transactions:
     - First payment in the purchase month
     - Remaining payments scheduled monthly thereafter
- Installments roll off once all scheduled payments are logged.

### 3.3 Recurring Subscriptions
- User defines a subscription with:
  - Name (e.g. “Netflix”)
  - Monthly amount
  - Start date
  - Optional end/cancel date
- The app auto-generates one transaction per month until cancellation.

### 3.4 Monthly and Yearly Summaries
- **Monthly Dashboard**  
  - Total income vs. expenses  
  - Category breakdown (e.g. Rent, Food, Entertainment)  
  - Net savings or deficit

- **Yearly Overview**  
  - Cumulative income/expense charts by month  
  - Highest-spend and highest-income categories  
  - Year-to-date net balance

### 3.5 Savings Buckets (Funds)
- Users create named “buckets” (e.g. “Vacation Fund”, “Emergency Savings”).
- Allocate money into buckets via transfers from main balance.
- Track bucket balances independently of everyday spending.
- Optional goal targets and progress indicators.

## 4. User Workflows

1. **Add a One-Off Expense or Income**  
   – Open “New Transaction” → fill in details → Save.
   - May add a category to the expense or income like respectively groceries, shopping or salary and gift

2. **Record a 6-Month Installment Purchase**  
   – Open “New Installment” → enter total, date, installments = 6 → Save  
   – Verify: transactions appear in Jan, Feb, … June.

3. **Set Up a Monthly Subscription**  
   – Open “New Subscription” → name = “Spotify”, amount, start date → Save  
   – Each month a new “Spotify” expense logs automatically.

4. **View Monthly Report**  
   – Navigate to “Reports” → select month → review totals and charts.

5. **Allocate to a Savings Bucket**  
   – Go to “Buckets” → “Create Bucket” → name, target amount → Save  
   – “Transfer” $500 from main balance to “Vacation Fund”.

## 5. High-Level Architecture (Functional Modules)
- **UI Layer**  
  – Transaction forms, dashboards, bucket management screens.

- **Business Logic**  
  – Installment scheduler  
  – Subscription scheduler  
  – Summary calculators

- **Data Storage**  
  – Transactions table  
  – Installment plans  
  – Subscription records  
  – Bucket definitions and balances

## 6. Success Criteria
- Users can log any transaction in ≤ 15 seconds.
- Installments and subscriptions generate correctly without manual intervention.
- Monthly and yearly reports accurately reflect underlying data.
- Savings buckets remain in sync with transfers and goals.

---