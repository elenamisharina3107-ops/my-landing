# Шаблон админ-панели для сайтов — план реализации (MVP)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать переиспользуемый шаблон сайта на Next.js со встроенной админ-панелью: контент описывается файлом-схемой, панель рисует форму сама, клиент правит тексты/цены/картинки/списки, есть черновик→предпросмотр→публикация, история версий с откатом, загрузка картинок, экспорт, фирменный вид.

**Architecture:** Один Next.js-проект (App Router) = публичный сайт + панель под `/admin` + API. Контент и версии — в Postgres (Neon). Картинки — Vercel Blob (загрузка из браузера напрямую). Вход — Auth.js (email+пароль), две роли. Форма панели генерируется из `content.schema.json`. Сайт рендерится на сервере из опубликованной версии контента; в режиме черновика — из черновика. Разворачивается на аккаунтах клиента (Vercel + Neon + Blob + домен Beget).

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS, Drizzle ORM + Neon Postgres, `@vercel/blob` (client uploads), `sharp` (обработка картинок), Auth.js v5 (Credentials + Drizzle adapter, DB-сессии), `bcryptjs`, react-hook-form, Tiptap (rich text), `zod` (валидация схемы), `jszip` (экспорт), Vitest (юнит/интеграция), Playwright (e2e).

## Global Constraints

- **Node.js ≥ 20**, пакетный менеджер — `npm`.
- **TypeScript strict mode** включён; никакого `any` в `src/schema`, `src/content`, `src/auth`.
- **Загрузка файла через серверный роут ограничена 4.5 МБ на Vercel** — картинки грузятся из браузера напрямую в Blob через client-upload flow, серверный роут только выдаёт токен и обрабатывает callback.
- **Машинное имя поля (`key`) клиенту не показывается никогда** — только `label` и `hint`.
- **Скрытое условием поле не участвует в проверке `required`** — это делает движок, а не автор схемы.
- **Все подписи, подсказки, кнопки и сообщения об ошибках в панели — на русском.**
- **Порядок полей в форме строго равен порядку в `content.schema.json`.** Никакой сортировки.
- **Контент хранится и экспортируется как человекочитаемый JSON**, без проприетарных форматов.
- **Коммит после каждого шага «тесты зелёные»**, формат сообщения: `feat: …` / `test: …` / `chore: …`.
- Ветка разработки: `agent/admin-panel-mvp` (проект в `~/projects/**` → фичи в отдельной ветке).

## Границы этого плана

Полностью детализированы **этапы 0–3** — это законченный сквозной продукт: рабочая панель + рабочий сайт + полный цикл правка→публикация→откат→экспорт, проверяемый одним e2e-тестом (Задача 3.5).

**Этапы 4–5** (превращение в тиражируемый шаблон и боевой пилот на реальном сайте) даны списком задач без пошаговой детализации — их детальный план пишется отдельно, когда появится конкретный пилотный сайт, потому что многое зависит от его вёрстки.

---

## File Structure

```
admin-panel-template/
├── content.schema.json        # определения полей сайта (в шаблоне — пример)
├── content.seed.json          # начальный контент сайта
├── src/branding.ts            # per-site: логотип клиента, имя студии, URL поддержки
├── src/schema/
│   ├── types.ts               # TS-типы схемы и контента
│   ├── validate.ts            # zod-схема самого файла схемы
│   ├── load.ts                # loadSchema(): чтение + валидация + resolve $components
│   ├── conditions.ts          # evaluateCondition(cond, data): boolean
│   └── content-validate.ts    # validateContent(schema, data): FieldError[]
├── src/db/
│   ├── index.ts               # drizzle-клиент
│   ├── tables.ts              # таблицы
│   └── migrations/            # сгенерированные миграции
├── src/content/
│   ├── versions.ts            # getOrCreateDraft, saveDraft, publish, listVersions, restoreVersion
│   ├── read.ts                # getPublished, getDraft, getContent(key, mode)
│   └── export.ts              # buildExportZip
├── src/auth/
│   ├── config.ts              # конфиг Auth.js
│   ├── password.ts            # hashPassword, verifyPassword
│   ├── guard.ts               # requireUser, getCurrentUser
│   └── users.ts               # createUser, listUsers, setPassword, deleteUser
├── src/media/
│   ├── process.ts             # sharp: resize + compress → webp
│   └── upload.ts              # handleClientUpload (callback от Blob)
├── src/components/
│   ├── fields/                # Text, Longtext, Richtext, Number, Boolean, Url, Select, Image, List, Group
│   ├── FormRenderer.tsx       # рендер секции схемы
│   ├── PublishBar.tsx         # баннер «неопубликованные изменения» + кнопка
│   └── VersionDiff.tsx
├── src/content-map.ts         # content("hero.title") — чтение в компонентах сайта
├── src/app/
│   ├── page.tsx               # публичный сайт
│   ├── (site)/                # секции/компоненты сайта
│   ├── admin/
│   │   ├── layout.tsx         # оболочка панели (шапка с брендом, навигация, поддержка)
│   │   ├── page.tsx           # «С чего начать»
│   │   ├── login/page.tsx
│   │   ├── change-password/page.tsx
│   │   ├── edit/[section]/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── history/page.tsx
│   │   ├── users/page.tsx
│   │   └── api/{save,autosave,publish,restore,export,upload}/route.ts
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       └── preview/route.ts
├── scripts/provision.ts       # создать владельца + залить seed-контент
├── docs/handover/             # чек-листы приёмки, границы поддержки, план видео
└── tests/{unit,e2e}/
```

---

## Этап 0 — Каркас

### Task 0.1: Инициализация проекта

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces: рабочие команды `npm run dev`, `npm test` (Vitest), `npm run e2e` (Playwright), `npm run build`.

- [ ] **Step 1: Создать Next.js-приложение**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --use-npm
```

- [ ] **Step 2: Добавить зависимости**

```bash
npm i drizzle-orm @neondatabase/serverless @vercel/blob next-auth@beta bcryptjs zod react-hook-form @tiptap/react @tiptap/starter-kit @tiptap/extension-link isomorphic-dompurify jszip sharp
npm i -D drizzle-kit vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test @types/bcryptjs tsx
```

- [ ] **Step 3: Настроить Vitest**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./tests/setup.ts"], include: ["tests/unit/**/*.test.{ts,tsx}"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"e2e": "playwright test"`, `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`.

- [ ] **Step 4: Пустой тест — убедиться, что раннер работает**

Create `tests/unit/smoke.test.ts`:

```ts
import { expect, test } from "vitest";
test("раннер работает", () => { expect(1 + 1).toBe(2); });
```

Run: `npm test` → Expected: PASS (1 passed).

- [ ] **Step 5: Проверить сборку и запуск**

Run: `npm run build` → Expected: успешная сборка. Run: `npm run dev`, открыть `http://localhost:3000` → Expected: страница отдаётся.

- [ ] **Step 6: Commit**

```bash
git checkout -b agent/admin-panel-mvp
git add -A && git commit -m "chore: инициализация Next.js + Vitest + Playwright"
```

---

### Task 0.2: Конфигурация окружения и Drizzle

**Files:**
- Create: `drizzle.config.ts`, `src/db/index.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `db` — экземпляр drizzle (`import { db } from "@/db"`).

- [ ] **Step 1: `.env.example`**

```
DATABASE_URL=postgres://user:pass@host/db
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
AUTH_SECRET=generate-with-openssl-rand-base64-33
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/tables.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 3: `src/db/index.ts`**

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as tables from "./tables";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema: tables });
```

- [ ] **Step 4: Локальная БД для тестов**

Завести бесплатную Neon-ветку для разработки, положить строку в `.env.local` (в `.gitignore`). Проверить: `node -e "require('dotenv').config({path:'.env.local'}); const {neon}=require('@neondatabase/serverless'); neon(process.env.DATABASE_URL)\`select 1\`.then(r=>console.log(r))"` → Expected: `[ { '?column?': 1 } ]`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: конфиг окружения и drizzle-клиент"
```

