export function useCalculateTotal(
  unitPrice: number,
  quantity: number,
  discountAmount: number,
  discountPercentage: number
): number {
  const subtotal = unitPrice * quantity
  const percentageDiscount = (subtotal * discountPercentage) / 100
  const totalDiscount = discountAmount + percentageDiscount
  return Math.max(0, subtotal - totalDiscount)
}
