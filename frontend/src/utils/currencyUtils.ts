// Utility functions for currency formatting and calculation
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : value;
  if (isNaN(numValue) || numValue === 0) return '';
  return numValue.toLocaleString('vi-VN');
};

export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned) : 0;
};

export const handleCurrencyInput = (
  rawInput: string,
  onChange: (value: string) => void
) => {
  const rawNumber = rawInput.replace(/[^\d]/g, '');
  if (rawNumber) {
    const formatted = Number(rawNumber).toLocaleString('vi-VN');
    onChange(formatted);
  } else {
    onChange('');
  }
};

export const calculateTotalCost = (costItems: {
  khophang: string;
  xquang: string;
  minivis: string;
  maccai: string;
  chupcam: string;
  nongham: string;
}): number => {
  return Object.values(costItems).reduce((total, item) => {
    return total + parseCurrency(item);
  }, 0);
};