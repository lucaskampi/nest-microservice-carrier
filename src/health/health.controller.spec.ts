import { Test, TestingModule } from '@nestjs/testing'
import { HealthController } from './health.controller'
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus'
import { PrismaService } from '../prisma/prisma.service'

describe('HealthController', () => {
  let controller: HealthController
  let healthCheckService: jest.Mocked<HealthCheckService>
  let prismaHealthIndicator: jest.Mocked<PrismaHealthIndicator>
  let prismaService: jest.Mocked<PrismaService>

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    }

    const mockPrismaHealthIndicator = {
      pingCheck: jest.fn(),
    }

    const mockPrismaService = {
      $queryRaw: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaHealthIndicator },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    controller = module.get<HealthController>(HealthController)
    healthCheckService = module.get(HealthCheckService)
    prismaHealthIndicator = module.get(PrismaHealthIndicator)
    prismaService = module.get(PrismaService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('check', () => {
    it('should return health check result', async () => {
      const mockHealthResult = { status: 'ok' as const, info: {}, details: {} }
      healthCheckService.check.mockResolvedValue(mockHealthResult)
      prismaHealthIndicator.pingCheck.mockReturnValue({ status: 'up' } as any)

      const result = await controller.check()

      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ])
      expect(result.status).toBe('ok')
    })
  })

  describe('live', () => {
    it('should return liveness status', () => {
      const result = controller.live()

      expect(result).toHaveProperty('status', 'ok')
      expect(result).toHaveProperty('timestamp')
      expect(new Date(result.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('ready', () => {
    it('should return ready when database is connected', async () => {
      prismaService.$queryRaw.mockResolvedValue([])

      const result = await controller.ready()

      expect(prismaService.$queryRaw).toHaveBeenCalled()
      expect(result).toHaveProperty('status', 'ready')
      expect(result).toHaveProperty('timestamp')
    })

    it('should return not ready when database connection fails', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'))

      const result = await controller.ready()

      expect(result).toHaveProperty('status', 'not ready')
      expect(result).toHaveProperty('timestamp')
    })
  })
})
