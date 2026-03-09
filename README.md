# Rosatri Backend

Backend starter untuk aplikasi kos-kosan **Rosatri** menggunakan **Express.js**, **PostgreSQL**, dan **Prisma**. Repository ini sudah berada pada tahap fondasi backend yang rapi: server Express siap jalan, koneksi PostgreSQL sudah ada, schema Prisma sudah dibuat, dan migration pertama sudah berhasil dijalankan.

README ini ditulis bukan hanya untuk menjelaskan kondisi project sekarang, tetapi juga sebagai **panduan dari nol sampai titik saat ini**, supaya kalau nanti Anda ingin membuat backend baru lagi, Anda tahu urutan langkah yang perlu dilakukan.

## Cheat Sheet Singkat

Command yang paling sering dipakai:

- install dependency → `npm install`
- jalankan backend dev → `npm run dev`
- test → `npm test`
- lint → `npm run lint`
- format schema Prisma → `npm run prisma:format`
- validasi schema Prisma → `npm run prisma:validate`
- buat draft migration baru → `npm run prisma:migrate:create -- --name nama_perubahan`
- apply migration lokal saat development → `npm run prisma:migrate:dev`
- apply migration yang sudah ada → `npm run prisma:migrate:deploy`
- cek status migration → `npm run prisma:migrate:status`

## Kondisi Project Saat Ini

Yang sudah tersedia:

- Express app dengan struktur folder yang rapi
- koneksi PostgreSQL runtime menggunakan `pg`
- health check endpoint
- middleware error handler dan not found handler
- test dasar dengan `node:test` + `supertest`
- konfigurasi environment
- schema Prisma lengkap
- migration pertama Prisma sudah berhasil diaplikasikan
- dokumentasi perubahan schema Prisma dan Prisma 7 config

## Tech Stack

- Node.js 20+
- Express.js
- PostgreSQL
- Prisma
- ESLint
- `node:test`
- Supertest

## Struktur Folder

```text
.
├── database/
│   └── init.sql
├── prisma/
│   ├── migrations/
│   │   ├── 20260309143000_init_schema/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── README.md
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/
│   │   └── health.controller.js
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   ├── routes/
│   │   ├── health.routes.js
│   │   └── index.js
│   ├── app.js
│   └── server.js
├── tests/
│   └── app.test.js
├── .env.example
├── .gitignore
├── eslint.config.js
├── package.json
├── prisma.config.ts
└── README.md
```

Dokumentasi khusus pengelolaan schema Prisma ada di `prisma/README.md`.

## Cara Menjalankan Project Saat Ini

### 1. Install dependency project

```bash
npm install
```

### 2. Siapkan environment

Salin `.env.example` menjadi `.env` atau `.env.local`, lalu isi nilainya sesuai database lokal Anda.

Contoh minimal:

```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
APP_NAME=Rosatri Backend API

DB_HOST=localhost
DB_PORT=5432
DB_NAME=rosatri
DB_USER=postgres
DB_PASSWORD=<your_password>
DB_SSL=false

DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/rosatri?schema=public"
```

> Project ini memakai `prisma.config.ts`. Artinya Prisma akan memakai `DATABASE_URL` jika tersedia, atau otomatis membangun koneksi dari `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, dan `DB_SSL`. Jadi Anda bisa tetap memakai `.env` maupun `.env.local`.

### 3. Buat database kosong jika belum ada

```bash
psql -U postgres -d postgres -f database/init.sql
```

File `database/init.sql` hanya untuk membuat database `rosatri`, bukan untuk membuat tabel-tabel utama.

> Dependency `prisma` sudah tercantum di `devDependencies`, jadi Anda tidak perlu install manual lagi selama menjalankan `npm install`.

### 4. Apply migration Prisma pertama

Untuk repo yang migration-nya sudah tersedia seperti project ini, jalankan:

```bash
npm run prisma:migrate:deploy
```

Jika Anda sedang membuat migration baru saat development lokal, gunakan:

```bash
npm run prisma:migrate:dev
```

Perintah di atas membaca konfigurasi Prisma dari file root `prisma.config.ts`.

### 5. Cek status migration

```bash
npm run prisma:migrate:status
```

Jika status normal, Prisma akan menampilkan pesan bahwa schema database sudah `up to date`.

Migration pertama sudah tersedia di:

`prisma/migrations/20260309143000_init_schema/migration.sql`

### 6. Jalankan backend

```bash
npm run dev
```

### 7. Cek endpoint dasar

- root: `GET http://localhost:5000/`
- health: `GET http://localhost:5000/api/v1/health`

