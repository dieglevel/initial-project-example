export const enumToOptions = <T extends object>(enumObj: T) =>
  Object.entries(enumObj)
    .filter(([key]) => isNaN(Number(key)))
    .map(([label, value]) => ({
      label,
      value,
    }))

export const enumToOptionsWithCustomLabel = <
  T extends Record<string, string | number>,
>(
  enumObj: T,
  labelMapper: (key: keyof T, value: T[keyof T]) => string,
) =>
  Object.entries(enumObj)
    .filter(([key]) => isNaN(Number(key)))
    .map(([key, value]) => ({
      label: labelMapper(key as keyof T, value as T[keyof T]),
      value,
    }))
