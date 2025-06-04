# Cofrinho Server

A modern expense tracking backend built with **Bun**, **Hono**, **PostgreSQL**, and **TypeScript** using **Hexagonal Architecture**.

## 🏗️ Architecture

This server follows **Hexagonal Architecture** (Ports and Adapters) with clean separation of concerns:

- **Domain Layer**: Core business logic, entities, and value objects
- **Application Layer**: Use cases and business workflows  
- **Infrastructure Layer**: Database, web controllers, and external services

## 🚀 Features

### ✅ Complete Implementation
- **Transaction Management**: Full CRUD with filtering, pagination, and advanced querying
- **Categories & Payment Methods**: Complete organization system with active/inactive states
- **Installment Plans**: Multi-month purchase tracking with automatic payment generation
- **Subscriptions**: Recurring payment management with cancellation and pausing
- **Savings Buckets**: Goal-based savings tracking with transfer management
- **Financial Reports**: Comprehensive monthly and yearly reports with analytics
- **Database Migrations**: Automated schema management with version control
- **Data Seeding**: Default categories, payment methods, and sample data
- **Comprehensive Testing**: Unit tests with 75.99% line coverage (54 passing tests)
- **Input Validation**: Complete Zod schemas for all endpoints
- **Error Handling**: Standardized error responses with detailed logging
- **CORS Support**: Cross-origin request configuration
- **Health Checks**: Application and database status monitoring
- **OpenAPI Documentation**: Complete API documentation with Swagger UI

### 🏢 Business Logic Features
- **Automatic Transaction Generation**: From installments and subscriptions
- **Financial Analytics**: Category spending, payment method usage, trends
- **Bucket Transfers**: Deposit/withdrawal tracking with balance management
- **Report Generation**: Monthly/yearly summaries with breakdowns
- **Data Validation**: Comprehensive business rule enforcement
- **Type Safety**: Full TypeScript coverage with strict validation

## 📋 Prerequisites

- **Bun** >= 1.0.0
- **PostgreSQL** >= 14
- **Node.js** >= 18 (for development tools)

## 🛠️ Installation

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Setup environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with your database credentials
   nano .env
   ```

4. **Setup PostgreSQL database**
   ```bash
   # Create database
   createdb cofrinho
   
   # Or using psql
   psql -c "CREATE DATABASE cofrinho;"
   ```

5. **Run database migrations**
   ```bash
   bun run migrate
   ```

6. **Seed initial data**
   ```bash
   bun run seed
   ```

## 🏃‍♂️ Running the Server

### Development
```bash
bun run dev
```

### Production Build
```bash
bun run build
bun run start
```

### Testing
```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage
```

### Code Quality
```bash
# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Type checking
bun run type-check
```

## 📊 Database Management

### Migrations
```bash
# Run pending migrations
bun run migrate

# Check migration status
bun run migrate status
```

### Seeding
```bash
# Seed default data
bun run seed

# Force re-seed existing data
bun run seed force

# Include sample savings buckets
bun run seed --buckets
```

## 🌐 API Endpoints

### Health & Documentation
- `GET /health` - Application and database status
- `GET /api/docs` - Swagger UI documentation
- `GET /api/redoc` - ReDoc documentation
- `GET /api/openapi.json` - OpenAPI specification
- `GET /api/info` - API information and endpoints

### Transactions
- `GET /api/transactions` - List transactions (with filtering & pagination)
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get transaction by ID
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category by ID
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Payment Methods
- `GET /api/payment-methods` - List payment methods
- `POST /api/payment-methods` - Create payment method
- `GET /api/payment-methods/:id` - Get payment method by ID
- `PUT /api/payment-methods/:id` - Update payment method
- `DELETE /api/payment-methods/:id` - Delete payment method

### Installment Plans
- `GET /api/installment-plans` - List installment plans
- `POST /api/installment-plans` - Create installment plan
- `GET /api/installment-plans/:id` - Get installment plan by ID
- `PUT /api/installment-plans/:id` - Update installment plan
- `DELETE /api/installment-plans/:id` - Delete installment plan

### Subscriptions
- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/:id` - Get subscription by ID
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription

### Savings Buckets
- `GET /api/buckets` - List savings buckets
- `POST /api/buckets` - Create savings bucket
- `GET /api/buckets/:id` - Get savings bucket by ID
- `PUT /api/buckets/:id` - Update savings bucket
- `DELETE /api/buckets/:id` - Delete savings bucket
- `POST /api/buckets/:id/transfer` - Transfer to/from bucket

### Reports
- `GET /api/reports/monthly/:year/:month` - Monthly financial report
- `GET /api/reports/yearly/:year` - Yearly financial report
- `GET /api/reports/summary` - Financial summary

## 📝 API Examples

### Create Transaction
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.99,
    "currency": "BRL",
    "categoryId": "uuid-here",
    "paymentMethodId": "uuid-here",
    "type": "expense",
    "description": "Grocery shopping",
    "date": "2024-01-15"
  }'
```

### List Transactions with Filters
```bash
curl "http://localhost:3000/api/transactions?page=1&limit=10&type=expense&startDate=2024-01-01&endDate=2024-01-31&categoryId=uuid-here"
```

### Create Installment Plan
```bash
curl -X POST http://localhost:3000/api/installment-plans \
  -H "Content-Type: application/json" \
  -d '{
    "totalAmount": 1200.00,
    "currency": "BRL",
    "purchaseDate": "2024-01-15",
    "installmentCount": 12,
    "description": "Laptop purchase",
    "paymentMethodId": "uuid-here",
    "categoryId": "uuid-here"
  }'
