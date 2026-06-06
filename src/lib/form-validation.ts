/** Lightweight client-side validation helpers for visible inline errors. */

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

export function validateMinLength(
  value: string,
  min: number,
  label: string,
): string | undefined {
  if (value.length < min) return `${label} must be at least ${min} characters.`;
  return undefined;
}

export function validatePositiveNumber(value: string, label: string): string | undefined {
  const required = validateRequired(value, label);
  if (required) return required;
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0) return `${label} must be a positive number.`;
  return undefined;
}

export function validatePercentage(value: string): string | undefined {
  const required = validateRequired(value, "Discount");
  if (required) return required;
  const n = Number(value);
  if (Number.isNaN(n) || n <= 0 || n > 100) return "Enter a percentage between 1 and 100.";
  return undefined;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function firstFieldError(errors: FieldErrors): string | undefined {
  return Object.values(errors).find(Boolean);
}
