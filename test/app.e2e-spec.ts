import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from './../src/app.module'
import { PrismaService } from './../src/prisma/prisma.service'

describe('AppController (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('RabbitMQService')
      .useValue({
        consume: jest.fn().mockResolvedValue(undefined),
        publish: jest.fn().mockResolvedValue(true),
        isConnected: jest.fn().mockReturnValue(true),
      })
      .compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ transform: true }))
    await app.init()

    prisma = moduleFixture.get<PrismaService>(PrismaService)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await prisma.delivery.deleteMany({})
  })

  describe('/delivery (POST)', () => {
    it('should create a delivery', async () => {
      const createDeliveryDto = {
        orderId: 123,
        deliveryDate: '2024-12-25',
        originAddress: '123 Origin St',
        destinationAddress: '456 Destination Ave',
      }

      const response = await request(app.getHttpServer())
        .post('/api/delivery')
        .send(createDeliveryDto)
        .expect(201)

      expect(response.body).toHaveProperty('number')
      expect(response.body).toHaveProperty('deliveryForecast')
    })

    it('should return 400 for invalid data', async () => {
      const invalidDto = {
        orderId: 'not-a-number',
      }

      const response = await request(app.getHttpServer())
        .post('/api/delivery')
        .send(invalidDto)
        .expect(400)

      expect(response.body).toHaveProperty('message')
    })
  })

  describe('/delivery/:orderId (GET)', () => {
    it('should return delivery by orderId', async () => {
      await prisma.delivery.create({
        data: {
          orderId: 999,
          originAddress: 'Origin',
          destinationAddress: 'Destination',
          status: 'BOOKED',
          deliveryDate: new Date(),
          deliveryForecast: new Date(),
          voucherNumber: 12345,
        },
      })

      const response = await request(app.getHttpServer())
        .get('/api/delivery/999')
        .expect(200)

      expect(response.body.orderId).toBe(999)
      expect(response.body.voucherNumber).toBe(12345)
    })

    it('should return null for non-existent delivery', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/delivery/999999')
        .expect(200)

      expect(response.body).toEqual({})
    })
  })
})
