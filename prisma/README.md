# Prisma Schema Guide

Dokumen ini menjelaskan cara mengelola `prisma/schema.prisma` untuk project Rosatri jika nanti ada perubahan tabel, kolom, enum, atau relasi.

## File yang penting

- `prisma/schema.prisma` → sumber utama schema database
- `prisma.config.ts` → konfigurasi Prisma 7 dan datasource
- `prisma/migrations/` → hasil migration yang sudah dibuat Prisma
- `prisma/migrations/20260309143000_init_schema/migration.sql` → migration pertama project ini
- `prisma/migrations/20260309194500_add_user_password_hash/migration.sql` → migration tambahan untuk module register user
- `prisma/migrations/20260311053515_add_user_email_verification_otp/migration.sql` → migration tambahan untuk verifikasi email OTP user

## Cara menjalankan Prisma di project ini

Urutan paling aman jika Anda menjalankan repo ini sendiri:

1. install dependency:

   ```bash
   npm install
   ```

2. siapkan `.env` atau `.env.local`
3. apply migration yang sudah ada:

   ```bash
   npm run prisma:migrate:deploy
   ```

4. cek status:

   ```bash
   npm run prisma:migrate:status
   ```

5. jika sedang mengubah schema, gunakan workflow pada dokumen ini

## Prinsip yang dipakai di project ini

1. Nama model Prisma menggunakan **PascalCase singular**
   - contoh: `User`, `Kos`, `Room`, `Booking`

2. Nama tabel database tetap mengikuti query SQL awal
   - dipetakan dengan `@@map("nama_tabel")`

3. Nama field Prisma menggunakan **camelCase**
   - nama kolom database tetap **snake_case**
   - dipetakan dengan `@map("nama_kolom")`

4. Primary key UUID mengikuti PostgreSQL
   - memakai `@db.Uuid`
   - default memakai `dbgenerated("gen_random_uuid()")`

5. Field waktu dibuat dengan `@default(now())`

## Catatan migration pertama

Di project ini, Prisma membaca konfigurasi dari `prisma.config.ts`.

- Jika `DATABASE_URL` ada, nilai itu akan dipakai.
- Jika `DATABASE_URL` belum ada, Prisma akan fallback ke `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, dan `DB_SSL`.

Contoh jika Anda ingin tetap memakai `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/rosatri?schema=public"
```

Selain itu, migration pertama perlu memuat SQL manual berikut:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

Ini penting karena `gen_random_uuid()` berasal dari extension tersebut.

Pada project ini, migration pertama sudah saya siapkan, sudah memuat partial index `idx_active_bookings`, dan sudah berhasil dijalankan ke database lokal.

Setelah itu, ada migration lanjutan untuk menambahkan kolom `users.password_hash` agar module register user bisa menyimpan password secara aman dalam bentuk hash.

Migration berikutnya menambahkan kolom:

- `users.email_verified`
- `users.email_verification_otp_hash`
- `users.email_verification_otp_expires_at`

Kolom-kolom ini dipakai untuk flow verifikasi email OTP saat register dan untuk memblok login sebelum email user terverifikasi.

## Command Prisma yang paling sering dipakai

- `npm run prisma:format`
  - merapikan `prisma/schema.prisma`

- `npm run prisma:validate`
  - memastikan schema Prisma valid

- `npm run prisma:migrate:create -- --name nama_perubahan`
  - membuat draft migration tanpa langsung apply

- `npm run prisma:migrate:dev`
  - apply migration baru saat development lokal

- `npm run prisma:migrate:deploy`
  - apply migration yang sudah tersedia

- `npm run prisma:migrate:status`
  - mengecek status sinkronisasi migration dengan database

## Workflow perubahan schema

Setiap kali Anda ingin mengubah struktur database, gunakan alur berikut:

1. Edit `prisma/schema.prisma`
2. Rapikan dan validasi schema:

   ```bash
   npm run prisma:format
   npm run prisma:validate
   ```

3. Buat migration draft lebih dulu:

   ```bash
   npm run prisma:migrate:create -- --name nama_perubahan
   ```

4. Jika ada kebutuhan SQL khusus, edit file SQL migration yang baru dibuat
5. Jalankan migration:

   ```bash
   npm run prisma:migrate:dev
   ```

6. Cek status migration:

   ```bash
   npm run prisma:migrate:status
   ```

7. Jika Anda memakai Prisma Client, generate ulang:

   ```bash
   npx prisma generate
   ```

## Jika ingin menambah kolom baru

Contoh: Anda ingin menambah kolom `photo_url` pada tabel `rooms`.

Tambahkan field di model `Room`:

```prisma
photoUrl String? @map("photo_url") @db.VarChar(255)
```

Lalu buat migration baru.

## Jika ingin menambah tabel baru

Contoh langkah umum:

1. Buat model baru di `schema.prisma`
2. Tambahkan relasi ke model lain jika diperlukan
3. Tambahkan `@@map("nama_tabel")`
4. Tambahkan index / unique jika diperlukan
5. Buat migration baru

Contoh pola model baru:

```prisma
model Facility {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  roomId    String   @map("room_id") @db.Uuid
  name      String   @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@index([roomId], map: "idx_facilities_room")
  @@map("facilities")
}
```

## Jika ingin mengubah enum

Contoh: ingin menambah status booking baru.

1. Buka enum terkait di `schema.prisma`
2. Tambahkan nilai enum baru
3. Buat migration baru

Contoh:

```prisma
enum BookingStatus {
  Pending   @map("pending")
  Active    @map("active")
  Cancelled @map("cancelled")
  Finished  @map("finished")
  CheckedOut @map("checked_out")

