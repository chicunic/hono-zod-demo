import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { config } from './config.js';
import { logger } from './logger.js';
import authApp from './routes/auth.js';
import usersApp from './routes/users.js';
import { defaultHook } from './schemas.js';

const app = new OpenAPIHono({ defaultHook: defaultHook() });
const { PORT: port, ROUTE_PREFIX: routePrefix } = config;
const baseUrl = `http://localhost:${String(port)}`;

app.use('*', cors());

app.notFound((c) =>
  c.json({ success: false as const, error: { name: 'NotFound', message: 'Route not found' } }, 404),
);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { success: false as const, error: { name: 'HTTPException', message: err.message } },
      err.status,
    );
  }
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  return c.json(
    { success: false as const, error: { name: 'InternalServerError', message: 'Internal server error' } },
    500,
  );
});

app.get('/', (c) => c.json({ name: 'Hono + Zod OpenAPI Demo', version: '0.0.1' }));
app.get('/health', (c) => c.json({ status: 'ok' }));

app.route(`${routePrefix}/users`, usersApp);
app.route(`${routePrefix}/auth`, authApp);

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Hono + Zod OpenAPI Demo',
    version: '0.0.1',
    description: 'Demo of Hono with Zod OpenAPI and Swagger UI.',
    license: { name: 'MIT' },
  },
  servers: [{ url: baseUrl, description: 'Local' }],
});

app.get('/docs', swaggerUI({ url: '/openapi.json' }));

serve({ fetch: app.fetch, port }, () => {
  logger.info('Server started', { server: baseUrl, docs: `${baseUrl}/docs` });
});
