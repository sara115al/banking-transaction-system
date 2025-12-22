import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Customer } from '../models/Customer';
import { CreateCustomerRequest } from '../models/request/CustomerRequest';
import { CustomerService } from '../services/CustomerService';

@Controller({
  path: '/bank/customers'
})
@ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal Server Error' })
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  // get a list of all customers
  @Get()
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  public async getCustomers(): Promise<Customer[]> {
    return this.customerService.getCustomers();
  }

  // create a new customer
  @Post()
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created customer' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The request failed due to malformed syntax.' })
  public async createCustomer(@Body() customer: CreateCustomerRequest): Promise<Customer> {
    const { name } = customer;
    return this.customerService.createCustomer(name);
  }

  // get a single customer by id
  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The request failed due to malformed syntax.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer could not be found.' })
  public async getCustomer(@Param('id') id: string): Promise<Customer> {
    const customerId = this.convertUrlIdtoCustomerId(id);
    return this.customerService.getCustomerById(customerId);
  }

  // delete a customer via an id
  @Delete(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The request failed due to malformed syntax.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer could not be found.' })
  public async deleteCustomer(@Param('id') id: string): Promise<void> {
    const customerId = this.convertUrlIdtoCustomerId(id);
    await this.customerService.deleteCustomer(customerId);
  }

  // update a customer - currently supports updating a customer's name
  @Patch(':id')
  @ApiResponse({ status: HttpStatus.OK, description: 'OK' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The request failed due to malformed syntax.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The customer could not be found.' })
  public async updateCustomer(@Param('id') id: string, @Body() customer: CreateCustomerRequest): Promise<Customer> {
    const customerId = this.convertUrlIdtoCustomerId(id);
    const { name } = customer;
    return this.customerService.updateCustomer(customerId, name);
  }

  private convertUrlIdtoCustomerId(id: string): number {
    if (!parseInt(id, 10) || parseInt(id, 10) <= 0) {
      throw new HttpException('Customer ID must be a valid integer greater than 1.', HttpStatus.BAD_REQUEST);
    }
    return parseInt(id, 10);
  }
}
