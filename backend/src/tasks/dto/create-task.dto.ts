import {IsEnum, IsNotEmpty, IsOptional, IsString} from 'class-validator';
import {Status} from '../status.enum.js';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    text: string;

    @IsEnum(Status)
    @IsOptional()
    status?: Status;
}
