# Simple Workout Tracker

## Prod Data Sync Workflow

Bring a copy of the live workout/plan data into your local database without ever risking writes to production.

### 1. Environment variables

Start from `.env.example` and set the following in your real `.env`:

- `PROD_RO_DATABASE_URL` – **must** be a read-only Postgres role that can access the production data. The export script refuses to run if this host looks local.
- `SEED_EXPORT_PATH` – where the JSON snapshot should live (relative paths are resolved from the repo root, e.g. `./backups/prod-seed.json`).

### 2. Export from production

```bash
npm run pull:prod-data
```

What happens:

- Prisma is pointed at `PROD_RO_DATABASE_URL`.
- The session is set to `READ ONLY` inside a single transaction so no mutations are possible.
- All workout-related tables (`Exercise`, `Workout`, `Plan`, `Mesocycle`, instances, sets, adjustments) are written to the JSON file at `SEED_EXPORT_PATH`—without copying any user rows.

### 3. Seed your local database

```bash
npm run db:seed:prod
```

This runs `prisma db seed`, which:

1. Loads the JSON snapshot from `SEED_EXPORT_PATH`.
2. Clears the dependent tables locally in FK-safe order.
3. Creates a fresh default “Seeded Demo User” and rewrites every user-owned record to point to that user so no production identities are stored locally.
4. Re-inserts the exported rows (preserving IDs/timestamps) inside a single transaction.
5. Resets every serial sequence so future inserts keep auto-incrementing correctly.
6. Verifies `DATABASE_URL` points to a local host (e.g., `localhost`, `127.0.0.1`, `.local`) and aborts if `NODE_ENV=production`, so it can never touch the production database.

⚠️ Never point `DATABASE_URL` (or this seed command) at production. The script deletes data before inserting, so it is for local/dev environments only.

### Troubleshooting

- **Missing env vars** – both `PROD_RO_DATABASE_URL` and `SEED_EXPORT_PATH` are required; the scripts will exit with an explicit error if they're absent.
- **Stale snapshot** – rerun `npm run pull:prod-data` whenever you need fresh content, then seed again.
- **Permission errors** – ensure the prod role truly is read-only but still allowed to `SELECT` every exported table.
- **Sequence mismatch** – if you interrupt the seed midway, just rerun `npm run db:seed:prod`; the script always clears + reseeds + resets sequences.

