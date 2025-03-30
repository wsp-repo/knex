import { pgClientConfig, pgKnexFactory } from '../factory';
import { prepareDatabase } from './database';
import { prepareUsers } from './users';

import { MigratorConfig } from '../../common/types';
import { PgKnexConfig } from '../types';

export async function pgMigrateUp(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);

  await prepareDatabase(clientConfig, migratorConfig);
  await prepareUsers(clientConfig, migratorConfig);

  const knexClient = pgKnexFactory(clientConfig);

  await knexClient.migrate.up(migratorConfig);
}

export async function pgMigrateLatest(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);

  await prepareDatabase(clientConfig, migratorConfig);
  await prepareUsers(clientConfig, migratorConfig);

  const knexClient = pgKnexFactory(clientConfig);

  await knexClient.migrate.latest(migratorConfig);
}

export async function pgMigrateDown(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);
  const knexClient = pgKnexFactory(clientConfig);

  await knexClient.migrate.down(migratorConfig);
}
