export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 7) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

export const maskSensitiveData = (
  data: Record<string, unknown>,
  fields: string[] = ['contactPhone', 'phone']
): Record<string, unknown> => {
  const result = { ...data };
  fields.forEach((field) => {
    if (typeof result[field] === 'string') {
      result[field] = maskPhone(result[field] as string);
    }
  });
  return result;
};
