// src/utils/calculateImpermanentLoss.ts

/**
 * محاسبه Impermanent Loss (IL) بر اساس تغییر قیمت یکی از دارایی‌ها
 * فرمول استاندارد: 
 * IL = (2 * sqrt(r)) / (1 + r) - 1
 * که r = نسبت قیمت جدید به قیمت اولیه
 * 
 * @param priceRatio نسبت قیمت جدید به قیمت قدیم (مثلاً 1.5 یعنی 50% رشد)
 * @returns درصد Impermanent Loss (منفی = ضرر)
 */
export function calculateImpermanentLoss(priceRatio: number): number {
  if (priceRatio <= 0) {
    throw new Error('priceRatio باید بزرگتر از صفر باشد.');
  }
  const sqrtR = Math.sqrt(priceRatio);
  const il = (2 * sqrtR) / (1 + priceRatio) - 1;
  return il * 100; // به درصد
}