```

### Create Subscription
```bash
curl -X POST http://localhost:3000/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Netflix",
    "monthlyAmount": 29.90,
    "currency": "BRL",
    "startDate": "2024-01-01",
    "categoryId": "uuid-here",
    "paymentMethodId": "uuid-here"
  }'
```

### Generate Monthly Report
```bash
curl "http://localhost:3000/api/reports/monthly/2024/1"
```

### Transfer to Savings Bucket
```bash
curl -X POST http://localhost:3000/api/buckets/bucket-id/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500.00,
    "currency": "BRL",
    "type": "deposit",
    "description": "Monthly savings"
  }'
```

## 🗄️ Database Schema

### Core Tables
- **transactions** - All financial transactions with source tracking
- **categories** - Transaction categories (income/expense/both)
- **payment_methods** - Payment method types (cash/bank/credit_card)
- **installment_plans** - Multi-month purchase tracking
- **subscriptions** - Recurring payment definitions
- **savings_buckets** - Goal-based savings containers
- **bucket_transfers** - Savings bucket transaction history

### Key Features
- **UUID Primary Keys** for all entities
- **Optimized Indexes** for fast querying by date, category, payment method
- **Database Triggers** for automatic timestamp updates and balance calculations
- **Constraint Validation** at database level
- **Cascading Operations** for related data management
- **Migration System** for version-controlled schema changes

## 🧪 Testing

The project includes comprehensive unit tests covering:

- ✅ **Domain Entities** - Business logic validation (Transaction, Category, etc.)
- ✅ **Value Objects** - Money calculations, date ranges, types
- ✅ **Use Cases** - Application workflows and business processes
- ✅ **Repository Interfaces** - Data access patterns and contracts
- ✅ **Domain Services** - Complex business logic orchestration

**Current Coverage**: 75.99% lines, 60.50% functions, 54 passing tests

```bash
# Run specific test suites
bun test domain/
bun test application/
bun test infrastructure/

# Run tests with coverage
bun run test:coverage

# Watch mode for development
bun run test:watch
```

## 📁 Project Structure

```
src/
├── domain/              # Core business logic
│   ├── entities/        # Business entities (7 complete)
│   ├── repositories/    # Repository interfaces (7 complete)
│   ├── services/        # Domain services (5 complete)
│   └── value-objects/   # Value objects (Money, DateRange, etc.)
├── application/         # Application layer
│   ├── dto/            # Data transfer objects (7 complete)
│   ├── use-cases/      # Business use cases (12 complete)
│   └── validation/     # Zod schemas (7 complete)
└── infrastructure/     # External concerns
    ├── database/       # PostgreSQL implementation
    │   ├── migrations/ # 7 migration files
    │   └── repositories/ # 7 repository implementations
    └── web/           # HTTP layer
        ├── controllers/ # 7 request handlers
        ├── docs/       # OpenAPI documentation
        ├── middleware/ # HTTP middleware (4 complete)
        └── routes/    # Route definitions (7 complete)
```

## 🔧 Environment Variables

Create a `.env` file with:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/cofrinho

# Server
PORT=3000
NODE_ENV=development

# Production CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Optional: External services
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

## 🐳 Docker Support

Docker configuration files are available for easy deployment:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or run manually
docker build -t cofrinho-server .
docker run -p 3000:3000 cofrinho-server
```

## 📈 Performance

- **Database Connection Pooling** - Efficient resource usage with postgres library
- **Optimized Queries** - Indexed lookups and aggregations for fast data access
- **Pagination Support** - Efficient handling of large transaction datasets
- **Caching Headers** - HTTP caching for static resources
- **Background Processing** - Automatic transaction generation from installments/subscriptions

## 🔒 Security

- **Input Validation** - Comprehensive Zod schemas for all endpoints
- **SQL Injection Prevention** - Parameterized queries with postgres library
- **CORS Configuration** - Configurable cross-origin security
- **Error Handling** - Sanitized error responses without sensitive data exposure
- **Type Safety** - Full TypeScript coverage preventing runtime errors

## 🚀 Deployment

The server is ready to deploy on:

- **Railway** / **Render** - PostgreSQL apps with automatic deployments
- **Vercel** - With Neon/Supabase PostgreSQL integration
- **Fly.io** - PostgreSQL with regional data storage
- **Self-hosted** - With Docker container support
- **AWS/Google Cloud** - With managed PostgreSQL services

### Production Checklist
- ✅ Environment variables configured
- ✅ Database migrations run
- ✅ Initial data seeded
- ✅ CORS origins configured
- ✅ Health checks enabled
- ✅ Logging configured
- ✅ Error monitoring ready

## 🤝 Contributing

1. Follow the **Hexagonal Architecture** patterns
2. Add **unit tests** for new features (maintain >75% coverage)
3. Update **migration files** for schema changes
4. Use **Zod schemas** for all validation
5. Follow **TypeScript best practices**
6. Update **OpenAPI documentation** for new endpoints
7. Run **linting and formatting** before commits

## 📊 Development Status

### ✅ Completed (85/100+ tasks)
- **Domain Layer**: All entities, value objects, repository interfaces, and services
- **Application Layer**: All use cases, DTOs, mappers, and validation schemas
- **Infrastructure Layer**: Database repositories, web controllers, routes, middleware
- **Testing**: Comprehensive unit test coverage
- **Documentation**: Complete OpenAPI/Swagger documentation

### 🔧 Minor Outstanding Items
- BucketTransfer Repository: Database schema update for `type` field
- Docker configuration optimization
- Advanced analytics features
- Background job processing
- Email notifications

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ using Bun, Hono, PostgreSQL, and TypeScript in Hexagonal Architecture** 