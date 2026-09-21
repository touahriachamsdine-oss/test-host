import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/admin';
import { getMemberByEmail } from '@/lib/members';
import { rateLimit } from '@/lib/rate-limit';

function allowLogin(email: string): boolean {
  return rateLimit(`login:${email}`, 25, 15 * 60_000).allowed;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  useSecureCookies:
    process.env.AUTH_USE_SECURE_COOKIES !== undefined
      ? process.env.AUTH_USE_SECURE_COOKIES === 'true'
      : process.env.NODE_ENV === 'production',
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login'
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.toLowerCase().trim() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) {
          console.error('[auth:admin] missing credentials');
          return null;
        }
        if (!allowLogin(email)) {
          console.error(`[auth:admin] login rate-limited for ${email}`);
          return null;
        }

        const user = await getUserByEmail(email);
        if (!user) {
          console.error(`[auth:admin] user not found: ${email}`);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          console.error(`[auth:admin] wrong password: ${email}`);
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamDomain: user.teamDomain
        };
      }
    }),
    Credentials({
      name: 'member-credentials',
      id: 'member-credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) {
          console.error('[auth:member] missing credentials');
          return null;
        }
        if (!allowLogin(email)) {
          console.error(`[auth:member] login rate-limited for ${email}`);
          return null;
        }

        const member = await getMemberByEmail(email);
        if (!member) {
          console.error(`[auth:member] member not found: ${email}`);
          return null;
        }

        const valid = await bcrypt.compare(password, member.passwordHash);
        if (!valid) {
          console.error(`[auth:member] wrong password: ${email}`);
          return null;
        }

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: 'member',
          teamDomain: null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'team';
        token.teamDomain = (user as { teamDomain?: string | null }).teamDomain ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = ((token.role as string | undefined) ?? 'team') as
          | 'team'
          | 'reviewer'
          | 'admin';
        session.user.teamDomain = (token.teamDomain as string | null) ?? null;
      }
      return session;
    }
  }
});