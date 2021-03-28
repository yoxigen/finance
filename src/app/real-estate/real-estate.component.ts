import { getCurrencySymbol } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Mortgage } from '../data_types/Mortgage';
import { Rent } from '../data_types/Rent';
import { calculatCapitalGainsTax, futureValue, subtractCapitalGainsTax } from '../math/payments';
import { SummaryItem } from '../summary-table/summary-table.component';
import { CalcTextType } from '../text/text.component';


interface ChartDataItem {
    year: number, 
    rent: number, 
    mortgageMonthlyPayment: number, 
    monthlyRentInvestment: number, 
    yearlyRentInvestment: number, 
    totalRentSavings: number,
    totalRentInvestmentSum: number,
    mortgageInvestments: number,
    mortgageMonthlyInvestments: number,
    mortgageAmountLeft: number,
    propertyValue: number,
    solventMortgageAmount: number
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

  yearsData: ChartData = [];
  chartData: [string, number, number][] = [];
  savingsChartData: [string, number, number][] = [];
  chartColumns = ['Year', 'Mortgage', 'Rent'];
  chartOptions = {
    legend: {
      position: 'bottom',
    },
    chartArea: {
      right: 0,
      left: 80,
      height: 200
    },
    height: 280
  };

  initialSum = 920000;
  price = 2120000;
  annualAssetInterest = 3;
  investmentInterest = 7;
  extraYears = 0;
  capitalGainsTax = .25;
  
  mortgage: Mortgage;
  rent: Rent;

  displayedMortgageLoanColumns = ['principal', 'interestRate', 'months', 'monthlyPayment', 'total'];
  displayedChartDataTableColumns = ['year', 'rent', 'monthlyRentInvestment', 'totalRentSavings', 'mortgageMonthlyPayment', 'mortgageInvestments', 'mortgageAmountLeft'];

  currency: 'ILS';
  currencyFormat: '0.0-0';
  currencySymbol = getCurrencySymbol('ILS', 'wide');

  rentSummaryItems: SummaryItem[] = [];
  mortgageSummaryItems: SummaryItem[] = [];

  get totalTime(): number {
    return this.mortgage.totalYears + this.extraYears;
  }

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

  get totalMortgageInvestmentTax(): number {
    return (this.totalMortgageSavings - this.totalMortgageInvestmentSum) * this.capitalGainsTax;
  }

  get totalMortgageInvestmentGainsAfterTax(): number {
    return this.totalMortgageInvestmentSum + (this.totalMortgageSavings - this.totalMortgageInvestmentSum) * (1 - this.capitalGainsTax);
  }

  get totalRentInvestmentGainsTax(): number {
    return (this.totalRentSavings - this.totalRentInvestmentSum) * this.capitalGainsTax;
  }

  get totalRentInvestmentGainsAfterTax(): number {
    return this.totalRentSavings - this.totalRentInvestmentGainsTax;
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

    const yearsData: ChartData = [
      {
        rent: this.rent.rentAtYear(0),
        year: 0,
        monthlyRentInvestment: 0,
        yearlyRentInvestment: this.initialSum,
        totalRentSavings: Math.floor(rentSavings),
        totalRentInvestmentSum: this.initialSum,
        mortgageMonthlyPayment: this.mortgage.paymentAtMonth(0),
        mortgageInvestments: 0,
        mortgageMonthlyInvestments: 0,
        mortgageAmountLeft: this.mortgage.totalAmount,
        propertyValue: this.price,
        solventMortgageAmount: 0
      }
    ];

    const yearsCount = this.totalTime;

    for (let year = 0; year < yearsCount; year++) {
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
        const mortgageMonthlyInvestment = Math.abs(mortgageToRentDifference);

        mortgageInvestments = Math.ceil(futureValue({
          yearlyInterestRate: this.investmentInterest,
          paymentsPerYear: 12,
          paymentCount: 12,
          payment: mortgageMonthlyInvestment,
          initialValue: mortgageInvestments
        }));
        mortgageInvestmentSum += mortgageMonthlyInvestment * 12;
      }

      const propertyValue = Math.floor(futureValue({
        yearlyInterestRate: this.annualAssetInterest,
        paymentsPerYear: 12,
        paymentCount: (year + 1) * 12,
        payment: 0,
        initialValue: this.price
      }));

      yearsData.push({
        rent,
        year: year + 1,
        monthlyRentInvestment: Math.floor(monthlySavings),
        yearlyRentInvestment: Math.floor(monthlySavings) * 12,
        totalRentSavings: Math.floor(rentSavings),
        totalRentInvestmentSum: rentInvestmentSum,
        mortgageMonthlyPayment,
        mortgageInvestments,
        mortgageMonthlyInvestments: mortgageToRentDifference < 0 ? -mortgageToRentDifference : 0,
        mortgageAmountLeft,
        propertyValue,
        solventMortgageAmount: propertyValue + subtractCapitalGainsTax(mortgageInvestmentSum, mortgageInvestments - mortgageInvestmentSum, this.capitalGainsTax) - mortgageAmountLeft
      });
    }

