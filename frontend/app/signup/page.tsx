"use client";

import { useRouter } from "next/navigation";
import { AuthComponent } from "@/components/ui/sign-up";

export default function SignupPage() {
  const router = useRouter();

  return (
    <AuthComponent
      brandName="Codeax"
      onComplete={async () => {
        router.replace("/login");
      }}
    />
  );
}
