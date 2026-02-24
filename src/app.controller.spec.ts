import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { BookDeliveryDto } from './app.dto'

describe('AppController', () => {
  let controller: AppController
  let service: jest.Mocked<AppService>

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
    const mockAppService = {
      bookDelivery: jest.fn(),
      getDeliveryByOrderId: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
      ],
    }).compile()

    controller = module.get<AppController>(AppController)
    service = module.get(AppService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('bookDelivery', () => {
    it('should create a delivery', async () => {
      const dto: BookDeliveryDto = {
        orderId: 123,
        deliveryDate: '2024-12-25',
        originAddress: 'Origin St',
        destinationAddress: 'Destination Ave',
      }

      const expectedResult = { number: 54321, deliveryForecast: new Date() }
      service.bookDelivery.mockResolvedValue(expectedResult)

      const result = await controller.bookDelivery(dto)

      expect(service.bookDelivery).toHaveBeenCalledWith({
        orderId: dto.orderId,
        deliveryDate: new Date(dto.deliveryDate),
        originAddress: dto.originAddress,
        destinationAddress: dto.destinationAddress,
      })
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getDelivery', () => {
    it('should return delivery by orderId', async () => {
      service.getDeliveryByOrderId.mockResolvedValue(mockDelivery)

      const result = await controller.getDelivery('123')

      expect(service.getDeliveryByOrderId).toHaveBeenCalledWith(123)
      expect(result).toEqual(mockDelivery)
    })

    it('should parse string orderId to number', async () => {
      service.getDeliveryByOrderId.mockResolvedValue(mockDelivery)

      await controller.getDelivery('456')

      expect(service.getDeliveryByOrderId).toHaveBeenCalledWith(456)
    })
  })
})
