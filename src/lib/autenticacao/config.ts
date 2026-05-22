import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '../banco/conexao'
import { getRoleLevel } from './utilidades'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  events: {
    async createUser({ user }) {
      if (!user.role) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'USER' },
        })
      }
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'RememberMe', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Credenciais inválidas')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Credenciais inválidas')
        }

        if (!user.isActive) {
          throw new Error('Conta desativada')
        }

        if (!user.isAccountActive) {
          throw new Error('Conta nao verificada. Verifique seu email para o codigo de confirmacao.')
        }

        const rememberMe = credentials.rememberMe === 'true'
        const rememberUntil = rememberMe ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

        if (rememberMe) {
          await prisma.user.update({
            where: { id: user.id },
            data: { rememberUntil },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || 'USER',
          roleLevel: getRoleLevel(user.role),
          permissions: user.permissions,
          rememberUntil: rememberUntil?.toISOString() || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'USER'
        token.roleLevel = (user as any).roleLevel || getRoleLevel((user as any).role)
        token.permissions = (user as any).permissions || null
        token.rememberUntil = (user as any).rememberUntil || null
      }
      if (!token.roleLevel && token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string }, select: { role: true, permissions: true, rememberUntil: true } })
        if (dbUser) {
          token.role = dbUser.role || 'USER'
          token.roleLevel = getRoleLevel(dbUser.role)
          token.permissions = dbUser.permissions
          token.rememberUntil = dbUser.rememberUntil?.toISOString() || null
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).roleLevel = token.roleLevel
        ;(session.user as any).permissions = token.permissions || null
        ;(session.user as any).rememberUntil = token.rememberUntil
      }
      return session
    },
  },
}
