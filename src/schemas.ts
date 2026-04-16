import type { Env } from 'hono';
import type { Hook } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';

export const ErrorSchema = z
  .object({
    success: z.literal(false).meta({ example: false }),
    error: z.object({
      name: z.string().meta({ example: 'HTTPException' }),
      message: z.string().meta({ example: 'Unauthorized' }),
    }),
  })
  .meta({ id: 'Error' });

export const defaultHook =
  <E extends Env>(): Hook<unknown, E, string, unknown> =>
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false as const,
          error: { name: 'ZodError', message: result.error.issues[0]?.message ?? 'Validation failed' },
        },
        400,
      );
    }
  };
