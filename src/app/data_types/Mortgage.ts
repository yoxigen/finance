import { Observable, Observer } from "rxjs";
import { Loan, LoanConfig } from "./Loan";

export interface AmountPerMonths {
    amount: number,
    months: number,
    monthCount: number,
}

export interface MortgageConfig {
    loans: LoanConfig[],
    requiredPrincipal: number,
}

export class Mortgage {
    loans: Array<Loan>;
    private _paymentPerMonths: AmountPerMonths[];
    loans$: Observable<Array<Loan>>;
    
    private loansObserver: Observer<Array<Loan>>;
    private _requiredPrincipal: number;

    constructor(config: MortgageConfig) {
        const loans = config.loans.map(loan => new Loan(loan, () => this.reset()));
        this.loans = loans.sort((a, b) => a.id > b.id ? 1 : -1);
        this.loans$ = new Observable<Array<Loan>>(observer => {
            this.loansObserver = observer;
            observer.next(loans);
        });
        this._requiredPrincipal = config.requiredPrincipal;
    }

    get requiredPrincipal(): number {
        return this._requiredPrincipal;
    }

    get totalMonths(): number {
        return Math.max(...this.loans.map(({ months }) => months));
    }

    get totalYears(): number {
        return this.totalMonths / 12;
    }

    get maxMonthlyPayment(): number {
        return this.loans.reduce((total, { monthlyPayment }) => total + monthlyPayment, 0);
    }

    get weightedAvgPayment(): number {
        const paymentPerMonths = this.paymentPerMonths;
        const totalmonths = this.totalMonths;

        return paymentPerMonths.reduce((weights, { monthCount, amount }) =>
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
        return this.loans.reduce((total, { principal }) => total + principal, 0);
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
            .map(([months, amount]) => ({ months, amount }))
            .sort((a, b) => a.months < b.months ? -1 : 1);

        return amountPerMonths.map(({ amount, months }, i) => ({
            amount,
            months,
            monthCount: i ? months - amountPerMonths[i - 1].months : months
        }));
    }

    addLoan(loanConfig?: LoanConfig) {
        const newLoan = new Loan(loanConfig ?? {
            name: `Loan #${this.loans.length}`,
            principal: 0,
            months: 0,
            interestRate: 3
        }, () => this.reset());

        this.loans = [...this.loans, newLoan]
        this.reset();
    }

    addLoans(loanConfig: LoanConfig[]): Loan[] {
        const newLoans = loanConfig.map(loanConfig => new Loan(loanConfig ?? {
            name: `Loan #${this.loans.length}`,
            principal: 0,
            months: 0,
            interestRate: 3
        }, () => this.reset()));

        this.loans = this.loans.concat(newLoans);
        this.reset();
        return newLoans;
    }

    removeLoans(loans: Loan[]) {
        const loanIndexes = loans.map(loan => this.loans.indexOf(loan)).filter(index => index !== -1).sort().reverse();
        loanIndexes.forEach((loanIndex) => this.loans.splice(loanIndex, 1));
        this.loans = Array.from(this.loans);
        this.reset();
    }

    reset() {
        this._paymentPerMonths = null;
        this.loansObserver.next(this.loans);
    }

    paymentAtMonth(month: number): number {
        const paymentPerMonths = this.paymentPerMonths
        for (const { months, amount } of paymentPerMonths) {
            if (month < months) {
                return amount;
            }
        }

        return 0;
    }

    paymentAtYear(year: number): number {
        let yearPayment = 0;
        const startingMonth = year * 12;
        for (let month = 0; month < 12; month++) {
            const paymentAtMonth = this.paymentAtMonth(startingMonth + month);
            if (paymentAtMonth) {
                yearPayment += paymentAtMonth
            } else {
                return yearPayment;
            }
        }
        return yearPayment;
    }

    serialize(): string {
        return this.loans.map(loan => loan.serialize()).join(',');
    }

    static deserialize(serialized: string): Array<LoanConfig> {
        const serializedLoans = serialized.split(',');
        return serializedLoans.map(Loan.deserialize);
    }
}