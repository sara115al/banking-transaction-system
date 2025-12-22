import { HttpException, HttpStatus } from '@nestjs/common';
import { CustomerDTO } from '../../../src/models/Customer';
import { CustomerRepository } from '../../../src/repositories/CustomerRepository';

describe('CustomerRepository Unit Tests', () => {
  const mockCustomerDto1: CustomerDTO = {
    id: 1,
    name: 'Jake'
  };
  const mockCustomerDto2: CustomerDTO = {
    id: 2,
    name: 'Max'
  };

  const mockSqliteDb = {
    get: jest.fn(),
    all: jest.fn(),
    run: jest.fn()
  };
  let customerRepo: CustomerRepository;

  beforeAll(() => {
    customerRepo = new CustomerRepository(mockSqliteDb as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('Will return an empty list if there are no customers', async () => {
    mockSqliteDb.all.mockResolvedValue([]); // sqlite.all returns an array of entities
    const result = await customerRepo.getCustomers();
    expect(result.length).toBe(0);
  });

  test('Can get all customers', async () => {
    mockSqliteDb.all.mockResolvedValue([mockCustomerDto1, mockCustomerDto2]); // sqlite.all returns an array of entities
    const result = await customerRepo.getCustomers();
    expect(result.length).toBe(2);
    expect(result).toEqual([
      {
        id: 1,
        name: 'Jake'
      },
      {
        id: 2,
        name: 'Max'
      }
    ]);
    expect(mockSqliteDb.all).toHaveBeenCalledWith('SELECT * FROM customers');
  });

  test('Throws if getting a single customer in the database fails', async () => {
    mockSqliteDb.all.mockRejectedValue(new Error('Test Error'));
    await expect(customerRepo.getCustomers()).rejects.toThrow(new Error('Test Error'));
    expect(mockSqliteDb.all).toHaveBeenCalledWith('SELECT * FROM customers');
  });

  test('Can get a single customer by id', async () => {
    mockSqliteDb.get.mockResolvedValue(mockCustomerDto1); // sqlite.get returns a single entity, not an array
    const result = await customerRepo.getCustomerById(1);
    expect(result).toEqual({
      id: 1,
      name: 'Jake'
    });
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = ?', 1);
  });

  test('Throws a 404 if the customer DNE in the database', async () => {
    mockSqliteDb.get.mockResolvedValue(undefined); // sqlite.get will return nothing if the query yields no results
    await expect(customerRepo.getCustomerById(5)).rejects.toThrow(new HttpException('Customer not found.', HttpStatus.NOT_FOUND));
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = ?', 5);
  });

  test('Throws if getting a single customer in the database fails', async () => {
    mockSqliteDb.get.mockRejectedValue(new Error('Test Error'));
    await expect(customerRepo.getCustomerById(1)).rejects.toThrow(new Error('Test Error'));
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = ?', 1);
  });

  test('Can delete a customer', async () => {
    mockSqliteDb.run.mockResolvedValue({});
    await customerRepo.deleteCustomer(2);
    expect(mockSqliteDb.run).toHaveBeenCalledWith('DELETE FROM customers WHERE id = ?', 2);
  });

  test('Throws if deleting the customer in the database fails', async () => {
    mockSqliteDb.run.mockRejectedValue(new Error('Test Error'));
    await expect(customerRepo.deleteCustomer(1)).rejects.toThrow(new Error('Test Error'));
    expect(mockSqliteDb.run).toHaveBeenCalledWith('DELETE FROM customers WHERE id = ?', 1);
  });

  test('Can create a new customer', async () => {
    const mockId = 3;
    const mockName = 'Josh';

    mockSqliteDb.run.mockResolvedValue({ lastID: mockId }); // see RunResult interface in sqlite
    const results = await customerRepo.createCustomer(mockName);
    expect(results).toEqual({
      id: 3,
      name: 'Josh'
    });
    expect(mockSqliteDb.run).toHaveBeenCalledWith('INSERT INTO customers (name) VALUES (?)', 'Josh');
  });

  test('Throws if creating a new customer in the database fails', async () => {
    mockSqliteDb.run.mockRejectedValue(new Error('Test Error'));
    await expect(customerRepo.createCustomer('Josh')).rejects.toThrow(new Error('Test Error'));
    expect(mockSqliteDb.run).toHaveBeenCalledWith('INSERT INTO customers (name) VALUES (?)', 'Josh');
  });

  test('Can update a customer\'s name', async () => {
    mockSqliteDb.run.mockResolvedValue({});
    await customerRepo.updateCustomer(1, 'Dan');
    expect(mockSqliteDb.run).toHaveBeenCalledWith('UPDATE customers SET name = ? WHERE id = ?', 'Dan', 1);
  });

  test('Throws if updating the customer in the database fails', async () => {
    mockSqliteDb.run.mockRejectedValue(new Error('Test Error'));
    await expect(customerRepo.updateCustomer(1, 'Dan')).rejects.toThrow(new Error('Test Error'));
    expect(mockSqliteDb.run).toHaveBeenCalledWith('UPDATE customers SET name = ? WHERE id = ?', 'Dan', 1);
  });

  test('Returns true if customer exists in database', async () => {
    mockSqliteDb.get.mockResolvedValue(1); // if our exists query returns 1, the customer exists
    const exists = await customerRepo.customerExists(1);
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT 1 FROM customers WHERE id= ?', 1);
    expect(exists).toBe(true);
  });

  test('Returns false if customer does not exists in database', async () => {
    mockSqliteDb.get.mockResolvedValue(undefined); // if our exists query returns undefined, the customer exists
    const exists = await customerRepo.customerExists(1);
    expect(mockSqliteDb.get).toHaveBeenCalledWith('SELECT 1 FROM customers WHERE id= ?', 1);
    expect(exists).toBe(false);
  });
});