---

### Task 0.3: Таблицы БД и первая миграция

**Files:**
- Create: `src/db/tables.ts`
- Test: `tests/unit/db.test.ts`

**Interfaces:**
- Produces:
  - `users` { id: uuid, email: text unique, passwordHash: text, role: `'owner'|'editor'`, mustChangePassword: boolean, createdAt: timestamp }
  - `contentVersions` { id: uuid, data: jsonb, authorId: uuid|null, createdAt: timestamp, status: `'draft'|'published'`, autosave: boolean, note: text|null }
  - `siteState` { id: int pk=1, publishedVersionId: uuid|null, draftVersionId: uuid|null }
  - `sessions`, `accounts`, `verificationTokens` — для Auth.js Drizzle-адаптера.

- [ ] **Step 1: Написать `src/db/tables.ts`**

```ts
import { pgTable, uuid, text, boolean, timestamp, jsonb, integer, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "editor"] }).notNull().default("editor"),
  mustChangePassword: boolean("must_change_password").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentVersions = pgTable("content_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  data: jsonb("data").notNull(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  autosave: boolean("autosave").notNull().default(false),
  note: text("note"),
});

export const siteState = pgTable("site_state", {
  id: integer("id").primaryKey().default(1),
  publishedVersionId: uuid("published_version_id").references(() => contentVersions.id),
  draftVersionId: uuid("draft_version_id").references(() => contentVersions.id),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
}, (a) => ({ pk: primaryKey({ columns: [a.provider, a.providerAccountId] }) }));

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }));
```

- [ ] **Step 2: Сгенерировать и применить миграцию**

Run: `npm run db:generate` → создаётся `src/db/migrations/0000_*.sql`. Run: `npm run db:migrate` → Expected: применено без ошибок.

- [ ] **Step 3: Написать проверочный тест**

Create `tests/unit/db.test.ts`:

```ts
import { expect, test, afterAll } from "vitest";
import { db } from "@/db";
import { users } from "@/db/tables";
import { eq } from "drizzle-orm";

test("вставка и чтение пользователя", async () => {
  const email = `t_${Date.now()}@example.com`;
  await db.insert(users).values({ email, passwordHash: "x" });
  const [row] = await db.select().from(users).where(eq(users.email, email));
  expect(row.role).toBe("editor");
  expect(row.mustChangePassword).toBe(true);
  await db.delete(users).where(eq(users.email, email));
});
```

- [ ] **Step 4: Прогнать тест**

Run: `npm test tests/unit/db.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: таблицы БД + первая миграция"
```

---

### Task 0.4: Типы схемы и валидатор файла схемы

**Files:**
- Create: `src/schema/types.ts`, `src/schema/validate.ts`
- Test: `tests/unit/schema-validate.test.ts`

**Interfaces:**
- Produces:
  - Типы: `FieldType = 'text'|'longtext'|'richtext'|'number'|'boolean'|'url'|'select'|'image'|'list'|'group'`
  - `Field` { key: string; type: FieldType; label: string; hint?: string; required?: boolean; maxLength?: number; options?: {value:string;label:string}[]; item?: Field[]; itemLabel?: string; use?: string; showWhen?: Condition }
  - `Condition` { field: string; equals: string|number|boolean }
  - `Section` { id: string; title: string; fields: Field[] }
  - `SiteSchema` { site: string; components?: Record<string, Field[]>; sections: Section[] }
  - `schemaFileSchema: z.ZodType<SiteSchema>` — zod-валидатор.
  - `parseSchemaFile(raw: unknown): SiteSchema` — бросает `ZodError` при несоответствии.

- [ ] **Step 1: Написать тест**

Create `tests/unit/schema-validate.test.ts`:

```ts
import { expect, test } from "vitest";
import { parseSchemaFile } from "@/schema/validate";

const valid = {
  site: "Демо",
  sections: [{ id: "hero", title: "Первый экран", fields: [
    { key: "hero.title", type: "text", label: "Заголовок", required: true, maxLength: 80 },
  ]}],
};

test("корректная схема проходит", () => {
  expect(parseSchemaFile(valid).sections[0].fields[0].key).toBe("hero.title");
});

test("неизвестный тип поля — ошибка", () => {
  const bad = structuredClone(valid);
  (bad.sections[0].fields[0] as any).type = "magic";
  expect(() => parseSchemaFile(bad)).toThrow();
});

test("список без item — ошибка", () => {
  const bad = { site: "x", sections: [{ id: "s", title: "S", fields: [
    { key: "s.items", type: "list", label: "Список" },
  ]}]};
  expect(() => parseSchemaFile(bad)).toThrow(/item/i);
});
```

- [ ] **Step 2: Прогнать — падает**

Run: `npm test tests/unit/schema-validate.test.ts` → Expected: FAIL (`parseSchemaFile` не найден).

- [ ] **Step 3: Реализовать `types.ts` и `validate.ts`**

`src/schema/validate.ts` — zod-схема с `z.lazy` для рекурсивного `item`, `superRefine`: если `type==='list'` то `item` обязателен; если `type==='select'` то `options` обязателен; если `type==='group'` то ровно одно из `item`/`use`. `parseSchemaFile` = `schemaFileSchema.parse(raw)`. Экспортировать выведенные типы в `types.ts` через `z.infer` либо описать вручную (strict).

- [ ] **Step 4: Прогнать — проходит**

Run: `npm test tests/unit/schema-validate.test.ts` → Expected: PASS (3 passed).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: типы схемы контента и валидатор файла схемы"
```

---

### Task 0.5: `loadSchema()` — чтение файла и resolve `$components`

**Files:**
- Create: `src/schema/load.ts`, `content.schema.json` (пример)
- Test: `tests/unit/schema-load.test.ts`

**Interfaces:**
- Consumes: `parseSchemaFile` (Task 0.4).
- Produces:
  - `loadSchema(path?: string): SiteSchema` — читает JSON (по умолчанию `content.schema.json` в корне), валидирует, **раскрывает `use`**: каждое поле `{ type: 'group', use: 'seo' }` заменяется на `{ type: 'group', item: components.seo }`. Бросает при неизвестном `use`.
  - `flattenFields(section: Section): Field[]` — рекурсивно собирает все листовые поля секции (для валидации/чтения), разворачивая `group`; `list` не разворачивает (это массив).

- [ ] **Step 1: Написать тест**

```ts
import { expect, test } from "vitest";
import { loadSchema, flattenFields } from "@/schema/load";
import { writeFileSync, rmSync } from "node:fs";

test("resolve $components через use", () => {
  const file = `/tmp/s_${Date.now()}.json`;
  writeFileSync(file, JSON.stringify({
    site: "x",
    components: { seo: [{ key: "seo.title", type: "text", label: "SEO заголовок" }] },
    sections: [{ id: "p", title: "Страница", fields: [{ type: "group", use: "seo", key: "seo", label: "SEO" }] }],
  }));
  const s = loadSchema(file);
  expect(s.sections[0].fields[0].item?.[0].key).toBe("seo.title");
  rmSync(file);
});

