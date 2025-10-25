export function createSelectOptionsFromEnum<T extends string>(
  enumType: Record<string, T> | readonly T[],
  labelMapper?: Partial<Record<T, string>>
): { value: T; label: string }[] {
  const values: readonly T[] = Array.isArray(enumType)
    ? enumType
    : (Object.values(enumType) as T[]);

  return values.map((value) => ({
    value,
    label: labelMapper?.[value as T] ?? value,
  }));
}
