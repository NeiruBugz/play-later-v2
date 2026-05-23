# shared layer

Infrastructure primitives shared across all layers. No domain logic lives here.

## Import rules

- May NOT import from any other layer
- May be imported from any layer

## Subdirectories

| Dir       | Contents                                                                   |
| --------- | -------------------------------------------------------------------------- |
| `lib/`    | Prisma singleton (`db`), logger (pino), `AppError` taxonomy, auth instance |
| `ui/`     | shadcn/ui primitives, design tokens, base components                       |
| `config/` | Zod-validated env (`env` from `@env`)                                      |
| `api/`    | Low-level external clients: S3, IGDB — no business logic                   |

## Key rule

`shared` has no slices. It is organised directly into segments. Never add domain-specific code here — if logic belongs to a business domain, it goes in `entities` or `features`.
