# Rosatri Backend

Backend starter untuk aplikasi kos-kosan **Rosatri** menggunakan **Express.js**, **TypeScript**, **PostgreSQL**, dan **Prisma**. Repository ini sudah berada pada tahap fondasi backend yang rapi: server Express siap jalan, koneksi PostgreSQL sudah ada, schema Prisma sudah dibuat, source backend utama sudah dimigrasikan ke TypeScript, dan module auth pertama untuk **register user** sudah mulai tersedia.

README ini ditulis bukan hanya untuk menjelaskan kondisi project sekarang, tetapi juga sebagai **panduan dari nol sampai titik saat ini**, supaya kalau nanti Anda ingin membuat backend baru lagi, Anda tahu urutan langkah yang perlu dilakukan.

## Cheat Sheet Singkat

Command yang paling sering dipakai:

- install dependency → `npm install`
- jalankan backend dev → `npm run dev`
- type check TypeScript → `npm run typecheck`
- test semua file `*.test.ts` → `npm test`
- lint JavaScript + TypeScript → `npm run lint`
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
- endpoint `register user` pertama
- endpoint `login user` dasar
- endpoint protected `auth/me`
- endpoint update profile sendiri
- role-based authorization dasar
- middleware error handler dan not found handler
- hashing password untuk kebutuhan auth dasar
- access token auth dasar
- test endpoint dengan `node:test` + `supertest`
- konfigurasi environment
- schema Prisma lengkap
- dua migration Prisma sudah tersedia di repo
- dokumentasi perubahan schema Prisma dan Prisma 7 config
- source backend utama sudah memakai TypeScript

## Tech Stack

- Node.js 20+
- TypeScript
- Express.js
- PostgreSQL
- Prisma
- ESLint
- tsx
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
│   │   ├── 20260309194500_add_user_password_hash/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── README.md
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── health.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── not-found.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── health.routes.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── password.ts
│   │   └── token.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   └── app.test.ts
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
AUTH_TOKEN_SECRET=change-this-secret-for-development
AUTH_TOKEN_EXPIRES_IN_HOURS=24
EMAIL_PROVIDER=log
EMAIL_FROM_ADDRESS=no-reply@rosatri.local
EMAIL_OTP_EXPIRES_IN_MINUTES=10

# Required when EMAIL_PROVIDER=smtp
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

DATABASE_URL="postgresql://postgres:<your_password>@localhost:5432/rosatri?schema=public"
```

> Project ini memakai `prisma.config.ts`. Artinya Prisma akan memakai `DATABASE_URL` jika tersedia, atau otomatis membangun koneksi dari `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, dan `DB_SSL`. Jadi Anda bisa tetap memakai `.env` maupun `.env.local`.

Untuk auth dasar saat ini:

- `AUTH_TOKEN_SECRET` dipakai untuk menandatangani access token
- `AUTH_TOKEN_EXPIRES_IN_HOURS` dipakai untuk mengatur masa berlaku token login
- `EMAIL_PROVIDER` menentukan mode kirim email (`log` atau `smtp`)
- `EMAIL_FROM_ADDRESS` dipakai sebagai alamat pengirim email
- `EMAIL_OTP_EXPIRES_IN_MINUTES` mengatur masa berlaku OTP verifikasi email
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` dipakai Nodemailer saat `EMAIL_PROVIDER=smtp`

### 3. Buat database kosong jika belum ada

```bash
psql -U postgres -d postgres -f database/init.sql
```

File `database/init.sql` hanya untuk membuat database `rosatri`, bukan untuk membuat tabel-tabel utama.

> Dependency `prisma` sudah tercantum di `devDependencies`, jadi Anda tidak perlu install manual lagi selama menjalankan `npm install`.

### 4. Apply migration Prisma yang tersedia

Untuk repo yang migration-nya sudah tersedia seperti project ini, jalankan:

```bash
npm run prisma:migrate:deploy
```

Saat ini repo ini sudah memiliki migration berikut:

- `20260309143000_init_schema`
- `20260309194500_add_user_password_hash`

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

Migration yang saat ini tersedia di repo:

- `prisma/migrations/20260309143000_init_schema/migration.sql`
- `prisma/migrations/20260309194500_add_user_password_hash/migration.sql`

### 6. Jalankan backend

```bash
npm run dev
```

### 7. Cek endpoint dasar

- root: `GET http://localhost:5000/`
- health: `GET http://localhost:5000/api/v1/health`
- register: `POST http://localhost:5000/api/v1/auth/register`
- login: `POST http://localhost:5000/api/v1/auth/login`
- verify email otp: `POST http://localhost:5000/api/v1/auth/verify-email-otp`
- me: `GET http://localhost:5000/api/v1/auth/me`
- update profile: `PATCH http://localhost:5000/api/v1/auth/me`
- staff area: `GET http://localhost:5000/api/v1/auth/staff-area`
- admin area: `GET http://localhost:5000/api/v1/auth/admin-area`

## Script yang Tersedia

