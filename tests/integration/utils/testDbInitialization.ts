import * as sqlite from 'sqlite';
import { Customer } from '../../../src/models/Customer';

export async function initializeTestDb(dbConn: sqlite.Database) {
  await dbConn.exec('CREATE TABLE customers (\
    id INTEGER PRIMARY KEY,\
    name TEXT NOT NULL \
  )');
  await dbConn.exec('CREATE TABLE accounts (\
    id INTEGER PRIMARY KEY,\
    balance REAL NOT NULL, \
    customerId INTEGER NOT NULL, \
    FOREIGN KEY(customerId) REFERENCES customers(id) \
  )');
  await dbConn.exec('CREATE TABLE transfers (\
    id INTEGER PRIMARY KEY,\
    timestamp TEXT NOT NULL, \
    amount REAL NOT NULL, \
    toId INTEGER NOT NULL, \
    fromId INTEGER NOT NULL, \
    FOREIGN KEY(toId) REFERENCES accounts(id), \
    FOREIGN KEY(fromId) REFERENCES accounts(id) \
  )');

  await dbConn.run('INSERT OR IGNORE INTO customers (id, name) VALUES (1, "Jake")');
  await dbConn.run('INSERT OR IGNORE INTO customers (id, name) VALUES (2, "Max")');
  await dbConn.run('INSERT OR IGNORE INTO customers (id, name) VALUES (3, "Josh")');
  await dbConn.run('INSERT OR IGNORE INTO customers (id, name) VALUES (4, "Dan")');

  await dbConn.run('INSERT INTO accounts (balance, customerId) VALUES (1000.00, 1)');
  await dbConn.run('INSERT INTO accounts (balance, customerId) VALUES (99.99, 1)');
  await dbConn.run('INSERT INTO accounts (balance, customerId) VALUES (200.00, 2)');
  await dbConn.run('INSERT INTO accounts (balance, customerId) VALUES (50, 4)');

  await dbConn.run('INSERT INTO transfers (timestamp, amount, toId, fromId) VALUES ("right now", 40, 1, 4)');
}

export async function cleanTestDatabase(dbConn: sqlite.Database) {
  await dbConn.run('DROP TABLE customers');
  await dbConn.run('DROP TABLE accounts');
  await dbConn.run('DROP TABLE transfers');
}

export const defaultExpectedCustomers: Customer[] = [
  {
    id: 1,
    name: 'Jake',
    accounts: [{
      accountId: 1,
      balance: 1000.00,
      transferHistory: [{
        transferId: 1,
        amount: 40,
        timestamp: 'right now',
        toAccountId: 1,
        fromAccountId: 4
      }]
    }, {
      accountId: 2,
      balance: 99.99,
      transferHistory: []
    }]
  },
  {
    id: 2,
    name: 'Max',
    accounts: [{
      accountId: 3,
      balance: 200.00,
      transferHistory: []
    }]
  },
  {
    id: 3,
    name: 'Josh',
    accounts: []
  },
  {
    id: 4,
    name: 'Dan',
    accounts: [{
      accountId: 4,
      balance: 50,
      transferHistory: [{
        transferId: 1,
        amount: 40,
        timestamp: 'right now',
        toAccountId: 1,
        fromAccountId: 4
      }]
    }]
  }
];
