import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

class AccountRequest {}

export class CreateAccountRequest extends AccountRequest {
  @IsNumber()
  @IsOptional()
  @ApiProperty({ required: false, description: 'The initial deposit for the new account' })
  initialDeposit?: number;
}

export class UpdateAccountRequest extends AccountRequest {
  @IsNumber()
  @ApiProperty({ description: 'The value to set the account\'s balance to' })
  balance!: number;
}