test("неизвестный use — ошибка", () => {
  const file = `/tmp/s2_${Date.now()}.json`;
  writeFileSync(file, JSON.stringify({ site: "x", sections: [{ id: "p", title: "P", fields: [{ type: "group", use: "missing", key: "g", label: "G" }] }] }));
  expect(() => loadSchema(file)).toThrow(/missing/);
  rmSync(file);
});
```

- [ ] **Step 2: Прогнать — падает.** Run: `npm test tests/unit/schema-load.test.ts` → FAIL.

- [ ] **Step 3: Реализовать `load.ts`** (readFileSync + JSON.parse + parseSchemaFile + рекурсивный проход по секциям, замена `use`). Создать `content.schema.json` в корне с примером из `ARCHITECTURE.md` (hero, услуги-список, цены-список, FAQ, контакты, секция `settings`, компонент `seo`).

- [ ] **Step 4: Прогнать — проходит.** Run: `npm test tests/unit/schema-load.test.ts` → PASS.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: loadSchema + resolve переиспользуемых фрагментов"`

---

### Task 0.6: `evaluateCondition()` — условные поля

**Files:**
- Create: `src/schema/conditions.ts`
- Test: `tests/unit/conditions.test.ts`

**Interfaces:**
- Produces:
  - `getByPath(data: unknown, path: string): unknown` — читает `"a.b.c"` из объекта.
  - `evaluateCondition(cond: Condition | undefined, data: Record<string, unknown>): boolean` — `undefined` → `true`; иначе `getByPath(data, cond.field) === cond.equals`.
  - `isFieldVisible(field: Field, data): boolean` — обёртка над `evaluateCondition(field.showWhen, data)`.

- [ ] **Step 1: Тест**

```ts
import { expect, test } from "vitest";
import { evaluateCondition, getByPath } from "@/schema/conditions";

test("нет условия → видимо", () => { expect(evaluateCondition(undefined, {})).toBe(true); });
test("равенство выполнено", () => {
  expect(evaluateCondition({ field: "hero.hasButton", equals: true }, { hero: { hasButton: true } })).toBe(true);
});
test("равенство не выполнено", () => {
  expect(evaluateCondition({ field: "hero.hasButton", equals: true }, { hero: { hasButton: false } })).toBe(false);
});
test("getByPath по отсутствующему пути → undefined", () => {
  expect(getByPath({}, "a.b")).toBeUndefined();
});
```

- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `conditions.ts`.
- [ ] **Step 4: Прогнать — проходит.** → PASS (4 passed).
- [ ] **Step 5: Commit.** `git commit -m "feat: вычисление условных полей"`

---

### Task 0.7: `validateContent()` — проверка контента по схеме

**Files:**
- Create: `src/schema/content-validate.ts`
- Test: `tests/unit/content-validate.test.ts`

**Interfaces:**
- Consumes: `loadSchema`/`Section` types (0.5), `isFieldVisible` (0.6).
- Produces:
  - `FieldError` { key: string; message: string }
  - `validateContent(schema: SiteSchema, data: Record<string, unknown>): FieldError[]` — по всем секциям и полям:
    - если поле не видимо по `showWhen` → пропустить целиком;
    - `required` и значение пусто (`undefined`/`""`/`[]`) → `"Заполните поле «<label>»"`;
    - `maxLength` превышен → `"«<label>»: не больше <maxLength> символов"`;
    - `type==='url'` и значение не пустое и не матчит `/^https?:\/\//` → `"«<label>»: ссылка должна начинаться с http:// или https://"`;
    - `type==='number'` и значение не число → `"«<label>»: введите число"`;
    - `type==='list'` → для каждого элемента массива рекурсивно проверить `item`-поля (ключи внутри элемента — относительные).
    - `type==='image'` с `alt:true`, картинка задана, alt пуст → `"Добавьте описание картинки «<label>» (alt)"`.

- [ ] **Step 1: Тест**

```ts
import { expect, test } from "vitest";
import { validateContent } from "@/schema/content-validate";
import type { SiteSchema } from "@/schema/types";

const schema: SiteSchema = { site: "x", sections: [{ id: "hero", title: "H", fields: [
  { key: "hero.title", type: "text", label: "Заголовок", required: true, maxLength: 10 },
  { key: "hero.link", type: "url", label: "Ссылка" },
  { key: "hero.extra", type: "text", label: "Доп", required: true, showWhen: { field: "hero.hasExtra", equals: true } },
]}]};

test("пустой обязательный → ошибка", () => {
  const e = validateContent(schema, { hero: { title: "" } });
  expect(e.some(x => x.key === "hero.title")).toBe(true);
});
test("превышение длины → ошибка", () => {
  const e = validateContent(schema, { hero: { title: "12345678901" } });
  expect(e.some(x => /не больше 10/.test(x.message))).toBe(true);
});
test("плохой url → ошибка", () => {
  const e = validateContent(schema, { hero: { title: "ok", link: "example.com" } });
  expect(e.some(x => x.key === "hero.link")).toBe(true);
});
test("скрытое обязательное не проверяется", () => {
  const e = validateContent(schema, { hero: { title: "ok", hasExtra: false } });
  expect(e.some(x => x.key === "hero.extra")).toBe(false);
});
```

- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `content-validate.ts`.
- [ ] **Step 4: Прогнать — проходит.** → PASS (4 passed).
- [ ] **Step 5: Commit.** `git commit -m "feat: валидация контента по схеме (required с учётом условий, длина, url, число, alt)"`

---

### Task 0.8: Хеширование пароля

**Files:**
- Create: `src/auth/password.ts`
- Test: `tests/unit/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>` (bcryptjs, 10 rounds).

- [ ] **Step 1: Тест**

```ts
import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/auth/password";

test("верный пароль проходит, неверный — нет", async () => {
  const h = await hashPassword("Секрет123");
  expect(await verifyPassword("Секрет123", h)).toBe(true);
  expect(await verifyPassword("другое", h)).toBe(false);
});
```

- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** через `bcryptjs`.
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: хеширование и проверка пароля"`

---

### Task 0.9: Auth.js — вход по email/паролю

**Files:**
- Create: `src/auth/config.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/auth/index.ts`, `src/app/admin/login/page.tsx`
- Test: `tests/e2e/login.spec.ts`

**Interfaces:**
- Consumes: `verifyPassword` (0.8), `users` table (0.3).
- Produces:
  - `auth()` — серверный хелпер получения сессии (re-export из next-auth).
  - `signIn`, `signOut` — server actions.
  - Сессия содержит `user.id`, `user.role`, `user.mustChangePassword`.

- [ ] **Step 1: Написать e2e-тест**

```ts
import { test, expect } from "@playwright/test";

test("вход с верным паролем ведёт в панель, с неверным — ошибка", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', process.env.E2E_OWNER_EMAIL!);
  await page.fill('input[name="password"]', "неверный");
  await page.click('button[type="submit"]');
  await expect(page.getByText(/неверн/i)).toBeVisible();
  await page.fill('input[name="password"]', process.env.E2E_OWNER_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin(\/|$)/);
});
```

- [ ] **Step 2: Прогнать — падает.** Run: `npm run e2e tests/e2e/login.spec.ts` → FAIL (нет страницы).

- [ ] **Step 3: Реализовать**

`src/auth/config.ts` — `NextAuth({...})` с `DrizzleAdapter(db)`, `session: { strategy: "database" }`, `Credentials` provider: `authorize` ищет юзера по email, `verifyPassword`, возвращает `{ id, email, role, mustChangePassword }` или `null`. `callbacks.session` прокидывает `role` и `mustChangePassword` в `session.user`. `pages: { signIn: "/admin/login" }`.
`src/app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
`src/app/admin/login/page.tsx` — форма (email, password), server action вызывает `signIn("credentials", ...)`, при ошибке показывает «Неверный email или пароль».

- [ ] **Step 4: Подготовить тестового владельца.** Запустить `scripts/provision.ts` (Task 0.12) или вручную вставить юзера с известным паролем; положить креды в `.env.local` как `E2E_OWNER_EMAIL`/`E2E_OWNER_PASSWORD`.

- [ ] **Step 5: Прогнать — проходит.** Run: `npm run e2e tests/e2e/login.spec.ts` → PASS.

- [ ] **Step 6: Commit.** `git commit -m "feat: вход в панель по email и паролю (Auth.js)"`

---

### Task 0.10: Guard `requireUser()`

**Files:**
- Create: `src/auth/guard.ts`
- Test: `tests/unit/guard.test.ts`

**Interfaces:**
- Consumes: `auth()` (0.9).
- Produces:
  - `getCurrentUser(): Promise<{ id: string; role: 'owner'|'editor'; mustChangePassword: boolean } | null>`
  - `requireUser(role?: 'owner'): Promise<User>` — нет сессии → `redirect("/admin/login")`; `role==='owner'` и у юзера `editor` → `redirect("/admin")` (или 403-страница). Возвращает юзера.

- [ ] **Step 1: Тест** (мокаем `@/auth`):

```ts
import { expect, test, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));
const redirectMock = vi.fn(() => { throw new Error("REDIRECT"); });
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirectMock(u) }));

