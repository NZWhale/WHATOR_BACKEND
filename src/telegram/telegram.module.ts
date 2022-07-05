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
          token: configService.get('telegram.key'),
          options: {
            telegram: { apiRoot: configService.get('telegram.apiRoot') },
          },
        } as unknown as TelegrafModuleOptions),
      inject: [ConfigService],
    }),
  ],
  providers: [TelegramUpdate],
})
export class TelegramModule {}
