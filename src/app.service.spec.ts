import { Test, TestingModule } from '@nestjs/testing'
import { AppService } from './app.service'
import { PrismaService } from './prisma/prisma.service'
import { RabbitMQService } from './rabbitmq/rabbitmq.service'
import { RABBITMQ_QUEUES } from '@nest-microservices/shared'

describe('AppService', () => {
  let service: AppService
  let prisma: any
  let rabbitMQ: any

  const mockDelivery = {
    id: 1,
    orderId: 123,
    purchaseId: null,
    voucherNumber: 54321,
    originAddress: 'Origin St',
    destinationAddress: 'Destination Ave',
    status: 'BOOKED',
    deliveryDate: new Date(),
    deliveryForecast: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    prisma = {
      delivery: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    }

    rabbitMQ = {
      consume: jest.fn(),
      publish: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: PrismaService, useValue: prisma },
        { provide: RabbitMQService, useValue: rabbitMQ },
      ],
    }).compile()

    service = module.get<AppService>(AppService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should setup consumers', async () => {
      rabbitMQ.consume.mockResolvedValue(undefined)

      await service.onModuleInit()

      expect(rabbitMQ.consume).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.ORDER_COMPLETED,
        expect.any(Function),
      )
    })
  })

  describe('bookDelivery', () => {
    const deliveryInfo = {
      orderId: 123,
      deliveryDate: new Date('2024-12-25'),
      originAddress: 'Origin St',
      destinationAddress: 'Destination Ave',
    }

    it('should create a delivery and return voucher info', async () => {
      prisma.delivery.create.mockResolvedValue(mockDelivery)

      const result = await service.bookDelivery(deliveryInfo)

      expect(prisma.delivery.create).toHaveBeenCalledWith({
        data: {
          orderId: deliveryInfo.orderId,
          originAddress: deliveryInfo.originAddress,
          destinationAddress: deliveryInfo.destinationAddress,
          deliveryDate: deliveryInfo.deliveryDate,
          deliveryForecast: expect.any(Date),
          voucherNumber: expect.any(Number),
          status: 'BOOKED',
        },
      })
      expect(result).toHaveProperty('number')
      expect(result).toHaveProperty('deliveryForecast')
    })

    it('should generate valid voucher number', async () => {
      prisma.delivery.create.mockResolvedValue(mockDelivery)

      const result = await service.bookDelivery(deliveryInfo)

      expect(result.number).toBeGreaterThanOrEqual(10000)
      expect(result.number).toBeLessThanOrEqual(110000)
    })
  })

  describe('getDeliveryByOrderId', () => {
    it('should return delivery by orderId', async () => {
      prisma.delivery.findUnique.mockResolvedValue(mockDelivery)

      const result = await service.getDeliveryByOrderId(123)

      expect(prisma.delivery.findUnique).toHaveBeenCalledWith({
        where: { orderId: 123 },
      })
      expect(result).toEqual(mockDelivery)
    })

    it('should return null if delivery not found', async () => {
      prisma.delivery.findUnique.mockResolvedValue(null)

      const result = await service.getDeliveryByOrderId(999)

      expect(result).toBeNull()
    })
  })

  describe('handleOrderCompleted', () => {
    const orderMessage = {
      purchaseId: 1,
      orderId: 123,
      preparationTime: 2,
      providerAddress: 'Provider Address',
    }

    it('should create delivery and publish completion message', async () => {
      let capturedCallback: any = null
      rabbitMQ.consume.mockImplementation((queue: string, callback: any) => {
        capturedCallback = callback
        return Promise.resolve()
      })
      prisma.delivery.create.mockResolvedValue({
        ...mockDelivery,
        voucherNumber: 54321,
        deliveryForecast: new Date(),
      })

      await service.onModuleInit()

      if (capturedCallback) {
        await capturedCallback(orderMessage)
      }

      expect(prisma.delivery.create).toHaveBeenCalled()
      expect(rabbitMQ.publish).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.DELIVERY_COMPLETED,
        expect.objectContaining({
          purchaseId: orderMessage.purchaseId,
          orderId: orderMessage.orderId,
          voucherNumber: expect.any(Number),
          deliveryForecast: expect.any(Date),
        }),
      )
    })

    it('should handle errors gracefully', async () => {
      let capturedCallback: any = null
      rabbitMQ.consume.mockImplementation((queue: string, callback: any) => {
        capturedCallback = callback
        return Promise.resolve()
      })
      prisma.delivery.create.mockRejectedValue(new Error('DB Error'))

      await service.onModuleInit()

      if (capturedCallback) {
        await capturedCallback(orderMessage)
      }

      expect(rabbitMQ.publish).not.toHaveBeenCalled()
    })

    it('should throw error when delivery creation fails', async () => {
      let capturedCallback: any = null
      rabbitMQ.consume.mockImplementation((queue: string, callback: any) => {
        capturedCallback = callback
        return Promise.resolve()
      })
      prisma.delivery.create.mockResolvedValue({
        ...mockDelivery,
        voucherNumber: null as any,
        deliveryForecast: null as any,
      })

      await service.onModuleInit()

      if (capturedCallback) {
        await capturedCallback(orderMessage)
      }

      expect(rabbitMQ.publish).not.toHaveBeenCalled()
    })
  })
})
