import { Context, Next } from 'hono';

export const loggerMiddleware = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header('User-Agent') || 'Unknown';
  
  // Log incoming request
  console.log(`➡️  ${method} ${path} - ${userAgent}`);
  
  try {
    await next();
    
    const duration = Date.now() - start;
    const status = c.res.status;
    
    // Log response with appropriate emoji
    const statusEmoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    console.log(`${statusEmoji} ${method} ${path} - ${status} (${duration}ms)`);
    
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`💥 ${method} ${path} - ERROR (${duration}ms):`, error);
    throw error; // Re-throw to let error handler deal with it
  }
}; 