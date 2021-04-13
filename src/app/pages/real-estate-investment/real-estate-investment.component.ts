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
import { SummaryItem } from '../../shared/components/display/summary-table/summary-table.component';

interface RentVsOwnershipQueryParams {
  downPayment: number,
  initialRent: number,
  annualAssetInterest: number,
  extraYears: number,
  renterTax: number,
  rentAnnualIncreaseRate: number,
  mortgage: string,
  price: number
}

interface ChartDataItem {
  year: number,
  rent: number,
  mortgageMonthlyPayment: number,
  monthlyIncome: number,
  mortgageAmountLeft: number,
  propertyValue: number,
  solventMortgageAmount: number,
}

type ChartData = ChartDataItem[];

const DEFAULT_INITIAL_SUM = 300000;
const DEFAULT_PROPERTY_PRICE = 1200000;
const DEFAULT_LOAN_PRINCIPAL = (DEFAULT_PROPERTY_PRICE - DEFAULT_INITIAL_SUM) / 3;
const DEFAULT_LOAN_MONTHS = 20 * 12;
const DEFAULT_INITIAL_RENT = 4000;
const DEFAULT_ANNUAL_RENT_INCREASE_RATE = 3;

const DEFAULT_LOANS = [
  { name: $localize `Prime`, months: DEFAULT_LOAN_MONTHS, interestRate: 1.6, principal: DEFAULT_LOAN_PRINCIPAL },
  { name: $localize `Mishtana`, months: DEFAULT_LOAN_MONTHS, interestRate: 3, principal: DEFAULT_LOAN_PRINCIPAL },
  { name: $localize `Fixed`, months: DEFAULT_LOAN_MONTHS, interestRate: 3, principal: DEFAULT_LOAN_PRINCIPAL },
];

const PAGE_TITLE = $localize `Realt Estate Investment Calculator`;

@Component({
  selector: 'real-estate-investment',
  templateUrl: './real-estate-investment.component.html',
})
export class RealEstateInvestmentComponent implements OnInit {
  private _totalRent: number;
  private _totalRentIncome: number;
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
    vAxis: {
      baseline: 0
    }
  };

  downPayment = DEFAULT_INITIAL_SUM;
  price = DEFAULT_PROPERTY_PRICE;
  annualAssetInterest = 3;
  extraYears = 0;
  renterTax = 0;

  mortgageConfig: MortgageConfig = { 
    loans: DEFAULT_LOANS, 
    requiredPrincipal: this.price - this.downPayment 
  };

  mortgage: Mortgage;
  rent: Rent;

  displayedChartDataTableColumns = [
    'year', 
    'rent', 
    'monthlyIncome', 
    'mortgageMonthlyPayment', 
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
    return this.price - this.downPayment;
  }

  get totalRent(): number {
    return this._totalRent;
  }

  get totalRentIncome(): number {
    return this._totalRentIncome;
  }

  get totalMortgageFutureValue(): number {
    return this.futurePropertyValue;
  }

  get totalMortgageGain(): number {
    return this.totalMortgageFutureValue - this.price;
  }

  get financingPercent(): number {
    return 100 * (this.price - this.downPayment) / this.price;
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
    this.rent = new Rent({ initialRent: DEFAULT_INITIAL_RENT, annualIncreaseRate: DEFAULT_ANNUAL_RENT_INCREASE_RATE });

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
          this.calcResults();
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
    this.calcResults();
  }

  private getQueryParams(): RentVsOwnershipQueryParams {
    return {
      downPayment: this.downPayment,
      initialRent: this.rent.initialRent,
      annualAssetInterest: this.annualAssetInterest,
      extraYears: this.extraYears,
      rentAnnualIncreaseRate: this.rent.annualIncreaseRate,
      mortgage: this.mortgage ? this.mortgage.serialize() : undefined,
      price: this.price,
      renterTax: this.renterTax
    };
  }

  private getDataFromQueryParams(queryParams: Params): Params {
    const params = ['downPayment', 'initialRent', 'annualAssetInterest', 'extraYears', 'renterTax', 'rentAnnualIncreaseRate', 'price'];
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
    ['downPayment', 'annualAssetInterest', 'initialRent', 'investmentInterest', 'extraYears', 'renterTax', 'price'].forEach(param => {
      if (numericParams[param] !== undefined) {
        this[param] = numericParams[param];
      }
    })
    if (numericParams.initialRent !== undefined) {
      this.rent.initialRent = numericParams.initialRent;
    }

    if (numericParams.rentAnnualIncreaseRate !== undefined) {
      this.rent.annualIncreaseRate = numericParams.rentAnnualIncreaseRate;
    }

    if (numericParams.mortgage) {
      this.mortgageConfig = { loans: numericParams.mortgage, requiredPrincipal: this.price - this.downPayment };
    }
  }

  calcResults() {
    if (!this.mortgage || !this.rent) {
      return;
    }

    let mortgageAmountLeft = this.mortgage.totalAmount;
    let totalRentIncome = 0;
    let totalRent = 0;

    const firstYearRent = this.rent.rentAtYear(0);
    const firstYearMortgageMonthlyPayment = this.mortgage.paymentAtMonth(0);

    const yearsData: ChartData = [
      {
        rent: firstYearRent,
        year: 0,
        mortgageMonthlyPayment: firstYearMortgageMonthlyPayment,
        mortgageAmountLeft: this.mortgage.totalAmount,
        propertyValue: this.price,
        solventMortgageAmount: this.downPayment,
        monthlyIncome: firstYearRent - firstYearMortgageMonthlyPayment
      }
    ];

    const yearsCount = this.totalTime;

    for (let year = 0; year < yearsCount; year++) {
      const rent = this.rent.rentAtYear(year);
      const mortgageMonthlyPayment = this.mortgage.paymentAtMonth(year * 12);
      const monthlyIncome = rent - mortgageMonthlyPayment;
      mortgageAmountLeft -= this.mortgage.paymentAtYear(year);
      totalRent += rent * 12;
      totalRentIncome += monthlyIncome * 12;

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
        mortgageMonthlyPayment,
        mortgageAmountLeft,
        propertyValue,
        monthlyIncome,
        solventMortgageAmount: Math.floor(propertyValue - mortgageAmountLeft),
      });
    }

    this.yearsData = yearsData;
    //console.table(yearsData);
    this._totalRent = totalRent;
    this._totalRentIncome = totalRentIncome;

    this.chartData = getChartData(yearsData);

    this.rentSummaryItems = [];

    const futurePropertyValue = this.futurePropertyValue;

    this.mortgageSummaryItems = [
      {
        title: $localize `Total assets value (after tax)`,
        valueType: CalcTextType.good,
        value: futurePropertyValue,
        description: $localize `Property value + investments value`,
        isHighlight: true
      },
      {
        title: $localize `Total money paid for the property`,
        value: this.mortgage.totalAmount + this.downPayment,
        description: $localize `All the money that was paid to buy the property (down-payment + mortgage)`
      },
      {
        title: $localize `Property value`,
        value: futurePropertyValue,
        description: $localize `Expected value of the property at the end of the period, calculated by compounding the price of the property by the annual property value increase rate for ${yearsCount} years.`,
      },
      {
        title: $localize `:Value minus payments on mortgage:Total value minus money paid`,
        value: futurePropertyValue - (this.mortgage.totalAmount + this.downPayment),
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