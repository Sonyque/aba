const moment = require('moment');
const BigNumber = require('bignumber.js');
const sprintf = require('printf');

const toCents = (number = 0) =>
  new BigNumber(number)
    .round(2)
    .times(100)
    .toFixed(0);

const sum = totals =>
  totals.reduce((p, v) => p.add(new BigNumber(v)), new BigNumber(0)).toFixed(2);

const hash = accounts => {
  const hashBase = accounts.map(a => {
    const newA = a.substr(2, 11);
    if (newA.length < 11) {
      return newA.padStart(11, '0');
    }
    return newA;
  });

  if (hashBase.length > 1) {
    const result = hashBase
      .reduce(
        (accumulator, currentItem) => accumulator + parseInt(currentItem, 10),
        0
      )
      .toString();

    if (result.length > 11) return result.substr(result.length - 11);
    else if (result.length < 11) return result.padStart(11, '0');
    return result;
  }

  return hashBase;
};

const HEADER_FORMAT = [
  '1,',
  ',',
  ',',
  ',',
  '%(account).16s,',
  '7,',
  '%(date)02d,',
  '%(date)02d,',
].join('');

const PAYMENT_FORMAT = [
  '2,',
  '%(account).16s,',
  '%(transactionCode)02d,',
  '%(amount)d,',
  '%(accountTitle).20s,',
  '%(reference).12s,',
  '%(traceAccount).12s,',
  ',',
  '%(particulars).12s,',
  '%(remitter).12s,',
  ',', // Your Code Optional
  ',', // Your Reference Optional
].join('');

const FOOTER_FORMAT = [
  '3,', // Control record
  '%(credit)012d,',
  '%(length)06d,',
  '%(hash)011d',
].join('');

class IB4B {
  constructor(opts) {
    this.options = Object.assign({}, IB4B.defaults, opts);
  }

  transaction(transaction) {
    return sprintf(
      PAYMENT_FORMAT,
      Object.assign({}, transaction, {
        amount: toCents(transaction.amount),
        account: transaction.account.trim(),
        accountTitle: transaction.accountTitle.trim().substring(0, 20),
        traceAccount: transaction.traceAccount
          ? transaction.traceAccount.trim().substring(0, 12)
          : '',
        reference: transaction.reference.trim().substring(0, 12),
        remitter: transaction.remitter,
        transactionCode: IB4B.CREDIT,
        particulars: '',
      })
    );
  }

  formatHeader() {
    return sprintf(HEADER_FORMAT, this.getHeader());
  }

  getHeader() {
    const header = this.options;
    const time = moment(header.date || new Date());

    return Object.assign({}, header, {
      date: time.format('YYMMDD'),
      account: header.account.trim(),
    });
  }

  formatFooter(transactions) {
    return sprintf(FOOTER_FORMAT, this.getFooter(transactions));
  }

  getFooter(transactions) {
    const credits = transactions.filter(p => p.transactionCode === IB4B.CREDIT);
    const credit = sum(credits.map(c => c.amount));
    const accounts = transactions.map(p => p.account);
    const hashTotal = hash(accounts);

    return {
      credit: toCents(credit),
      length: transactions.length,
      hash: hashTotal,
    };
  }

  generate(transactions = []) {
    // IB4B requires at least one detail record.
    if (!transactions.length) {
      throw new Error('Please pass in at least one payment');
    }
    const formatted = transactions.map(payment =>
      this.transaction(Object.assign({}, IB4B.PAYMENT_DEFAULTS, payment))
    );
    const footer = this.formatFooter(transactions);
    return [this.formatHeader(), ...formatted, footer].join('\r\n');
  }
}

IB4B.PAYMENT_DEFAULTS = {
  tax: '',
  taxAmount: 0,
};

IB4B.CREDIT = 50;
IB4B.DEBIT = 13;

IB4B.defaults = {
  bsb: '',
  account: '',
  description: '',
  time: '',
  remitter: '',
};

module.exports = IB4B;
