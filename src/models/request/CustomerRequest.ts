import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

class CustomerRequest {
  @IsString()
  @ApiProperty({ description: 'The new name for the customer' })
  name!: string;
}

export class CreateCustomerRequest extends CustomerRequest {}
export class UpdateCustomerRequest extends CustomerRequest {}
