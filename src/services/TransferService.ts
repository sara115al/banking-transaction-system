import { Injectable } from '@nestjs/common';
import { Transfer } from '../models/Transfer';
import { TransferRepository } from '../repositories/TransferRepository';

@Injectable()
export class TransferService {
  constructor(private transferRepo: TransferRepository) {}

  public async createTransfer(amount: number, toId: number, fromId: number): Promise<Transfer> {
    const dto = await this.transferRepo.createTransfer(amount, toId, fromId);
    return {
      transferId: dto.id,
      timestamp: dto.timestamp,
      amount,
      toAccountId: toId,
      fromAccountId: fromId
    };
  }

  public async getTransfersForAccount(accountId: number): Promise<Transfer[]> {
    const transfers: Transfer[] = [];
    const dtos = await this.transferRepo.getTransfersForAccount(accountId);
    for (const dto of dtos) {
      const transfer: Transfer = {
        transferId: dto.id,
        amount: dto.amount,
        timestamp: dto.timestamp,
        toAccountId: dto.toId,
        fromAccountId: dto.fromId
      };
      transfers.push(transfer);
    }
    return transfers;
  }
}
