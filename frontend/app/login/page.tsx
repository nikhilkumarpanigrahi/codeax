"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/dashboard");
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: nextPath,
      });

      if (!result || result.error) {
        setError("Invalid credentials. Try again.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startSocialSignIn = async (provider: "google" | "github") => {
    await signIn(provider, { callbackUrl: nextPath });
  };

  return (
    <main className="hero-grid relative min-h-screen overflow-hidden bg-gh-bg px-6 py-10 md:px-16 md:py-16">
      <div className="pointer-events-none absolute -left-40 top-8 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-sky-400/20 blur-3xl" />
      <motion.section
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card relative z-10 mx-auto max-w-md rounded-3xl p-8"
      >
        <p className="text-sm font-semibold tracking-[0.2em] text-gh-green">CODEAX SECURE ACCESS</p>
        <h1 className="mt-2 text-3xl font-bold text-gh-heading">Sign in</h1>
        <p className="mt-2 text-sm text-gh-text">Use credentials or continue with Google/GitHub.</p>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-6 space-y-4"
          onSubmit={onSubmit}
        >
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gh-text/80">Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-gh-border bg-gh-bg/70 px-3 py-2 text-sm text-gh-text outline-none ring-gh-green focus:ring-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gh-text/80">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-gh-border bg-gh-bg/70 px-3 py-2 text-sm text-gh-text outline-none ring-gh-green focus:ring-2"
              required
            />
          </div>

          {error ? <p className="text-sm text-amber-300">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gh-green px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </motion.form>

        <div className="my-5 h-px bg-gh-border" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-2"
        >
          <button
            type="button"
            onClick={() => void startSocialSignIn("google")}
            className="w-full rounded-xl border border-gh-border bg-gh-bg/70 px-4 py-2 text-sm font-semibold text-gh-heading transition hover:border-gh-green"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => void startSocialSignIn("github")}
            className="w-full rounded-xl border border-gh-border bg-gh-bg/70 px-4 py-2 text-sm font-semibold text-gh-heading transition hover:border-gh-green"
          >
            Continue with GitHub
          </button>
        </motion.div>

        <p className="mt-4 text-center text-sm text-gh-text">
          New user? <Link href="/signup" className="font-semibold text-gh-green">Create account</Link>
        </p>
      </motion.section>
    </main>
  );
}
