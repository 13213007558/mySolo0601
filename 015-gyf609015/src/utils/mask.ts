export function maskPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length <= 4) return cleaned
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(7)}`
  }
  if (cleaned.length >= 8) {
    const start = Math.floor((cleaned.length - 4) / 2)
    return `${cleaned.slice(0, start)}****${cleaned.slice(start + 4)}`
  }
  return `${cleaned.slice(0, 2)}**${cleaned.slice(-2)}`
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [name, domain] = email.split('@')
  if (name.length <= 2) return `**@${domain}`
  return `${name.slice(0, 2)}***@${domain}`
}
