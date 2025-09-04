# chatlife

Backend for LifeChat built on Supabase.

## Supabase Setup

- Initialize and link your project with `supabase init` and `supabase link --project-ref <PROJECT_REF>`.
- Apply schema from `supabase/seed/001_init.sql` using `supabase db push`.
- Deploy edge functions with `supabase functions deploy`, e.g. `wechat-login` for WeChat authentication.

## Drizzle ORM

Use [Drizzle ORM](https://orm.drizzle.team/) to query the Supabase database.
Set `SUPABASE_DB_URL` to your project's connection string and import the client:

```ts
import { db, users } from './db/client';

const result = await db.select().from(users);
```
