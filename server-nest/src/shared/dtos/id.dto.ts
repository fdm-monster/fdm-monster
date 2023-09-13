import { IsNotEmpty, IsNumber } from 'class-validator';

export class IdDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
