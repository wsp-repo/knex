import { Knex } from 'knex';

import { rawQuery } from '../../common/helpers';
import { pgKnexFactory } from '../factory';

import { MigratorConfig, UserConfig, UserLevels } from '../../common/types';

import { PgClientConfig } from '../types/configs';

const ENTITIES = ['TABLES', 'SEQUENCES', 'FUNCTIONS'];

/**
 * Создает безопасную функцию-хелпер для выполнения RAW-запроса
 */
function createSafeRawExecutor(
  knex: Knex,
  binds: unknown[],
): (sqlString: string) => Promise<void> {
  return async (sqlString: string) => {
    await rawQuery(knex, sqlString, binds).catch((error: Error) =>
      console.warn(`Error ${sqlString}: ${error.message}`),
    );
  };
}

/**
 * Создает роль и задает указанный пароль
 */
async function createRoleIfNotExists(
  knex: Knex,
  username: string,
  password: string,
): Promise<void> {
  try {
    await rawQuery(knex, 'CREATE ROLE ?? LOGIN PASSWORD ?;', [
      username,
      password,
    ]);
  } catch (error) {
    console.warn(`Create role error: ${error.message}`);
  }

  try {
    await rawQuery(knex, 'ALTER USER ?? WITH PASSWORD ?;', [
      username,
      password,
    ]);
  } catch (error) {
    console.warn(`Alter password error: ${error.message}`);
  }
}

/**
 * Отзывает у роли все права на схему
 */
async function revokeRoleAllPrivileges(
  knex: Knex,
  username: string,
  schema: string,
): Promise<void> {
  const execQuery = createSafeRawExecutor(knex, [schema, username]);

  for (const entity of ENTITIES) {
    await execQuery(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA ?? REVOKE ALL PRIVILEGES ON ${entity} FROM ?? CASCADE;`,
    );
    await execQuery(
      `REVOKE ALL PRIVILEGES ON ALL ${entity} IN SCHEMA ?? FROM ?? CASCADE;`,
    );
  }

  await execQuery('REVOKE ALL PRIVILEGES ON SCHEMA ?? FROM ?? CASCADE;');
}

/**
 * Назначает роли полные права на схему
 */
async function grantRoleFullPrivileges(
  knex: Knex,
  username: string,
  schema: string,
): Promise<void> {
  const execQuery = createSafeRawExecutor(knex, [schema, username]);

  await execQuery('GRANT ALL ON SCHEMA ?? TO ?? WITH GRANT OPTION;');

  for (const entity of ENTITIES) {
    await execQuery(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA ?? GRANT ALL ON ${entity} TO ?? WITH GRANT OPTION;`,
    );
    await execQuery(
      `GRANT ALL ON ALL ${entity} IN SCHEMA ?? TO ?? WITH GRANT OPTION;`,
    );
  }
}

/**
 * Назначает роли базовые права на служебные сущности схемы
 */
async function grantRoleBasePrivileges(
  knex: Knex,
  username: string,
  schema: string,
): Promise<void> {
  const execQuery = createSafeRawExecutor(knex, [schema, username]);

  await execQuery(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA ?? GRANT SELECT, USAGE ON SEQUENCES TO ??;',
  );
  await execQuery(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA ?? GRANT EXECUTE ON FUNCTIONS TO ??;',
  );

  await execQuery('GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA ?? TO ??;');
  await execQuery('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ?? TO ??;');
}

/**
 * Назначает права на изменение данных в таблицах схемы
 */
async function grantRoleWritePrivileges(
  knex: Knex,
  username: string,
  schema: string,
): Promise<void> {
  const execQuery = createSafeRawExecutor(knex, [schema, username]);

  await grantRoleBasePrivileges(knex, username, schema);

  await execQuery(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA ?? GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO ??;',
  );
  await execQuery(
    'GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA ?? TO ??;',
  );
}

/**
 * Назначает права на чтение данных из таблиц схемы
 */
async function grantRoleReadPrivileges(
  knex: Knex,
  username: string,
  schema: string,
): Promise<void> {
  const execQuery = createSafeRawExecutor(knex, [schema, username]);

  await grantRoleBasePrivileges(knex, username, schema);

  await execQuery(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA ?? GRANT SELECT ON TABLES TO ??;',
  );
  await execQuery('GRANT SELECT ON ALL TABLES IN SCHEMA ?? TO ??;');
}

/**
 * Обновляет полномочия роли
 */
async function updateRolePrivileges(
  knex: Knex,
  user: UserConfig,
  schema: string,
): Promise<void> {
  const { level, username } = user;

  await revokeRoleAllPrivileges(knex, username, schema);

  switch (level) {
    case UserLevels.Full:
      await grantRoleFullPrivileges(knex, username, schema);
      break;
    case UserLevels.Write:
      await grantRoleWritePrivileges(knex, username, schema);
      break;
    case UserLevels.Read:
      await grantRoleReadPrivileges(knex, username, schema);
      break;
  }
}

/**
 * Проводит подготовку пользователей
 */
export async function prepareUsers(
  clientConfig: PgClientConfig,
  migratorConfig: MigratorConfig,
): Promise<void> {
  const { users } = migratorConfig;

  if (!users?.length) return;

  const { connection, searchPath } = clientConfig;
  const { database, user: currentUser } = connection;

  if (!database) throw new Error('Empty database');

  const knex = pgKnexFactory(clientConfig);

  await Promise.all(
    users.map(async (user) => {
      const { password, username } = user;

      // изменять роль текущего подключения нельзя
      if (currentUser === user.username) return;

      await createRoleIfNotExists(knex, username, password);
      await updateRolePrivileges(knex, user, searchPath);
    }),
  );

  await knex.destroy();
}
