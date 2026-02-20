"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent, type RefObject } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface TldrModalProps {
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  title?: string;
}

export function TldrModal({ onClose, initialFocusRef, title = "TL;DR of NUT-24" }: TldrModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 220);
  }, [onClose]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.classList.add("modal-open");
    const focusTarget = initialFocusRef?.current ?? closeButtonRef.current;
    focusTarget?.focus();

    return () => {
      document.body.classList.remove("modal-open");
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [initialFocusRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  function onOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === overlayRef.current) {
      requestClose();
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 dummies-modal-overlay"
      data-state={isVisible ? "open" : "closed"}
      onMouseDown={onOverlayMouseDown}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          requestClose();
        }}
        ref={closeButtonRef}
        aria-label="Close TL;DR modal"
        className="dummies-pressable absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg transition-colors hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative h-[80vh] w-full max-w-5xl dummies-modal-panel"
        data-state={isVisible ? "open" : "closed"}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        <p id={descriptionId} className="sr-only">
          Visual TL;DR image for the NUT-24 request and payment flow.
        </p>
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
