import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class TransferRequest {
  @IsNumber()
  @ApiProperty({ description: 'The amount to transfer' })
  amount!: number;

  @IsNumber()
  @ApiProperty({ description: 'The customer that the account you want to transfer to belongs to' })
  toCustomerId!: number;

  @IsNumber()
  @ApiProperty({ description: 'The ID of the account to transfer money to' })
  toAccountId!: number;
}
