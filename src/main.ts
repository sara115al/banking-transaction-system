import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BankModule } from './BankModule';

async function bootstrap() {
  const app = await NestFactory.create(BankModule);

  const config = new DocumentBuilder()
    .setTitle('Bank API')
    .setDescription('Basic API written in Typescript and NestJS.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('bank/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap().catch(console.error);
