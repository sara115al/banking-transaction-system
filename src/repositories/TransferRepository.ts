import { Injectable } from '@nestjs/common';
import * as sqlite from 'sqlite';
import { TransferDTO } from '../models/Transfer';

@Injectable()
export class TransferRepository {
  constructor(private db: sqlite.Database) {}

  public async createTransfer(amount: number, toId: number, fromId: number): Promise<TransferDTO> {
    const date = new Date().toISOString();
    const results = await this.db.run('INSERT INTO transfers (timestamp, amount, toId, fromId) VALUES (?, ?, ?, ?)', date, amount, toId, fromId);
    return {
      id: results.lastID!, // lastId will be present if the query didn't throw
      timestamp: date,
      amount,
      toId,
      fromId
    };
  }

  public async getTransfersForAccount(accountId: number): Promise<TransferDTO[]> {
    // get all transfers associated with the account - both to and from
    const results = await this.db.all('SELECT * FROM transfers WHERE toId = ? OR fromId = ?', accountId, accountId);
    if (!results) {
      return [];
    }
    return results;
  }
}
