const moment = require('moment');
const IB4B = require('../');

const PAYMENT = {
  account: '0200123456789000',
  transactionCode: 50,
  amount: 1337.42,
  accountTitle: 'French Coffee',
  reference: 'Order 132',
  traceAccount: '567890',
  remitter: 'Vault',
};

describe('IB4B', () => {
  describe('.generate', () => {
    it('must return header in IB4B format', () => {
      const aba = new IB4B({
        account: '0201000123456000',
      });

      let header = '1,'; // Header record
      header += ','; // Spare. Currently an unused field, leave blank.
      header += ','; // Spare. Currently an unused field, leave blank.
      header += ','; // Spare. Currently an unused field, leave blank.
      header += '0201000123456000,'; // Your bank account number or credit card number
      header += '7,'; // File Type. 7 = Direct Credit type
      header += `${moment().format('YYMMDD')},`; // File Due Date
      header += `${moment().format('YYMMDD')},`; // File Creation Date
      expect(header.length).toBe(38);

      const rows = aba.generate([PAYMENT]).split(/\r\n/);
      expect(rows[0]).toBe(header);
    });

    it('must return payment rows in IB4B format', () => {
      const ib4b = new IB4B({
        account: '0201000123456000',
      });

      let row = '2,'; // Transaction Record
      row += '0200123456789000,'; // Other party bank account number or credit card number
      row += '50,'; // Transaction Code. 50 = Standard credit
      row += '133742,'; // Transaction Amount expressed in cents
      row += 'French Coffee,'; // Other Party Name
      row += 'Order 132,'; // Other Party Reference. Optional field.
      row += ','; // Other Party Code. Optional field.
      row += ','; // Spare. Currently an unused field, leave blank.
      row += ','; // Other Party Particulars. Optional field.
      row += 'Vault,'; // Remitter. Your company’s name.
      row += ','; // Your Code. Optional field.
      row += ','; // Your Reference. Optional field.
      expect(row.length).toBe(64);

      const payment = {
        transactionCode: IB4B.CREDIT,
        account: '0200123456789000',
        amount: 1337.42,
        accountTitle: 'French Coffee',
        reference: 'Order 132',
        remitter: 'Vault',
      };

      const rows = ib4b.generate([payment]).split(/\r\n/);
      expect(rows[1]).toBe(row);
    });

    it('must return footer in IB4B format', () => {
      const ib4b = new IB4B({
        account: '0201000123456000',
      });

      let footer = '3,'; // Control record
      footer += '000000401226,'; // Transaction Amount Total = 4012,26
      footer += '000003,'; // Transaction Record Count
      footer += '00370370367'; // Hash Total. Last row without comma
      expect(footer.length).toBe(33);

      const payments = [PAYMENT, PAYMENT, PAYMENT];
      const rows = ib4b.generate(payments).split(/\r\n/);

      expect(rows[4]).toBe(footer);
    });

    it('must use given account', () => {
      const ib4b = new IB4B({
        account: '0201000123456000',
      });

      const rows = ib4b.generate([PAYMENT]).split(/\r\n/);

      expect(rows[0].slice(5, 21)).toBe('0201000123456000');
    });

    it('must use given date if exist', () => {
      const ib4b = new IB4B({
        account: '0201000123456000',
        date: new Date(1987, 5, 18),
      });

      const rows = ib4b.generate([PAYMENT]).split(/\r\n/);
      expect(rows[0].slice(24, 38)).toBe('870618,870618,');
    });

    it('must use current date if not given', () => {
      const ib4b = new IB4B({
        account: '0201000123456000',
      });

      const rows = ib4b.generate([PAYMENT]).split(/\r\n/);
      expect(rows[0].slice(24, 30)).toBe(moment().format('YYMMDD'));
    });

    it('must sum up credits total', () => {
      const ib4b = new IB4B({
        account: '0201000123456000',
      });

      const defaults = {
        transactionCode: IB4B.CREDIT,
        account: '0200123456789000',
        accountTitle: 'French Coffee',
        reference: 'Order 132',
        remitter: 'Vault',
      };

      const creditA = Object.assign({}, defaults, {
        amount: 1337.42,
      });
      const creditB = Object.assign({}, defaults, {
        amount: 512.64,
      });

      const payments = [creditA, creditB];

      const footer = '185006'; // Sum of credits should be 1850.06
      const rows = ib4b.generate(payments).split(/\r\n/);
      expect(rows[3].substr(8, 6)).toBe(footer);
    });
  });
});
