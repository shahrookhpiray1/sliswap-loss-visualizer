// src/utils/formatToken.ts

export const TOKEN_DECIMALS: Record<string, number> = {
  USDT: 6,
  EDS: 8,
  VDEP: 8,
};

export function formatRawAmount(raw: string | number, tokenSymbol: string): string {
  const decimals = TOKEN_DECIMALS[tokenSymbol];
  if (decimals === undefined) return raw.toString();
  
  const rawNum = typeof raw === 'string' ? BigInt(raw) : BigInt(Math.floor(raw));
  const divisor = 10n ** BigInt(decimals);
  
  const integer = rawNum / divisor;
  const fractional = rawNum % divisor;
  const fractionalPadded = fractional.toString().padStart(decimals, '0');
  
  // حذف صفرهای انتهایی
  const trimmedFractional = fractionalPadded.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return integer.toString();
  }
  return `${integer.toString()}.${trimmedFractional}`;
}