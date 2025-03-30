import { trimObject } from '@zalib/core/dist';

import { pgClientConfig, pgKnexFactory } from '../factory';
import { prepareDatabase } from './database';
import { prepareUsers } from './users';

import { MigratorConfig } from '../../common/types';
import { PgKnexConfig } from '../types';

import { PgClientConfig } from '../types/configs';

function getKnexConfig(
  clientConfig: PgClientConfig,
  migratorConfig: MigratorConfig,
): PgClientConfig {
  const { users, ...migrations } = migratorConfig;
  const searchPath = migrations.schemaName;

  /* prettier-ignore */
  return trimObject(
    { ...clientConfig, migrations, searchPath },
    true,
  );
}

export async function pgMigrateUp(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);

  await prepareDatabase(clientConfig, migratorConfig);
  await prepareUsers(clientConfig, migratorConfig);

  const config = getKnexConfig(clientConfig, migratorConfig);
  const knexClient = pgKnexFactory(config);

  await knexClient.migrate.up();
}

export async function pgMigrateLatest(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);

  await prepareDatabase(clientConfig, migratorConfig);
  await prepareUsers(clientConfig, migratorConfig);

  const config = getKnexConfig(clientConfig, migratorConfig);
  const knexClient = pgKnexFactory(config);

  await knexClient.migrate.latest();
}

export async function pgMigrateDown(
  knexConfig: PgKnexConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const clientConfig = pgClientConfig(knexConfig);

  const config = getKnexConfig(clientConfig, migratorConfig);
  const knexClient = pgKnexFactory(config);

  await knexClient.migrate.down();
}
