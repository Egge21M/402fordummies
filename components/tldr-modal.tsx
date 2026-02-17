"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function TldrModal() {
  const router = useRouter();

  const close = () => {
    router.push("/");
  };

  return (
    <div
      className="fixed inset-0 z-50 border-[6px] border-primary bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <button
        onClick={close}
        className="absolute top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-foreground shadow-lg hover:bg-primary/90"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
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
