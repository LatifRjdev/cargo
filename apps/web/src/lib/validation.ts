export const validators = {
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 9 || cleaned.length > 15) return 'Введите корректный номер телефона';
    return null;
  },

  required: (value: string, label = 'Поле') => {
    if (!value.trim()) return `${label} обязательно для заполнения`;
    return null;
  },

  minLength: (value: string, min: number, label = 'Поле') => {
    if (value.trim().length < min) return `${label} должно содержать минимум ${min} символов`;
    return null;
  },

  positiveNumber: (value: string, label = 'Значение') => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return `${label} должно быть положительным числом`;
    return null;
  },

  weight: (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return 'Введите корректный вес';
    if (num > 500) return 'Вес не может превышать 500 кг';
    return null;
  },

  dimensions: (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return 'Введите корректный размер';
    if (num > 300) return 'Размер не может превышать 300 см';
    return null;
  },
};

export function validateForm(rules: Record<string, string | null>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  for (const [field, error] of Object.entries(rules)) {
    if (error) errors[field] = error;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
