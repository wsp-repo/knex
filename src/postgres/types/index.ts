import { ClientConfig, ConnectionClients } from '../../common/types/clients';

import { KnexPgConnectionConfig } from './configs';

export type PgKnexConfig = ClientConfig<
  ConnectionClients.Postgres,
  KnexPgConnectionConfig
>;