beforeEach(() => { authMock.mockReset(); redirectMock.mockClear(); });

test("нет сессии → redirect на login", async () => {
  authMock.mockResolvedValue(null);
  const { requireUser } = await import("@/auth/guard");
  await expect(requireUser()).rejects.toThrow("REDIRECT");
  expect(redirectMock).toHaveBeenCalledWith("/admin/login");
});

test("editor на owner-ресурсе → redirect на /admin", async () => {
  authMock.mockResolvedValue({ user: { id: "1", role: "editor", mustChangePassword: false } });
  const { requireUser } = await import("@/auth/guard");
  await expect(requireUser("owner")).rejects.toThrow("REDIRECT");
  expect(redirectMock).toHaveBeenCalledWith("/admin");
});

test("owner проходит", async () => {
  authMock.mockResolvedValue({ user: { id: "1", role: "owner", mustChangePassword: false } });
  const { requireUser } = await import("@/auth/guard");
  expect((await requireUser("owner")).id).toBe("1");
});
```

- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `guard.ts`.
- [ ] **Step 4: Прогнать — проходит.** → PASS (3 passed).
- [ ] **Step 5: Commit.** `git commit -m "feat: guard requireUser с ролями"`

---

### Task 0.11: Управление пользователями

**Files:**
- Create: `src/auth/users.ts`
- Test: `tests/unit/users.test.ts`

**Interfaces:**
- Consumes: `hashPassword` (0.8), `users` table.
- Produces:
  - `createUser(email, role): Promise<{ user; tempPassword: string }>` — генерирует временный пароль (12 симв.), `mustChangePassword: true`.
  - `listUsers(): Promise<User[]>`
  - `setPassword(userId, plain): Promise<void>` — хеширует, `mustChangePassword: false`.
  - `deleteUser(userId): Promise<void>` — **бросает `Error("Нельзя удалить последнего владельца")`**, если это единственный `owner`.
  - `resetPassword(userId): Promise<{ tempPassword: string }>` — новый временный, `mustChangePassword: true`.

- [ ] **Step 1: Тест**

```ts
import { expect, test } from "vitest";
import { createUser, deleteUser, listUsers, resetPassword } from "@/auth/users";
import { db } from "@/db";
import { users } from "@/db/tables";
import { eq } from "drizzle-orm";

test("createUser выдаёт временный пароль и mustChangePassword", async () => {
  const { user, tempPassword } = await createUser(`u_${Date.now()}@e.com`, "editor");
  expect(tempPassword).toHaveLength(12);
  expect(user.mustChangePassword).toBe(true);
  await db.delete(users).where(eq(users.id, user.id));
});

test("нельзя удалить последнего владельца", async () => {
  await db.delete(users);
  const { user } = await createUser(`o_${Date.now()}@e.com`, "owner");
  await expect(deleteUser(user.id)).rejects.toThrow(/последнего владельца/);
  await db.delete(users).where(eq(users.id, user.id));
});
```

- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `users.ts`.
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: управление пользователями + защита последнего владельца"`

---

### Task 0.12: Скрипт `provision.ts`

**Files:**
- Create: `scripts/provision.ts`, `content.seed.json`

**Interfaces:**
- Consumes: `createUser`/`setPassword` (0.11), `loadSchema` (0.5), `contentVersions`/`siteState` tables.
- Produces: CLI `npx tsx scripts/provision.ts --email a@b.c [--password X]` → создаёт `owner`, создаёт первую версию контента из `content.seed.json` со `status:'published'`, ставит `siteState.publishedVersionId`. Печатает временный пароль, если `--password` не задан.

- [ ] **Step 1: Реализовать** скрипт (парсинг аргументов вручную, без внешних либ).
- [ ] **Step 2: Проверить**

Run: `npx tsx scripts/provision.ts --email test-owner@example.com --password Test123456` → Expected: печатает `owner создан`, `контент залит`. Проверить в БД: `contentVersions` 1 строка `published`, `siteState.publishedVersionId` заполнен.

- [ ] **Step 3: Commit.** `git commit -m "feat: скрипт provision (владелец + начальный контент)"`

---

### Task 0.13: Смена пароля и принудительный редирект

**Files:**
- Create: `src/app/admin/change-password/page.tsx`
- Modify: `src/app/admin/layout.tsx` (Task 1.3 создаёт полноценный; здесь — минимальная проверка)
- Test: `tests/e2e/change-password.spec.ts`

**Interfaces:**
- Consumes: `getCurrentUser` (0.10), `setPassword` (0.11).

- [ ] **Step 1: e2e-тест**

```ts
import { test, expect } from "@playwright/test";
test("новый пользователь обязан сменить пароль", async ({ page }) => {
  // предполагается пользователь E2E_FRESH_* с mustChangePassword=true
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', process.env.E2E_FRESH_EMAIL!);
  await page.fill('input[name="password"]', process.env.E2E_FRESH_PASSWORD!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/change-password/);
  await page.fill('input[name="password"]', "НовыйПароль123");
  await page.fill('input[name="confirm"]', "НовыйПароль123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin(\/|$)/);
});
```

- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать.** В `admin/layout.tsx`: `const u = await requireUser();` если `u.mustChangePassword` и путь ≠ `/admin/change-password` → `redirect("/admin/change-password")`. Страница: форма (пароль + подтверждение, мин. 8 символов, совпадение), server action → `setPassword`.
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: смена пароля + принудительный редирект при первом входе"`

---

## Этап 1 — Панель: редактирование

### Task 1.1: Чтение контента

**Files:**
- Create: `src/content/read.ts`
- Test: `tests/unit/content-read.test.ts`

**Interfaces:**
- Consumes: `contentVersions`/`siteState` tables, `getByPath` (0.6).
- Produces:
  - `getPublishedData(): Promise<Record<string, unknown>>` — data опубликованной версии или `{}`.
  - `getDraftData(): Promise<Record<string, unknown>>` — data черновика; если черновика нет → копия опубликованной.
  - `getContent(key: string, mode?: 'published'|'draft'): Promise<unknown>` — `mode` по умолчанию `'published'`.

- [ ] **Step 1: Тест** — вставить published-версию с `{ hero: { title: "Привет" } }`, проверить `getContent("hero.title")` → `"Привет"`; `getContent("nope.x")` → `undefined`.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `read.ts`.
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: чтение опубликованного/черновикового контента"`

---

### Task 1.2: Версии — черновик и сохранение

**Files:**
- Create: `src/content/versions.ts`
- Test: `tests/unit/versions.test.ts`

