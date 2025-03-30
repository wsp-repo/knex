import { trimObject } from '@zalib/core/dist';

import { PgKnexConfig } from '../types';

import { DEFAULT_SCHEMA } from '../constants';
import {
  KnexPgConnectionConfig,
  PgClientConfig,
  PgConnectionConfig,
} from '../types/configs';

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
// eslint-disable-next-line complexity
function prepareConnection(
  connection: KnexPgConnectionConfig | PgConnectionConfig,
  applicationName?: string,
): PgConnectionConfig {
  const {
    connectionString,
    host: hostConfig,
    port: portConfig,
    user: userConfig,
    password: passConfig,
    database: baseConfig,
    schema: schemaConfig,
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
    schema:
      schemaConfig ||
      connectionUrl?.searchParams.get('currentSchema') ||
      DEFAULT_SCHEMA,
    user: userConfig || connectionUrl?.username,
  });
}

/**
 * Формирует и возвращает конфиг подключения к БД
 */
export function pgClientConfig(
  config: PgKnexConfig | PgClientConfig,
): PgClientConfig {
  const { connection: confConnection, applicationName } = config;

  const connection = prepareConnection(confConnection, applicationName);

  return { ...config, connection, searchPath: connection.schema };
}
