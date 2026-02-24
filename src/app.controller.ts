import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { AppService } from './app.service'
import { BookDeliveryDto } from './app.dto'

@ApiTags('carrier')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('delivery')
  @ApiOperation({ summary: 'Book delivery with carrier' })
  @ApiResponse({ status: 201, description: 'Delivery booked successfully' })
  async bookDelivery(@Body() deliveryInfo: BookDeliveryDto) {
    return this.appService.bookDelivery({
      ...deliveryInfo,
      deliveryDate: new Date(deliveryInfo.deliveryDate),
    })
  }

  @Get('delivery/:orderId')
  @ApiOperation({ summary: 'Get delivery by order ID' })
  @ApiResponse({ status: 200, description: 'Returns delivery info' })
  async getDelivery(@Param('orderId') orderId: string) {
    return this.appService.getDeliveryByOrderId(parseInt(orderId))
  }
}
