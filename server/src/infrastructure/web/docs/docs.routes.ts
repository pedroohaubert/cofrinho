import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { openAPIConfig } from './openapi.config';

export function createDocsRoutes(app: OpenAPIHono) {
  // Generate OpenAPI spec
  app.doc('/api/openapi.json', openAPIConfig);

  // Swagger UI at /api/docs
  app.get('/api/docs', swaggerUI({ 
    url: '/api/openapi.json',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: 'list',
    filter: true,
    displayRequestDuration: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    syntaxHighlight: {
      activated: true,
      theme: ['arta']
    },
    plugins: [],
    layout: 'BaseLayout'
  }));

  // Alternative Redoc UI (optional)
  app.get('/api/redoc', (c) => {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cofrinho API Documentation</title>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; }
            redoc { display: block; }
          </style>
        </head>
        <body>
          <redoc spec-url="/api/openapi.json" theme="light"></redoc>
          <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
        </body>
      </html>
    `);
  });

  // API information endpoint
  app.get('/api/info', (c) => {
    return c.json({
      title: 'Cofrinho API',
      description: 'Personal expense tracker and financial management API',
      version: '1.0.0',
      documentation: {
        swagger: '/api/docs',
        redoc: '/api/redoc',
        openapi: '/api/openapi.json'
      },
      endpoints: {
        transactions: '/api/transactions',
        categories: '/api/categories',
        paymentMethods: '/api/payment-methods',
        installmentPlans: '/api/installment-plans',
        subscriptions: '/api/subscriptions',
        savingsBuckets: '/api/buckets',
        reports: '/api/reports'
      },
      features: [
        'Full CRUD operations for all entities',
        'Advanced filtering and pagination',
        'Financial reporting and analytics',
        'Type-safe API with Zod validation',
        'Comprehensive OpenAPI documentation'
      ],
      lastUpdated: new Date().toISOString()
    });
  });

  return app;
} 