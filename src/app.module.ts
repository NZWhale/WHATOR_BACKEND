import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {CustomLoggerService} from "./logger/custom-logger.service";
import {getConnectionOptions} from "typeorm";
import {ConfigModule} from "@nestjs/config";
import * as path from 'path';
import configuration from './config';
import {TelegramModule} from "./telegram/telegram.module";

@Module({
  imports: [
      TelegramModule,
      ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: path.join(__dirname, '..', '.env'),
      }),
      TypeOrmModule.forRootAsync({
          imports: CustomLoggerService,
          name: 'kognia',
          useFactory: async () =>
              Object.assign(getConnectionOptions(), {
                  autoLoadEntities: true,
                  logging: 'simple-console',
                  logger: new CustomLoggerService(),
              }),
      }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