**Interfaces:**
- Consumes: `contentVersions`/`siteState`, `validateContent` (0.7), `loadSchema` (0.5), `getPublishedData` (1.1).
- Produces:
  - `getOrCreateDraft(authorId): Promise<Version>` — если `siteState.draftVersionId` есть → вернуть; иначе создать `status:'draft'` из данных опубликованной версии, записать указатель.
  - `saveDraft(data, { authorId, autosave }): Promise<{ errors: FieldError[] }>` — при `autosave:false` валидирует (`validateContent`), при ошибках не пишет и возвращает `errors`; при `autosave:true` пишет без валидации. Обновляет `data` строки черновика (не плодит строки на автосейве — одна строка-черновик, перезапись).
  - `listVersions(limit=50): Promise<Version[]>` — по `createdAt desc`, только не-autosave + текущий черновик.

- [ ] **Step 1: Тест**

```ts
import { expect, test, beforeEach } from "vitest";
import { getOrCreateDraft, saveDraft } from "@/content/versions";
import { db } from "@/db";
import { contentVersions, siteState } from "@/db/tables";

beforeEach(async () => { await db.delete(siteState); await db.delete(contentVersions); });

test("getOrCreateDraft создаёт один черновик и переиспользует его", async () => {
  const a = await getOrCreateDraft(null);
  const b = await getOrCreateDraft(null);
  expect(a.id).toBe(b.id);
});

test("saveDraft без autosave валидирует и не пишет при ошибке", async () => {
  await getOrCreateDraft(null);
  const { errors } = await saveDraft({ hero: { title: "" } }, { authorId: null, autosave: false });
  expect(errors.length).toBeGreaterThan(0);
});
```

(в тесте `content.schema.json` должен требовать `hero.title` — использовать тестовую схему через переменную окружения `SCHEMA_PATH`, поддержать её в `loadSchema`.)

- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `versions.ts` (`publish`/`restoreVersion` — Task 2.1/2.2, здесь заглушки не нужны).
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: черновик контента и сохранение с валидацией"`

---

### Task 1.3: Оболочка панели

**Files:**
- Create: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx` (заглушка «С чего начать», полноценно — Task 2.7), `src/components/AdminHeader.tsx`, `src/branding.ts`

**Interfaces:**
- Consumes: `requireUser` (0.10), `branding` (Task 2.8 расширит).
- Produces: `branding` { clientLogoUrl: string; studioName: string; supportUrl: string; siteTitle: string }.

- [ ] **Step 1: Реализовать** `branding.ts` с плейсхолдерами. `layout.tsx`: `await requireUser()`, проверка `mustChangePassword` (из 0.13), рендер `<AdminHeader/>` + `{children}`. `AdminHeader`: логотип клиента, название, навигация (Разделы / Настройки / История / Пользователи — последнее только для `owner`), кнопка «Выйти» (server action `signOut`), ссылка «Написать в поддержку» (`branding.supportUrl`).
- [ ] **Step 2: Проверить** визуально: `npm run dev`, войти, увидеть шапку и навигацию; у `editor` нет пункта «Пользователи».
- [ ] **Step 3: Commit.** `git commit -m "feat: оболочка панели — шапка, навигация, выход, поддержка"`

---

### Task 1.4: FormRenderer и простые поля

**Files:**
- Create: `src/components/FormRenderer.tsx`, `src/components/fields/{TextField,LongtextField,NumberField,BooleanField,UrlField,SelectField}.tsx`, `src/components/fields/FieldWrapper.tsx`
- Test: `tests/unit/form-renderer.test.tsx`

**Interfaces:**
- Consumes: `Section`/`Field` types, `isFieldVisible` (0.6).
- Produces:
  - `<FormRenderer section={Section} />` — клиентский компонент; внутри `useForm` (react-hook-form), `defaultValues` приходят пропсом `initialData`. Рендерит поля **в порядке массива**, скрывает невидимые по `showWhen` (watch формы).
  - `FieldWrapper` — общий каркас: `label`, `hint` под полем, сообщение об ошибке, счётчик символов (если `maxLength`).
  - Каждый Field-компонент принимает `{ field: Field, name: string }` и использует `useFormContext`.

- [ ] **Step 1: Тест** (`@testing-library/react`): отрендерить `FormRenderer` с секцией из text+select, проверить, что подпись видна, `key` не отрисован как текст, поле с `showWhen` скрыто при несоблюдённом условии.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** компоненты (Tailwind, аккуратные подписи/подсказки, счётчик символов).
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: генератор формы по схеме + простые типы полей"`

---

### Task 1.5: Страница редактирования секции

**Files:**
- Create: `src/app/admin/edit/[section]/page.tsx`, `src/app/admin/edit/[section]/EditForm.tsx`
- Test: `tests/e2e/edit-text.spec.ts`

**Interfaces:**
- Consumes: `loadSchema` (0.5), `getDraftData` (1.1), `getOrCreateDraft` (1.2), `FormRenderer` (1.4).

- [ ] **Step 1: e2e** — войти, открыть `/admin/edit/hero`, изменить «Заголовок», нажать «Сохранить», перезагрузить, убедиться, что значение осталось.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать.** Server component: находит секцию по `params.section`, грузит `getDraftData`, отдаёт в `<EditForm section initialData/>`. `EditForm` (client): `FormRenderer` + кнопка «Сохранить» → `POST /api/save` (Task 1.6). Показ ошибок валидации из ответа.
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: страница редактирования секции"`

---

### Task 1.6: Роуты `/api/save` и `/api/autosave`

**Files:**
- Create: `src/app/admin/api/save/route.ts`, `src/app/admin/api/autosave/route.ts`
- Test: `tests/unit/api-save.test.ts`

**Interfaces:**
- Consumes: `requireUser` (0.10 — здесь через `auth()` в route), `saveDraft` (1.2).
- Produces: `POST /admin/api/save` body `{ data }` → 200 `{ ok: true }` или 422 `{ errors: FieldError[] }`; 401 без сессии. `autosave` — то же, но `autosave:true`, всегда 200.
- **Важно:** `data` мержится в общий объект контента (частичное сохранение секции не затирает другие секции). `saveDraft` принимает уже смёрженный объект — мерж делает роут: `deepMerge(await getDraftData(), body.data)`.

- [ ] **Step 1: Тест** — вызвать хендлер с замоканной сессией и битыми данными → 422 с errors; с валидными → 200; без сессии → 401.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** оба роута + `deepMerge` в `src/lib/merge.ts` (с юнит-тестом на мерж вложенных объектов и замену массивов целиком).
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: API сохранения черновика (ручное и авто)"`

---

### Task 1.7: Автосохранение и защита от потери правок

**Files:**
- Create: `src/components/useAutosave.ts`, `src/components/SaveStatus.tsx`
- Modify: `src/app/admin/edit/[section]/EditForm.tsx`

- [ ] **Step 1: Реализовать** `useAutosave(watch, sectionKeys)` — debounce 3 с, `POST /api/autosave`, состояние `idle|saving|saved|error`. `SaveStatus` — индикатор («Сохранено», «Сохраняю…», «Ошибка, повторю»). `beforeunload` + Next `useBeforeUnload`-эквивалент: предупреждение при несохранённых изменениях (`formState.isDirty`).
- [ ] **Step 2: Проверить** в `npm run dev`: правка → через 3 с «Сохранено»; закрытие вкладки с грязной формой → браузерное предупреждение; перезагрузка возвращает автосохранённое.
- [ ] **Step 3: Commit.** `git commit -m "feat: автосохранение черновика + предупреждение о несохранённом"`

---

### Task 1.8: Поле-список

**Files:**
- Create: `src/components/fields/ListField.tsx`, `src/lib/array-ops.ts`
- Test: `tests/unit/array-ops.test.ts`

**Interfaces:**
- Produces: `move(arr, from, to)`, `insertAt(arr, i, item)`, `removeAt(arr, i)` — чистые функции. `renderItemLabel(template: string, item: Record<string, unknown>): string` — подстановка `{name}` → `item.name`, пустое → `"Без названия"`.

