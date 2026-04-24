# hono-zod-demo

Demo of Hono with Zod OpenAPI and Swagger UI.

## Usage

```bash
pnpm run dev        # Development mode (with hot reload)
pnpm run start      # Start server
pnpm run build      # Build for production
pnpm run test       # Run tests
pnpm run test:watch # Run tests in watch mode
pnpm run check      # Type check + ESLint + Prettier
pnpm run fix        # Auto-fix ESLint + Prettier
```

## API

| Method   | Path                     | Description                |
| -------- | ------------------------ | -------------------------- |
| `GET`    | `/`                      | Service info               |
| `GET`    | `/health`                | Health check               |
| `GET`    | `/api/v1/users/{userId}` | Get a user by ID           |
| `POST`   | `/api/v1/users`          | Create a new user          |
| `POST`   | `/api/v1/auth/session`   | Create a session           |
| `GET`    | `/api/v1/auth/session`   | Get current session data   |
| `DELETE` | `/api/v1/auth/session`   | Delete the current session |
| `POST`   | `/api/v1/auth/token`     | Create a JWT token         |
| `GET`    | `/api/v1/auth/token`     | Get current token data     |

## Docs

- Swagger UI: `http://localhost:8080/docs`
- OpenAPI JSON: `http://localhost:8080/openapi.json`

## License

[MIT](LICENSE)
