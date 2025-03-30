import { pgClientConfig, pgKnexFactory } from '../factory';
import { prepareDatabase } from './database';
import { prepareUsers } from './users';

import { MigratorConfig } from '../../common/types';
import { PgKnexConfig } from '../types';

import { PgClientConfig } from '../types/configs';

/**
 * Возвращает конфиг для миграций
 */
function getKnexConfig(
  clientConfig: PgClientConfig,
  migratorConfig: MigratorConfig,
): PgClientConfig {
  const { users, ...migrations } = migratorConfig;

  return { ...clientConfig, migrations };
}

/**
 * Метод для выполнения одной миграции
 */
export async function pgMigrateUp(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);
  const config = getKnexConfig(clientConfig, migratorConfig);

  await prepareDatabase(clientConfig, migratorConfig);
  await prepareUsers(clientConfig, migratorConfig);

  await pgKnexFactory(config).migrate.up();
}

/**
 * Метод для выполнения всех миграций
 */
export async function pgMigrateLatest(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);
  const config = getKnexConfig(clientConfig, migratorConfig);

  await prepareDatabase(clientConfig, migratorConfig);
  await prepareUsers(clientConfig, migratorConfig);

  await pgKnexFactory(config).migrate.latest();
}

/**
 * Метод для отката одной миграции
 */
export async function pgMigrateDown(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);
  const config = getKnexConfig(clientConfig, migratorConfig);

  await pgKnexFactory(config).migrate.down();
}
