import { HttpException, HttpStatus } from '@nestjs/common';
import { Customer, CustomerDTO } from '../../../src/models/Customer';
import { CustomerService } from '../../../src/services/CustomerService';

describe('CustomerService Unit Tests', () => {
  const mockCustomerDto1: CustomerDTO = {
    id: 1,
    name: 'Jake'
  };
  const mockCustomer1: Customer = {
    id: mockCustomerDto1.id,
    name: mockCustomerDto1.name,
    accounts: [
      {
        accountId: 1,
        balance: 100.00,
        transferHistory: [{
          transferId: 1,
          amount: 100,
          timestamp: 'right now',
          toAccountId: 5,
          fromAccountId: 1
        }]
      },
      {
        accountId: 3,
        balance: 3000.00,
        transferHistory: []
      }
    ]
  };
  const mockCustomerDto2: CustomerDTO = {
    id: 2,
    name: 'Max'
  };
  const mockCustomer2: Customer = {
    id: mockCustomerDto2.id,
    name: mockCustomerDto2.name,
    accounts: [
      {
        accountId: 2,
        balance: 2000.00,
        transferHistory: []
      }
    ]
  };
  const mockCustomerDto3: CustomerDTO = {
    id: 3,
    name: 'Bob'
  };
  const mockCustomer3: Customer = {
    id: mockCustomerDto3.id,
    name: mockCustomerDto3.name,
    accounts: []
  };

  const mockCustomerRepo = {
    getCustomers: jest.fn(),
    getCustomerById: jest.fn(),
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn()
  };
  const mockAccountService = {
    getAccountsForCustomer: jest.fn(),
    deleteAccount: jest.fn()
  };
  let customerService: CustomerService;

  beforeAll(() => {
    customerService = new CustomerService(mockCustomerRepo as any, mockAccountService as any);
  });

  beforeEach(() => {
    mockAccountService.getAccountsForCustomer.mockImplementation(accountId => {
      if (accountId === 1) return mockCustomer1.accounts;
      return mockCustomer2.accounts;
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Can get all customers', async () => {
    mockCustomerRepo.getCustomers.mockResolvedValue([mockCustomerDto1, mockCustomerDto2]);

    const results = await customerService.getCustomers();
    expect(results).toEqual([
      {
        id: 1,
        name: 'Jake',
        accounts: [
          {
            accountId: 1,
            balance: 100.00,
            transferHistory: [{
              transferId: 1,
              amount: 100,
              timestamp: 'right now',
              toAccountId: 5,
              fromAccountId: 1
            }]
          },
          {
            accountId: 3,
            balance: 3000.00,
            transferHistory: []
          }
        ]
      },
      {
        id: 2,
        name: 'Max',
        accounts: [
          {
            accountId: 2,
            balance: 2000.00,
            transferHistory: []
          }
        ]
      }
    ]);
    expect(mockAccountService.getAccountsForCustomer).toHaveBeenCalledTimes(2);
  });

  test('Can get a customer by id', async () => {
    mockCustomerRepo.getCustomerById.mockResolvedValue(mockCustomerDto1);

    const results = await customerService.getCustomerById(1);
    expect(results).toEqual({
      id: 1,
      name: 'Jake',
      accounts: [
        {
          accountId: 1,
          balance: 100.00,
          transferHistory: [{
            transferId: 1,
            amount: 100,
            timestamp: 'right now',
            toAccountId: 5,
            fromAccountId: 1
          }]
        },
        {
          accountId: 3,
          balance: 3000.00,
          transferHistory: []
        }
      ]
    });
    expect(mockAccountService.getAccountsForCustomer).toHaveBeenCalledTimes(1);
  });

  test('Throws if the repository cannot find the customer when getting a customer by id', async () => {
    mockCustomerRepo.getCustomerById.mockRejectedValue(new HttpException('Customer not found.', HttpStatus.NOT_FOUND));
    await expect(customerService.getCustomerById(1)).rejects.toThrow(new HttpException('Customer not found.', HttpStatus.NOT_FOUND));
    expect(mockAccountService.getAccountsForCustomer).not.toHaveBeenCalled();
  });

  test('Can create a new customer', async () => {
    const mockId = 3;
    const mockName = 'Josh';
    mockCustomerRepo.createCustomer.mockResolvedValue({
      id: mockId,
      name: mockName
    });

    const results = await customerService.createCustomer(mockName);
    expect(results).toEqual({
      id: 3,
      name: 'Josh',
      accounts: [] // accounts should be empty when creating a new customer
    });
  });

  test('Can update a customer', async () => {
    // before updating, we get the old version of the customer. Mock this.
    mockCustomerRepo.getCustomerById.mockResolvedValue(mockCustomerDto1);
    mockCustomerRepo.updateCustomer.mockResolvedValue({});

    const results = await customerService.updateCustomer(1, 'Dan');
    expect(results).toEqual({
      id: 1,
      name: 'Dan',
      accounts: mockCustomer1.accounts // should be the same accounts as the original's
    });
    expect(mockAccountService.getAccountsForCustomer).toHaveBeenCalledWith(1);
  });

  test('Throws if we cannot get the old version of the customer when updating', async () => {
    // before updating, we first get the old version of the customer. Pretend this fails.
    mockCustomerRepo.getCustomerById.mockRejectedValue(new HttpException('Customer not found.', HttpStatus.NOT_FOUND));
    await expect(customerService.updateCustomer(1, 'Dan')).rejects.toThrow(new HttpException('Customer not found.', HttpStatus.NOT_FOUND));
    expect(mockAccountService.getAccountsForCustomer).not.toHaveBeenCalled();
  });

  test('Can delete a customer', async () => {
    // before deleting, we get the old version of the customer. Mock this.
    mockCustomerRepo.getCustomerById.mockResolvedValue(mockCustomerDto2);
    mockAccountService.getAccountsForCustomer.mockResolvedValue(mockCustomer2.accounts); // mock customer 1 has two accounts

    // when deleting a customer, we remove all of their accounts as well
    mockAccountService.deleteAccount.mockResolvedValue({});

    mockCustomerRepo.deleteCustomer.mockResolvedValue({});

    await customerService.deleteCustomer(mockCustomerDto2.id);
    expect(mockAccountService.getAccountsForCustomer).toHaveBeenCalledWith(mockCustomerDto2.id);
    expect(mockAccountService.deleteAccount).toHaveBeenCalledWith(mockCustomerDto2.id, 2);
    expect(mockCustomerRepo.deleteCustomer).toHaveBeenCalledWith(mockCustomerDto2.id);
  });

  test('When deleting a customer, all accounts should be deleted', async () => {
    // before deleting, we get the old version of the customer. Mock this.
    mockCustomerRepo.getCustomerById.mockResolvedValue(mockCustomerDto1);
    mockAccountService.getAccountsForCustomer.mockResolvedValue(mockCustomer1.accounts); // mock customer 1 has two accounts

    // when deleting a customer, we remove all of their accounts as well
    mockAccountService.deleteAccount.mockResolvedValue({});

    mockCustomerRepo.deleteCustomer.mockResolvedValue({});

    await customerService.deleteCustomer(mockCustomerDto1.id);
    expect(mockAccountService.getAccountsForCustomer).toHaveBeenCalledWith(mockCustomerDto1.id);
    expect(mockAccountService.deleteAccount).toHaveBeenCalledWith(mockCustomerDto1.id, 1);
    expect(mockAccountService.deleteAccount).toHaveBeenCalledWith(mockCustomerDto1.id, 3);
    expect(mockCustomerRepo.deleteCustomer).toHaveBeenCalledWith(mockCustomerDto1.id);
  });

  test('Should be able to delete a customer with no accounts', async () => {
    // before deleting, we get the old version of the customer. Mock this.
    mockCustomerRepo.getCustomerById.mockResolvedValue(mockCustomerDto3);
    mockAccountService.getAccountsForCustomer.mockResolvedValue(mockCustomer3.accounts); // mock customer 3 has no accounts

    // when deleting a customer, we remove all of their accounts as well
    mockAccountService.deleteAccount.mockResolvedValue({});

    mockCustomerRepo.deleteCustomer.mockResolvedValue({});

    await customerService.deleteCustomer(mockCustomerDto3.id);
    expect(mockAccountService.getAccountsForCustomer).toHaveBeenCalledWith(mockCustomerDto3.id);
    expect(mockAccountService.deleteAccount).not.toHaveBeenCalled(); // should have been no calls since there were no accounts
    expect(mockCustomerRepo.deleteCustomer).toHaveBeenCalledWith(mockCustomerDto3.id);
  });

  test('Throws if we cannot get the old version of the customer when deleting', async () => {
    // before deleting, we first get the old version of the customer. Pretend this fails.
    mockCustomerRepo.getCustomerById.mockRejectedValue(new HttpException('Customer not found.', HttpStatus.NOT_FOUND));
    await expect(customerService.deleteCustomer(1)).rejects.toThrow(new HttpException('Customer not found.', HttpStatus.NOT_FOUND));
    expect(mockAccountService.getAccountsForCustomer).not.toHaveBeenCalled();
  });
});
