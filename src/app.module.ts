import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CsgoApiController } from './controllers/csgo-api.controller';
import { CsgoApiService } from './services/csgo-api.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [CsgoApiController],
  providers: [CsgoApiService],
})
export class AppModule {}
