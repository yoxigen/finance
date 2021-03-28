import { pmt } from "../math/payments";

export interface LoanConfig {
  name: string,
  months: number,
  interestRate: number,
  principal: number,
}

export class Loan {
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