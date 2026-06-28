// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')

declare global {
  // eslint-disable-next-line no-var
  var prisma: unknown
}

export const prisma = (global.prisma as InstanceType<typeof PrismaClient>) || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