- [ ] **Step 1: Тест** на `move`/`removeAt`/`renderItemLabel` (`"{name}"` + `{name:"Уборка"}` → `"Уборка"`; пустой объект → `"Без названия"`).
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `array-ops.ts`, затем `ListField` (react-hook-form `useFieldArray`, кнопка «Добавить», «Удалить» с подтверждением, перетаскивание — нативный HTML5 DnD или `@dnd-kit/core`, сворачивание элемента, подпись из `itemLabel`).
- [ ] **Step 4: Прогнать — проходит.** → PASS. Плюс визуальная проверка списка услуг в `npm run dev`.
- [ ] **Step 5: Commit.** `git commit -m "feat: поле-список (добавить/удалить/перетащить/свернуть)"`

---

### Task 1.9: Поле-группа и переиспользуемые фрагменты

**Files:**
- Create: `src/components/fields/GroupField.tsx`
- Modify: `src/components/FormRenderer.tsx`

- [ ] **Step 1: Реализовать** `GroupField` — рендерит вложенные `item`-поля с префиксом имени. `FormRenderer` уже получает раскрытые `use` из `loadSchema` (0.5), поэтому просто обрабатывает `type:'group'`.
- [ ] **Step 2: Проверить** визуально: секция с группой «SEO» (из `use: "seo"`) рисует вложенные поля.
- [ ] **Step 3: Commit.** `git commit -m "feat: поле-группа + переиспользуемые фрагменты в форме"`

---

### Task 1.10: Поле форматированного текста

**Files:**
- Create: `src/components/fields/RichtextField.tsx`, `src/lib/sanitize-html.ts`
- Test: `tests/unit/sanitize-html.test.ts`

**Interfaces:**
- Produces: `sanitizeHtml(dirty: string): string` — DOMPurify, allowlist: `b, strong, i, em, a[href], ul, ol, li, p, br`. `a` — принудительно `rel="noopener nofollow"`, только `http(s)`.

- [ ] **Step 1: Тест** — `<script>` вырезается; `<a href="javascript:...">` теряет href; `<b>` и `<a href="https://...">` остаются.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `sanitize-html.ts`, затем `RichtextField` на Tiptap (StarterKit + Link; тулбар: жирный, ссылка, маркированный список). На сохранении контент прогоняется через `sanitizeHtml` (и в роуте `/api/save` тоже — для richtext-полей).
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: поле форматированного текста + очистка HTML"`

---

### Task 1.11: Условные поля в форме

**Files:**
- Modify: `src/components/FormRenderer.tsx`
- Test: `tests/e2e/conditional-field.spec.ts`

- [ ] **Step 1: e2e** — секция с галочкой «Показывать кнопку» и полем «Текст кнопки» (`showWhen`); поле появляется при включении галочки, исчезает при выключении; сохранение без галочки не требует «Текст кнопки».
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** — `FormRenderer` подписывается на `watch()`, для каждого поля вызывает `isFieldVisible(field, values)`; скрытые не рендерит. Валидация уже пропускает скрытые (0.7).
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: условные поля в форме редактирования"`

---

### Task 1.12: Загрузка картинок

**Files:**
- Create: `src/media/process.ts`, `src/media/upload.ts`, `src/app/admin/api/upload/route.ts`, `src/components/fields/ImageField.tsx`
- Test: `tests/unit/media-process.test.ts`, `tests/e2e/image-upload.spec.ts`

**Interfaces:**
- Consumes: `@vercel/blob` client-upload (`handleUpload`), `sharp`.
- Produces:
  - `processImage(buf: Buffer): Promise<{ webp: Buffer; width: number; height: number }>` — ресайз до max 2000px по длинной стороне, конверт в webp q80.
  - `POST /admin/api/upload` — Blob `handleUpload` callback: проверяет сессию в `onBeforeGenerateToken`, ограничивает `allowedContentTypes: ['image/*']`, `maximumSizeInBytes: 15MB`.
  - `<ImageField>` — превью текущей картинки, кнопка «Загрузить», `upload()` из `@vercel/blob/client` (браузер → Blob напрямую), в значение поля пишется `{ url, alt }`; поле `alt` обязательно при заданной картинке (подпись «Опишите картинку словами — это видят поисковики и незрячие»).

- [ ] **Step 1: Тест `processImage`** — подать тестовый PNG 3000×1000, проверить `width===2000` и что выход — валидный webp (сигнатура `RIFF....WEBP`).
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `process.ts`, `upload` callback (в `onUploadCompleted` — прогнать через `processImage` и перезаписать блоб webp-версией, либо процессить на клиенте до аплоуда через `createImageBitmap`+canvas; выбрать клиентский ресайз как основной, серверный webp как дополнительный — зафиксировать в коде комментарием).
- [ ] **Step 4: e2e** — на `/admin/edit/hero` загрузить картинку, дождаться превью, задать alt, сохранить, перезагрузить — картинка и alt на месте.
- [ ] **Step 5: Прогнать оба.** → PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat: загрузка и сжатие картинок (client upload в Blob)"`

---

## Этап 2 — Публикация, история, настройки, бренд, экспорт

### Task 2.1: `publish()`

**Files:**
- Modify: `src/content/versions.ts`
- Test: `tests/unit/publish.test.ts`

**Interfaces:**
- Consumes: `contentVersions`/`siteState`, `validateContent`, `revalidateTag` (`next/cache`).
- Produces: `publish({ authorId, note? }): Promise<{ errors: FieldError[] }>` — валидирует данные черновика; при ошибках не публикует; иначе: помечает строку черновика `status:'published'`, ставит `siteState.publishedVersionId = draftVersionId`, обнуляет `draftVersionId`, `revalidateTag("content")`.
  - `hasUnpublishedChanges(): Promise<boolean>` — `draftVersionId != null` и его `data` ≠ `data` опубликованной.

- [ ] **Step 1: Тест** — создать черновик с валидными данными, `publish()`, проверить: `publishedVersionId` указывает на бывший черновик, `draftVersionId` пуст, `getContent(key,'published')` отдаёт новые данные. Черновик с ошибкой → `errors`, публикации нет.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать.**
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: публикация черновика + сброс кэша сайта"`

---

### Task 2.2: `restoreVersion()`

**Files:**
- Modify: `src/content/versions.ts`
- Test: `tests/unit/restore.test.ts`

**Interfaces:**
- Produces: `restoreVersion(versionId, { authorId }): Promise<void>` — берёт `data` указанной версии, кладёт в **новый** черновик (не мутируя историю), ставит `siteState.draftVersionId`. Публиковать отдельно.

- [ ] **Step 1: Тест** — 2 опубликованные версии (A, потом B), `restoreVersion(A.id)`, проверить `getDraftData()` === A.data, история не изменилась (2 строки + новый черновик).
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать.**
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: откат к прошлой версии (через новый черновик)"`

---

### Task 2.3: PublishBar и роут публикации

**Files:**
- Create: `src/components/PublishBar.tsx`, `src/app/admin/api/publish/route.ts`
- Modify: `src/app/admin/layout.tsx`
- Test: `tests/e2e/publish.spec.ts`

- [ ] **Step 1: e2e** — изменить заголовок, увидеть баннер «Есть неопубликованные изменения», открыть публичную страницу в другой вкладке — старый заголовок; нажать «Опубликовать» — баннер меняется на «Опубликовано только что», публичная страница показывает новый заголовок.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `POST /admin/api/publish` (guard, `publish()`, вернуть errors при 422). `PublishBar` (client, в layout): опрашивает `hasUnpublishedChanges` + время последней публикации, показывает статус и кнопку. Формат времени: «только что / N минут назад / N дней назад».
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: баннер статуса и публикация из панели"`

---

### Task 2.4: Предпросмотр черновика (Draft Mode)

