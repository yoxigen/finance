import { Component, OnInit } from '@angular/core';
import {MatInputModule} from '@angular/material/input';

interface LoanConfig {
  name: string,
  months: number,
  interestRate: number,
  principal: number,
}

interface AmountPerMonths {
  amount: number, 
  months: number,
  monthCount: number,
}

interface ChartDataItem {
    year: number, 
    rent: number, 
    mortgageMonthlyPayment: number, 
    monthlyRentInvestment: number, 
    yearlyRentInvestment: number, 
    totalRentSavings: number,
    mortgageInvestments: number,
    mortgageMonthlyInvestments: number,
    mortgageAmountLeft: number
}

type ChartData = ChartDataItem[];

@Component({
  selector: 'app-real-estate',
  templateUrl: './real-estate.component.html',
  styleUrls: ['./real-estate.component.scss']
})
export class RealEstateComponent implements OnInit {
  private _totalRentSavings: number;
  private _totalMortgageSavings: number;
  private _totalRentInvestmentSum: number;
  private _totalMortgageInvestmentSum: number;
  private _totalRentPaid: number;

  chartData: ChartData = [];

  initialSum = 920000;
  price = 2120000;
  annualAssetInterest = 3;
  investmentInterest = 7;
  extraYears = 0;
  capitalGainsTax = .25;
  
  mortgage: Mortgage;
  rent: Rent;

  displayedMortgageLoanColumns = ['name', 'principal', 'interestRate', 'months', 'monthlyPayment', 'total'];
  displayedChartDataTableColumns = ['year', 'rent', 'monthlyRentInvestment', 'totalRentSavings', 'mortgageMonthlyPayment', 'mortgageInvestments', 'mortgageAmountLeft'];

  currency: 'ILS';
  currencyFormat: '0.0-0';

  get mortgageSum(): number {
    return this.price - this.initialSum;
  }

  get totalRentSavings(): number {
    return this._totalRentSavings;
  }

  get totalRentInvestmentSum(): number {
    return this._totalRentInvestmentSum;
  }

  get totalMortgageInvestmentSum(): number {
    return this._totalMortgageInvestmentSum;
  }

  get totalMortgageSavings(): number {
    return this._totalMortgageSavings;
  }

  get totalMortgageInvestmentGainsAfterTax(): number {
    return this.totalMortgageInvestmentSum + (this.totalMortgageSavings - this.totalMortgageInvestmentSum) * (1 - this.capitalGainsTax);
  }

  get totalRentInvestmentGainsAfterTax(): number {
    return this.totalRentInvestmentSum + (this.totalRentSavings - this.totalRentInvestmentSum) * (1 - this.capitalGainsTax);
  }

  get totalRentPaid(): number {
    return this._totalRentPaid;
  }

  get totalMortgageFutureValue(): number {
    return this.totalMortgageInvestmentGainsAfterTax + this.futurePropertyValue;
  }

  get totalMortgageGain(): number {
    return this.totalMortgageFutureValue - this.totalMortgageInvestmentSum - this.price;
  }

  get totalRentGain(): number {
    return this.totalRentInvestmentGainsAfterTax - this.totalRentInvestmentSum;
  }

  ngOnInit(): void {
    this.rent = new Rent({ initialRent: 4500, annualIncreaseRate: 3});
    this.mortgage = new Mortgage([
      {name: 'Prime', months: 20 * 12, interestRate: 1, principal: 360000},
      {name: 'Mishtana', months: 20 * 12, interestRate: 2.6, principal: 440000},
      {name: 'Fixed', months: 7 * 12, interestRate: 1.15, principal: 400000},
    ], () => this.calcTotalSavings());

    this.calcTotalSavings();
  }

