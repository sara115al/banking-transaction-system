
import { Module } from '@nestjs/common';
import * as sqlite from 'sqlite';
import * as sqlite3 from 'sqlite3';
import { AccountController } from './controllers/AccountController';
import { CustomerController } from './controllers/CustomerController';
import { TransferController } from './controllers/TransferController';
import { AccountRepository } from './repositories/AccountRepository';
import { CustomerRepository } from './repositories/CustomerRepository';
import { TransferRepository } from './repositories/TransferRepository';
import { AccountService } from './services/AccountService';
import { CustomerService } from './services/CustomerService';
import { TransferService } from './services/TransferService';

@Module({
  controllers: [CustomerController, AccountController, TransferController],
  providers: [
    AccountService,
    CustomerService,
    TransferService,
    {
      provide: CustomerRepository,
      useFactory: async (): Promise<CustomerRepository> => {
        try {
          const dbConn = await sqlite.open({
            filename: 'bank_api_db',
            driver: sqlite3.Database
          });
          return new CustomerRepository(dbConn);
        } catch (error) {
          console.log('Error connecting to sqlite database. Exiting.', error);
          throw error;
        }
      }
    },
    {
      provide: AccountRepository,
      useFactory: async (): Promise<AccountRepository> => {
        try {
          const dbConn = await sqlite.open({
            filename: 'bank_api_db',
            driver: sqlite3.Database
          });
          return new AccountRepository(dbConn);
        } catch (error) {
          console.log('Error connecting to sqlite database. Exiting.', error);
          throw error;
        }
      }
    },
    {
      provide: TransferRepository,
      useFactory: async (): Promise<TransferRepository> => {
        try {
          const dbConn = await sqlite.open({
            filename: 'bank_api_db',
            driver: sqlite3.Database
          });
          return new TransferRepository(dbConn);
        } catch (error) {
          console.log('Error connecting to sqlite database. Exiting.', error);
          throw error;
        }
      }
    }
  ]
})
export class BankModule {}
