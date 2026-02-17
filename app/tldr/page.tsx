import Image from "next/image";

export default function TldrPage() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="relative h-[92vh] w-full max-w-6xl">
        <Image
          src="/tldr.jpg"
          alt="TLDR of the NUT-24 protocol"
          fill
          priority
          className="object-contain"
          sizes="100vw"
        />
      </div>
    </main>
  );
}
