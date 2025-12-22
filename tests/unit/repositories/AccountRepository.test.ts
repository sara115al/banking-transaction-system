import { HttpException, HttpStatus } from '@nestjs/common';
import { AccountDTO } from '../../../src/models/Account';
import { AccountRepository } from '../../../src/repositories/AccountRepository';

describe('AccountRepository Unit Tests', () => {
  const mockAccountDto1: AccountDTO = {
    id: 1,
    balance: 100,
    customerId: 1
  };
  const mockAccountDto2: AccountDTO = {
    id: 2,
    balance: 150.55,
    customerId: 1
  };

  const mockSqliteDb = {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn()
  };
  let accountRepo: AccountRepository;

  beforeAll(() => {
    accountRepo = new AccountRepository(mockSqliteDb as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Can get all accounts for a customer', async () => {
    mockSqliteDb.all.mockResolvedValue([mockAccountDto1, mockAccountDto2]); // sqlite.all returns an array of entities
    const results = await accountRepo.getAccountsForCustomer(mockAccountDto1.customerId);
    expect(results.length).toBe(2);
    expect(results).toEqual([
      {
        id: 1,
        balance: 100,
        customerId: 1
      },
      {
        id: 2,
        balance: 150.55,
        customerId: 1
      }
    ]);
    expect(mockSqliteDb.all).toHaveBeenCalledWith('SELECT * FROM accounts where customerId = ?', 1);
  });

  test('Can get an account for a customer', async () => {
    mockSqliteDb.get.mockResolvedValue(mockAccountDto2); // sqlite.get returns a single entity
    const result = await accountRepo.getAccountById(mockAccountDto1.customerId, mockAccountDto2.id);
    expect(result).toEqual({
      id: 2,
      balance: 150.55,
      customerId: 1
    });
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT * FROM accounts where customerId = ? and id = ?', 1, 2);
  });

  test('Throws a 404 if the account DNE in the database', async () => {
    mockSqliteDb.get.mockResolvedValue(undefined); // sqlite.get will return nothing if the query yields no results
    await expect(accountRepo.getAccountById(mockAccountDto1.customerId, 5))
      .rejects.toThrow(new HttpException('Account not found.', HttpStatus.NOT_FOUND));
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT * FROM accounts where customerId = ? and id = ?', 1, 5);
  });

  test('Can delete an account', async () => {
    mockSqliteDb.run.mockResolvedValue({});
    await accountRepo.deleteAccount(mockAccountDto1.customerId, mockAccountDto1.id);
    expect(mockSqliteDb.run).toHaveBeenCalledWith('DELETE FROM accounts WHERE id = ? and customerId = ?', 1, 1);
  });

  test('Can create a new account for a customer', async () => {
    const mockId = 3;
    const mockBalance = 400.00;
    const mockCustomerId = 2;

    mockSqliteDb.run.mockResolvedValue({ lastID: mockId }); // see RunResult interface in sqlite
    const results = await accountRepo.createAccount(mockCustomerId, mockBalance);
    expect(results).toEqual({
      id: 3,
      balance: 400.00,
      customerId: 2
    });
    expect(mockSqliteDb.run).toHaveBeenCalledWith('INSERT INTO accounts (balance, customerId) VALUES (?, ?)', 400.00, 2);
  });

  test('Can update a customer\'s name', async () => {
    mockSqliteDb.run.mockResolvedValue({});
    await accountRepo.updateAccount(mockAccountDto1.customerId, mockAccountDto2.id, 123.45);
    expect(mockSqliteDb.run).toHaveBeenCalledWith('UPDATE accounts SET balance = ? WHERE id = ? and customerId = ?', 123.45, 2, 1);
  });

  test('Returns true if customer exists in database', async () => {
    mockSqliteDb.get.mockResolvedValue(1); // if our exists query returns 1, the customer exists
    const exists = await accountRepo.accountExists(mockAccountDto1.customerId, mockAccountDto2.id);
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT 1 FROM accounts WHERE id = ? and customerId = ?', 2, 1);
    expect(exists).toBe(true);
  });

  test('Returns false if customer does not exists in database', async () => {
    mockSqliteDb.get.mockResolvedValue(undefined); // if our exists query returns undefined, the customer exists
    const exists = await accountRepo.accountExists(mockAccountDto1.customerId, mockAccountDto2.id);
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT 1 FROM accounts WHERE id = ? and customerId = ?', 2, 1);
    expect(exists).toBe(false);
  });
});
