"use client";

import { useRouter } from "next/navigation";
import { TldrModal } from "@/components/tldr-modal";

export default function TldrInterceptedPage() {
  const router = useRouter();
  
  return <TldrModal onClose={() => router.push("/")} />;
}
