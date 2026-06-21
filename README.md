<div align="center">
    <img src="./client/public/img/survev_logo_full.png" alt="Survev logo" style="height: 200px;">
</div>
<hr />
<div align="center">
    <img src="https://img.shields.io/badge/node.js%20-%235FA04E.svg?style=for-the-badge&logo=nodedotjs&logoColor=white">
    <img src="https://img.shields.io/badge/typescript-%233178C6?style=for-the-badge&logo=typescript&logoColor=white">
    <img src="https://img.shields.io/badge/hono-%23E36002.svg?style=for-the-badge&logo=hono&logoColor=white">
    <img src="https://img.shields.io/badge/jquery-%230769AD.svg?style=for-the-badge&logo=jquery&logoColor=white">
    <img src="https://img.shields.io/badge/drizzle-%23C5F74F?style=for-the-badge&logo=drizzle&logoColor=black">
    <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white">
</div>
<br />
<div align="center">
    Open-source recreation of 2D top-down battle royale <a href="surviv.io">surviv.io</a>.
</div>
<br />

## Development
Start the client dev server using `pnpm dev:client` and API / game servers with `pnpm dev:server`,  
or traverse into client and server directories individually to run `pnpm dev` in each.

### Accounts
Accounts are optional. You can set `accountsEnabled` to `false` in `config.ts` to disable them.  
If disabled, you can skip the steps below.

First generate a private key and set encryptLoadoutSecret to it, this is used to encrypt loadouts.
```sh
openssl rand -base64 10
```

After installing [PostgreSQL](https://www.postgresql.org), start the service and create a database:
```sh
sudo -u postgres initdb --locale=C.UTF-8 --encoding=UTF8 -D /var/lib/postgres/data --data-checksums

systemctl enable --now postgresql.service

sudo -u postgres createuser survev
sudo -u postgres createdb survev -O survev
```

Then populate the database with the schema:
```sh
cd server

# Run this everytime you make changes to schema.ts.
pnpm run db:generate
pnpm run db:migrate

# Start the server
pnpm run dev
# or
# pnpm run dev:api
# pnpm run dev:game
```

To interact with the database through an interface:
```sh
pnpm run db:studio 
```

To wipe the database and start over:
```sh
# Set database permissions.
sudo -u postgres psql -c "ALTER USER survev WITH PASSWORD 'survev';"

# Wipe database.
pnpm run db:wipe
```

**NOTE:** Do not run this in production!

### Caching
Caching is disabled by default. Set `cachingEnabled` to `true` in `config.ts` to use it.

Install [Redis](https://redis.io):
```sh
sudo apt install redis-server
```

Ensure Redis starts on boot and is running:
```sh
systemctl enable --now redis-server
```

## Production
See [HOSTING.md](./HOSTING.md)
