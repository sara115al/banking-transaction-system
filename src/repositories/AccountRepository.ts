import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as sqlite from 'sqlite';
import { AccountDTO } from '../models/Account';

@Injectable()
export class AccountRepository {
  constructor(private db: sqlite.Database) {}

  public async getAccountsForCustomer(customerId: number): Promise<AccountDTO[]> {
    const results = await this.db.all('SELECT * FROM accounts where customerId = ?', customerId);
    if (!results) {
      return [];
    }
    return results;
  }

  public async getAccountById(customerId: number, accountId: number): Promise<AccountDTO> {
    const result = await this.db.get('SELECT * FROM accounts where customerId = ? and id = ?', customerId, accountId);
    if (!result) {
      throw new HttpException('Account not found.', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  public async createAccount(customerId: number, balance: number): Promise<AccountDTO> {
    const result = await this.db.run('INSERT INTO accounts (balance, customerId) VALUES (?, ?)', balance, customerId);
    return {
      id: result.lastID!, // lastId will be present if the query didn't throw
      balance,
      customerId
    };
  }

  public async deleteAccount(customerId: number, accountId: number): Promise<void> {
    await this.db.run('DELETE FROM accounts WHERE id = ? and customerId = ?', accountId, customerId);
  }

  public async updateAccount(customerId: number, accountId: number, balance: number): Promise<void> {
    await this.db.run('UPDATE accounts SET balance = ? WHERE id = ? and customerId = ?', balance, accountId, customerId);
  }

  public async accountExists(customerId: number, accountId: number): Promise<boolean> {
    return !!await this.db.get('SELECT 1 FROM accounts WHERE id = ? and customerId = ?', accountId, customerId);
  }
}
