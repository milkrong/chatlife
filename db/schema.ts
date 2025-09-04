import { pgSchema, uuid, text, jsonb, timestamp, integer, bigserial, vector } from 'drizzle-orm/pg-core';

const app = pgSchema('app');

export const users = app.table('users', {
  uid: uuid('uid').primaryKey(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  locale: text('locale').default('en'),
  tz: text('tz').default('Asia/Singapore'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const runs = app.table('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerUid: uuid('owner_uid').notNull(),
  universe: text('universe').notNull(),
  seedProfile: jsonb('seed_profile').notNull(),
  state: jsonb('state').default('{}'),
  version: text('version').default('v1'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const chats = app.table('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull(),
  title: text('title'),
  stage: text('stage'),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = app.table('messages', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  chatId: uuid('chat_id').notNull(),
  role: text('role'),
  content: text('content').notNull(),
  meta: jsonb('meta'),
  tokensIn: integer('tokens_in').default(0),
  tokensOut: integer('tokens_out').default(0),
  llmModel: text('llm_model'),
  status: text('status').default('complete'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const npcs = app.table('npcs', {
  id: uuid('id').primaryKey().defaultRandom(),
  universe: text('universe').notNull(),
  archetype: text('archetype').notNull(),
  persona: jsonb('persona').notNull(),
  memoryVec: vector('memory_vec', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const templates = app.table('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  universe: text('universe').notNull(),
  version: text('version').notNull(),
  checksum: text('checksum'),
  files: jsonb('files'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const relationships = app.table('relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull(),
  subjectType: text('subject_type').notNull(),
  subjectId: uuid('subject_id').notNull(),
  intimacy: integer('intimacy').default(0),
  trust: integer('trust').default(0),
  conflict: integer('conflict').default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});
