import { HttpException, HttpStatus } from '@nestjs/common';
import { Account, AccountDTO } from '../../../src/models/Account';
import { AccountService } from '../../../src/services/AccountService';

describe('AccountService Unit Tests', () => {
  const mockAccountDto1: AccountDTO = {
    id: 1,
    balance: 100.00,
    customerId: 1
  };
  const mockAccount1: Account = {
    accountId: mockAccountDto1.id,
    balance: mockAccountDto1.balance,
    transferHistory: [{
      transferId: 1,
      amount: 100,
      timestamp: 'right now',
      toAccountId: 2,
      fromAccountId: 1
    }]
  };
  const mockAccountDto2: AccountDTO = {
    id: 2,
    balance: 2000.00,
    customerId: 2
  };
  const mockAccount2: Account = {
    accountId: mockAccountDto2.id,
    balance: mockAccountDto2.balance,
    transferHistory: [{
      transferId: 1,
      amount: 100,
      timestamp: 'right now',
      toAccountId: 2,
      fromAccountId: 1
    }]
  };
  const mockAccountDto3: AccountDTO = {
    id: 3,
    balance: 50,
    customerId: 2
  };
  const mockAccount3: Account = {
    accountId: mockAccountDto3.id,
    balance: mockAccountDto3.balance,
    transferHistory: []
  };

  const mockAccountRepo = {
    getAccountsForCustomer: jest.fn(),
    getAccountById: jest.fn(),
    createAccount: jest.fn(),
    deleteAccount: jest.fn(),
    updateAccount: jest.fn()
  };
  const mockTransferService = {
    getTransfersForAccount: jest.fn()
  };
  let accountService: AccountService;

  beforeAll(() => {
    accountService = new AccountService(mockAccountRepo as any, mockTransferService as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Can get an account by an id', async () => {
    mockAccountRepo.getAccountById.mockResolvedValue(mockAccountDto1);
    // when getting an account, we also get the transfer history. Mock this.
    mockTransferService.getTransfersForAccount.mockResolvedValue(mockAccount1.transferHistory);

    const result = await accountService.getAccountById(mockAccountDto1.customerId, mockAccountDto1.id);
    expect(mockAccountRepo.getAccountById).toHaveBeenCalledWith(1, 1);
    expect(result).toEqual({
      accountId: 1,
      balance: 100.00,
      transferHistory: [{
        transferId: 1,
        amount: 100,
        timestamp: 'right now',
        toAccountId: 2,
        fromAccountId: 1
      }]
    });
  });

  test('Can get all accounts for a customer', async () => {
    mockAccountRepo.getAccountsForCustomer.mockResolvedValue([mockAccountDto2, mockAccountDto3]);
    // when getting an account, we also get the transfer history. Mock this.
    mockTransferService.getTransfersForAccount.mockImplementation((accountId: number) => {
      if (accountId === 1) return mockAccount1.transferHistory;
      if (accountId === 2) return mockAccount2.transferHistory;
      return mockAccount3.transferHistory;
    });

    const result = await accountService.getAccountsForCustomer(2);
    expect(mockAccountRepo.getAccountsForCustomer).toHaveBeenCalledWith(2);
    expect(result).toEqual([
      {
        accountId: 2,
        balance: 2000.00,
        transferHistory: [{
          transferId: 1,
          amount: 100,
          timestamp: 'right now',
          toAccountId: 2,
          fromAccountId: 1
        }]
      },
      {
        accountId: 3,
        balance: 50,
        transferHistory: []
      }
    ]);
  });

  test('Can create an account for a customer with a default balance', async () => {
    mockAccountRepo.createAccount.mockResolvedValue(mockAccountDto3);
    const result = await accountService.createAccount(mockAccountDto3.customerId);
    expect(mockAccountRepo.createAccount).toHaveBeenCalledWith(2, 0);
    expect(result).toEqual({
      accountId: 3,
      balance: 50,
      transferHistory: []
    });
  });

  test('Can create an account for a customer with a provided initial deposit amount', async () => {
    const mockInitialDeposit = 1000;
    mockAccountRepo.createAccount.mockResolvedValue({
      id: 4,
      balance: mockInitialDeposit,
      customerId: 2
    });
    const result = await accountService.createAccount(2, mockInitialDeposit);
    expect(mockAccountRepo.createAccount).toHaveBeenCalledWith(2, 1000);
    expect(result).toEqual({
      accountId: 4,
      balance: 1000,
      transferHistory: []
    });
  });

  test('Can update an account for a customer with a new balance', async () => {
    // when we update, we first grab the old version
    mockAccountRepo.getAccountById.mockResolvedValue(mockAccountDto1);
    // we also call getTransfersForAccount
    mockTransferService.getTransfersForAccount.mockResolvedValue(mockAccount1.transferHistory);

    const result = await accountService.updateAccount(mockAccountDto1.customerId, mockAccountDto1.id, 100);
    expect(mockAccountRepo.updateAccount).toHaveBeenCalledWith(1, 1, 100);
    expect(result).toEqual({
      accountId: 1,
      balance: 100,
      transferHistory: mockAccount1.transferHistory
    });
  });

  test('Throws if the old version of the account was not found when updating', async () => {
    // when we update, we first grab the old version
    mockAccountRepo.getAccountById.mockRejectedValue(new HttpException('Account not found.', HttpStatus.NOT_FOUND));
    // we also call getTransfersForAccount
    mockTransferService.getTransfersForAccount.mockResolvedValue(mockAccount1.transferHistory);

    await expect(accountService.updateAccount(mockAccountDto1.customerId, mockAccountDto1.id, 100))
      .rejects.toThrow(new HttpException('Account not found.', HttpStatus.NOT_FOUND));

    // should have failed before these, when getting the old version of the account
    expect(mockAccountRepo.updateAccount).toHaveBeenCalledTimes(0);
    expect(mockTransferService.getTransfersForAccount).toHaveBeenCalledTimes(0);
  });

  test('Can delete an account', async () => {
    // when we update, we first grab the old version
    mockAccountRepo.getAccountById.mockResolvedValue(mockAccountDto1);
    // we also call getTransfersForAccount
    mockTransferService.getTransfersForAccount.mockResolvedValue(mockAccount1.transferHistory);

    await accountService.deleteAccount(mockAccountDto1.customerId, mockAccountDto1.id);
    expect(mockAccountRepo.deleteAccount).toHaveBeenCalledWith(1, 1);
  });

  test('Throws if the old version of the account was not found when deleting', async () => {
    // when we update, we first grab the old version
    mockAccountRepo.getAccountById.mockRejectedValue(new HttpException('Account not found.', HttpStatus.NOT_FOUND));
    // we also call getTransfersForAccount
    mockTransferService.getTransfersForAccount.mockResolvedValue(mockAccount1.transferHistory);

    await expect(accountService.deleteAccount(mockAccountDto1.customerId, mockAccountDto1.id))
      .rejects.toThrow(new HttpException('Account not found.', HttpStatus.NOT_FOUND));

    // should have failed before these, when getting the old version of the account
    expect(mockAccountRepo.deleteAccount).toHaveBeenCalledTimes(0);
    expect(mockTransferService.getTransfersForAccount).toHaveBeenCalledTimes(0);
  });
});
