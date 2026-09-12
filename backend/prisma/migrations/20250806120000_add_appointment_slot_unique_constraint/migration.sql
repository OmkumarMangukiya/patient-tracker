-- Add slotStart column (nullable during backfill)
ALTER TABLE "Appointment" ADD COLUMN "slotStart" TIMESTAMP(3);

-- Backfill from appointmentDate, truncated to the hour
UPDATE "Appointment"
SET "slotStart" = date_trunc('hour', "appointmentDate")
WHERE "slotStart" IS NULL;

-- Keep appointmentDate aligned with the normalized slot
UPDATE "Appointment"
SET "appointmentDate" = "slotStart"
WHERE "slotStart" IS NOT NULL;

-- Resolve any existing duplicate active bookings before adding the constraint
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "doctorId", "slotStart"
      ORDER BY "createdAt" ASC
    ) AS rn
  FROM "Appointment"
  WHERE status <> 'cancelled'
)
UPDATE "Appointment" AS a
SET status = 'cancelled'
FROM ranked AS r
WHERE a.id = r.id AND r.rn > 1;

ALTER TABLE "Appointment" ALTER COLUMN "slotStart" SET NOT NULL;

-- One active booking per doctor per slot; cancelled slots remain bookable
CREATE UNIQUE INDEX "Appointment_doctorId_slotStart_active_key"
ON "Appointment" ("doctorId", "slotStart")
WHERE status <> 'cancelled';
