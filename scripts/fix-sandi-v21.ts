/** Perbaiki sandi akun ketua tim perawat demo memakai mekanisme hash aplikasi. */
import { scryptSync, randomBytes } from 'crypto'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

async function main() {
  const hash = hashPassword('kredens123')
  await db.user.update({
    where: { email: 'ketuatim.perawat@kredens.go.id' },
    data: { passwordHash: hash },
  })
  console.log('Sandi ketuatim.perawat@ diperbaiki (kredens123)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
