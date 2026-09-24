import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  login?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;
}
