import { trimObject } from '@zalib/core/dist';
import { Knex } from 'knex';

import { PgKnexConfig } from '../types';

import { PgClientConfig, PgConnectionConfig } from '../types/configs';

/**
 * Адаптирует имя приложения под имя соединения
 */
export function getApplicationName(applicationName?: string): string {
  const { package_name: packageName } = process.env;

  /* prettier-ignore */
  const appName = (applicationName || packageName || 'unknown')
    .replace(/[^\d\w]+/g, '_');

  return `${appName.trim().toLowerCase()}:knex`;
}

/**
 * Возвращает декомпозированный конфиг соединения
 */
function prepareConnection(
  connection: Knex.PgConnectionConfig | PgConnectionConfig,
  applicationName?: string,
): PgConnectionConfig {
  const {
    connectionString,
    host: hostConfig,
    port: portConfig,
    user: userConfig,
    password: passConfig,
    database: baseConfig,
    ...other
  } = connection;

  const connectionUrl = connectionString ? new URL(connectionString) : null;

  return trimObject({
    ...other,
    application_name: getApplicationName(applicationName),
    database: baseConfig || connectionUrl?.pathname.split('/')[1],
    host: hostConfig || connectionUrl?.hostname || 'localhost',
    password: passConfig || connectionUrl?.password,
    port: portConfig || Number(connectionUrl?.port) || 5432,
    user: userConfig || connectionUrl?.username,
  });
}

/**
 * Формирует и возвращает конфиг подключения к БД
 */
export function pgClientConfig(
  config: PgKnexConfig | PgClientConfig,
): PgClientConfig {
  const { connection, applicationName } = config;

  const conn = prepareConnection(connection, applicationName);

  return { ...config, connection: conn };
}
