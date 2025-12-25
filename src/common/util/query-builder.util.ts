function col<T>(alias: string, key: keyof T) {
  return `${alias}.${String(key)}` as const;
}

function eq<T>(alias: string, key: keyof T) {
  return `${alias}.${String(key)} = :${String(key)}` as const;
}

function alias<T>(alias: string) {
  return new Proxy(
    {},
    {
      get(_, prop: string) {
        return `${alias}.${prop}` as const;
      },
    },
  ) as Record<keyof T, string>;
}

export { col, eq, alias };
