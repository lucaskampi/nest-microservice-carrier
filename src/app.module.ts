import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaService } from './prisma/prisma.service'
import { HealthModule } from './health/health.module'
import { RabbitMQModule } from './rabbitmq/rabbitmq.module'

@Module({
  imports: [HealthModule, RabbitMQModule],
  controllers: [AppController],
  providers: [AppService, PrismaService]
})
export class AppModule {}
