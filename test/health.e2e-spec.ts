import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from './../src/app.module'

describe('HealthController (e2e)', () => {
  let app: INestApplication

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
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200)

      expect(response.body).toHaveProperty('status')
    })
  })

  describe('/health/live (GET)', () => {
    it('should return liveness probe', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/live')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('/health/ready (GET)', () => {
    it('should return readiness probe', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health/ready')
        .expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
    })
  })
})
