"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface TldrModalProps {
  onClose: () => void;
}

export function TldrModal({ onClose }: TldrModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg hover:bg-yellow-300"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div
        className="relative h-[80vh] w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
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
