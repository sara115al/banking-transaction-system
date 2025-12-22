import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { TransferRequest } from '../models/request/TransferRequest';
import { Transfer } from '../models/Transfer';
import { AccountService } from '../services/AccountService';
import { CustomerService } from '../services/CustomerService';
import { TransferService } from '../services/TransferService';

@Controller({
  path: '/bank/customers/:customerId/accounts/:accountId/transfers'
})
@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The request failed due to malformed syntax.' })
@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
export class TransferController {
  constructor(private accountService: AccountService, private customerService: CustomerService, private transferService: TransferService) {}

  // get the complete transfer history for the provided account
  @Get()
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer or account could not be found.' })
  public async getTransferHistoryForAccount(@Param('customerId') cid: string, @Param('accountId') aid: string): Promise<Transfer[]> {
    const customerId = this.convertUrlIdtoValidId(cid);
    const accountId = this.convertUrlIdtoValidId(aid);
    if (!(await this.customerService.customerExists(customerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }
    if (!(await this.accountService.accountExists(customerId, accountId))) {
      throw new HttpException('The desired account does not exist.', HttpStatus.NOT_FOUND);
    }

    return await this.transferService.getTransfersForAccount(accountId);
  }

  // transfer money between two accounts. These can be accounts belonging to the same customer, or different customers.
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Made transfer' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer or account could not be found.' })
  public async transfer(
    @Param('customerId') cid: string,
    @Param('accountId') aid: string,
    @Body() body: TransferRequest): Promise<Transfer> {
    const fromCustomerId = this.convertUrlIdtoValidId(cid);
    const fromAccountId = this.convertUrlIdtoValidId(aid);
    const { amount: amountToTransfer, toAccountId, toCustomerId } = body;
    await this.validateTransferRequest({ amountToTransfer, toCustomerId, toAccountId, fromCustomerId, fromAccountId });

    const fromAccount = await this.accountService.getAccountById(fromCustomerId, fromAccountId);
    if (fromAccount.balance < amountToTransfer) {
      throw new HttpException('This account does not have enough funds to transfer the desired amount.', HttpStatus.BAD_REQUEST);
    }
    await this.accountService.updateAccount(fromCustomerId, fromAccountId, (fromAccount.balance - amountToTransfer));

    const toAccount = await this.accountService.getAccountById(toCustomerId, toAccountId);
    await this.accountService.updateAccount(toCustomerId, toAccountId, (toAccount.balance + amountToTransfer));

    const transfer = await this.transferService.createTransfer(amountToTransfer, toAccountId, fromAccountId);
    return transfer;
  }

  private async validateTransferRequest(
    { amountToTransfer, toCustomerId, toAccountId, fromCustomerId, fromAccountId }:
    {
      amountToTransfer: number,
      toCustomerId: number,
      toAccountId: number,
      fromCustomerId: number,
      fromAccountId: number
    }): Promise<void> {
    if (!(await this.customerService.customerExists(fromCustomerId))) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }
    if (!(await this.customerService.customerExists(toCustomerId))) {
      throw new HttpException('The customer you wish to transfer money to does not exist.', HttpStatus.NOT_FOUND);
    }
    if (!(await this.accountService.accountExists(fromCustomerId, fromAccountId))) {
      throw new HttpException('The desired account to transfer money from does not exist.', HttpStatus.NOT_FOUND);
    }
    if (!(await this.accountService.accountExists(toCustomerId, toAccountId))) {
      throw new HttpException('The desired account to transfer money to does not exist.', HttpStatus.NOT_FOUND);
    }
    if (amountToTransfer <= 0) {
      throw new HttpException('The transfer amount must be a dollar value greater than 0.', HttpStatus.BAD_REQUEST);
    }
  }

  private convertUrlIdtoValidId(id: string): number {
    if (!parseInt(id, 10) || parseInt(id, 10) <= 0) {
      throw new HttpException('Customer and Account ID must be a valid integer greater than 1.', HttpStatus.BAD_REQUEST);
    }
    return parseInt(id, 10);
  }
}
