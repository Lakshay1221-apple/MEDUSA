import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CategoriesService } from './categories/categories.service';

async function bootstrap() {
  const logger = new Logger('MedusaBootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix /api/v1
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Interceptor & Filter
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('MEDUSA API')
    .setDescription('MEDUSA — Execution Enforcement System Backend API Specification')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Seed default categories
  try {
    const categoriesService = app.get(CategoriesService);
    await categoriesService.ensureDefaultCategories();
  } catch (err) {
    logger.warn(`Default categories initialization deferred: ${err.message}`);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`⚡ MEDUSA Backend server running on http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger API documentation available at http://localhost:${port}/docs`);
}
bootstrap();
