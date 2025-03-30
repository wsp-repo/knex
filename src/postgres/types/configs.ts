import { Knex } from 'knex';

import { ClientConfig, ConnectionClients } from '../../common/types/clients';

export type KnexPgConnectionConfig = Knex.PgConnectionConfig & {
  schema?: string;
};

/* prettier-ignore */
export type PgConnectionConfig =
  & Omit<KnexPgConnectionConfig, 'host' | 'port' | 'schema' | 'connectionUrl'>
  & Required<Pick<KnexPgConnectionConfig, 'host' | 'port' | 'schema'>>;

export type PgClientConfig = ClientConfig<
  ConnectionClients.Postgres,
  PgConnectionConfig
> & { searchPath: string };
