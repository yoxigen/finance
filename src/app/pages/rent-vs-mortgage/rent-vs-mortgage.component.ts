import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap, Params, NavigationEnd } from '@angular/router';
import { LoanConfig } from '../../data_types/Loan';
import { Mortgage, MortgageConfig } from '../../data_types/Mortgage';
import { Rent } from '../../data_types/Rent';
import { calculatCapitalGainsTax, futureValue, subtractCapitalGainsTax } from '../../shared/math/payments';
import { CalcTextType } from '../../shared/components/display/text/text.component';
import { filter, skip } from 'rxjs/operators';
import { CurrencyService } from '../../shared/services/currency.service';
import { Title } from '@angular/platform-browser';
import { SummaryItem } from 'src/app/shared/components/display/summary-table/summary-table.component';

const LOCAL_STORAGE_KEY = "rent-vs-ownership";

interface ChartDataItem {
  year: number,
  rent: number,
  mortgageMonthlyPayment: number,
  monthlyRentInvestment: number,
  yearlyRentInvestment: number,
  totalRentEquity: number,
  totalRentInvestmentSum: number,
  mortgageInvestments: number,
  mortgageMonthlyInvestments: number,
  mortgageAmountLeft: number,
  propertyValue: number,
  solventMortgageAmount: number,
  solventRentAmount: number,
}

interface RentVsOwnershipQueryParams {
  initialSum: number,
  rent: number,
  annualAssetInterest: number,
  investmentInterest: number,
  extraYears: number,
  capitalGainsTax: number,
  rentAnnualIncreaseRate: number,
  mortgage: string,
  price: number
}

type ChartData = ChartDataItem[];

const DEFAULT_INITIAL_SUM = 600000;
const DEFAULT_PROPERTY_PRICE = 1800000;
const DEFAULT_LOAN_PRINCIPAL = (DEFAULT_PROPERTY_PRICE - DEFAULT_INITIAL_SUM) / 3;
const DEFAULT_LOAN_MONTHS = 20 * 12;

const DEFAULT_LOANS = [
  { name: $localize `Prime`, months: DEFAULT_LOAN_MONTHS, interestRate: 1.6, principal: DEFAULT_LOAN_PRINCIPAL },
  { name: $localize `Mishtana`, months: DEFAULT_LOAN_MONTHS, interestRate: 3, principal: DEFAULT_LOAN_PRINCIPAL },
  { name: $localize `Fixed`, months: DEFAULT_LOAN_MONTHS, interestRate: 3, principal: DEFAULT_LOAN_PRINCIPAL },
];

const PAGE_TITLE = $localize `Rent vs Home Ownership Calculator`;

@Component({
  selector: 'app-rent-vs-mortgage',
  templateUrl: './rent-vs-mortgage.component.html',
})
export class RentVsMortgageComponent implements OnInit {
  private _totalRentEquity: number;
  private _totalMortgageSavings: number;
  private _totalRentInvestmentSum: number;
  private _totalMortgageInvestmentSum: number;
  private _totalRentPaid: number;

  private isInit = false;

  readonly title = PAGE_TITLE;

  yearsData: ChartData = [];
  chartData: [string, number, number][] = [];
  savingsChartData: [string, number, number][] = [];
  chartColumns = [$localize `Year`, $localize `Mortgage`, $localize `Rent`];
  chartOptions = {
    legend: {
      position: 'bottom',
    },
    chartArea: {
      right: 0,
      left: 80,
      height: 200
    },
    height: 280,
  };

  initialSum = DEFAULT_INITIAL_SUM;
  price = DEFAULT_PROPERTY_PRICE;
  annualAssetInterest = 3;
  investmentInterest = 7;
  extraYears = 0;
  capitalGainsTax = .25;

  mortgageConfig: MortgageConfig = { 
    loans: DEFAULT_LOANS, 
    requiredPrincipal: this.price - this.initialSum 
  };

  mortgage: Mortgage;
  rent: Rent;

  displayedChartDataTableColumns = [
    'year', 
    'rent', 
    'monthlyRentInvestment', 
    'totalRentEquity', 
    'mortgageMonthlyPayment', 
    'mortgageInvestments', 
    'mortgageAmountLeft',
    'mortgageEquity'
  ];

  currency: 'ILS';
  currencyFormat: '0.0-0';

  rentSummaryItems: SummaryItem[] = [];
  mortgageSummaryItems: SummaryItem[] = [];

  get totalTime(): number {
    return this.mortgage.totalYears + this.extraYears;
  }

  get mortgageSum(): number {
    return this.price - this.initialSum;
  }

  get totalRentEquity(): number {
    return this._totalRentEquity;
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
    return (this.totalRentEquity - this.totalRentInvestmentSum) * this.capitalGainsTax;
  }

