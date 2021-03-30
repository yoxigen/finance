import { Component, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { Loan, LoanConfig } from '../data_types/Loan';
import { Mortgage } from '../data_types/Mortgage';

@Component({
  selector: 'calc-mortgage',
  templateUrl: './mortgage.component.html',
  styleUrls: ['./mortgage.component.scss']
})
export class MortgageComponent implements OnDestroy {
  @Input() 
  set loans(loansConfig: Array<LoanConfig>) {
    if (this.loansSubscription) {
      this.loansSubscription.unsubscribe();
    }

    this.mortgage = new Mortgage(loansConfig ?? []);
    this.mortgageChange.emit(this.mortgage);
    this.loansSubscription = this.mortgage.loans$.subscribe(() => this.mortgageChange.emit(this.mortgage));
  }
  @Input() totalAmount: number;

  @Output() mortgageChange = new EventEmitter<Mortgage>();

  displayedMortgageLoanColumns = ['principal', 'interestRate', 'months', 'monthlyPayment', 'total', 'removeLoan'];
  mortgage: Mortgage;

  private loansSubscription: Subscription;
  
  constructor() { }

  ngOnDestroy(): void {
    if (this.loansSubscription) {
      this.loansSubscription.unsubscribe();
    }
  }

  addLoan() {
    const uncoveredPrice = this.totalAmount - this.mortgage.principal;
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
}
