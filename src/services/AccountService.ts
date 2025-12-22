import { Injectable } from '@nestjs/common';
import { Account } from '../models/Account';
import { AccountRepository } from '../repositories/AccountRepository';
import { TransferService } from './TransferService';

@Injectable()
export class AccountService {
  constructor(private accountRepo: AccountRepository, private transferService: TransferService) {}

  public async getAccountsForCustomer(customerId: number): Promise<Account[]> {
    const accounts: Account[] = [];
    const accountDtos = await this.accountRepo.getAccountsForCustomer(customerId);
    for (const accountDto of accountDtos) {
      const { id, balance } = accountDto;
      accounts.push({
        accountId: id,
        balance,
        transferHistory: await this.transferService.getTransfersForAccount(id)
      });
    }
    return accounts;
  }

  public async getAccountById(customerId: number, accountId: number): Promise<Account> {
    const { id, balance } = await this.accountRepo.getAccountById(customerId, accountId);
    return {
      accountId: id,
      balance,
      transferHistory: await this.transferService.getTransfersForAccount(id)
    };
  }

  public async createAccount(customerId: number, balance?: number): Promise<Account> {
    const dto = await this.accountRepo.createAccount(customerId, balance ?? 0);
    return {
      accountId: dto.id,
      balance: dto.balance,
      transferHistory: [] // should be empty when creating new account
    };
  }

  public async updateAccount(customerId: number, accountId: number, balance: number): Promise<Account> {
    // grab the old version of the account first
    const oldAccount = await this.getAccountById(customerId, accountId);
    await this.accountRepo.updateAccount(customerId, accountId, balance);
    return {
      accountId,
      balance,
      transferHistory: oldAccount.transferHistory
    };
  }

  public async deleteAccount(customerId: number, accountId: number): Promise<void> {
    // ensure the account is present, then delete
    await this.getAccountById(customerId, accountId);
    await this.accountRepo.deleteAccount(customerId, accountId);
  }

  public async accountExists(customerId: number, accountId: number): Promise<boolean> {
    return await this.accountRepo.accountExists(customerId, accountId);
  }
}
