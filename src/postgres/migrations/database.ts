import { rawQuery } from '../../common/helpers';
import { pgKnexFactory } from '../factory';

import { MigratorConfig } from '../../common/types';

import { PgClientConfig } from '../types/configs';

/**
 * Создает БД, если ее не существует
 */
async function createDatabaseIfNotExists(
  clientConfig: PgClientConfig,
): Promise<void> {
  const { database, ...connection } = clientConfig.connection;

  if (!database) throw new Error('Empty database');

  const knex = pgKnexFactory({ ...clientConfig, connection });

  const dbData = await knex('pg_catalog.pg_database')
    .where('datname', database)
    .first('*');

  if (!dbData) await rawQuery(knex, 'CREATE DATABASE ??;', [database]);

  await knex.destroy();
}

/**
 * Создает схему, если ее не существует
 */
async function createSchemaIfNotExists(
  clientConfig: PgClientConfig,
  schemaName?: string,
): Promise<void> {
  if (!schemaName) return;

  const knex = pgKnexFactory(clientConfig);

  await rawQuery(knex, 'CREATE SCHEMA IF NOT EXISTS ??;', [schemaName]);

  await knex.destroy();
}

/**
 * Проводит подготовку БД и схемы
 */
export async function prepareDatabase(
  clientConfig: PgClientConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  await createDatabaseIfNotExists(clientConfig);
  await createSchemaIfNotExists(clientConfig, clientConfig.searchPath);
  await createSchemaIfNotExists(clientConfig, migratorConfig.schemaName);
}
