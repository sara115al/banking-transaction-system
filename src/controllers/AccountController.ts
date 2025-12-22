import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Account } from '../models/Account';
import { CreateAccountRequest, UpdateAccountRequest } from '../models/request/AccountRequest';
import { AccountService } from '../services/AccountService';
import { CustomerService } from '../services/CustomerService';

// Controller containing all routes associated accounts
@Controller({
  path: '/bank/customers/:customerId/accounts'
})
@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The request failed due to malformed syntax.' })
@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
export class AccountController {
  constructor(private accountService: AccountService, private customerService: CustomerService) {}

  // get the accounts for a given user
  @Get()
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer could not be found.' })
  public async getAllAccounts(@Param('customerId') cid: string): Promise<Account[]> {
    const customerId = this.convertUrlIdtoValidId(cid);
    if (!(await this.customerService.customerExists(customerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }
    return await this.accountService.getAccountsForCustomer(customerId);
  }

  // get a single account via an account id and a customer id
  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer or account could not be found.' })
  public async getAccount(@Param('customerId') cid: string, @Param('id') aid: string): Promise<Account> {
    const customerId = this.convertUrlIdtoValidId(cid);
    const accountId = this.convertUrlIdtoValidId(aid);
    if (!(await this.customerService.customerExists(customerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }
    return await this.accountService.getAccountById(customerId, accountId);
  }

  // get the balance of an account
  @Get(':id/balance')
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer or account could not be found.' })
  public async getAccountBalance(@Param('customerId') cid: string, @Param('id') aid: string): Promise<number> {
    const customerId = this.convertUrlIdtoValidId(cid);
    const accountId = this.convertUrlIdtoValidId(aid);
    if (!(await this.customerService.customerExists(customerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }

    const { balance } = await this.accountService.getAccountById(customerId, accountId);
    return balance;
  }

  // create a new account
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created account' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer could not be found.' })
  public async createAccount(@Param('customerId') cid: string, @Body() body: CreateAccountRequest) {
    const customerId = this.convertUrlIdtoValidId(cid);
    if (!(await this.customerService.customerExists(customerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }

    const { initialDeposit } = body;
    if (initialDeposit && initialDeposit < 0) {
      throw new HttpException('Initial deposit amount must be a valid amount greater than 0.', HttpStatus.BAD_REQUEST);
    }
    return await this.accountService.createAccount(customerId, initialDeposit);
  }

  // update an account - currently supports updating an account's balance
  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer or account could not be found.' })
  public async updateAccount(
    @Param('customerId') cid: string,
    @Param('id') aid: string,
    @Body() body: UpdateAccountRequest): Promise<Account> {
    const customerId = this.convertUrlIdtoValidId(cid);
    const accountId = this.convertUrlIdtoValidId(aid);
    if (!(await this.customerService.customerExists(customerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }

    const { balance } = body;
    return await this.accountService.updateAccount(customerId, accountId, balance);
  }

  // delete an account via an account id and customer id
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer or account could not be found.' })
  public async deleteAccount(@Param('customerId') cid: string, @Param('id') aid: string): Promise<void> {
    const customerId = this.convertUrlIdtoValidId(cid);
    const accountId = this.convertUrlIdtoValidId(aid);
    if (!(await this.customerService.customerExists(customerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }

    await this.accountService.deleteAccount(customerId, accountId);
  }

  private convertUrlIdtoValidId(id: string): number {
    if (!parseInt(id, 10) || parseInt(id, 10) <= 0) {
      throw new HttpException('Customer and Account ID must be a valid integer greater than 1.', HttpStatus.BAD_REQUEST);
    }
    return parseInt(id, 10);
  }
}
