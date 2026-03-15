import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

const githubClientId = process.env.GITHUB_CLIENT_ID || "";
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET || "";
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

const providers: any[] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const username = credentials?.username?.trim() || "";
      const password = credentials?.password?.trim() || "";

      const expectedUser = process.env.CODEAX_AUTH_USERNAME || "admin";
      const expectedPass = process.env.CODEAX_AUTH_PASSWORD || "codeax123";

      if (username !== expectedUser || password !== expectedPass) {
        return null;
      }

      return {
        id: "codeax-local-user",
        name: expectedUser,
        email: `${expectedUser}@local.codeax`,
      };
    },
  }),
];

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  );
}

if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}

const handler = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
