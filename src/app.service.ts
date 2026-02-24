import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { RabbitMQService } from './rabbitmq/rabbitmq.service'
import { RABBITMQ_QUEUES, DeliveryCompletedMessage } from '@nest-microservices/shared'

interface DeliveryInfo {
  orderId: number
  deliveryDate: Date
  originAddress: string
  destinationAddress: string
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQ: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.setupConsumers()
  }

  private async setupConsumers() {
    await this.rabbitMQ.consume(RABBITMQ_QUEUES.ORDER_COMPLETED, this.handleOrderCompleted.bind(this))
  }

  private async handleOrderCompleted(message: any) {
    this.logger.log(`Processing delivery for order ${message.orderId}`)

    try {
      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + message.preparationTime)

      const deliveryInfo: DeliveryInfo = {
        orderId: message.orderId,
        deliveryDate,
        originAddress: message.providerAddress,
        destinationAddress: '',
      }

      const result = await this.bookDelivery(deliveryInfo)

      const deliveryCompletedMessage: DeliveryCompletedMessage = {
        purchaseId: message.purchaseId,
        orderId: message.orderId,
        voucherNumber: result.number,
        deliveryForecast: result.deliveryForecast,
      }

      await this.rabbitMQ.publish(RABBITMQ_QUEUES.DELIVERY_COMPLETED, deliveryCompletedMessage)
      this.logger.log(`Delivery completed for order ${message.orderId}`)
    } catch (error) {
      this.logger.error(`Failed to process delivery for order ${message.orderId}`, error)
    }
  }

  async bookDelivery(deliveryInfo: DeliveryInfo) {
    const voucherNumber = Math.floor(Math.random() * 100000) + 10000

    const deliveryForecast = new Date(deliveryInfo.deliveryDate)
    deliveryForecast.setDate(deliveryForecast.getDate() + Math.floor(Math.random() * 2) + 1)

    const delivery = await this.prisma.delivery.create({
      data: {
        orderId: deliveryInfo.orderId,
        originAddress: deliveryInfo.originAddress,
        destinationAddress: deliveryInfo.destinationAddress,
        deliveryDate: deliveryInfo.deliveryDate,
        deliveryForecast,
        voucherNumber,
        status: 'BOOKED',
      },
    })

    return {
      number: delivery.voucherNumber,
      deliveryForecast: delivery.deliveryForecast,
    }
  }

  async getDeliveryByOrderId(orderId: number) {
    return this.prisma.delivery.findUnique({
      where: { orderId },
    })
  }
}
