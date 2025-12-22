const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

sqlite.open({
  filename: 'bank_api_db',
  driver: sqlite3.Database
}).then(async (db) => {
  await db.exec('CREATE TABLE customers (\
    id INTEGER PRIMARY KEY,\
    name TEXT NOT NULL \
  )');

  await db.exec('CREATE TABLE accounts (\
    id INTEGER PRIMARY KEY,\
    balance REAL NOT NULL, \
    customerId INTEGER NOT NULL, \
    FOREIGN KEY(customerId) REFERENCES customers(id) \
  )');

  await db.exec('CREATE TABLE transfers (\
    id INTEGER PRIMARY KEY,\
    timestamp TEXT NOT NULL, \
    amount REAL NOT NULL, \
    toId INTEGER NOT NULL, \
    fromId INTEGER NOT NULL, \
    FOREIGN KEY(toId) REFERENCES accounts(id), \
    FOREIGN KEY(fromId) REFERENCES accounts(id) \
  )');

  await db.run('INSERT OR IGNORE INTO customers (id, name) VALUES (1, "altayeb ahmad")');
  await db.run('INSERT OR IGNORE INTO customers (id, name) VALUES (2, "sara altayeb")');
  await db.run('INSERT OR IGNORE INTO customers (id, name) VALUES (3, "khalid korena")');
  await db.run('INSERT OR IGNORE INTO customers (id, name) VALUES (4, "tariq abdalla")');

}).catch(error => {
  console.log('Error initializing database', error);
});