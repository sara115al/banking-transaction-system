import { Injectable } from '@nestjs/common';
import { Account } from '../models/Account';
import { Customer } from '../models/Customer';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { AccountService } from './AccountService';

@Injectable()
export class CustomerService {
  constructor(private customerRepo: CustomerRepository, private accountService: AccountService) {}

  public async getCustomers(): Promise<Customer[]> {
    const customers: Customer[] = [];
    const customerDtos = await this.customerRepo.getCustomers();
    for (const customerDto of customerDtos) {
      customers.push({
        ...customerDto,
        accounts: await this.getAccountsForCustomer(customerDto.id)
      });
    }
    return customers;
  }

  public async getCustomerById(id: number): Promise<Customer> {
    const dto = await this.customerRepo.getCustomerById(id);
    return {
      ...dto,
      accounts: await this.getAccountsForCustomer(id)
    };
  }

  public async createCustomer(name: string): Promise<Customer> {
    const dto = await this.customerRepo.createCustomer(name);
    return {
      ...dto,
      accounts: [] // accounts will be empty when creating a new costumer
    };
  }

  public async deleteCustomer(id: number): Promise<void> {
    // ensure the customer is present, then delete
    const oldCustomer = await this.getCustomerById(id);

    // delete all of the acconuts assocaited with the customer
    for (const account of oldCustomer.accounts) {
      await this.accountService.deleteAccount(id, account.accountId);
    }

    await this.customerRepo.deleteCustomer(id);
  }

  public async updateCustomer(id: number, name: string): Promise<Customer> {
    // grab the old version of the customer first
    const oldCustomer = await this.getCustomerById(id);
    await this.customerRepo.updateCustomer(id, name);
    return {
      id,
      name,
      accounts: oldCustomer.accounts
    };
  }

  public async customerExists(id: number): Promise<boolean> {
    return this.customerRepo.customerExists(id);
  }

  private async getAccountsForCustomer(customerId: number): Promise<Account[]> {
    return this.accountService.getAccountsForCustomer(customerId);
  }
}
