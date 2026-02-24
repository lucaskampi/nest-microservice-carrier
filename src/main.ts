import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('Carrier Service')
    .setDescription('Carrier microservice API')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 4002
  await app.listen(port)
  console.log(`🚀 Carrier Service running on http://localhost:${port}/api`)
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`)
}

bootstrap()
