import { Test, TestingModule } from '@nestjs/testing'
import { RabbitMQService } from './rabbitmq.service'

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}))

describe('RabbitMQService', () => {
  let service: RabbitMQService
  let mockChannel: any
  let mockConnection: any
  let connectMock: jest.Mock

  beforeEach(async () => {
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({}),
      bindQueue: jest.fn().mockResolvedValue({}),
      publish: jest.fn().mockReturnValue(true),
      consume: jest.fn().mockResolvedValue({}),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue({}),
    }

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue({}),
    }

    connectMock = jest.fn().mockResolvedValue(mockConnection)
    const { connect } = require('amqplib')
    ;(connect as jest.Mock).mockImplementation(connectMock)

    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitMQService],
    }).compile()

    service = module.get<RabbitMQService>(RabbitMQService)
    await service.onModuleInit()
  })

  afterEach(async () => {
    try {
      await service.onModuleDestroy()
    } catch {}
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should connect to RabbitMQ', () => {
      expect(connectMock).toHaveBeenCalled()
    })

    it('should create channel', () => {
      expect(mockConnection.createChannel).toHaveBeenCalled()
    })

    it('should assert exchange', () => {
      expect(mockChannel.assertExchange).toHaveBeenCalledWith('purchase', 'topic', { durable: true })
    })

    it('should handle connection errors', async () => {
      const errorConnectMock = jest.fn().mockRejectedValue(new Error('Connection failed'))
      const { connect } = require('amqplib')
      ;(connect as jest.Mock).mockImplementation(errorConnectMock)

      const errorModule: TestingModule = await Test.createTestingModule({
        providers: [RabbitMQService],
      }).compile()

      const errorService = errorModule.get<RabbitMQService>(RabbitMQService)
      await errorService.onModuleInit()
    })
  })

  describe('onModuleDestroy', () => {
    it('should close channel and connection', async () => {
      await service.onModuleDestroy()

      expect(mockChannel.close).toHaveBeenCalled()
      expect(mockConnection.close).toHaveBeenCalled()
    })

    it('should handle close errors gracefully', async () => {
      mockConnection.close.mockRejectedValue(new Error('Close error'))

      await service.onModuleDestroy()

      expect(mockChannel.close).toHaveBeenCalled()
    })
  })

  describe('publish', () => {
    it('should publish message to channel', async () => {
      const result = await service.publish('test.routing.key', { test: 'data' })

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'purchase',
        'test.routing.key',
        expect.any(Buffer),
        { persistent: true, contentType: 'application/json' },
      )
      expect(result).toBe(true)
    })

    it('should return false if channel not available', async () => {
      const service2 = new RabbitMQService()
      const result = await service2.publish('test.routing.key', { test: 'data' })

      expect(result).toBe(false)
    })

    it('should handle publish errors', async () => {
      mockChannel.publish.mockImplementation(() => {
        throw new Error('Publish error')
      })

      const result = await service.publish('test.routing.key', { test: 'data' })

      expect(result).toBe(false)
    })
  })

  describe('consume', () => {
    it('should setup consumer for queue', async () => {
      const callback = jest.fn()

      await service.consume('test.queue', callback)

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test.queue', { durable: true })
      expect(mockChannel.bindQueue).toHaveBeenCalledWith('test.queue', 'purchase', 'test.queue')
      expect(mockChannel.consume).toHaveBeenCalled()
    })

    it('should return if channel not available', async () => {
      const service2 = new RabbitMQService()
      const callback = jest.fn()

      await service2.consume('test.queue', callback)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should handle consume errors', async () => {
      const consumeMock = jest.fn().mockImplementation(() => {
        throw new Error('Consume setup failed')
      })
      jest.spyOn(mockChannel, 'consume').mockImplementation(consumeMock)

      const callback = jest.fn()
      await service.consume('test.queue', callback)
    })

    it('should handle errors in message processing', async () => {
      const callback = jest.fn().mockRejectedValue(new Error('Processing error'))

      await service.consume('test.queue', callback)

      const registeredHandler = (mockChannel.consume as jest.Mock).mock.calls[0][1]
      await registeredHandler({ content: Buffer.from('{}') })

      expect(mockChannel.nack).toHaveBeenCalled()
    })

    it('should ack message on successful processing', async () => {
      const callback = jest.fn().mockResolvedValue(undefined)

      await service.consume('test.queue', callback)

      const registeredHandler = (mockChannel.consume as jest.Mock).mock.calls[0][1]
      await registeredHandler({ content: Buffer.from('{"test":"data"}') })

      expect(callback).toHaveBeenCalledWith({ test: 'data' })
      expect(mockChannel.ack).toHaveBeenCalled()
    })
  })

  describe('isConnected', () => {
    it('should return true when connected', () => {
      expect(service.isConnected()).toBe(true)
    })

    it('should return false when not connected', async () => {
      const service2 = new RabbitMQService()
      expect(service2.isConnected()).toBe(false)
    })
  })
})