  @@map("booking_status_enum")
}
```

## Jika ingin mengubah relasi

Saat menambah foreign key baru, pastikan 3 hal berikut ikut diperbarui:

1. field foreign key, misalnya `ownerId`
2. field relation Prisma, misalnya `owner User @relation(...)`
3. index pada foreign key jika memang perlu

## Hal yang perlu dilakukan manual di migration SQL

Beberapa kebutuhan PostgreSQL tidak selalu ideal jika hanya mengandalkan schema Prisma. Untuk project ini, yang perlu diperhatikan adalah:

1. **Extension `pgcrypto`**
   - tambahkan manual di migration SQL

2. **Partial index**
   - index ini belum direpresentasikan langsung di `schema.prisma`:

   ```sql
   CREATE INDEX idx_active_bookings
   ON bookings(room_id)
   WHERE status = 'active';
   ```

3. **SQL khusus lain**
   - jika nanti Anda butuh trigger, function, view, atau check constraint yang spesifik, tambahkan langsung di file migration SQL

## Tentang index dan unique

Di query SQL awal ada index tambahan untuk `users.email` dan `users.username`. Di schema Prisma file ini, keduanya cukup direpresentasikan dengan `@unique` karena PostgreSQL sudah membuat backing index untuk unique constraint.

Artinya:

- tetap aman untuk query dan constraint
- migration lebih bersih
- tidak membuat index ganda yang sebenarnya redundant

## Tips penamaan agar tetap rapi

- model: `User`, `Room`, `Invoice`
- field Prisma: `createdAt`, `ownerId`, `paymentMethod`
- nama database tetap snake_case lewat `@map` dan `@@map`
- nama migration buat deskriptif, misalnya:
  - `add_room_photo`
  - `add_facility_table`
  - `change_invoice_status`

## Langkah aman sebelum apply migration

Sebelum menjalankan migration ke database utama:

1. review perubahan di `schema.prisma`
2. buat migration dengan `--create-only`
3. review file SQL hasil generate
4. tambahkan SQL manual jika diperlukan
5. baru jalankan migration

## Checklist singkat setiap perubahan database

- [ ] schema Prisma sudah diubah
- [ ] relasi sudah benar
- [ ] type dan nullability sudah benar
- [ ] index / unique sudah dipertimbangkan
- [ ] migration SQL sudah direview
- [ ] kebutuhan SQL manual sudah ditambahkan

## Jika ingin mulai lagi dari nol

Kalau nanti Anda ingin membuat backend baru dengan pola yang sama, urutan Prisma-nya bisa seperti ini:

1. install `prisma` ke project
2. buat folder `prisma/`
3. tulis `prisma/schema.prisma`
4. buat `prisma.config.ts`
5. siapkan `.env` atau `.env.local`
6. buat migration awal dengan `--create-only`
7. review SQL migration dan tambahkan SQL manual jika perlu
8. apply migration
9. cek status migration

## Rekomendasi next step

Karena migration pertama sudah beres, langkah terbaik berikutnya adalah:

1. pertahankan `prisma/schema.prisma` sebagai sumber utama perubahan struktur database
2. saat ada perubahan schema baru, buat migration berikutnya dengan alur pada dokumen ini
3. test endpoint health check backend setelah setiap perubahan penting