  calcTotalSavings() {
    if (!this.mortgage || !this.rent) {
      return;
    }

    let mortgageAmountLeft = this.mortgage.totalAmount;

    let rentSavings = this.initialSum;
    let mortgageInvestments = 0;
    let rentInvestmentSum = this.initialSum;
    let mortgageInvestmentSum = 0;
    let totalRentPaid = 0;

    const chartData: ChartData = [
      {
        rent: this.rent.rentAtYear(0),
        year: 0,
        monthlyRentInvestment: 0,
        yearlyRentInvestment: this.initialSum,
        totalRentSavings: Math.floor(rentSavings),
        mortgageMonthlyPayment: this.mortgage.paymentAtMonth(0),
        mortgageInvestments: 0,
        mortgageMonthlyInvestments: 0,
        mortgageAmountLeft: this.mortgage.totalAmount
      }
    ];

    for (let year = 0; year < this.mortgage.totalYears + this.extraYears; year++) {
      const rent = this.rent.rentAtYear(year);
      const mortgageMonthlyPayment = this.mortgage.paymentAtMonth(year * 12);
      const mortgageToRentDifference = mortgageMonthlyPayment - rent;
      const monthlySavings = Math.max(0, mortgageToRentDifference);
      rentInvestmentSum += monthlySavings * 12;
      mortgageAmountLeft -= this.mortgage.paymentAtYear(year);
      totalRentPaid += rent * 12;

      rentSavings = futureValue({ 
        yearlyInterestRate: this.investmentInterest,
        paymentsPerYear: 12,
        paymentCount: 12,
        payment: monthlySavings,
        initialValue: rentSavings
      });
      
      if (mortgageToRentDifference < 0) {
        mortgageInvestments = Math.ceil(futureValue({
          yearlyInterestRate: this.investmentInterest,
          paymentsPerYear: 12,
          paymentCount: 12,
          payment: -mortgageToRentDifference,
          initialValue: mortgageInvestments
        }));
        mortgageInvestmentSum += this.mortgage.paymentAtYear(year) - rent * 12;
      }
      

      chartData.push({
        rent,
        year: year + 1,
        monthlyRentInvestment: Math.floor(monthlySavings),
        yearlyRentInvestment: Math.floor(monthlySavings) * 12,
        totalRentSavings: Math.floor(rentSavings),
        mortgageMonthlyPayment,
        mortgageInvestments,
        mortgageMonthlyInvestments: mortgageToRentDifference < 0 ? -mortgageToRentDifference : 0,
        mortgageAmountLeft
      });
    }

    this.chartData = chartData;
    console.table(chartData);
    this._totalRentSavings = rentSavings;
    this._totalMortgageSavings = mortgageInvestments;
    this._totalRentInvestmentSum = rentInvestmentSum;
    this._totalMortgageInvestmentSum = mortgageInvestmentSum;
    this._totalRentPaid = totalRentPaid;
  }

  get futurePropertyValue(): number {
    return Math.floor(futureValue({
      initialValue: this.price,
      yearlyInterestRate: this.annualAssetInterest,
      paymentCount: this.mortgage.totalMonths + this.extraYears * 12
    }));
  }

  toPercent(value: number): string {
    return `${value}%`;
  }
}

class Rent {
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

class Mortgage {
  loans: Array<Loan>;
  private _paymentPerMonths: AmountPerMonths[];

  constructor(loans: Array<LoanConfig>, private onChange?: (mortgage: Mortgage) => void) {
    this.loans = loans.map(loan => new Loan(loan, () => this.reset()));
  }

  get totalMonths(): number {
    return Math.max(...this.loans.map(({months}) => months));
  }

  get totalYears(): number {
    return this.totalMonths / 12;
  }

  get maxMonthlyPayment(): number {
    return this.loans.reduce((total, {monthlyPayment}) => total + monthlyPayment, 0);
  }

  get weightedAvgPayment(): number {
    const paymentPerMonths = this.paymentPerMonths;
    const totalmonths = this.totalMonths;

    return paymentPerMonths.reduce((weights, {monthCount, amount}) => 
      weights + monthCount * amount
    , 0) / this.totalMonths;
  }

  get totalAmount(): number {
    return this.loans.reduce((total, loan) => total + loan.totalAmount, 0);
  }

  get avgInterestRate(): number {
    return this.loans.reduce((total, loan) => total + loan.principal * loan.interestRate, 0) / this.principal;
  }

  get principal(): number {
    return this.loans.reduce((total, {principal}) => total + principal, 0);
  }

