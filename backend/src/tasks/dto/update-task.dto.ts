import {IsEnum, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {Status} from '../status.enum.js';

export class UpdateTaskDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    title?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    text?: string;

    @IsEnum(Status)
    @IsNotEmpty()
    @IsOptional()
    status?: Status;
}
