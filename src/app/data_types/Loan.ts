import { pmt } from "../math/payments";

let lastLoanId = 0;

export interface LoanConfig {
  name: string,
  months: number,
  interestRate: number,
  principal: number,
  id?: number
}

export class Loan {
    name: string;
    id: number;

    private _months: number;
    private _interestRate: number;
    private _principal: number;
  
    private _totalAmount: number = null;
    private _monthlyPayment: number = null;
    private isInit = false;

    constructor(config: LoanConfig, private onChange: (loan: Loan) => void) {
      Object.assign(this, config);
      this.isInit = true;

      if (!this.id) {
        this.id = ++lastLoanId;
      }
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
      if (!this.months || !this.principal) {
        return this._monthlyPayment = 0;
      }

      return this._monthlyPayment = Math.floor(pmt(this.interestRate, 12, this.months, this.principal));
    }
  
    private notifyOnChange() {
      if (this.isInit) {
        this._totalAmount = null;
        this._monthlyPayment = null;
        this.onChange(this);
      }
    }

    serialize(): string {
      return `${this.name.replace(/[_,]/g, ' ')}_${this.principal}_${this.interestRate}_${this.months}_${this.id}`;
    }

    static deserialize(serialized: string): LoanConfig {
      const [name, ...values] = serialized.split("_");
      const [principal, interestRate, months, id] = values.map(value => parseFloat(value));
      return {
        name,
        principal,
        interestRate, 
        months,
        id
      };
    }
  }