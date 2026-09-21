import type { DefaultSession } from 'next-auth';

export type AppRole = 'team' | 'reviewer' | 'admin' | 'member';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      teamDomain: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    role?: AppRole;
    teamDomain?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: AppRole;
    teamDomain?: string | null;
  }
}