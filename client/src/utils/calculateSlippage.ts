// src/utils/calculateSlippage.ts

/**
 * محاسبه درصد Slippage Loss
 * @param expectedAmount مقدار مورد انتظار (بر اساس قیمت پیش‌نمایش)
 * @param actualAmount مقدار واقعی دریافت‌شده
 * @returns درصد ضرر (مثبت = ضرر، منفی = سود ناشی از بهتر از انتظار بودن)
 */
export function calculateSlippageLoss(
  expectedAmount: number,
  actualAmount: number
): number {
  if (expectedAmount <= 0) {
    throw new Error('expectedAmount باید بزرگتر از صفر باشد.');
  }
  return ((expectedAmount - actualAmount) / expectedAmount) * 100;
}