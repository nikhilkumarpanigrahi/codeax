"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import confetti from "canvas-confetti";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Gem,
  GitBranch,
  Loader,
  Lock,
  Mail,
  PartyPopper,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useRef, useState } from "react";

type AuthComponentProps = {
  logo?: React.ReactNode;
  brandName?: string;
  onComplete?: (payload: { email: string; password: string }) => Promise<void> | void;
};

type Step = "email" | "password" | "confirm";
type ModalState = "closed" | "loading" | "error" | "success";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-gh-border bg-gh-card text-gh-heading transition-all duration-300",
  {
    variants: {
      size: {
        default: "h-10 px-5 text-sm font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

type GlassButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

function GlassButton({ className, size, ...props }: GlassButtonProps) {
  return <button className={cn(buttonVariants({ size }), className)} {...props} />;
}

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <path d="M21.8 12.23c0-.7-.06-1.37-.18-2.02H12v3.83h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.45Z" fill="#4285F4" />
    <path d="M12 22c2.75 0 5.05-.91 6.73-2.47l-3.3-2.56c-.92.62-2.1.98-3.43.98-2.64 0-4.87-1.79-5.66-4.19H2.92v2.63A10 10 0 0 0 12 22Z" fill="#34A853" />
    <path d="M6.34 13.76A5.99 5.99 0 0 1 6 12c0-.61.1-1.2.34-1.76V7.61H2.92A10 10 0 0 0 2 12c0 1.62.39 3.16 1.08 4.39l3.26-2.63Z" fill="#FBBC05" />
    <path d="M12 5.98c1.5 0 2.85.52 3.91 1.53l2.93-2.93C17.04 2.9 14.74 2 12 2A10 10 0 0 0 2.92 7.61l3.42 2.63c.79-2.4 3.02-4.26 5.66-4.26Z" fill="#EA4335" />
  </svg>
);

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.08.55-.17.55-.38v-1.46c-2.23.49-2.7-1.07-2.7-1.07-.36-.91-.89-1.15-.89-1.15-.72-.5.06-.49.06-.49.8.06 1.22.82 1.22.82.71 1.23 1.88.88 2.34.67.07-.52.28-.88.5-1.08-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.35-1.02.08-2.12 0 0 .67-.21 2.2.82A7.6 7.6 0 0 1 8 4.84c.68 0 1.36.09 2 .27 1.53-1.03 2.2-.82 2.2-.82.43 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.88 3.75-3.67 3.95.29.25.54.73.54 1.47v2.18c0 .21.14.46.55.38A8 8 0 0 0 8 0Z" />
  </svg>
);

function DefaultLogo() {
  return (
    <div className="rounded-md bg-gh-green p-1.5 text-white">
      <Gem className="h-4 w-4" />
    </div>
  );
}

function fireConfetti() {
  const defaults = { startVelocity: 34, spread: 360, ticks: 60, zIndex: 200 };
  confetti({ ...defaults, particleCount: 60, origin: { x: 0, y: 1 }, angle: 60 });
  confetti({ ...defaults, particleCount: 60, origin: { x: 1, y: 1 }, angle: 120 });
}

export function AuthComponent({ logo = <DefaultLogo />, brandName = "Codeax" , onComplete }: AuthComponentProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("closed");
  const [modalMessage, setModalMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const isPasswordValid = password.length >= 6;
  const isConfirmValid = confirmPassword.length >= 6;

  const proceed = async () => {
    if (step === "email" && isEmailValid) setStep("password");
    else if (step === "password" && isPasswordValid) setStep("confirm");
    else if (step === "confirm" && isConfirmValid) {
      if (password !== confirmPassword) {
        setModalState("error");
        setModalMessage("Passwords do not match.");
        return;
      }

      setModalState("loading");
      setModalMessage("Creating your account...");

      timeoutRef.current = setTimeout(async () => {
        try {
          await onComplete?.({ email, password });
          setModalState("success");
          setModalMessage("Welcome aboard!");
          fireConfetti();
        } catch {
          setModalState("error");
          setModalMessage("Signup failed. Please try again.");
        }
      }, 1400);
    }
  };

  const goBack = () => {
    if (step === "confirm") setStep("password");
    else if (step === "password") setStep("email");
  };

  const closeModal = () => {
    setModalState("closed");
    setModalMessage("");
  };

  return (
    <div className="hero-grid relative min-h-screen overflow-hidden bg-gh-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(42,209,120,0.2),transparent_34%),radial-gradient(circle_at_85%_75%,rgba(83,183,255,0.2),transparent_40%)]" />

      <div className="relative z-10 flex items-center gap-2 px-5 py-5">
        {logo}
        <span className="text-sm font-bold text-gh-heading">{brandName}</span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md px-4 pb-10 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
          className="glass-card rounded-3xl p-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <div className="space-y-1 text-center">
                <h1 className="text-3xl font-bold text-gh-heading">
                  {step === "email" ? "Create account" : step === "password" ? "Set password" : "Confirm password"}
                </h1>
                <p className="text-sm text-gh-text/85">
                  {step === "email"
                    ? "Start with your email or continue with social auth."
                    : "Use at least 6 characters for a strong password."}
                </p>
              </div>

              {step === "email" ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <GlassButton size="default" className="flex-1 gap-2 hover:border-gh-green/70 hover:bg-gh-bg/70">
                      <GoogleIcon className="h-5 w-5" />
                      Google
                    </GlassButton>
                    <GlassButton size="default" className="flex-1 gap-2 hover:border-gh-green/70 hover:bg-gh-bg/70">
                      <GitHubIcon className="h-5 w-5" />
                      GitHub
                    </GlassButton>
                  </div>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gh-text/70" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void proceed();
                        }
                      }}
                      placeholder="Email"
                      className="w-full rounded-xl border border-gh-border bg-gh-bg/70 py-3 pl-10 pr-3 text-sm text-gh-heading outline-none transition focus:border-gh-green"
                    />
                  </div>
                </div>
              ) : null}

              {step === "password" ? (
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gh-text/70" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full rounded-xl border border-gh-border bg-gh-bg/70 py-3 pl-10 pr-10 text-sm text-gh-heading outline-none transition focus:border-gh-green"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gh-text/80"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              ) : null}

              {step === "confirm" ? (
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gh-text/70" />
                  <input
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="w-full rounded-xl border border-gh-border bg-gh-bg/70 py-3 pl-10 pr-10 text-sm text-gh-heading outline-none transition focus:border-gh-green"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gh-text/80"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-2">
                {step !== "email" ? (
                  <GlassButton type="button" size="icon" onClick={goBack} aria-label="Go back">
                    <ArrowLeft className="h-4 w-4" />
                  </GlassButton>
                ) : (
                  <span />
                )}

                <GlassButton
                  type="button"
                  onClick={() => void proceed()}
                  className="gap-2 border-gh-green bg-gh-green/15 text-gh-heading hover:bg-gh-green/25"
                  disabled={
                    (step === "email" && !isEmailValid) ||
                    (step === "password" && !isPasswordValid) ||
                    (step === "confirm" && !isConfirmValid)
                  }
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </GlassButton>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {modalState !== "closed" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative mx-4 w-full max-w-sm rounded-2xl border border-gh-border bg-gh-card p-6 text-center"
            >
              {(modalState === "error" || modalState === "success") ? (
                <button type="button" onClick={closeModal} className="absolute right-2 top-2 p-1 text-gh-text/70 hover:text-gh-heading">
                  <X className="h-4 w-4" />
                </button>
              ) : null}

              <div className="mx-auto mb-3 w-fit">
                {modalState === "loading" ? <Loader className="h-10 w-10 animate-spin text-gh-green" /> : null}
                {modalState === "error" ? <AlertCircle className="h-10 w-10 text-red-400" /> : null}
                {modalState === "success" ? <PartyPopper className="h-10 w-10 text-gh-green" /> : null}
              </div>

              <p className="text-base font-medium text-gh-heading">{modalMessage}</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default AuthComponent;
