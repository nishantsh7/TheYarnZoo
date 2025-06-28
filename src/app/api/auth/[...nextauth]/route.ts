
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import type { UserDocument, UserRole } from '@/types';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Please provide email and password.');
        }

        const { db } = await connectToDatabase();
        const usersCollection = db.collection<UserDocument>('users');

        const user = await usersCollection.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('Invalid email or password.');
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!passwordMatch) {
          throw new Error('Invalid email or password.');
        }

        // Return the user object that will be encoded in the JWT
        return {
          id: user._id!.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // Include the role
          // Do not include passwordHash or other sensitive info
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // user is only available on initial sign in
      if (user) {
        token.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as UserRole, // Add role to token
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.user && session.user) {
        // Assign the custom user properties from the token to the session.user
        // Ensure type compatibility defined in next-auth.d.ts
        session.user = {
            ...session.user, // Keep default session properties like name, email, image
            id: (token.user as { id: string }).id, 
            role: (token.user as { role: UserRole }).role, // Add role to session
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Direct users to our custom login page
    // error: '/login', // Optionally, direct users to login page on error
  },
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development', // For debugging
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