  get totalRentInvestmentGainsAfterTax(): number {
    return this.totalRentEquity - this.totalRentInvestmentGainsTax;
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

  get financingPercent(): number {
    return 100 * (this.price - this.initialSum) / this.price;
  }

  get capitalGainsTaxPercentage(): number {
    return this.capitalGainsTax * 100;
  }

  set capitalGainsTaxPercentage(value: number) {
    this.capitalGainsTax = value / 100;
  }

  constructor(
    private activatedRoute: ActivatedRoute, 
    private router: Router,
    public currencyService: CurrencyService,
    titleService: Title
  ) {
      titleService.setTitle(PAGE_TITLE);
  }

  ngOnInit(): void {
    this.rent = new Rent({ initialRent: 4500, annualIncreaseRate: 3 });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(
      () => {
          const currentValuesQueryParams = this.getQueryParams();
          const queryParams = this.getDataFromQueryParams(this.activatedRoute.snapshot.queryParams);

          if (JSON.stringify(currentValuesQueryParams) !== JSON.stringify(queryParams)) {
            this.setDataFromQueryParams(queryParams);
          }

          this.isInit = true;
          this.calcTotalSavings();
      }
    );

  }

  setMortgage(mortgage: Mortgage) {
    this.mortgage = mortgage;
    this.update();
  }

  /**
   * Calculates results and summaries, updates the URL query params
   */
  update() {
    if (this.isInit) {
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: this.getQueryParams(),
        replaceUrl: true
      })
    }
    this.calcTotalSavings();
  }

  private getQueryParams(): RentVsOwnershipQueryParams {
    return {
      initialSum: this.initialSum,
      rent: this.rent.initialRent,
      annualAssetInterest: this.annualAssetInterest,
      investmentInterest: this.investmentInterest,
      extraYears: this.extraYears,
      capitalGainsTax: this.capitalGainsTax,
      rentAnnualIncreaseRate: this.rent.annualIncreaseRate,
      mortgage: this.mortgage ? this.mortgage.serialize() : undefined,
      price: this.price
    };
  }

  private getDataFromQueryParams(queryParams: Params): Params {
    const params = ['initialSum', 'rent', 'annualAssetInterest', 'investmentInterest', 'extraYears', 'capitalGainsTax', 'rentAnnualIncreaseRate', 'price'];
    const data = params.reduce((numericParams, param) => {
      const numericValue = getNumberFromParam(param);
      return numericValue !== null ? {
        ...numericParams,
        [param]: numericValue
      } : numericParams;
    }, {});

    if (queryParams.mortgage) {
      data["mortgage"] = Mortgage.deserialize(queryParams.mortgage);
    }

    return data;

    function getNumberFromParam(param: string): number {
      const value = queryParams[param];
      if (value) {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          return numericValue;
        }
      }

      return null;
    }
  }

  private setDataFromQueryParams(numericParams: Params) {
    ['initialSum', 'annualAssetInterest', 'investmentInterest', 'extraYears', 'capitalGainsTax', 'price'].forEach(param => {
      if (numericParams[param] !== undefined) {
        this[param] = numericParams[param];
      }
    })
    if (numericParams.rent !== undefined) {
      this.rent.initialRent = numericParams.rent;
    }

    if (numericParams.rentAnnualIncreaseRate !== undefined) {
      this.rent.annualIncreaseRate = numericParams.rentAnnualIncreaseRate;
    }

    if (numericParams.mortgage) {
      this.mortgageConfig = { loans: numericParams.mortgage, requiredPrincipal: this.price - this.initialSum };
    }
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
        totalRentEquity: Math.floor(rentSavings),
        totalRentInvestmentSum: this.initialSum,
        mortgageMonthlyPayment: this.mortgage.paymentAtMonth(0),
        mortgageInvestments: 0,
        mortgageMonthlyInvestments: 0,
        mortgageAmountLeft: this.mortgage.totalAmount,
        propertyValue: this.price,
        solventMortgageAmount: this.initialSum,
        solventRentAmount: this.initialSum
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
        totalRentEquity: Math.floor(rentSavings),
        totalRentInvestmentSum: rentInvestmentSum,
        mortgageMonthlyPayment,
        mortgageInvestments,
        mortgageMonthlyInvestments: mortgageToRentDifference < 0 ? -mortgageToRentDifference : 0,
        mortgageAmountLeft,
        propertyValue,
        solventMortgageAmount: Math.floor(propertyValue + subtractCapitalGainsTax(mortgageInvestmentSum, mortgageInvestments - mortgageInvestmentSum, this.capitalGainsTax) - mortgageAmountLeft),
        solventRentAmount: Math.floor(subtractCapitalGainsTax(rentInvestmentSum, rentSavings - rentInvestmentSum, this.capitalGainsTax))
      });
    }

    this.yearsData = yearsData;
    //console.table(yearsData);
    this._totalRentEquity = rentSavings;
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
        title: $localize `:Invested money while renting, after deducting capital gains tax:Equity (after tax)`,
        valueType: CalcTextType.good,
        value: rentSavings - rentInvestmentsTax,
        description: $localize `After paying taxes, the net value of investments`,
        isHighlight: true
      },
      {
        title: $localize `Equity minus rent paid`,
        value: rentSavings - rentInvestmentsTax - totalRentPaid,
        description: $localize `Sum of all the monetary value of equity, minus the total money paid on rent and taxes`
      },
      {
        title: $localize `Total rent paid`,
        valueType: CalcTextType.bad,
        value: totalRentPaid,
        description: $localize `All the rent payments for ${yearsCount} years combined`
      },
      {
        title: $localize `Total money invested`,
        value: rentInvestmentSum,
        description: $localize `Sum of all the money invested in yield-generating assets over the ${yearsCount} period`
      },
      {
        title: $localize `Total money gained from investments`,
        value: rentInvestmentsGains,
        description: $localize `The profit from investments, calculated as the current value of all assets minus the money invested`
      },
      {
        title: $localize `Assets available (before tax)`,
        value: rentSavings,
        description: $localize `How much all invested assets are worth, before capital gains tax`
      },
      {
        title: $localize `Capital gains tax (${this.capitalGainsTax * 100}%)`,
        valueType: CalcTextType.bad,
        value: rentInvestmentsTax,
        description: $localize `Tax money to pay for capital gains on investments`
      },
    ];

    const mortgageInvestmentsGains = mortgageInvestments - mortgageInvestmentSum;
    const mortgageInvestmentsTax = calculatCapitalGainsTax(mortgageInvestmentsGains, this.capitalGainsTax);
    const futurePropertyValue = this.futurePropertyValue;

    this.mortgageSummaryItems = [
      {
        title: $localize `Total assets value (after tax)`,
        valueType: CalcTextType.good,
        value: futurePropertyValue + mortgageInvestments - mortgageInvestmentsTax,
        description: $localize `Property value + investments value`,
        isHighlight: true
      },
      {
        title: $localize `Total money paid for the property`,
        value: this.mortgage.totalAmount + this.initialSum,
        description: $localize `All the money that was paid to buy the property (down-payment + mortgage)`
      },
      {
        title: $localize `Property value`,
        value: futurePropertyValue,
        description: $localize `Expected value of the property at the end of the period, calculated by compounding the price of the property by the annual property value increase rate for ${yearsCount} years.`,
      },
      {
        title: $localize `:Value minus payments on mortgage:Total value minus money paid`,
        value: futurePropertyValue + mortgageInvestments - mortgageInvestmentsTax - (this.mortgage.totalAmount + this.initialSum),
        description: $localize `Sum of all the monetary value of the property + equity, minus money paid on the mortgage`
      },
      {
        title: $localize `Total interest rate paid`,
        value: this.mortgage.totalInterest,
        description: $localize `Total amount of interest paid for the mortgage (in other words, the price you pay for the mortgage).`
      },
      {
        title: $localize `Avg. monthly payment`,
        value: this.mortgage.weightedAvgPayment,
        description: $localize `The average mortgage monthly payment for the period of the mortgage`
      },
      {
        title: $localize `Total money invested (not on the property)`,
        value: mortgageInvestmentSum,
        description: $localize `Sum of all the money invested in yield-generating assets (not including the mortgaged property!) over the ${yearsCount} years period, when the mortgage payment was lower than the rent payment`
      },
      {
        title: $localize `Total profit from investments`,
        value: mortgageInvestmentsGains,
        description: $localize `The difference between the value of the investments at the end of the period and the total sum invested`
      },
      {
        title: $localize `:Invested money while renting, before deducting capital gains tax:Equity (before tax)`,
        value: mortgageInvestments,
        description: $localize `How much all invested assets (not including the property!) are worth, before capital gains tax`
      },
      {
        title: $localize `Capital gains tax (${this.capitalGainsTax * 100}%)`,
        value: mortgageInvestmentsTax,
        description: $localize `Tax money to pay for capital gains on investments`
      },
      {
        title: $localize `:Invested money while renting, after deducting capital gains tax:Equity (after tax)`,
        value: mortgageInvestments - mortgageInvestmentsTax,
        description: $localize `After paying taxes, the net value of investments (other than the property)`,
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
    yearData.solventRentAmount
  ]);
}