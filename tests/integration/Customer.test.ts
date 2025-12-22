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

describe('Integration tests for the Customer API', () => {
  let app: NestFastifyApplication;
  let testDbConn: sqlite.Database;

  beforeAll(async () => {
    testDbConn = await sqlite.open({
      filename: 'bank_api_test_customer_db',
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

  describe('GET /customers', () => {
    test('Will get all customers', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers'
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual(defaultExpectedCustomers);
    });
  });

  describe('GET /customers/:id', () => {
    test('Will get a customer by id', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/1'
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual(defaultExpectedCustomers[0]);
    });

    test('Returns a 404 if customer is not found', async () => {
      const { statusCode, body } = await app.inject({
        method: 'GET',
        url: '/bank/customers/404'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Customer not found.');
    });

    test('Returns a 400 if id is invalid', async () => {
      let response = await app.inject({
        method: 'GET',
        url: '/bank/customers/abc'
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toEqual('Customer ID must be a valid integer greater than 1.');

      response = await app.inject({
        method: 'GET',
        url: '/bank/customers/-1'
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toEqual('Customer ID must be a valid integer greater than 1.');

      response = await app.inject({
        method: 'GET',
        url: '/bank/customers/0'
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toEqual('Customer ID must be a valid integer greater than 1.');
    });
  });

  describe('POST /customers', () => {
    test('Will create a new customer', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers',
        payload: {
          name: 'Tyler'
        }
      });
      expect(statusCode).toBe(201);
      expect(JSON.parse(body)).toEqual({
        id: 5,
        name: 'Tyler',
        accounts: []
      });
    });

    test('Will throw a 400 if create customer payload is invalid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'POST',
        url: '/bank/customers',
        payload: {
          name: 123
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual([ 'name must be a string' ]); // error comes from class-validator
    });
  });

  describe('DELETE /customers/:id', () => {
    test('Can delete a customer with no accounts', async () => {
      const { statusCode } = await app.inject({
        method: 'DELETE',
        url: '/bank/customers/5'
      });
      expect(statusCode).toBe(200);
    });

    test('Will delete a customer and all their accounts', async () => {
      const { statusCode } = await app.inject({
        method: 'DELETE',
        url: '/bank/customers/1'
      });
      expect(statusCode).toBe(200);

      // there should be no accounts left for that customer
      expect(await testDbConn.get('SELECT * FROM accounts WHERE customerId = ?', 1)).toEqual(undefined);
    });

    test('Will throw a 404 if customer does not exist', async () => {
      const { statusCode, body } = await app.inject({
        method: 'DELETE',
        url: '/bank/customers/404'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Customer not found.');
    });

    test('Will throw a 404 if customer does not exist', async () => {
      const { statusCode, body } = await app.inject({
        method: 'DELETE',
        url: '/bank/customers/404'
      });
      expect(statusCode).toBe(404);
      expect(JSON.parse(body).message).toEqual('Customer not found.');
    });

    test('Returns a 400 if id is invalid', async () => {
      const { body, statusCode } = await app.inject({
        method: 'GET',
        url: '/bank/customers/abc'
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer ID must be a valid integer greater than 1.');
    });
  });

  describe('PATCH /customers/:id', () => {
    test('Will update a customer', async () => {
      const { statusCode, body } = await app.inject({
        method: 'PATCH',
        url: '/bank/customers/2',
        payload: {
          name: 'Brandon'
        }
      });
      expect(statusCode).toBe(200);
      expect(JSON.parse(body)).toEqual({
        id: 2,
        name: 'Brandon',
        accounts: defaultExpectedCustomers[1].accounts
      });
    });

    test('Returns a 400 if id is invalid', async () => {
      const { body, statusCode } = await app.inject({
        method: 'PATCH',
        url: '/bank/customers/-1',
        payload: {
          name: 'Brandon'
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual('Customer ID must be a valid integer greater than 1.');
    });

    test('Will throw a 400 if update customer payload is invalid', async () => {
      const { statusCode, body } = await app.inject({
        method: 'PATCH',
        url: '/bank/customers/2',
        payload: {
          name: 123
        }
      });
      expect(statusCode).toBe(400);
      expect(JSON.parse(body).message).toEqual([ 'name must be a string' ]); // error comes from class-validator
    });
  });
});
