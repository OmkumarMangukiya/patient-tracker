import dotenv from 'dotenv';
dotenv.config(); // Ensure DATABASE_URL is available whether imported by the server or a standalone script
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { withAccelerate } from '@prisma/extension-accelerate';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL || '';
const isAccelerate = dbUrl.startsWith('prisma://') || dbUrl.startsWith('prisma+postgres://');

let prisma;

if (isAccelerate) {
  prisma = new PrismaClient({
    accelerateUrl: dbUrl,
  }).$extends(withAccelerate());
} else {
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
}

export default prisma;