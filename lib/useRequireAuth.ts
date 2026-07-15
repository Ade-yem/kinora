"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useRequireAuth() {
  const router = useRouter();
  return useSession({ required: true, onUnauthenticated: () => router.push("/login") });
}
