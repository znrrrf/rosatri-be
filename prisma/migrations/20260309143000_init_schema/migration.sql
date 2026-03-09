-- Create required PostgreSQL extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE "user_role_enum" AS ENUM ('admin', 'owner', 'renter');
CREATE TYPE "booking_status_enum" AS ENUM ('pending', 'active', 'cancelled', 'finished');
CREATE TYPE "invoice_status_enum" AS ENUM ('unpaid', 'paid', 'late', 'partial');
CREATE TYPE "payment_method_enum" AS ENUM ('cash', 'transfer', 'ewallet');

-- Create users table
CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "first_name" VARCHAR(255) NOT NULL,
  "last_name" VARCHAR(255),
  "username" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50),
  "address" TEXT,
  "id_card_number" VARCHAR(100),
  "id_card_photo" VARCHAR(255),
  "role" "user_role_enum" NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Create kos table
CREATE TABLE "kos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL,
  "kos_name" VARCHAR(255) NOT NULL,
  "location" TEXT,
  "lat" DECIMAL(10, 7),
  "lng" DECIMAL(10, 7),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "kos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_kos_owner"
    FOREIGN KEY ("owner_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
);

CREATE INDEX "idx_kos_owner" ON "kos"("owner_id");

-- Create rooms table
CREATE TABLE "rooms" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "kos_id" UUID NOT NULL,
  "room_name" VARCHAR(100) NOT NULL,
  "room_type" VARCHAR(100),
  "price" DECIMAL(12, 2) NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rooms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_rooms_kos"
    FOREIGN KEY ("kos_id")
    REFERENCES "kos"("id")
    ON DELETE CASCADE
);

CREATE INDEX "idx_rooms_kos" ON "rooms"("kos_id");

-- Create bookings table
CREATE TABLE "bookings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "room_id" UUID NOT NULL,
  "renter_id" UUID NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE,
  "status" "booking_status_enum" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bookings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_booking_room"
    FOREIGN KEY ("room_id")
    REFERENCES "rooms"("id")
    ON DELETE CASCADE,
  CONSTRAINT "fk_booking_renter"
    FOREIGN KEY ("renter_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
);

CREATE INDEX "idx_bookings_room" ON "bookings"("room_id");
CREATE INDEX "idx_bookings_renter" ON "bookings"("renter_id");
CREATE INDEX "idx_bookings_status" ON "bookings"("status");
CREATE INDEX "idx_active_bookings"
  ON "bookings"("room_id")
  WHERE "status" = 'active'::"booking_status_enum";

-- Create invoices table
CREATE TABLE "invoices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "booking_id" UUID NOT NULL,
  "billing_month" DATE NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "due_date" DATE NOT NULL,
  "status" "invoice_status_enum" NOT NULL DEFAULT 'unpaid',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_invoice_booking"
    FOREIGN KEY ("booking_id")
    REFERENCES "bookings"("id")
    ON DELETE CASCADE
);

CREATE INDEX "idx_invoices_booking" ON "invoices"("booking_id");
CREATE INDEX "idx_invoices_status" ON "invoices"("status");
CREATE INDEX "idx_invoices_due_date" ON "invoices"("due_date");

-- Create payments table
CREATE TABLE "payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "invoice_id" UUID NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "payment_date" TIMESTAMP(6) NOT NULL,
  "payment_method" "payment_method_enum",
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "fk_payment_invoice"
    FOREIGN KEY ("invoice_id")
    REFERENCES "invoices"("id")
    ON DELETE CASCADE
);

CREATE INDEX "idx_payments_invoice" ON "payments"("invoice_id");
CREATE INDEX "idx_payments_date" ON "payments"("payment_date");