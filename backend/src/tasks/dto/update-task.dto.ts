import {IsEnum, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {Status} from '../status.enum.js';

export class UpdateTaskDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    text?: string;

    @IsEnum(Status)
    @IsOptional()
    status?: Status;
}
