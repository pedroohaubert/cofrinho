# Cofrinho Expense Tracker – Tech Stack

## 1. Technology Overview

### 1.1 Frontend Stack
- **React 18+** - Core UI framework
- **React Router** - Client-side routing and navigation
- **TanStack Query** - Server state management and data fetching
- **ShadCN/UI** - Pre-built component library with accessibility focus
- **TailwindCSS** - Utility-first CSS framework for styling
- **TypeScript** - Type safety and developer experience
- **Zod** - Schema validation and type inference

### 1.2 Backend Stack
- **Hono** - Lightweight, fast web framework
- **Bun** - JavaScript runtime and package manager
- **TypeScript** - Type safety across the backend
- **Zod** - Request/response validation and type safety
- **PostgreSQL** - Primary database
- **Bun's PostgreSQL driver** - Database connectivity

### 1.3 Architecture Pattern
- **Backend**: Ports and Adapters (Hexagonal Architecture)
- **Frontend**: Standard React component architecture with hooks

### 1.4 Infrastructure
- **Docker** - Containerization for application deployment
- **Docker Compose** - Multi-container orchestration (app + database)

## 2. Frontend Architecture

### 2.1 Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # ShadCN components
│   ├── forms/           # Form-specific components
│   ├── charts/          # Data visualization components
│   └── layout/          # Layout components
├── pages/               # Route-level components
│   ├── transactions/    # Transaction management pages
│   ├── reports/         # Monthly/yearly report pages
│   ├── buckets/         # Savings bucket pages
│   └── settings/        # Configuration pages
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
│   ├── api.ts          # API client setup
│   ├── schemas.ts      # Zod validation schemas
│   └── utils.ts        # Helper functions
├── types/               # TypeScript type definitions
└── App.tsx             # Main application component
```

### 2.2 Key Libraries Configuration

**TanStack Query**
- Handles server state caching and synchronization
- Manages loading states and error handling
- Optimistic updates for better UX
- Background refetching for data freshness

**React Router**
- File-based routing structure
- Protected routes for authenticated sections
- Nested routing for complex page layouts

**ShadCN/UI + TailwindCSS**
- Consistent design system
- Accessible components out of the box
- Dark/light theme support
- Responsive design utilities

**Zod Integration**
- Form validation with react-hook-form
- API response type validation
- Runtime type checking

### 2.3 State Management Strategy
- **Server State**: TanStack Query for API data
- **Client State**: React useState/useReducer for local component state
- **Form State**: react-hook-form with Zod validation
- **Global State**: React Context for user preferences and theme

## 3. Backend Architecture

### 3.1 Ports and Adapters Pattern

```
src/
├── domain/              # Business logic and entities
│   ├── entities/        # Domain models (Transaction, Category, etc.)
│   ├── repositories/    # Repository interfaces (ports)
│   ├── services/        # Business logic services
│   └── value-objects/   # Domain value objects
├── infrastructure/      # External adapters
│   ├── database/        # PostgreSQL adapters
│   │   ├── repositories/# Repository implementations
│   │   ├── migrations/  # Database migrations
│   │   └── connection.ts# Database connection setup
│   ├── web/            # HTTP adapters
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/  # HTTP middleware
│   │   └── routes/      # Route definitions
│   └── external/       # Third-party service adapters
├── application/        # Application layer
│   ├── use-cases/      # Application use cases
│   ├── dto/            # Data transfer objects
│   └── validation/     # Zod schemas for API validation
└── main.ts            # Application entry point
```

### 3.2 Core Adapters

**Database Adapter (PostgreSQL)**
- Repository pattern implementation
- Connection pooling with Bun's postgres driver
- Transaction management for complex operations
- Migration system for schema evolution

**Web Adapter (Hono)**
- RESTful API endpoints
- Middleware for authentication, CORS, and logging
- Request/response validation with Zod
- Error handling and standardized responses

### 3.3 Domain Layer

**Entities**
- Transaction, Category, PaymentMethod
- InstallmentPlan, Subscription
- SavingsBucket, BucketTransfer

**Services**
- TransactionService: Handle complex transaction logic
- InstallmentService: Manage installment scheduling
- SubscriptionService: Handle recurring payment logic
- ReportingService: Generate financial reports

**Repository Interfaces**
- Define contracts for data persistence
- Enable dependency inversion
- Support testing with mock implementations

## 4. Database Design

### 4.1 PostgreSQL Configuration
- Connection pooling for performance
- ACID compliance for financial data integrity
- Indexing strategy for query optimization
- Backup and recovery procedures

### 4.2 Migration Strategy
- Version-controlled schema changes
- Rollback capabilities
- Seed data for development/testing

### 4.3 Performance Considerations
- Proper indexing on frequently queried columns
- Query optimization for reporting functions
- Connection pooling to handle concurrent requests

## 5. Development Workflow

### 5.1 Project Setup
```bash
# Backend setup
cd backend
bun install
bun run migrate
bun run dev

