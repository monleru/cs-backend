import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Global prefix
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3002;
    await app.listen(port);
    
    logger.log(`🚀 CS:GO API Backend is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/api/csgo/health`);
    logger.log(`🌍 Supported languages: http://localhost:${port}/api/csgo/languages`);
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