## Script yang Tersedia

- `npm run dev` → menjalankan server dengan nodemon
- `npm start` → menjalankan server biasa
- `npm run lint` → menjalankan ESLint
- `npm test` → menjalankan test dasar
- `npm run prisma:format` → merapikan `prisma/schema.prisma`
- `npm run prisma:validate` → memvalidasi schema Prisma
- `npm run prisma:migrate:create -- --name nama_perubahan` → membuat draft migration baru tanpa langsung apply
- `npm run prisma:migrate:dev` → apply migration baru saat development lokal
- `npm run prisma:migrate:deploy` → apply migration yang sudah tersedia
- `npm run prisma:migrate:status` → mengecek status migration database

## Command Prisma yang Akan Sering Dipakai

- `npm run prisma:migrate:deploy` → apply migration yang sudah ada
- `npm run prisma:migrate:dev` → buat/apply migration baru saat development lokal
- `npm run prisma:migrate:create -- --name nama_perubahan` → generate draft migration tanpa langsung apply
- `npm run prisma:migrate:status` → cek apakah database sudah sinkron dengan migration
- `npm run prisma:validate` → validasi schema Prisma
- `npm run prisma:format` → rapikan format file `prisma/schema.prisma`

## Workflow Prisma yang Disarankan

Supaya lebih mudah diingat, gunakan script npm berikut saat bekerja dengan Prisma:

1. rapikan schema:

   ```bash
   npm run prisma:format
   ```

2. validasi schema:

   ```bash
   npm run prisma:validate
   ```

3. buat draft migration baru:

   ```bash
   npm run prisma:migrate:create -- --name nama_perubahan
   ```

4. review file SQL migration dan tambahkan SQL manual jika diperlukan
5. apply migration saat development lokal:

   ```bash
   npm run prisma:migrate:dev
   ```

6. cek status akhir:

   ```bash
   npm run prisma:migrate:status
   ```

## Arsitektur Project Saat Ini

Project ini menggunakan dua layer utama untuk database:

1. **Runtime connection** dengan `pg`
   - dipakai oleh Express saat aplikasi berjalan
   - file utama: `src/config/db.js`

2. **Schema & migration management** dengan Prisma
   - dipakai untuk mengelola struktur database
   - file utama: `prisma/schema.prisma`
   - konfigurasi Prisma 7: `prisma.config.ts`
   - migration pertama ada di folder `prisma/migrations/`

Ini artinya:

- untuk saat ini, aplikasi backend tetap bisa memakai query manual via `pg`
- sementara perubahan struktur database tetap versioned lewat Prisma migration

## Apa Saja yang Sudah Dibuat Sampai Titik Ini

Secara berurutan, project ini sekarang sudah punya:

1. inisialisasi project Node.js
2. instalasi dependency utama Express
3. setup middleware dasar
4. setup environment variable
5. setup koneksi PostgreSQL
6. setup routing awal dan health check
7. setup linting dan test dasar
8. desain schema database untuk domain kos-kosan
9. konversi desain tersebut ke `prisma/schema.prisma`
10. adaptasi Prisma 7 melalui `prisma.config.ts`
11. pembuatan migration pertama Prisma
12. migration pertama berhasil dijalankan ke database lokal
13. dokumentasi workflow perubahan schema

## Panduan Membuat Backend Baru dari Nol Sampai Tahap Ini

Kalau nanti Anda ingin membuat backend baru lagi dengan pola yang sama, urutan kerjanya bisa seperti ini.

### Langkah 1 — Inisialisasi project Node.js

```bash
npm init -y
```

Lalu set hal dasar:

- nama project
- version
- `type: module`
- script `dev`, `start`, `lint`, `test`

### Langkah 2 — Install dependency utama backend

Untuk backend Express dasar:

```bash
npm install express pg cors helmet morgan dotenv
```

