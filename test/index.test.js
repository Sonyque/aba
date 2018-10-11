const IB4B = require('../index');

describe('IB4B', () => {
  it('works', () => {
    const aba = new IB4B();
    expect(aba).not.toBe(null);
  });

  it('throws error', () => {
    const aba = new IB4B();
    expect(() => aba.generate([])).toThrowError();
  });

  it('generates', () => {
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
    expect(file).not.toBe(undefined);
    const lines = file.split('\r\n');
    expect(lines[1]).toBe(
      '2,0200123456789000,50,1250,The Electrician Corp,AZ100364C,,,,ACME CORPORATION,,,'
    );
  });
});
