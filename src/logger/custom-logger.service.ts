import { LoggerService } from '@nestjs/common';
import * as pino from 'pino';
import { Logger, QueryRunner } from 'typeorm';

export class CustomLoggerService implements LoggerService, Logger {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  constructor(private _logger = pino()) {}

  public log(message: any, ...params: any[]) {
    this._logger.info(message, params);
  }

  public error(message: any, ...params: any[]) {
    this._logger.error(message, params);
  }

  public warn(message: any, ...params: any[]) {
    this._logger.warn(message, params);
  }

  public debug(message: any, ...params: any[]) {
    this._logger.debug(message, params);
  }

  public verbose(message: any, ...params: any[]) {
    this._logger.trace(message, params);
  }

  private getOrmMessage(query: string, parameters?: any[]): string {
    return (
      query +
      (parameters && parameters.length
        ? ' -- PARAMETERS: ' + this.stringifyParams(parameters)
        : '')
    );
  }

  logMigration(message: string, queryRunner?: QueryRunner): any {
    this._logger.info(message);
  }

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
    this._logger.info(
      this.getAdditionalFields(),
      this.getOrmMessage(query, parameters),
    );
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): any {
    const addFields = this.getAdditionalFields();
    this._logger.error(addFields, this.getOrmMessage(query, parameters));
    this._logger.error(addFields, error);
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): any {
    const addFields = this.getAdditionalFields();
    this._logger.warn(
      addFields,
      `slow ${this.getOrmMessage(query, parameters)}`,
    );
    this._logger.warn(addFields, `time: ${time}`);
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner): any {
    this._logger.info(this.getAdditionalFields(), message);
  }

  protected stringifyParams(parameters: any[]) {
    try {
      return JSON.stringify(parameters);
    } catch (error) {
      return parameters;
    }
  }
  private getAdditionalFields(): any {
    // const store = this.asyncStorage.getStore();
    // const traceId = store?.get('traceId');
    // const userId = store?.get('userId');
    return {};
  }
}
