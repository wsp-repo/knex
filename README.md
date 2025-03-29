# Package @zalib/knex

## Getting started

```
npm i @zalib/knex
```

## Use migration methods

**package.json**

```
  ...
  "scripts": {
    ...
    "migrate:down": "node migrations.js down",
    "migrate:latest": "node migrations.js latest",
    "migrate:up": "node migrations.js up",
    ...
  },
```

**migrations.js**

```
const {
  MigratorConfig,
  UserLevels
} = require('@zalib/knex');
const {
  PgKnexConfig,
  migrateLatest,
  migrateDown,
  migrateUp,
} = require('@zalib/knex/postgres');

function getKnexConfig(): PgKnexConfig {
  return {
    applicationName: 'appName',
    connection: { ... },
    ...
  };
}

function getMigratorConfig(): MigratorConfig {
  // пользователи, могут отсутствовать
  const users = [
    { username: '...', password: '...', level: [UserLevels.Full] },
    { username: '...', password: '...', level: [UserLevels.Write] },
    { username: '...', password: '...', level: [UserLevels.Read] },
    { username: '...', password: '...', level: [UserLevels.None] },
  ];

  return { ..., users };
}

async function migrate() {
  const knexConfig = getKnexConfig();
  const migratorConfig = getMigratorConfig();

  try {
    switch (process.argv[2]) {
      case 'up':
        await migrateUp(knexConfig, migratorConfig);
        break;
      case 'latest':
        await migrateLatest(knexConfig, migratorConfig);
        break;
      case 'down':
        await migrateDown(knexConfig, migratorConfig);
        break;
      default:
        throw new Error('Unknown operation');
    }
  } catch (error) {
    console.error(error);

    process.exit(1);
  }

  process.exit(0);
}

migrate();
```
