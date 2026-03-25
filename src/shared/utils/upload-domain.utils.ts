export const uploadFile = (file?: string) => {
  if (!file) return ''

  return `${import.meta.env.VITE_API_URL}/uploads/${file}`
}
