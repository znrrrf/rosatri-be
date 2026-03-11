-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "fk_booking_renter";

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "fk_booking_room";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "fk_invoice_booking";

-- DropForeignKey
ALTER TABLE "kos" DROP CONSTRAINT "fk_kos_owner";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "fk_payment_invoice";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "fk_rooms_kos";

-- AddForeignKey
ALTER TABLE "kos" ADD CONSTRAINT "fk_kos_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_kos" FOREIGN KEY ("kos_id") REFERENCES "kos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "fk_booking_room" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "fk_booking_renter" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "fk_invoice_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "fk_payment_invoice" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
