export const DecimalTransformer = {
  to: (v?: number | null) => v,
  from: (v?: string | null) => (v == null ? v : parseFloat(v)),
};