    this.yearsData = yearsData;
    console.table(yearsData);
    this._totalRentSavings = rentSavings;
    this._totalMortgageSavings = mortgageInvestments;
    this._totalRentInvestmentSum = rentInvestmentSum;
    this._totalMortgageInvestmentSum = mortgageInvestmentSum;
    this._totalRentPaid = totalRentPaid;

    const rentInvestmentsGains = rentSavings - rentInvestmentSum;
    const rentInvestmentsTax = calculatCapitalGainsTax(rentInvestmentsGains, this.capitalGainsTax);

    this.chartData = getChartData(yearsData);
    this.savingsChartData = getSavingsChartData(yearsData, this.capitalGainsTax);

    this.rentSummaryItems = [
      {
        title: "Total rent paid",
        valueType: CalcTextType.bad,
        value: totalRentPaid,
        description: `All the rent payments combined`
      },
      {
        title: "Total money invested",
        value: rentInvestmentSum,
        description: `How much money was invested`
      },
      {
        title: "Total money gained from investments",
        value: rentInvestmentsGains,
        description: `The gain from investments`
      },
      {
        title: "Assets available (before tax)",
        value: rentSavings,
        description: `How much all invested assets are worth, before capital gains tax`
      },
      {
        title: "Capital gains tax",
        valueType: CalcTextType.bad,
        value: rentInvestmentsTax,
        description: `Tax money to pay`
      },
      {
        title: "Assets available (after tax)",
        valueType: CalcTextType.good,
        value: rentSavings - rentInvestmentsTax,
        description: `Soluble assets in investments`,
        isHighlight: true
      },
      {
        title: "Assets available minus rent paid",
        value: rentSavings - rentInvestmentsTax - totalRentPaid,
        description: `Soluble assets in investments`
      },
    ];

    const mortgageInvestmentsGains = mortgageInvestments - mortgageInvestmentSum;
    const mortgageInvestmentsTax = calculatCapitalGainsTax(mortgageInvestmentsGains, this.capitalGainsTax);
    const futurePropertyValue = this.futurePropertyValue;

    this.mortgageSummaryItems = [
      {
        title: "Total mortgage paid",
        valueType: CalcTextType.bad,
        value: this.mortgage.totalAmount + this.initialSum,
        description: `Total money paid to return the mortgage`
      },
      {
        title: "Avg. monthly payment",
        value: this.mortgage.weightedAvgPayment,
        description: "The avg payment for the while period of the mortgage"
      },
      {
        title: "Total money invested",
        value: mortgageInvestmentSum,
        description: `How much money was invested, when the mortgage payment was lower than the rent payment`
      },
      {
        title: "Total money gained from investments",
        value: mortgageInvestmentsGains,
        description: `The gain from investments`
      },
      {
        title: "Assets available (before tax)",
        value: mortgageInvestments,
        description: `How much all invested assets (not including the property!) are worth, before capital gains tax`
      },
      {
        title: "Capital gains tax",
        valueType: CalcTextType.bad,
        value: mortgageInvestmentsTax,
        description: `Tax money to pay for investments`
      },
      {
        title: "Assets available (after tax)",
        valueType: CalcTextType.good,
        value: mortgageInvestments - mortgageInvestmentsTax,
        description: `Soluble assets in investments`,
        isHighlight: true
      },
      {
        title: "Property value",
        valueType: CalcTextType.good,
        value: futurePropertyValue,
        description: `Value of the property at the end of the period`,
      },
      {
        title: "Total assets value (after tax)",
        valueType: CalcTextType.good,
        value: futurePropertyValue + mortgageInvestments - mortgageInvestmentsTax,
        description: `Property value + investments value`,
        isHighlight: true
      },
      {
        title: "Total value - money paid",
        value: futurePropertyValue + mortgageInvestments - mortgageInvestmentsTax - (this.mortgage.totalAmount + this.initialSum),
        description: `Money gained minus money paid`
      },
    ];
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

function getChartData(yearsData: ChartData): [string, number, number][] {
  return yearsData.slice(1).map(yearData => [
    yearData.year.toString(),
    yearData.mortgageMonthlyPayment, 
    yearData.rent
  ]);
}

function getSavingsChartData(yearsData: ChartData, capitalGainsTax: number): [string, number, number][] {
  return yearsData.map(yearData => [
    yearData.year.toString(),
    yearData.solventMortgageAmount, 
    subtractCapitalGainsTax(yearData.totalRentInvestmentSum, yearData.totalRentSavings - yearData.totalRentInvestmentSum, capitalGainsTax)
  ]);
}