**Files:**
- Create: `src/app/api/preview/route.ts`
- Modify: `src/content/read.ts` (учитывать `draftMode()`)
- Test: `tests/e2e/preview.spec.ts`

**Interfaces:**
- Produces: `GET /api/preview?enable=1` → `draftMode().enable()`, redirect на `/`; `?enable=0` → disable. `getContent` без явного `mode`: если `draftMode().isEnabled` → `'draft'`, иначе `'published'`.

- [ ] **Step 1: e2e** — изменить заголовок (без публикации), нажать «Предпросмотр» в панели → открывается сайт с черновым заголовком и плашкой «Черновик — [выйти]»; после «выйти» — опубликованный.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** роут + правку `read.ts` + кнопку «Предпросмотр» в `PublishBar` + плашку режима черновика в layout сайта.
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: предпросмотр черновика через Draft Mode"`

---

### Task 2.5: История версий

**Files:**
- Create: `src/app/admin/history/page.tsx`, `src/components/VersionDiff.tsx`, `src/app/admin/api/restore/route.ts`, `src/lib/diff.ts`
- Test: `tests/unit/diff.test.ts`, `tests/e2e/history.spec.ts`

**Interfaces:**
- Produces: `diffContent(a, b): { key: string; label: string; before: string; after: string }[]` — обход по листовым ключам схемы, только изменившиеся; значения приводятся к строке («картинка», «(пусто)», текст с обрезкой).

- [ ] **Step 1: Тест `diffContent`** — 2 объекта, отличающиеся `hero.title` → одна запись с `before`/`after`; одинаковые → пустой массив.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** `diff.ts`, страницу истории (список версий: дата, автор, «опубликовано/черновик», кнопки «Посмотреть отличия» → `VersionDiff` от предыдущей, «Вернуть эту версию» → `POST /admin/api/restore`).
- [ ] **Step 4: e2e** — опубликовать v1, затем v2, на `/admin/history` увидеть 2 записи, открыть отличия, нажать «Вернуть» на v1, опубликовать, проверить, что сайт снова показывает v1-контент.
- [ ] **Step 5: Прогнать — проходит.** → PASS.
- [ ] **Step 6: Commit.** `git commit -m "feat: история версий с отличиями и откатом"`

---

### Task 2.6: Экран «Общие настройки»

**Files:**
- Create: `src/app/admin/settings/page.tsx`

**Interfaces:**
- Consumes: `loadSchema` (секция с `id: "settings"`), `FormRenderer`, `/api/save`.

- [ ] **Step 1: Реализовать** — то же, что `edit/[section]`, но фиксировано на секцию `settings` (логотип, телефон, email, адрес, соцсети-список, текст футера, часы работы). Отдельный пункт меню.
- [ ] **Step 2: Проверить** визуально: правка телефона → сохранение → отражается в черновике; после публикации — на всех страницах сайта (проверяется в Task 3.2).
- [ ] **Step 3: Commit.** `git commit -m "feat: экран общих настроек сайта"`

---

### Task 2.7: Дашборд «С чего начать»

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Реализовать** — приветствие, кнопки-ссылки на разделы схемы, блок «Последние изменения» (последние 5 из `listVersions`), карточка «Нужна помощь? — Написать в поддержку» (`branding.supportUrl`), ссылка на обучающие видео (`branding` — добавить `tutorialUrl`).
- [ ] **Step 2: Проверить** визуально.
- [ ] **Step 3: Commit.** `git commit -m "feat: стартовый экран панели вместо пустой страницы"`

---

### Task 2.8: Брендирование

**Files:**
- Modify: `src/branding.ts`, `src/app/admin/login/page.tsx`, `src/components/AdminHeader.tsx`, `src/app/admin/layout.tsx`
- Create: `public/branding/` (логотип-плейсхолдер, favicon-плейсхолдер)

**Interfaces:**
- Produces: `branding` { clientLogoUrl, studioName, supportUrl, tutorialUrl, siteTitle, faviconUrl }.

- [ ] **Step 1: Реализовать** — логотип клиента на экране входа и в шапке; подпись «Разработка и поддержка — {studioName}» в подвале панели; `<title>` вкладки панели = `{siteTitle} — панель`; favicon из `branding.faviconUrl` через `metadata` в `admin/layout.tsx`. Всё читается из одного файла `branding.ts` — при новом сайте меняется только он.
- [ ] **Step 2: Проверить** визуально на входе и внутри.
- [ ] **Step 3: Commit.** `git commit -m "feat: фирменный вид панели из одного файла branding.ts"`

---

### Task 2.9: Экспорт контента

**Files:**
- Create: `src/content/export.ts`, `src/app/admin/api/export/route.ts`
- Test: `tests/unit/export.test.ts`

**Interfaces:**
- Produces: `buildExportZip(): Promise<Buffer>` — zip с `content.published.json`, `content.draft.json` (если есть), `content.schema.json`, `media-manifest.json` (список URL картинок из контента), `README.txt` («Это весь контент вашего сайта в формате JSON…»). `GET /admin/api/export` — guard (owner+editor), отдаёт zip с `Content-Disposition: attachment`.

- [ ] **Step 1: Тест** — залить published-данные, `buildExportZip()`, распаковать (jszip), проверить наличие `content.published.json` с верными данными и `media-manifest.json`.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать.**
- [ ] **Step 4: Прогнать — проходит.** → PASS. Плюс кнопка «Экспорт всего контента» на дашборде.
- [ ] **Step 5: Commit.** `git commit -m "feat: экспорт всего контента в ZIP"`

---

### Task 2.10: Экран пользователей

**Files:**
- Create: `src/app/admin/users/page.tsx`, `src/app/admin/api/users/route.ts`
- Test: `tests/e2e/users.spec.ts`

**Interfaces:**
- Consumes: `requireUser('owner')`, `createUser`/`listUsers`/`resetPassword`/`deleteUser` (0.11).

- [ ] **Step 1: e2e** — под `owner` открыть `/admin/users`, добавить редактора (email + роль) → показан временный пароль; сбросить пароль → показан новый; удалить редактора → пропал из списка; кнопка удаления у единственного владельца недоступна/выдаёт ошибку. Под `editor` — `/admin/users` редиректит на `/admin`.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать** страницу (таблица: email, роль, статус; действия) + роут (POST create / POST reset / DELETE), все под `requireUser('owner')`.
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: управление пользователями в панели (только владелец)"`

---

## Этап 3 — Сторона сайта

### Task 3.1: Помощник чтения контента в компонентах сайта

**Files:**
- Create: `src/content-map.ts`
- Test: `tests/unit/content-map.test.ts`

**Interfaces:**
- Consumes: `getContent` (1.1), `draftMode` (2.4).
- Produces:
  - `content(key: string): Promise<string>` — строковое значение по ключу для текущего режима, `""` если нет.
  - `contentList(key: string): Promise<Record<string, unknown>[]>` — массив для полей-списков.
  - `contentImage(key: string): Promise<{ url: string; alt: string } | null>`.
  - `contentRich(key: string): Promise<string>` — HTML (уже очищенный при сохранении), для `dangerouslySetInnerHTML`.

- [ ] **Step 1: Тест** — published `{ services: { items: [{name:"A"},{name:"B"}] }, hero: { pic: { url:"u", alt:"a" } } }` → `contentList("services.items")` длина 2, `contentImage("hero.pic").alt === "a"`.
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать.**
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: помощники чтения контента в компонентах сайта"`

---

### Task 3.2: Пример лендинга на контенте

**Files:**
- Create: `src/app/page.tsx`, `src/app/(site)/components/{Hero,Services,Prices,Faq,Contacts,Cta}.tsx`, `src/app/(site)/SiteLayout.tsx`

