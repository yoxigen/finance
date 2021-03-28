export class Rent {
    initialRent: number;
    annualIncreaseRate: number;
  
    constructor(config: { initialRent: number, annualIncreaseRate: number}) {
      Object.assign(this, config);
    }
  
    totalRent(months: number): number {
      return months * this.initialRent;
    }
  
    rentPerYear(month: number): number[] {
      return new Array(Math.ceil((month + 1) / 12))
        .fill(this.initialRent)
        .map((rent, year) => Math.floor(rent * (1 + year * this.annualIncreaseRate / 100)));
    }
  
    totalRentWithIncrease(months: number): number {
      return this.rentPerYear(months).reduce((totalRent, yearRent) => 
          totalRent + yearRent * 12
        , 0);
    }
  
    rentAtMonth(month: number): number {
      return this.rentPerYear(month).pop();
    }
  
    rentAtYear(year: number): number {
      return this.rentAtMonth(year * 12);
    }
  }
  