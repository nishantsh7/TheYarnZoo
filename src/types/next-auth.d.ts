
import type { DefaultSession, DefaultUser } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt'; // Renamed to avoid conflict
import type { UserRole } from '.'; // Import UserRole

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string; // Add your custom 'id' property
      role: UserRole; // Add role to session user
    } & DefaultSession['user']; // DefaultSession['user'] contains properties like name, email, image
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    // You can add other custom properties to the User object if needed
    // For example, if your authorize function returns more fields.
    // These fields will be available in the `user` object passed to the JWT and session callbacks.
    role: UserRole; // Add role to NextAuth User type
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends NextAuthJWT {
    // This is the shape of the token object.
    // We add our custom user object to it.
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: UserRole; // Add role to JWT user object
      // image?: string | null; // if you include image in your user object
    };
    // You can add other custom properties to the token here
    // e.g. accessToken?: string;
  }
}