- `npm run dev` → menjalankan server TypeScript dengan `tsx watch`
- `npm start` → menjalankan server TypeScript dengan `tsx`
- `npm run lint` → menjalankan ESLint untuk file JavaScript dan TypeScript
- `npm run typecheck` → memvalidasi type TypeScript tanpa build output
- `npm test` → menjalankan semua file test `*.test.ts` di folder `tests`
- `npm run prisma:format` → merapikan `prisma/schema.prisma`
- `npm run prisma:validate` → memvalidasi schema Prisma
- `npm run prisma:migrate:create -- --name nama_perubahan` → membuat draft migration baru tanpa langsung apply
- `npm run prisma:migrate:dev` → apply migration baru saat development lokal
- `npm run prisma:migrate:deploy` → apply migration yang sudah tersedia
- `npm run prisma:migrate:status` → mengecek status migration database

## Panduan Menulis `tests/app.test.ts`

Saat ini `tests/app.test.ts` adalah file utama untuk integration test HTTP backend. Developer baru sebaiknya mengikuti pola yang sama agar test konsisten dan mudah dibaca.

### Apa fungsi file ini

- menguji endpoint dari sisi request/response nyata melalui `supertest`
- memverifikasi status code dan payload penting
- memverifikasi side effect ke database jika endpoint memang mengubah data
- menjadi referensi pattern test untuk endpoint baru

### Pola isi file yang dipakai sekarang

Urutan penulisannya:

1. import dependency minimum: `assert`, `randomUUID`, `node:test`, `supertest`, dan helper database bila perlu
2. set environment test dan import `app`
3. definisikan type kecil untuk hasil query database bila memang diperlukan
4. buat helper lokal seperti cleanup data, ubah role, atau buat user login siap pakai
5. tutup koneksi database di `test.after()`
6. tulis test per kelompok fitur: public endpoint -> auth -> protected endpoint -> RBAC

### Pattern nama test

Gunakan format ini:

- `GET /api/v1/health should return service and database status`
- `POST /api/v1/auth/login should reject invalid credentials`

Pattern ini sengaja dipakai agar developer langsung tahu:

- method HTTP
- path endpoint
- ekspektasi perilaku

### Apa yang wajib ditulis saat menambah test baru

Minimal checklist untuk endpoint baru:

- 1 test success case
- 1 test error / validation case paling penting
- `401` jika endpoint butuh login
- `403` jika endpoint dibatasi role tertentu
- verifikasi database jika endpoint mengubah state penting

### Aturan praktis yang perlu diikuti

- gunakan `randomUUID()` untuk email / username unik
- jangan mengandalkan data tetap yang bisa bentrok antar-run test
- cleanup data yang dibuat oleh test sendiri
- jangan assert seluruh response body jika tidak perlu; cukup assert field penting
- gunakan helper lokal jika setup yang sama dipakai berulang di beberapa test
- query langsung ke database hanya untuk membuktikan side effect penting, bukan untuk menggantikan assertion utama dari API response

### Kapan pakai query database di test

Pakai query database jika Anda perlu memastikan perubahan benar-benar tersimpan, misalnya:

- password disimpan sebagai hash, bukan plain text
- profile user benar-benar berubah setelah `PATCH /auth/me`
- role user test berubah sebelum memverifikasi RBAC

Kalau endpoint hanya membaca data tanpa side effect, biasanya assertion response API sudah cukup.

### Kapan bikin helper baru di `app.test.ts`

Buat helper lokal jika langkah setup mulai berulang, misalnya:

- hapus user test
- ubah role user test
- register + login untuk mendapatkan `accessToken`

Tujuannya agar isi test tetap fokus pada perilaku yang diuji, bukan tenggelam di setup panjang.

### Cara menjalankan test

- `npm test`

Script ini akan menjalankan semua file `*.test.ts` di folder `tests` melalui `tests/run-tests.ts`.

## Endpoint yang Sudah Tersedia

### 1. Root endpoint

- `GET /`

### 2. Health check

- `GET /api/v1/health`
- mengecek status backend dan koneksi database

### 3. Register user

- `POST /api/v1/auth/register`
- endpoint auth pertama untuk membuat user baru dengan role default `renter`
- setelah register sukses, backend membuat OTP verifikasi email dan mengirimkannya ke email user

Field request yang saat ini dipakai:

- `firstName` **wajib**
- `username` **wajib**, minimal 3 karakter
- `email` **wajib**, format email valid
- `password` **wajib**, minimal 8 karakter
- `lastName` opsional
- `phone` opsional
- `address` opsional

Perilaku endpoint register saat ini:

- password disimpan dalam bentuk hash, bukan plain text
- user baru dibuat dengan `emailVerified = false`
- OTP verifikasi email disimpan dalam bentuk hash + expiry time
- response tidak mengembalikan `password` atau `passwordHash`
- response menandai bahwa verifikasi email masih diperlukan
- jika `email` atau `username` sudah dipakai, API mengembalikan `409`

### 4. Login user

- `POST /api/v1/auth/login`
- login dasar memakai `identifier` + `password`

Field request untuk login:

- `identifier` **wajib**
  - bisa berupa `email` atau `username`
- `password` **wajib**, minimal 8 karakter

Perilaku endpoint login saat ini:

- mencari user berdasarkan email atau username
- memverifikasi password terhadap `password_hash`
- jika credential salah, API mengembalikan `401`
- jika email user belum terverifikasi, API mengembalikan `403`
- response tidak mengembalikan `password` atau `passwordHash`
- jika login sukses, API mengembalikan `accessToken`

### 5. Verify email OTP

- `POST /api/v1/auth/verify-email-otp`
- dipakai untuk memverifikasi OTP 6 digit yang dikirim saat register

Field request:

- `email` **wajib**, format email valid
- `otp` **wajib**, harus string angka 6 digit

Perilaku endpoint verifikasi OTP:

- jika OTP valid dan belum kedaluwarsa, user akan di-set menjadi `emailVerified = true`
- OTP hash dan expiry akan dibersihkan setelah verifikasi berhasil
- jika OTP salah atau expired, API mengembalikan `400`

### 6. Auth me

- `GET /api/v1/auth/me`
- membutuhkan header `Authorization: Bearer <accessToken>`
- mengembalikan data user login yang sedang terautentikasi

### 7. Update profile sendiri

- `PATCH /api/v1/auth/me`
- membutuhkan header `Authorization: Bearer <accessToken>`
- update field profil dasar user login

Field request yang saat ini didukung:

- `firstName` opsional, tetapi jika dikirim harus string non-kosong
- `lastName` opsional, bisa string atau `null`
- `phone` opsional, bisa string atau `null`
- `address` opsional, bisa string atau `null`

Catatan perilaku endpoint ini:

- minimal salah satu field di atas harus dikirim
- `email`, `username`, dan `password` belum diubah lewat endpoint ini
- response tetap aman tanpa `password` atau `passwordHash`

### 7. Role-based authorization dasar

Role user yang saat ini dikenali backend:

- `renter`
- `owner`
- `admin`

Middleware auth sekarang bisa dibagi lagi berdasarkan role.

Contoh endpoint yang sudah tersedia:

- `GET /api/v1/auth/staff-area`
  - hanya bisa diakses `owner` atau `admin`
- `GET /api/v1/auth/admin-area`
  - hanya bisa diakses `admin`

Perilaku response:

- jika belum login / token tidak valid → `401`
- jika login valid tetapi role tidak punya akses → `403`

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
   - file utama: `src/config/db.ts`

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
14. migrasi source backend ke TypeScript
15. auto-discovery test runner untuk file `*.test.ts`
16. module auth pertama untuk register user
17. migration tambahan untuk kolom `users.password_hash`
18. test health check dan register user
19. module login user dasar dengan verifikasi password
20. test login user dengan email atau username
21. access token auth dasar
22. middleware auth untuk protected route
23. endpoint protected `auth/me`
24. endpoint update profile user sendiri
25. role-based authorization dasar
26. endpoint contoh untuk `owner/admin` dan `admin`

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
npm install -D eslint @eslint/js globals supertest typescript tsx @typescript-eslint/parser @typescript-eslint/eslint-plugin @types/node @types/express @types/cors @types/morgan @types/pg @types/supertest
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

Buat file koneksi seperti `src/config/db.ts` yang berisi:

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

Pada `src/server.ts`, siapkan:

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

## Catatan Perubahan Schema Terbaru

Untuk mendukung auth saat ini, ada dua migration tambahan penting berikut:

- `prisma/migrations/20260309194500_add_user_password_hash/migration.sql`
- `prisma/migrations/20260311053515_add_user_email_verification_otp/migration.sql`

Kolom yang ditambahkan untuk flow auth:

- `users.password_hash`
- `users.email_verified`
- `users.email_verification_otp_hash`
- `users.email_verification_otp_expires_at`

Kolom-kolom ini dipakai untuk menyimpan hash password, status verifikasi email, hash OTP, dan waktu kedaluwarsa OTP.

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
npm run typecheck
npm test
npm run lint
```

Lalu jalankan server dan cek:

```text
GET http://localhost:5000/
GET http://localhost:5000/api/v1/health
POST http://localhost:5000/api/v1/auth/register
POST http://localhost:5000/api/v1/auth/login
GET http://localhost:5000/api/v1/auth/me
PATCH http://localhost:5000/api/v1/auth/me
GET http://localhost:5000/api/v1/auth/staff-area
GET http://localhost:5000/api/v1/auth/admin-area
```

## Next Step yang Disarankan

Setelah tahap ini, langkah berikutnya yang paling natural adalah:

1. mulai buat module domain seperti `users`, `kos`, `rooms`, `bookings`, `invoices`, `payments`
2. buat service, repository, dan validation layer
3. lanjutkan auth ke refresh token / session yang lebih matang
4. tambahkan fitur ganti password dan update email/username dengan validasi yang lebih lengkap
5. tambahkan seed data awal
6. siapkan kontrak API untuk frontend Next.js

## Penutup

Pada titik ini, backend Rosatri sudah memiliki fondasi yang profesional dan cukup rapi untuk dikembangkan lebih lanjut. Dengan README ini dan `prisma/README.md`, Anda seharusnya bisa mengulangi proses setup yang sama untuk backend lain maupun melanjutkan project ini dengan lebih percaya diri.