# Frontend setup
cd frontend
npm install
npm run dev
```

### 5.2 Environment Configuration
- `.env` files for environment-specific settings
- Separate configurations for development, test, and production
- Database connection strings and API endpoints

### 5.3 Development Tools
- **TypeScript** across both frontend and backend
- **ESLint** and **Prettier** for code consistency
- **Zod** schemas shared between frontend and backend
- **Docker Compose** for local development environment

## 6. Docker Configuration

### 6.1 Application Container
```dockerfile
# Multi-stage build for production optimization
FROM oven/bun:latest as base
WORKDIR /app

# Backend build
FROM base as backend-build
COPY backend/package.json backend/bun.lockb ./
RUN bun install
COPY backend/ .
RUN bun run build

# Frontend build
FROM node:18-alpine as frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Production image
FROM oven/bun:latest
WORKDIR /app
COPY --from=backend-build /app/dist ./backend
COPY --from=frontend-build /app/dist ./frontend
EXPOSE 3000
CMD ["bun", "run", "backend/main.js"]
```

### 6.2 Docker Compose Setup
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/cofrinho
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=cofrinho
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 7. API Design

### 7.1 RESTful Endpoints
```
GET    /api/transactions          # List transactions
POST   /api/transactions          # Create transaction
PUT    /api/transactions/:id      # Update transaction
DELETE /api/transactions/:id      # Delete transaction

GET    /api/categories            # List categories
POST   /api/categories            # Create category

GET    /api/reports/monthly/:year/:month  # Monthly report
GET    /api/reports/yearly/:year          # Yearly report

GET    /api/buckets               # List savings buckets
POST   /api/buckets               # Create bucket
POST   /api/buckets/:id/transfer  # Transfer to/from bucket
```

### 7.2 Request/Response Validation
- Zod schemas for all API endpoints
- Consistent error response format
- Type-safe request/response handling

## 8. Security Considerations

### 8.1 Data Validation
- Input sanitization with Zod
- SQL injection prevention through parameterized queries
- XSS protection through proper data encoding

### 8.2 API Security
- CORS configuration for frontend-backend communication
- Request rate limiting
- Input validation at all API boundaries

## 9. Testing Strategy

### 9.1 Backend Testing
- Unit tests for domain services
- Integration tests for repository implementations
- API endpoint testing with Hono's testing utilities

### 9.2 Frontend Testing
- Component testing with React Testing Library
- Hook testing for custom logic
- E2E testing for critical user workflows

## 10. Performance Optimization

### 10.1 Frontend Optimizations
- Code splitting with React.lazy
- TanStack Query caching strategies
- Image optimization and lazy loading

### 10.2 Backend Optimizations
- Database query optimization
- Connection pooling
- Response caching for reports

### 10.3 Infrastructure Optimizations
- Docker image optimization
- Database indexing strategy
- CDN for static assets (if needed) 