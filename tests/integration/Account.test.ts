import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { BankModule } from '../../src/BankModule';
import { AccountRepository } from '../../src/repositories/AccountRepository';
import { CustomerRepository } from '../../src/repositories/CustomerRepository';
import { TransferRepository } from '../../src/repositories/TransferRepository';
import { cleanTestDatabase, defaultExpectedCustomers, initializeTestDb } from './utils/testDbInitialization';

describe('Integration tests for the Accounts API', () => {
  let app: NestFastifyApplication;
  let testDbConn: sqlite.Database;

  beforeAll(async () => {
    testDbConn = await sqlite.open({
      filename: 'bank_api_test_accounts_db',
      driver: sqlite3.Database
    });
    await initializeTestDb(testDbConn);

    const moduleRef = await Test.createTestingModule({
      imports: [ BankModule ]
    })
      .overrideProvider(CustomerRepository)
      .useValue(new CustomerRepository(testDbConn))
      .overrideProvider(AccountRepository)
      .useValue(new AccountRepository(testDbConn))
      .overrideProvider(TransferRepository)
      .useValue(new TransferRepository(testDbConn))
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await cleanTestDatabase(testDbConn);
  });

  describe('GET /accounts', () => {
    test('Will get all accounts for a customer', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts'
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual(defaultExpectedCustomers[0].accounts);
    });
  });

  describe('GET /accounts/:id/balance', () => {
    test('Will get the balance of an account', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts/1/balance'
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual(defaultExpectedCustomers[0].accounts[0].balance);
    });
  });

  describe('GET /accounts/:id', () => {
    test('Will get a specific customer\'s account by id', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts/2'
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual(defaultExpectedCustomers[0].accounts[1]);
    });

    test('Returns a 404 if customer is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/404/accounts/1'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Customer not found.');
    });

    test('Returns a 404 if account is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts/404'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Account not found.');
    });

    test('Returns a 400 if customer id is invalid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/abc/accounts/1'
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer and Account ID must be a valid integer greater than 1.');
    });

    test('Returns a 400 if account id is invalid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts/-1'
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer and Account ID must be a valid integer greater than 1.');
    });
  });

  describe('POST /accounts', () => {
    test('Will create a new account with a provided initial balance for a customer', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/3/accounts',
        payload: {
          initialDeposit: 500
        }
      });
      expect(statusCode).toBe(201);
      expect(JSON.parse(body)).toEqual({
        accountId: 5,
        balance: 500,
        transferHistory: []
      });

      // get the customer and ensure the new account was added
      const getResponse = await app.inject({
        method: 'GET',
        url: '/bank/customers/3'
      });
      expect(getResponse.statusCode).toBe(200);
      expect(JSON.parse(getResponse.body)).toEqual({
        id: 3,
        name: 'Josh',
        accounts: [{
          accountId: 5,
          balance: 500,
          transferHistory: []
        }]
      });
    });

    test('Will create a new account with a default initial balance of 0 if one is not provided', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/4/accounts',
        payload: {}
      });
      expect(statusCode).toBe(201);
      expect(JSON.parse(body)).toEqual({
        accountId: 6,
        balance: 0,
        transferHistory: []
      });

      // get the customer and ensure the new account was added
      const getResponse = await app.inject({
        method: 'GET',
        url: '/bank/customers/4'
      });
      expect(getResponse.statusCode).toBe(200);
      expect(JSON.parse(getResponse.body)).toEqual({
        id: 4,
        name: 'Dan',
        accounts: [
          {
            accountId: 4,
            balance: 50,
            transferHistory: [{
              transferId: 1,
              amount: 40,
              timestamp: 'right now',
              toAccountId: 1,
              fromAccountId: 4
            }]
          },
          {
            accountId: 6,
            balance: 0,
            transferHistory: []
          }
        ]
      });
    });

    test('Can create multiple accounts per customer', async () => {
      let response = await app.inject({
        method: 'POST',
        url: '/bank/customers/3/accounts',
        payload: {
          initialDeposit: 100
        }
      });
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        accountId: 7,
        balance: 100,
        transferHistory: []
      });

      response = await app.inject({
        method: 'POST',
        url: '/bank/customers/3/accounts',
        payload: {}
      });
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        accountId: 8,
        balance: 0,
        transferHistory: []
      });

      // get the customer and ensure the new account was added
      response = await app.inject({
        method: 'GET',
        url: '/bank/customers/3'
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        id: 3,
        name: 'Josh',
        accounts: [
          {
            accountId: 5,
            balance: 500,
            transferHistory: []
          },
          {
            accountId: 7,
            balance: 100,
            transferHistory: []
          },
          {
            accountId: 8,
            balance: 0,
            transferHistory: []
          }
        ]
      });
    });

    test('Will throw a 400 if initial deplosit amount is invalid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts',
        payload: {
          initialDeposit: 'abc'
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual([ 'initialDeposit must be a number conforming to the specified constraints' ]); // error comes from class-validator
    });

    test('Will throw a 400 if initial deplosit amount is less than zero', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts',
        payload: {
          initialDeposit: -123
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Initial deposit amount must be a valid amount greater than 0.'); // error comes from class-validator
    });
  });

  describe('DELETE /accounts/:id', () => {
    test('Can delete an account', async () => {
      const { statusCode } = await app.inject({
        method: 'DELETE',
        url: '/bank/customers/2/accounts/3'
      });
      expect(statusCode).toBe(200);

      // get the user and ensure the account is gone
      const getResponse = await app.inject({
        method: 'GET',
        url: '/bank/customers/2'
      });
      expect(getResponse.statusCode).toBe(200);
      expect(JSON.parse(getResponse.body)).toEqual({
        id: 2,
        name: 'Max',
        accounts: []
      });
    });

    test('Will throw a 404 if account does not exist', async () => {
      const { statusCode, body } = await app.inject({
        method: 'DELETE',
        url: '/bank/customers/1/accounts/404'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Account not found.');
    });
  });

  describe('PATCH /accounts/:id', () => {
    test('Will update an account', async () => {
      const { statusCode, body } = await app.inject({
        method: 'PATCH',
        url: '/bank/customers/1/accounts/1',
        payload: {
          balance: 3000.00
        }
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual({
        accountId: defaultExpectedCustomers[0].accounts[0].accountId,
        balance: 3000.00,
        transferHistory: defaultExpectedCustomers[0].accounts[0].transferHistory
      });
    });

    test('Returns a 404 if account is invalid', async () => {
      const { body, statusCode } = await app.inject({
        method: 'PATCH',
        url: '/bank/customers/1/accounts/404',
        payload: {
          balance: 100
        }
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Account not found.');
    });

    test('Returns a 400 if balance in request body is invalid', async () => {
      const { body, statusCode } = await app.inject({
        method: 'PATCH',
        url: '/bank/customers/1/accounts/1',
        payload: {
          balance: 'abc'
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual([ 'balance must be a number conforming to the specified constraints' ]); // error comes from class-validator
    });
  });
});