Untuk development tools:

```bash
npm install -D nodemon eslint @eslint/js globals supertest
```

Kalau ingin memakai Prisma untuk migration dari awal, install juga:

```bash
npm install -D prisma
```

> `@prisma/client` **belum wajib** untuk pola project ini, karena runtime backend saat ini masih memakai `pg`. Install `@prisma/client` nanti jika Anda memang ingin query database via Prisma Client di kode aplikasi.

### Langkah 3 — Buat struktur folder yang rapi

Minimal struktur yang direkomendasikan:

- `src/config`
- `src/controllers`
- `src/routes`
- `src/middlewares`
- `tests`
- `prisma`
- `database`

### Langkah 4 — Setup environment

Siapkan `.env.example`, lalu buat `.env` atau `.env.local` lokal Anda.

Yang minimal perlu ada:

- port aplikasi
- nama aplikasi
- prefix API
- konfigurasi PostgreSQL runtime
- `DATABASE_URL` untuk Prisma (opsional jika Anda memakai fallback `DB_*` lewat `prisma.config.ts`)

### Langkah 5 — Setup koneksi database runtime

Buat file koneksi seperti `src/config/db.js` yang berisi:

- pembuatan `Pool` dari package `pg`
- helper query
- helper health check database
- helper close connection saat shutdown

### Langkah 6 — Setup Express app dasar

Minimal yang sebaiknya ada:

- `cors`
- `helmet`
- `express.json()`
- logging (`morgan`)
- root route `/`
- prefix API, misalnya `/api/v1`
- error handler global
- not found handler

### Langkah 7 — Setup server lifecycle

Pada `src/server.js`, siapkan:

- `app.listen()`
- graceful shutdown
- handler untuk `SIGINT`, `SIGTERM`
- handler untuk `unhandledRejection` dan `uncaughtException`

### Langkah 8 — Tambahkan health check

Buat endpoint seperti:

```text
GET /api/v1/health
```

Health check ini penting untuk memastikan:

- backend hidup
- database bisa diakses

### Langkah 9 — Tambahkan lint dan test dasar

Minimal:

- 1 test untuk root endpoint
- 1 test untuk 404 route
- eslint config yang ringan tapi konsisten

Tujuan tahap ini adalah memastikan fondasi backend tidak rapuh sebelum domain logic ditambah.

### Langkah 10 — Rancang schema database

Sebelum membuat API bisnis, buat dulu rancangan entitas inti. Untuk project Rosatri, entitas utamanya adalah:

- `users`
- `kos`
- `rooms`
- `bookings`
- `invoices`
- `payments`

Lalu pikirkan juga:

- enum status
- foreign key
- cascade delete
- index penting
- field nullable dan non-nullable

### Langkah 11 — Tulis `prisma/schema.prisma` dan `prisma.config.ts`

Setelah desain SQL cukup matang, buat representasi Prisma-nya:

- enum Prisma
- model Prisma
- relasi
- `@map` untuk kolom snake_case
- `@@map` untuk nama tabel
- `@@index` dan `@unique`

Lalu buat `prisma.config.ts` agar Prisma 7 bisa membaca datasource dari:

- `DATABASE_URL`, atau
- fallback `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`

### Langkah 12 — Buat migration pertama

Setelah schema siap, buat migration awal.

