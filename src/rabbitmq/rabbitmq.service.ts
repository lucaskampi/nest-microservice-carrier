import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import * as amqp from 'amqplib'

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name)
  private connection: amqp.Connection | null = null
  private channel: amqp.Channel | null = null
  private readonly url: string

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
  }

  async onModuleInit() {
    await this.connect()
  }

  async onModuleDestroy() {
    await this.close()
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(this.url)
      this.channel = await this.connection.createChannel()
      await this.channel.assertExchange('purchase', 'topic', { durable: true })
      this.logger.log('Connected to RabbitMQ')
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error)
    }
  }

  private async close() {
    try {
      if (this.channel) await this.channel.close()
      if (this.connection) await this.connection.close()
      this.logger.log('Disconnected from RabbitMQ')
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error)
    }
  }

  async publish(routingKey: string, message: object) {
    if (!this.channel) {
      this.logger.warn('Channel not available, message not sent')
      return false
    }

    try {
      const content = Buffer.from(JSON.stringify(message))
      this.channel.publish('purchase', routingKey, content, {
        persistent: true,
        contentType: 'application/json',
      })
      this.logger.log(`Published message to ${routingKey}`)
      return true
    } catch (error) {
      this.logger.error(`Failed to publish message to ${routingKey}`, error)
      return false
    }
  }

  async consume(queue: string, callback: (message: object) => Promise<void>) {
    if (!this.channel) {
      this.logger.warn('Channel not available, cannot consume')
      return
    }

    try {
      await this.channel.assertQueue(queue, { durable: true })
      await this.channel.bindQueue(queue, 'purchase', queue)

      this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString())
            await callback(content)
            this.channel?.ack(msg)
          } catch (error) {
            this.logger.error('Error processing message', error)
            this.channel?.nack(msg, false, false)
          }
        }
      })

      this.logger.log(`Consuming messages from ${queue}`)
    } catch (error) {
      this.logger.error(`Failed to consume from ${queue}`, error)
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null
  }
}
