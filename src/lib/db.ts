import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    // Log kueri SQL hanya di lingkungan pengembangan — log produksi tetap bersih.
    process.env.NODE_ENV === 'production' ? undefined : { log: ['query'] },
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db