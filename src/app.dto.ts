import { IsNumber, IsDateString, IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class BookDeliveryDto {
  @ApiProperty({ example: 123 })
  @IsNumber()
  @IsNotEmpty()
  orderId: number

  @ApiProperty({ example: '2024-12-25' })
  @IsDateString()
  @IsNotEmpty()
  deliveryDate: string

  @ApiProperty({ example: '123 Origin St' })
  @IsString()
  @IsNotEmpty()
  originAddress: string

  @ApiProperty({ example: '456 Destination Ave' })
  @IsString()
  @IsNotEmpty()
  destinationAddress: string
}
