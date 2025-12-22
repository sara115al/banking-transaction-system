import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as sqlite from 'sqlite';
import { CustomerDTO } from '../models/Customer';

@Injectable()
export class CustomerRepository {
  constructor(private db: sqlite.Database) {}

  public async getCustomers(): Promise<CustomerDTO[]> {
    const results = await this.db.all('SELECT * FROM customers');
    return results;
  }

  public async getCustomerById(id: number): Promise<CustomerDTO> {
    const results = await this.db.get('SELECT * FROM customers WHERE id = ?', id);
    if (!results) {
      throw new HttpException('Customer not found.', HttpStatus.NOT_FOUND);
    }
    return results;
  }

  public async createCustomer(name: string): Promise<CustomerDTO> {
    const results = await this.db.run('INSERT INTO customers (name) VALUES (?)', name);
    return {
      id: results.lastID!, // lastId will be present if the query didn't throw
      name
    };
  }

  public async updateCustomer(id: number, name: string): Promise<void> {
    await this.db.run('UPDATE customers SET name = ? WHERE id = ?', name, id);
  }

  public async deleteCustomer(id: number): Promise<void> {
    await this.db.run('DELETE FROM customers WHERE id = ?', id);
  }

  public async customerExists(id: number): Promise<boolean> {
    return !!await this.db.get('SELECT 1 FROM customers WHERE id= ?', id);
  }
}
