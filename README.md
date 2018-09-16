# IB4B afi/txt file generation Node.js

Generate IB4B .afi/.txt Files from Node.js 🎇
Exports transaction files into Internet Banking for Business (IB4B).

Implemented according to general BNZ [documentation](https://www.bnz.co.nz/assets/business-banking-help-support/internet-banking/ib4b-file-format-guide).

Basic usage:
```javascript
const ib4b = new IB4B({
  account: '0201000123456000',
});

const transaction = {
  transactionCode: IB4B.CREDIT,
  account: '0200123456789000',
  amount: '12.50',
  accountTitle: 'The Electrician Corp',
  reference: 'AZ100364C',
  remitter: 'ACME CORPORATION',
};

const file = ib4b.generate([transaction]);
```