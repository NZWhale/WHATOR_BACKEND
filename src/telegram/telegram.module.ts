import { Module } from '@nestjs/common';
import { TelegrafModule, TelegrafModuleOptions } from 'nestjs-telegraf';
import { TelegramUpdate } from './telegram.update';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) =>
        ({
          botKey: configService.get('Telegram_API_Key'),
        } as unknown as TelegrafModuleOptions),
      inject: [ConfigService],
    }),
  ],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
