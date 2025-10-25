export function createSelectOptionsFromEnum<T extends string>(
  enumType: Record<string, T>,
  labelMapper?: Record<T, string>
): { value: T; label: string }[] {
  return Object.values(enumType).map((value) => ({
    value,
    label: labelMapper?.[value] ?? value,
  }));
}
