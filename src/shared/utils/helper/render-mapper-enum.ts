export function renderMapperEnum<T extends Record<PropertyKey, string>>(
  value: PropertyKey | null | undefined,
  record: T,
  defaultValue: string = '-',
): string {
  if (value != null && value in record) {
    return record[value as keyof T]
  }

  return defaultValue
}
