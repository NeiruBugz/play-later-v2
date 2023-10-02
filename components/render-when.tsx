type RenderWhenProps = {
  condition: boolean
  fallback?: React.ReactNode
}
export function RenderWhen({
  condition,
  children,
  fallback,
}: React.PropsWithChildren<RenderWhenProps>) {
  if (condition) {
    return children
  }

  return fallback ?? null
}