- [ ] **Step 1: Реализовать** серверные компоненты, читающие `content()/contentList()/contentImage()`. Все тексты/цены/картинки/списки — из контента; вёрстка и стили — в компонентах (клиент их не трогает). Плашка режима черновика (из 2.4) в `SiteLayout`.
- [ ] **Step 2: Проверить** — `npm run dev`, поправить контент в панели, опубликовать, увидеть изменения на `/`; в режиме предпросмотра — черновик.
- [ ] **Step 3: Commit.** `git commit -m "feat: пример лендинга, полностью на контенте из панели"`

---

### Task 3.3: SEO из схемы

**Files:**
- Modify: `src/app/page.tsx` (`generateMetadata`), `content.schema.json` (секция `seo` через `use`)

- [ ] **Step 1: Реализовать** `generateMetadata()` — `title`, `description`, `openGraph.images` из `content("seo.*")`; фолбэк на `hero.title` и дефолтную картинку.
- [ ] **Step 2: Проверить** — `view-source` страницы содержит заданные из панели title/description/og:image.
- [ ] **Step 3: Commit.** `git commit -m "feat: SEO-теги страницы из контента панели"`

---

### Task 3.4: Кэш и сброс

**Files:**
- Modify: `src/content/read.ts`
- Test: `tests/unit/read-cache.test.ts` (интеграционный)

**Interfaces:**
- `getPublishedData` оборачивается в `unstable_cache(fn, ["content-published"], { tags: ["content"] })`. В режиме черновика (`draftMode().isEnabled`) кэш **не используется** (прямой запрос). `publish()` уже вызывает `revalidateTag("content")` (2.1).

- [ ] **Step 1: Тест** — опубликовать A, прочитать (закэшировалось), опубликовать B (внутри — revalidateTag), прочитать снова → B. (В тесте `revalidateTag` мокается или проверяется через прямой вызов.)
- [ ] **Step 2: Прогнать — падает.** → FAIL.
- [ ] **Step 3: Реализовать.**
- [ ] **Step 4: Прогнать — проходит.** → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: кэширование опубликованного контента + сброс при публикации"`

---

### Task 3.5: Сквозной e2e-тест всего цикла

**Files:**
- Create: `tests/e2e/full-loop.spec.ts`

- [ ] **Step 1: Написать тест** — один сценарий:
  1. войти владельцем;
  2. на `/admin/edit/hero` изменить заголовок, загрузить картинку + alt;
  3. на `/admin/edit/services` добавить пункт списка, переставить, удалить;
  4. дождаться автосохранения;
  5. открыть предпросмотр → черновые данные видны, публичная `/` — старые;
  6. «Опубликовать» → `/` показывает новые данные, баннер «Опубликовано только что»;
  7. `/admin/history` → «Вернуть» предыдущую версию → «Опубликовать» → `/` показывает старые данные;
  8. скачать экспорт → файл не пустой, содержит `content.published.json`.
- [ ] **Step 2: Прогнать** — Run: `npm run e2e tests/e2e/full-loop.spec.ts` → Expected: PASS.
- [ ] **Step 3: Прогнать весь набор** — `npm test && npm run e2e` → Expected: всё зелёное.
- [ ] **Step 4: Commit.** `git commit -m "test: сквозной e2e — правка → предпросмотр → публикация → откат → экспорт"`

---

## Этап 4 — Превращение в тиражируемый шаблон (outline)

Детальный план — отдельно, когда стек стабилизируется. Состав:

- `scripts/new-site.md` — чек-лист: форк заготовки в репозиторий клиента → заполнить `content.schema.json` и `content.seed.json` → собрать компоненты сайта → завести Vercel-проект + Neon + Blob на аккаунт клиента → прогнать миграции → `provision.ts` → подключить домен Beget → создать владельца, отдать временный пароль.
- `README.md` для Лены — как собрать новый сайт, что где менять (`branding.ts`, схема, компоненты).
- `docs/handover/acceptance-checklist.md` — чек-лист приёмки с подписью (доступы переданы, обучение проведено, границы поддержки согласованы).
- `docs/handover/support-boundaries.md` — шаблон документа о границах поддержки (что входит, что платно, срочный канал, гарантия 30 дней на баги).
- `docs/handover/video-plan.md` — сценарии 1 тур-видео (20–30 мин) + 5–8 микро-видео (заменить баннер, добавить новость, поменять текст, загрузить фото, обновить контакты, опубликовать, откатить).
- Ссылки на видео и памятку — внутрь панели (иконка «?» в каждом разделе, пункт на дашборде).
- Проверка миграций схемы на «живом» сайте: как безопасно добавить/переименовать поле, не потеряв контент (написать `docs/schema-migration.md`).

## Этап 5 — Боевой пилот (outline)

- Выбрать первый реальный сайт (кандидат — личный лендинг Лены `my-landing` либо первый клиентский).
- Перенести его вёрстку в компоненты шаблона, составить `content.schema.json` под его блоки.
- Развернуть на реальных аккаунтах, прогнать полный цикл в проде.
- Отдать доступ, провести обучение по `video-plan.md`, подписать чек-лист приёмки.
- Зафиксировать в `~/workspace/memory/` время сборки и вскрытые пробелы — вход в план доработок v1.1.

---

## Self-Review

**Покрытие требований (CONCEPT.md р.6 + ARCHITECTURE.md план):**

| Требование | Задачи |
|---|---|
| Формат схемы + пример | 0.4, 0.5 |
| Форма по схеме: разделы, подписи, подсказки, проверка, счётчик | 1.4 |
| Типы полей: текст/длинный/форматированный/число/галочка/ссылка/выбор/картинка/список/группа | 1.4, 1.8, 1.9, 1.10, 1.12 |
| Автосохранение черновика | 1.7 |
| Черновик → предпросмотр → публикация + статус | 2.3, 2.4 |
| История версий: отличия + откат | 2.1, 2.2, 2.5 |
| Экран «Общие настройки» | 2.6 |
| Вход, смена пароля, две роли, стабильная сессия | 0.9, 0.10, 0.13, 2.10 |
| Фирменный вид + «С чего начать» | 2.7, 2.8 |
| Экспорт контента | 2.9 |
| Сайт показывает контент (метки в вёрстке) | 3.1, 3.2 |
| SEO | 3.3 |
| Сброс кэша после публикации | 2.1, 3.4 |
| Условные поля | 0.6, 0.7, 1.11 |
| Загрузка из браузера в Blob (обход 4.5 МБ) + сжатие + alt | 1.12 |
| Комплект сдачи | Этап 4 |
| Один реальный сайт, весь цикл проверен | 3.5 (тест), Этап 5 (прод) |
| Защита последнего владельца | 0.11, 2.10 |
| Машинное имя не показывать клиенту | 1.4 (тест) |

**Типы — сверка:** `FieldError {key,message}` (0.7) используется в `saveDraft`/`publish` (1.2/2.1) и роутах (1.6/2.3) единообразно. `Version` из `contentVersions` — общий. `getContent(key, mode)` (1.1) — сигнатура одна во всех местах. `branding` расширяется аддитивно (1.3 → 2.7 → 2.8), поля не переименовываются.

**Плейсхолдеры:** UI-задачи (1.3, 2.6, 2.7, 3.2) намеренно без пошагового TDD — там «реализовать + визуальная проверка + коммит», код компонентов пишется по интерфейсам из задач логики. Это допустимо для вёрстки; вся логика (схема, версии, авторизация, медиа, экспорт, diff, условия) покрыта тестами по 5-шаговому циклу.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-01-admin-panel-mvp.md`. Два способа исполнения:**

**1. Subagent-Driven (рекомендуется)** — свежий субагент на каждую задачу, ревью между задачами, быстрые итерации.

**2. Inline Execution** — задачи выполняются в текущей сессии через executing-plans, пакетно с чекпойнтами на ревью.

**Какой подход?**
