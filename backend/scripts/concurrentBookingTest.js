/**
 * Fires CONCURRENT_REQUESTS simultaneous booking attempts at the same slot
 * and verifies exactly one succeeds (201) and the rest get 409.
 *
 * Prerequisites:
 *   - Backend running (default http://localhost:8000)
 *   - DATABASE_URL and JWT_SECRET in backend/.env
 *   - At least one patient assigned to a doctor in the DB
 *
 * Usage: npm run test:concurrent-booking
 */
import dotenv from "dotenv";
import prisma from "../client.js";
import { tokenGenerate } from "../auth/jwtToken.js";
import { normalizeToSlotStart } from "../utils/slotUtils.js";

dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:8000";
const CONCURRENT_REQUESTS = Number(process.env.CONCURRENT_REQUESTS || 50);

async function findTestPatientAndDoctor() {
  const patient = await prisma.Patient.findFirst({
    where: {
      doctors: { some: {} },
    },
    include: { doctors: { take: 1 } },
  });

  if (!patient || patient.doctors.length === 0) {
    throw new Error(
      "No patient with an assigned doctor found. Assign a doctor to a patient first."
    );
  }

  return { patient, doctor: patient.doctors[0] };
}

function buildFutureSlot() {
  const slot = new Date();
  slot.setDate(slot.getDate() + 30);
  slot.setHours(10, 0, 0, 0);
  return normalizeToSlotStart(slot);
}

async function cleanupSlot(doctorId, slotStart) {
  await prisma.Appointment.deleteMany({
    where: {
      doctorId,
      slotStart,
    },
  });
}

async function bookSlot(token, doctorId, slotStart) {
  const response = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      doctorId,
      appointmentDate: slotStart.toISOString(),
      purpose: "Concurrent booking test",
    }),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { status: response.status, body };
}

async function main() {
  console.log(`API: ${API_URL}`);
  console.log(`Concurrent requests: ${CONCURRENT_REQUESTS}\n`);

  const { patient, doctor } = await findTestPatientAndDoctor();
  const slotStart = buildFutureSlot();

  console.log(`Patient: ${patient.email} (id ${patient.id})`);
  console.log(`Doctor:  ${doctor.name} (id ${doctor.id})`);
  console.log(`Slot:    ${slotStart.toISOString()}\n`);

  await cleanupSlot(doctor.id, slotStart);

  const token = tokenGenerate({
    id: patient.id,
    email: patient.email,
    name: patient.name,
    role: "patient",
  });

  const results = await Promise.all(
    Array.from({ length: CONCURRENT_REQUESTS }, () =>
      bookSlot(token, doctor.id, slotStart)
    )
  );

  const succeeded = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);
  const other = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log("Results:");
  console.log(`  201 Created:  ${succeeded.length}`);
  console.log(`  409 Conflict: ${conflicts.length}`);
  console.log(`  Other:        ${other.length}`);

  if (other.length > 0) {
    console.log("\nUnexpected responses:");
    for (const r of other) {
      console.log(`  HTTP ${r.status}:`, r.body);
    }
  }

  await cleanupSlot(doctor.id, slotStart);
  await prisma.$disconnect();

  const passed =
    succeeded.length === 1 &&
    conflicts.length === CONCURRENT_REQUESTS - 1 &&
    other.length === 0;

  if (passed) {
    console.log(
      `\nPASS: Exactly 1 of ${CONCURRENT_REQUESTS} concurrent bookings succeeded.`
    );
    process.exit(0);
  }

  console.error(
    `\nFAIL: Expected 1 success and ${CONCURRENT_REQUESTS - 1} conflicts.`
  );
  process.exit(1);
}

main().catch(async (err) => {
  console.error("Test error:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
