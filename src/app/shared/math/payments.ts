
export function pmt(rate: number, per: number, nper: number, principal: number) {
  const pRate = rate / (per * 100);
  const x = Math.pow(1 + pRate, nper);
  return (pRate * (x * principal)) / (-1 + x)
}

export function futureValue({ yearlyInterestRate, paymentsPerYear = 12, paymentCount, payment = 0, initialValue = 0 }: { yearlyInterestRate: number, paymentsPerYear?: number, paymentCount: number, payment?: number, initialValue?: number }): number {
  const pRate = yearlyInterestRate / (paymentsPerYear * 100);
  const x = Math.pow(1 + pRate, paymentCount);
  return initialValue * x + payment * (x - 1) / pRate;
}

/**
 * Returns the amount of tax to pay for the given amount
 * @param taxableAmount The amount from which to deduct tax (the capital gains)
 * @param tax The amount of tax, as a fraction (.25 for 25% tax, for example)
 * @returns The total amount, minus the owed tax
 */
export function calculatCapitalGainsTax(taxableAmount: number, tax: number): number {
  return taxableAmount * tax;
}

/**
 * Returns an amount with tax removed
 * @param afterTaxAmount The amount which is tax-free (the initial investment)
 * @param taxableAmount The amount from which to deduct tax (the capital gains)
 * @param tax The amount of tax, as a fraction (.25 for 25% tax, for example)
 * @returns The total amount, minus the owed tax
 */
export function subtractCapitalGainsTax(afterTaxAmount: number, taxableAmount: number, tax: number): number {
  return afterTaxAmount + (1 - tax) * taxableAmount;
}