import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { BankModule } from '../../src/BankModule';
import { AccountRepository } from '../../src/repositories/AccountRepository';
import { CustomerRepository } from '../../src/repositories/CustomerRepository';
import { TransferRepository } from '../../src/repositories/TransferRepository';
import { cleanTestDatabase, initializeTestDb } from './utils/testDbInitialization';

describe('Integration tests for the Transfer API', () => {
  let app: NestFastifyApplication;
  let testDbConn: sqlite.Database;

  beforeAll(async () => {
    testDbConn = await sqlite.open({
      filename: 'bank_api_test_transfers_db',
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

  describe('GET /transfers', () => {
    test('Can get transfer history for an account', async () => {
      const { body, statusCode } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts/1/transfers'
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual([{
        transferId: 1,
        amount: 40,
        timestamp: 'right now',
        toAccountId: 1,
        fromAccountId: 4
      }]);
    });

    test('Returns a 404 if customer is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/404/accounts/1/transfers'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Customer not found.');
    });

    test('Returns a 404 if account is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts/404/transfers'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('The desired account does not exist.');
    });

    test('Returns a 400 if account id is not valid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1/accounts/abc/transfers'
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer and Account ID must be a valid integer greater than 1.');
    });

    test('Returns a 400 if customer id is not valid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/0/accounts/1/transfers'
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer and Account ID must be a valid integer greater than 1.');
    });
  });

  describe('POST /transfers', () => {
    test('Can make a transfer between two different customers', async () => {
      let response = await app.inject({
        method: 'POST',
        url: '/bank/customers/4/accounts/4/transfers',
        payload: {
          amount: 10,
          toCustomerId: 2,
          toAccountId: 3
        }
      });
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        transferId: 2,
        amount: 10,
        timestamp: expect.any(String),
        toAccountId: 3,
        fromAccountId: 4
      });

      // the transfer object, as well as a difference in account balance, should be present in the two
      // accounts that partook in the transfer.

      response = await app.inject({
        method: 'GET',
        url: '/bank/customers/4'
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        id: 4,
        name: 'Dan',
        accounts: [{
          accountId: 4,
          balance: 40,
          transferHistory: [{
            transferId: 1,
            amount: 40,
            timestamp: expect.any(String),
            toAccountId: 1,
            fromAccountId: 4
          }, {
            transferId: 2,
            amount: 10,
            timestamp: expect.any(String),
            toAccountId: 3,
            fromAccountId: 4
          }]
        }]
      });

      response = await app.inject({
        method: 'GET',
        url: '/bank/customers/2'
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        id: 2,
        name: 'Max',
        accounts: [{
          accountId: 3,
          balance: 210.00,
          transferHistory: [{
            transferId: 2,
            amount: 10,
            timestamp: expect.any(String),
            toAccountId: 3,
            fromAccountId: 4
          }]
        }]
      });
    });

    test('Can make a transfer between two accounts of the same customer', async () => {
      let response = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/1/transfers',
        payload: {
          amount: 1.00,
          toCustomerId: 1,
          toAccountId: 2
        }
      });
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        transferId: 3,
        amount: 1.00,
        timestamp: expect.any(String),
        toAccountId: 2,
        fromAccountId: 1
      });

      // the transfer object, as well as a difference in account balance, should be present in the two
      // accounts that partook in the transfer.

      response = await app.inject({
        method: 'GET',
        url: '/bank/customers/1'
      });
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        id: 1,
        name: 'Jake',
        accounts: [{
          accountId: 1,
          balance: 999.00,
          transferHistory: [{
            transferId: 1,
            amount: 40,
            timestamp: expect.any(String),
            toAccountId: 1,
            fromAccountId: 4
          }, {
            transferId: 3,
            amount: 1.00,
            timestamp: expect.any(String),
            toAccountId: 2,
            fromAccountId: 1
          }]
        }, {
          accountId: 2,
          balance: 100.99,
          transferHistory: [{
            transferId: 3,
            amount: 1.00,
            timestamp: expect.any(String),
            toAccountId: 2,
            fromAccountId: 1
          }]
        }]
      });
    });

    test('Returns a 404 if customer is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/404/accounts/1/transfers',
        payload: {
          amount: 10,
          toCustomerId: 1,
          toAccountId: 2
        }
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Customer not found.');
    });

    test('Returns a 404 if account is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/404/transfers',
        payload: {
          amount: 10,
          toCustomerId: 1,
          toAccountId: 2
        }
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('The desired account to transfer money from does not exist.');
    });

    test('Returns a 400 if account id is not valid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/abc/transfers',
        payload: {
          amount: 10,
          toCustomerId: 1,
          toAccountId: 2
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer and Account ID must be a valid integer greater than 1.');
    });

    test('Returns a 400 if customer id is not valid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/-1/accounts/1/transfers',
        payload: {
          amount: 10,
          toCustomerId: 1,
          toAccountId: 2
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer and Account ID must be a valid integer greater than 1.');
    });

    test('Returns a 400 if the request body is malformed', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/1/transfers',
        payload: {
          amount: 10,
          toCustomerId: 'abc',
          toAccountId: 2
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual(['toCustomerId must be a number conforming to the specified constraints']); // comes from class-validator
    });

    test('Returns a 400 if the desired amount in the request body is less than or equal to 0', async () => {
      let response = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/1/transfers',
        payload: {
          amount: -5,
          toCustomerId: 1,
          toAccountId: 2
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toEqual('The transfer amount must be a dollar value greater than 0.');

      response = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/1/transfers',
        payload: {
          amount: 0,
          toCustomerId: 1,
          toAccountId: 2
        }
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toEqual('The transfer amount must be a dollar value greater than 0.');
    });

    test('Returns a 404 if the desired account id in the request body is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/1/transfers',
        payload: {
          amount: 10,
          toCustomerId: 1,
          toAccountId: 404
        }
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('The desired account to transfer money to does not exist.');
    });

    test('Returns a 404 if the desired customer id in the request body is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers/1/accounts/1/transfers',
        payload: {
          amount: 10,
          toCustomerId: 404,
          toAccountId: 1
        }
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('The customer you wish to transfer money to does not exist.');
    });
  });
});
