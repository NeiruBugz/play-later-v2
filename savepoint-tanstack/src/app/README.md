# app layer

Providers, root router wiring, global styles, and the root error boundary.

## Import rules

- May import from: `routes`, `widgets`, `features`, `entities`, `shared`
- Nothing imports from `app` — it is the top of the dependency graph

## Segments

| Segment              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `providers/`         | React context providers, theme wiring            |
| `styles/`            | Global CSS, font imports                         |
| `error-boundary/`    | Root error boundary branching on `AppError.code` |
