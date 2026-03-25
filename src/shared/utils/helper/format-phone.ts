// ex: +84 123 456 7890 => 0123 456 7890
export const formatPhone = (phone: string) => {
  if (!phone) return ''

  const cleaned = phone.replace(/\D/g, '')

  // Case: 0xxxxxxxxx (10 số)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
  }

  // Case: 84xxxxxxxxx (11 số)
  if (cleaned.length === 11 && cleaned.startsWith('84')) {
    const local = '0' + cleaned.slice(2) // đổi 84 -> 0
    return local.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
  }

  return phone
}
