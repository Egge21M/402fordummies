"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export function TldrModal() {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 border-[6px] border-primary bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={() => router.back()}
    >
      <div
        className="relative mx-auto h-full w-full max-w-5xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src="/tldr.jpg"
          alt="TLDR of the NUT-24 protocol"
          fill
          priority
          className="object-contain"
          sizes="100vw"
        />
      </div>
    </div>
  );
}
