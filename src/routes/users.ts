import { randomUUID } from 'node:crypto';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { ErrorSchema, defaultHook } from '../schemas.js';

const EXAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';

const UserSchema = z
  .object({
    userId: z.uuid().meta({ description: 'User ID (UUID)', example: EXAMPLE_UUID }),
    email: z.email().meta({ description: 'Email address', example: 'jane@doe.com' }),
    name: z.string().min(1).max(100).meta({ description: 'Display name', example: 'Jane Doe' }),
    status: z
      .enum(['Happy', 'Sad'])
      .optional()
      .default('Happy')
      .meta({ description: 'Current mood status', example: 'Happy' }),
    phoneNumbers: z
      .array(
        z
          .string()
          .regex(/^\+[1-9]\d{6,14}$/)
          .meta({ description: 'Phone number in E.164 format', example: '+12345678900' }),
      )
      .meta({ description: 'List of phone numbers' }),
  })
  .meta({ id: 'User' });

const UserCreationParamsSchema = UserSchema.pick({ email: true, name: true, phoneNumbers: true }).meta({
  id: 'UserCreationParams',
});

const app = new OpenAPIHono({ defaultHook: defaultHook() });

app.openapi(
  createRoute({
    method: 'get',
    path: '/{userId}',
    summary: 'Get a user by ID',
    tags: ['Users'],
    request: {
      params: z.object({
        userId: z.uuid().meta({
          description: 'User ID (UUID)',
          param: { name: 'userId', in: 'path' },
          example: EXAMPLE_UUID,
        }),
      }),
      query: z.object({
        name: z.string().optional().meta({ description: 'Override display name', example: 'Jane Doe' }),
      }),
    },
    responses: {
      200: { content: { 'application/json': { schema: UserSchema } }, description: 'User found' },
      404: { content: { 'application/json': { schema: ErrorSchema } }, description: 'User not found' },
    },
  }),
  (c) => {
    const { userId } = c.req.valid('param');
    const { name } = c.req.valid('query');
    // Demo: treat the all-zero UUID as "not found".
    if (userId === '00000000-0000-0000-0000-000000000000') {
      throw new HTTPException(404, { message: 'User not found' });
    }
    return c.json(
      { userId, email: 'jane@doe.com', name: name ?? 'Jane Doe', status: 'Happy' as const, phoneNumbers: [] },
      200,
    );
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '',
    summary: 'Create a new user',
    tags: ['Users'],
    request: {
      body: {
        content: { 'application/json': { schema: UserCreationParamsSchema } },
        description: 'User data to create',
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: UserSchema } },
        headers: z.object({
          Location: z.string().meta({
            description: 'URL of the created resource',
            example: '/api/v1/users/550e8400-e29b-41d4-a716-446655440000',
          }),
        }),
        description: 'User created',
      },
      400: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Validation error' },
      409: { content: { 'application/json': { schema: ErrorSchema } }, description: 'Email already exists' },
    },
  }),
  (c) => {
    const body = c.req.valid('json');
    // Demo: treat this address as an already-existing user.
    if (body.email === 'exists@example.com') {
      throw new HTTPException(409, { message: 'Email already exists' });
    }
    const user = { userId: randomUUID(), status: 'Happy' as const, ...body };
    return c.json(user, 201, { Location: `${c.req.path}/${user.userId}` });
  },
);

export default app;
