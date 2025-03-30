import { Knex } from 'knex';

export enum ConnectionClients {
  Postgres = 'pg',
}

/* prettier-ignore */
export type ClientConfig<Client extends ConnectionClients, Connection> =
  & Omit<Knex.Config, 'connection' | 'client'>
  & {
    applicationName: string;
    client: Client;
    connection: Connection;
  };