Alur aman yang direkomendasikan:

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:migrate:create -- --name init_schema
```

Lalu review file SQL hasil generate, dan tambahkan SQL manual jika diperlukan.

Untuk project ini, migration pertama berisi:

- `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`
- pembuatan enum PostgreSQL
- pembuatan semua tabel inti
- foreign key dengan `ON DELETE CASCADE`
- index utama
- partial index `idx_active_bookings`

### Langkah 13 — Apply migration dan verifikasi

Setelah migration siap:

1. apply migration:

   ```bash
   npm run prisma:migrate:deploy
   ```

2. cek status:

   ```bash
   npm run prisma:migrate:status
   ```

3. jalankan backend
4. jalankan lint dan test
5. akses endpoint health check

Kalau semua lolos, berarti fondasi backend sudah sampai tahap yang stabil seperti project ini sekarang.

## Ringkasan Schema Database Rosatri

### Entitas utama

- `users` → admin, owner, renter
- `kos` → properti kos milik owner
- `rooms` → kamar per kos
- `bookings` → transaksi sewa kamar
- `invoices` → tagihan berdasarkan booking
- `payments` → histori pembayaran invoice

### Enum utama

- `user_role_enum`
- `booking_status_enum`
- `invoice_status_enum`
- `payment_method_enum`

### Relasi utama

- `users (owner)` → `kos`
- `kos` → `rooms`
- `rooms` → `bookings`
- `users (renter)` → `bookings`
- `bookings` → `invoices`
- `invoices` → `payments`

## Catatan Penting Tentang Migration Pertama

Migration pertama yang sekarang sudah dibuat berada di path berikut:

`prisma/migrations/20260309143000_init_schema/migration.sql`

Hal penting di dalamnya:

1. extension `pgcrypto` sudah dimasukkan
2. semua enum PostgreSQL sudah dibuat
3. semua tabel inti sudah dibuat
4. foreign key memakai `ON DELETE CASCADE`
5. partial index `idx_active_bookings` sudah dimasukkan manual

Catatan desain penting:

- index terpisah untuk `users.email` dan `users.username` **tidak dibuat lagi** selain unique index bawaan, karena `@unique` sudah menghasilkan index yang diperlukan dan lebih rapi untuk dipelihara di Prisma

## Jika Nanti Ingin Mengubah Schema

Gunakan alur ini:

1. ubah `prisma/schema.prisma`
2. rapikan dan validasi schema:

   ```bash
   npm run prisma:format
   npm run prisma:validate
   ```

3. buat migration draft:

   ```bash
   npm run prisma:migrate:create -- --name nama_perubahan
   ```

4. review file SQL migration
5. tambahkan SQL manual jika dibutuhkan
6. jalankan migration:

   ```bash
   npm run prisma:migrate:dev
   ```

7. cek status akhir:

   ```bash
   npm run prisma:migrate:status
   ```

Untuk panduan rinci, baca `prisma/README.md`.

## Kapan Perlu Menambah SQL Manual di Migration

Beberapa hal PostgreSQL biasanya lebih aman ditambahkan langsung di file migration SQL:

- `CREATE EXTENSION`
- partial index
- trigger
- function
- view
- constraint SQL khusus yang belum nyaman direpresentasikan di Prisma schema

## Checklist Agar Sampai ke Titik Project Ini

Kalau Anda membuat backend baru lagi, checklist minimal untuk mencapai kondisi seperti project Rosatri saat ini adalah:

- [ ] project Node.js sudah diinisialisasi
- [ ] dependency backend utama sudah terpasang
- [ ] struktur folder dasar sudah rapi
- [ ] `.env.example` dan `.env` sudah disiapkan
- [ ] koneksi PostgreSQL runtime sudah ada
- [ ] Express app + middleware dasar sudah jadi
- [ ] root route dan health check sudah ada
- [ ] lint dan test dasar sudah ada
- [ ] Prisma schema sudah dibuat
- [ ] migration pertama sudah dibuat
- [ ] database sudah bisa di-migrate
- [ ] backend bisa dijalankan dan endpoint health check lolos

## Validasi Minimum yang Disarankan

Setelah setup selesai, jalankan minimal:

```bash
npm run prisma:validate
npm run prisma:migrate:status
npm test
npm run lint
```

Lalu jalankan server dan cek:

```text
GET http://localhost:5000/
GET http://localhost:5000/api/v1/health
```

## Next Step yang Disarankan

Setelah tahap ini, langkah berikutnya yang paling natural adalah:

1. mulai buat module domain seperti `users`, `kos`, `rooms`, `bookings`, `invoices`, `payments`
2. buat service, repository, dan validation layer
3. tambahkan auth
4. tambahkan seed data awal
5. siapkan kontrak API untuk frontend Next.js

## Penutup

Pada titik ini, backend Rosatri sudah memiliki fondasi yang profesional dan cukup rapi untuk dikembangkan lebih lanjut. Dengan README ini dan `prisma/README.md`, Anda seharusnya bisa mengulangi proses setup yang sama untuk backend lain maupun melanjutkan project ini dengan lebih percaya diri.
