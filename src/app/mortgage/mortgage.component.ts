import { Component, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/internal/operators/debounceTime';
import { CurrencyService } from '../currency.service';
import { Loan, LoanConfig } from '../data_types/Loan';
import { Mortgage, MortgageConfig } from '../data_types/Mortgage';

@Component({
  selector: 'calc-mortgage',
  templateUrl: './mortgage.component.html',
  styleUrls: ['./mortgage.component.scss']
})
export class MortgageComponent implements OnDestroy {
  @Input() requiredPrincipal: number;

  @Input() 
  set config(config: MortgageConfig) {
    if (this.loansSubscription) {
      this.loansSubscription.unsubscribe();
    }

    this.mortgage = new Mortgage(config);
    
    this.update();

    this.loansSubscription = this.mortgage.loans$.subscribe(() => {
      if (this.isInit) {
        this.update();
      }
    });

    this.isInit = true;
  }

  @Output() mortgageChange = new EventEmitter<Mortgage>();

  displayedMortgageLoanColumns = ['principal', 'portion', 'interestRate', 'months', 'monthlyPayment', 'total', 'removeLoan'];
  mortgage: Mortgage;
  portions: number[];

  private isInit = false;
  private loansSubscription: Subscription;
  
  constructor(public currencyService: CurrencyService) { }

  private update() {
    this.mortgageChange.emit(this.mortgage);
    this.setPortions();
  }

  get totalPercentageCovered(): number {
    return Math.floor(100 * this.mortgage.principal / this.mortgage.requiredPrincipal);
  }

  ngOnDestroy(): void {
    if (this.loansSubscription) {
      this.loansSubscription.unsubscribe();
    }
  }

  addLoan() {
    const uncoveredPrice = this.mortgage.requiredPrincipal - this.mortgage.principal;
    this.mortgage.addLoan({
      name: `Loan #${this.mortgage.loans.length + 1}`,
      principal: uncoveredPrice,
      months: this.mortgage.totalMonths,
      interestRate: 3
    })
  }

  trackByLoanId(loan: Loan): string | number {
    return loan.id;
  }

  onLoanPrincipalChange() {
    this.setPortions();
  }

  onLoanPortionChange(loanIndex: number) {
    const portion = this.portions[loanIndex];
    const principalForPortion = Math.floor(this.mortgage.requiredPrincipal * portion / 100);
    this.mortgage.loans[loanIndex].principal = principalForPortion;
  }

  private getOtherLoans(loan: Loan): Loan[] {
    return this.mortgage.loans.filter(_loan => _loan !== loan);
  }

  private setPortions() {
    this.portions = this.mortgage.loans.map(({principal}) => Math.floor(100 * principal / this.mortgage.requiredPrincipal));
  }
}