  get paymentPerMonths(): AmountPerMonths[] {
    if (this._paymentPerMonths) {
      return this._paymentPerMonths;
    }

    const paymentsPerMonths: Map<number, number> = this.loans.reduce((returnsMap, loan) => {
      const monthsReturn = returnsMap.get(loan.months);
      returnsMap.set(loan.months, (monthsReturn ?? 0) + loan.monthlyPayment);
      return returnsMap;
    }, new Map<number, number>());

    paymentsPerMonths.forEach((amount, months) => {
      paymentsPerMonths.forEach((_amount, _months) => {
        if (months !== _months && months < _months) {
          paymentsPerMonths.set(months, amount + _amount);
        }
      })
    })

    const amountPerMonths = Array.from(paymentsPerMonths.entries())
      .map(([months, amount]) => ({months, amount}))
      .sort((a, b) => a.months < b.months ? -1 : 1);

    return amountPerMonths.map(({amount, months}, i) => ({ 
      amount, 
      months, 
      monthCount: i ? months - amountPerMonths[i - 1].months : months
    }));
  }

  reset() {
    this._paymentPerMonths = null;
    this.onChange && this.onChange(this);
  }

  paymentAtMonth(month: number): number {
    const paymentPerMonths = this.paymentPerMonths
    for (const {months, amount} of paymentPerMonths) {
      if (month < months) {
        return amount;
      }
    }

    return 0;
  }

  paymentAtYear(year: number): number {
    let yearPayment = 0;
    const startingMonth = year * 12;
    for (let month=0; month < 12; month++) {
      const paymentAtMonth = this.paymentAtMonth(startingMonth + month);
      if (paymentAtMonth) {
        yearPayment += paymentAtMonth
      } else {
        return yearPayment;
      }
    }
    return yearPayment;
  }
}

class Loan {
  name: string;
  private _months: number;
  private _interestRate: number;
  private _principal: number;

  private _totalAmount: number = null;
  private _monthlyPayment: number = null;

  constructor(config: LoanConfig, private onChange: (loan: Loan) => void) {
    Object.assign(this, config);
  }

  get months(): number {
    return this._months;
  }

  set months(value: number) {
    this._months = value;
    this.notifyOnChange();
  }

  get interestRate(): number {
    return this._interestRate;
  }

  set interestRate(value: number) {
    this._interestRate = value;
    this.notifyOnChange();
  }

  get principal(): number {
    return this._principal;
  }

  set principal(value: number) {
    this._principal = value;
    this.notifyOnChange();
  }

  get totalAmount(): number {
    if (this._totalAmount !== null) {
      return this._totalAmount;
    }

    return this._totalAmount = this.monthlyPayment * this.months;
  }

  get monthlyPayment(): number {
    if (this._monthlyPayment !== null) {
      return this._monthlyPayment;
    }
    return this._monthlyPayment =  Math.floor(pmt(this.interestRate, 12, this.months, this.principal));
  }

  private notifyOnChange() {
    this._totalAmount = null;
    this._monthlyPayment = null;
    this.onChange(this);
  }
}

function calcCompound(initialBalance: number, interestRate: number, nPeriods: number, nCompound: number = 1): number {
  return futureValue({
    yearlyInterestRate: interestRate,
    paymentsPerYear: nCompound,
    paymentCount: nPeriods,
    payment: 0,
    initialValue: initialBalance
  })
}

function pmt(rate: number, per: number, nper: number, principal: number) { 
  const pRate = rate/(per * 100); 
  const x = Math.pow(1 + pRate,nper); 
  return (pRate * (x * principal))/(-1 + x)
}

function futureValue({yearlyInterestRate, paymentsPerYear = 12, paymentCount, payment = 0, initialValue = 0}: { yearlyInterestRate: number, paymentsPerYear?: number, paymentCount: number, payment?: number, initialValue?: number}): number {
  const pRate = yearlyInterestRate/(paymentsPerYear * 100); 
  const x = Math.pow(1 + pRate,paymentCount); 
  //return (payment * (x - 1) + pRate * x * initialValue ) /pRate;
  return initialValue * x + payment * (x - 1) / pRate;
}