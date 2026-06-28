import { getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.id   = user.id
        token.plan = (user as any).plan ?? 'FREE'
      }
      // Refresh plan din DB la fiecare request
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { plan: true } })
          if (dbUser) token.plan = dbUser.plan
        } catch {}
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        session.user.id   = token.id
        session.user.plan = token.plan ?? 'FREE'
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}

export const getSession = () => getServerSession(authOptions)
