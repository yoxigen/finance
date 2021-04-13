import { Component, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import {SelectionModel} from '@angular/cdk/collections';
import { CurrencyService } from '../../../services/currency.service';
import { Loan } from '../../../../data_types/Loan';
import { Mortgage, MortgageConfig } from '../../../../data_types/Mortgage';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';

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
    this.loansDataSource = new MatTableDataSource<Loan>(this.mortgage.loans);

    this.update();

    this.loansSubscription = this.mortgage.loans$.subscribe(() => {
      if (this.isInit) {
        this.update();
      }
    });

    this.isInit = true;

    // Update selection:
    const currentSelection = this.selection.selected;
    if (currentSelection.length) {
      this.selection.clear();
      this.selection.select(...this.mortgage.loans.filter(loan => !!currentSelection.find(_loan => _loan.id === loan.id)));
    }
  }

  @Output() mortgageChange = new EventEmitter<Mortgage>();

  displayedMortgageLoanColumns = ['select', 'principal', 'portion', 'interestRate', 'months', 'monthlyPayment', 'total'];
  mortgage: Mortgage;
  portions: number[];
  loansDataSource: MatTableDataSource<Loan>;
  selection = new SelectionModel<Loan>(true, []);

  private isInit = false;
  private loansSubscription: Subscription;
  
  constructor(public currencyService: CurrencyService, private snackBar: MatSnackBar) { }

  private update() {
    this.mortgageChange.emit(this.mortgage);
    this.setPortions();
  }

  get totalPercentageCovered(): number {
    return Math.floor(100 * this.mortgage.principal / this.requiredPrincipal);
  }

  /**
   * The difference of the amount covered by the loans sum principals and the required total principal.
   * For example, if the required principal (mortgage.requiredPrincipal) is 1M, but the loans amount to 0.5M,
   * the value of principalCoverageDifference will be -0.5M
   */
  get principalCoverageDifference(): number {
    return this.requiredPrincipal - this.mortgage.principal;
  }

  ngOnDestroy(): void {
    if (this.loansSubscription) {
      this.loansSubscription.unsubscribe();
    }
  }

  addLoan() {
    const uncoveredPrice = this.requiredPrincipal - this.mortgage.principal;
    this.mortgage.addLoan({
      name: `Loan #${this.mortgage.loans.length + 1}`,
      principal: uncoveredPrice,
      months: this.mortgage.totalMonths,
      interestRate: 3
    })
  }

  trackByLoanId(loan: Loan): number {
    return loan.id;
  }

  /**
   * If `principalCoverageDifference` is not 0, divides that value between the selected loans' principals,
   * So the mortgage meets the required principal.
   */
  fixPrincipals() {
    const loansToFix = this.selection.hasValue() ? this.selection.selected : this.mortgage.loans;

    const amountToDivide = this.principalCoverageDifference;
    const amountPerLoan = Math.round(amountToDivide / loansToFix.length);
    loansToFix.forEach(loan => loan.principal += amountPerLoan);

    // Accounting for rounding numbers:
    if (this.principalCoverageDifference) {
      loansToFix[loansToFix.length - 1].principal += this.principalCoverageDifference;
    }
  }

  onLoanPrincipalChange() {
    this.setPortions();
  }

  onLoanPortionChange(loanIndex: number) {
    const portion = this.portions[loanIndex];
    const principalForPortion = Math.floor(this.requiredPrincipal * portion / 100);
    this.mortgage.loans[loanIndex].principal = principalForPortion;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.mortgage.loans.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.mortgage.loans.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Loan): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${this.mortgage.loans.indexOf(row) + 1}`;
  }

  removeSelectedLoans() {
    const selectedLoans = this.selection.selected;
    this.mortgage.removeLoans(this.selection.selected);
    this.selection.clear();

    const snackBarRef = this.snackBar.open(`${selectedLoans.length === 1 ? 'Loan' : `${selectedLoans.length} loans`} removed`, 'Undo', {
      duration: 2000,
    });

    snackBarRef.onAction().subscribe(() => {
      const newLoans = this.mortgage.addLoans(selectedLoans);
      this.selection.select(...newLoans);
    });
  }

  private getOtherLoans(loan: Loan): Loan[] {
    return this.mortgage.loans.filter(_loan => _loan !== loan);
  }

  private setPortions() {
    this.portions = this.mortgage.loans.map(({principal}) => Math.floor(100 * principal / this.requiredPrincipal));
  }
}
