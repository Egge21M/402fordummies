"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDotDashed,
  Coins,
  LockKeyhole,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const acceptedMints = ["https://mint.minibits.cash/Bitcoin", "https://mint.coinos.io"];

const flowSteps = [
  {
    title: "Client requests protected resource",
    detail: "A normal HTTP request is sent without payment headers.",
    packet: "GET /premium/guide\nHost: 402fordummies.com",
  },
  {
    title: "Server returns HTTP 402 + X-Cashu",
    detail: "The response contains a NUT-18 encoded payment request in a header.",
    packet: "HTTP/1.1 402 Payment Required\nX-Cashu: eyJhIjoyMSwidSI6InNhdCIsIm0iOlt...",
  },
  {
    title: "Client decodes and evaluates request",
    detail: "The wallet checks amount, unit, accepted mints, and optional NUT-10 lock conditions.",
    packet: "decode(X-Cashu) -> { a, u, m, nut10 }",
  },
  {
    title: "Client retries with cashuB token",
    detail: "Token is built from a valid mint and sent in X-Cashu.",
    packet: "GET /premium/guide\nX-Cashu: cashuB...",
  },
  {
    title: "Server validates payment",
    detail: "Mint, unit, amount, and lock conditions are checked before serving content.",
    packet: "HTTP/1.1 200 OK\n(or 400 Bad Request on failure)",
  },
];

type ValidationResult = {
  label: string;
  pass: boolean;
  detail: string;
};

type DemoPhase = 0 | 1 | 2 | 3 | 4;

const demoPhases = [
  "Resource requested",
  "402 with X-Cashu",
  "Header decoded",
  "cashuB retry sent",
  "Server validation",
] as const;

const revealMotion =
  "motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none";

const demoCost = 21;

function encodeHeader(payload: object) {
  return btoa(JSON.stringify(payload));
}

function decodeHeader(encoded: string) {
  return JSON.parse(atob(encoded));
}

export function Nut24Landing() {
  const [tokenAmount, setTokenAmount] = useState("21");
  const [unit, setUnit] = useState("sat");
  const [mint, setMint] = useState(acceptedMints[0]);
  const [lockConditionSatisfied, setLockConditionSatisfied] = useState(true);
  const [revealed, setRevealed] = useState<number[]>([]);

  const [demoStep, setDemoStep] = useState<DemoPhase>(0);
  const [decodedRequest, setDecodedRequest] = useState<null | Record<string, unknown>>(null);
  const [requestLog, setRequestLog] = useState<string[]>([]);
  const [responseLog, setResponseLog] = useState<string[]>(["Awaiting first request"]);
  const [validation, setValidation] = useState<ValidationResult[]>([]);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const paymentRequest = useMemo(
    () => ({
      a: demoCost,
      u: "sat",
      m: acceptedMints,
      nut10: {
        kind: "P2PK",
        pubkey: "03b4...7e9",
      },
    }),
    []
  );

  const encodedHeader = useMemo(() => encodeHeader(paymentRequest), [paymentRequest]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.stepIndex);
          setRevealed((prev) => (prev.includes(index) ? prev : [...prev, index]));
        });
      },
      { threshold: 0.25 }
    );

    const nodes = document.querySelectorAll("[data-flow-step]");
    nodes.forEach((node) => observer.observe(node));

    return () => {
      nodes.forEach((node) => observer.unobserve(node));
      observer.disconnect();
    };
  }, []);

  function resetDemo() {
    setDemoStep(0);
    setDecodedRequest(null);
    setDecodeError(null);
    setRequestLog([]);
    setResponseLog(["Awaiting first request"]);
    setValidation([]);
  }

  function getNextStepLabel() {
    if (demoStep === 0) return "Step 1: Request protected resource";
    if (demoStep === 1) return "Step 2: Decode X-Cashu header";
    if (demoStep === 2) return "Step 3: Retry with cashuB token";
    if (demoStep === 3) return "Step 4: Run server validation";
    return "Flow complete";
  }

  function runNextStep() {
    if (demoStep === 0) {
      setRequestLog(["GET /premium/guide"]);
      setResponseLog(["HTTP/1.1 402 Payment Required", "X-Cashu: <encoded NUT-18 request>"]);
      setDemoStep(1);
      return;
    }

    if (demoStep === 1) {
      try {
        const decoded = decodeHeader(encodedHeader) as Record<string, unknown>;
        setDecodedRequest(decoded);
        setDecodeError(null);
        setResponseLog((prev) => [...prev, "Client decoded X-Cashu header successfully"]);
      } catch {
        setDecodedRequest(null);
        setDecodeError("Header decode failed: malformed X-Cashu payload");
        setResponseLog((prev) => [...prev, "Client failed to decode X-Cashu header"]);
      }
      setDemoStep(2);
      return;
    }

    if (demoStep === 2) {
      setRequestLog((prev) => [...prev, `GET /premium/guide\nX-Cashu: cashuB(token from ${mint})`]);
      setDemoStep(3);
      return;
    }

    if (demoStep === 3) {
      const amountValue = Number(tokenAmount);
      const checks: ValidationResult[] = [
        {
          label: "Mint allowed",
          pass: acceptedMints.includes(mint),
          detail: acceptedMints.includes(mint)
            ? "Mint appears in `m` array"
            : "Mint not included in server `m` array",
        },
        {
          label: "Unit matches",
          pass: unit === paymentRequest.u,
          detail: unit === paymentRequest.u ? "Client unit matches request" : "Client unit differs from server unit",
        },
        {
          label: "Amount sufficient",
          pass: Number.isFinite(amountValue) && amountValue >= paymentRequest.a,
          detail:
            Number.isFinite(amountValue) && amountValue >= paymentRequest.a
              ? "Token amount satisfies required amount"
              : "Token amount below required `a`",
        },
        {
          label: "NUT-10 lock satisfied",
          pass: lockConditionSatisfied,
          detail: lockConditionSatisfied
            ? "Lock condition proof provided"
            : "Missing required lock condition proof",
        },
      ];

      const allPass = checks.every((check) => check.pass) && !decodeError;
      setValidation(checks);
      setResponseLog((prev) => [
        ...prev,
        allPass
          ? "HTTP/1.1 200 OK - payment accepted"
          : "HTTP/1.1 400 Bad Request - token failed validation",
      ]);
      setDemoStep(4);
    }
  }

  const activeStepLabel = ["Ready", "402 received", "Header decoded", "Token submitted", "Server validated"][demoStep];

  const finalOk = validation.length > 0 && validation.every((item) => item.pass) && !decodeError;

  return (
    <main className="relative overflow-x-hidden">
      <section
        className={cn(
          "relative border-b px-6 pb-20 pt-24 sm:px-10 lg:px-16",
          revealMotion,
          "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
        )}
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 18%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 34%), radial-gradient(circle at 78% 22%, color-mix(in oklab, var(--accent) 36%, transparent), transparent 30%)",
          }}
        />

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <div className="flex items-center justify-between">
            <Badge
              className="w-fit rounded-none border border-border bg-card px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
              variant="secondary"
            >
              NUT-24 / HTTP 402 + Cashu
            </Badge>
            <ModeToggle />
          </div>

          <h1
            className={cn(
              "max-w-4xl text-4xl leading-tight font-semibold text-balance sm:text-6xl",
              revealMotion,
              "motion-safe:animate-in motion-safe:fade-in"
            )}
          >
            Stop hard-coding paywalls.
            <span className="text-primary"> Ship HTTP-native micropayments.</span>
          </h1>
          <p
            className={cn(
              "text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-base",
              revealMotion,
              "motion-safe:animate-in motion-safe:fade-in"
            )}
          >
            402forDummies is a practical entry point to the NUT-24 flow. Your server responds with
            a standard <code>402 Payment Required</code>, the client decodes the payment request, retries
            with <code>cashuB</code>, and unlocks access after validation.
          </p>
          <div
            className={cn(
              "flex flex-wrap items-center gap-3",
              revealMotion,
              "motion-safe:animate-in motion-safe:fade-in"
            )}
          >
            <Button asChild size="lg" className="rounded-none">
              <Link href="/tldr">Give me the TL;DR</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-none">
              <a href="#demo">
                Try Interactive Demo
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["NUT-24", "HTTP 402 payment negotiation"],
              ["NUT-18", "Encoded request structure"],
              ["NUT-12", "Token handling for clients"],
            ].map(([label, text]) => (
              <Card
                key={label}
                className={cn(
                  "border-border/80 bg-card/70 backdrop-blur-xs",
                  revealMotion,
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
                )}
              >
                <CardHeader>
                  <CardTitle className="text-[11px] uppercase tracking-[0.16em]">{label}</CardTitle>
                  <CardDescription>{text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">Flow that falls into place</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
                Scroll through the request/response lifecycle used by NUT-24.
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="outline" className="rounded-none">
                5-step handshake
              </Badge>
              <Button asChild variant="secondary" className="rounded-none">
                <a href="https://github.com/cashubtc/nuts/blob/main/24.md" target="_blank" rel="noreferrer">
                  Read NUT-24 Spec
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-5">
            {flowSteps.map((step, index) => (
              <Card
                key={step.title}
                data-flow-step
                data-step-index={index}
                data-visible={revealed.includes(index)}
                className={cn(
                  "border-border/80 bg-gradient-to-r from-card to-secondary/20 opacity-0 translate-y-8 scale-[0.985]",
                  revealMotion,
                  "data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 data-[visible=true]:scale-100"
                )}
                style={{ transitionDelay: `${index * 110}ms` }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-[0.08em]">
                    <span className="inline-flex size-6 items-center justify-center border border-border text-[10px]">
                      {index + 1}
                    </span>
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.detail}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-background/80 overflow-x-auto border p-4 font-mono text-[11px] leading-relaxed">
                    {step.packet}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="border-t px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">Interactive multi-step demo</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Walk through the actual lifecycle: 402 header issuance, client-side decode, retry with
                payment token, and final server validation.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-none border">
              Current step: {activeStepLabel}
            </Badge>
          </div>

          <div className="grid gap-2 sm:grid-cols-5">
            {demoPhases.map((phase, index) => {
              const complete = index < demoStep;
              const active = index === demoStep;
              return (
                <div
                  key={phase}
                  className={cn(
                    "border p-3",
                    revealMotion,
                    complete && "border-emerald-500/40 bg-emerald-500/5",
                    active && "border-primary/40 bg-primary/5"
                  )}
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Step {index + 1}</p>
                  <p className="mt-1 text-xs font-medium leading-relaxed">{phase}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className={cn("border-border/80", revealMotion)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-[0.08em]">
                  <Sparkles className="size-4" />
                  Client Controls
                </CardTitle>
                <CardDescription>Configure the client token before running validation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Token amount</Label>
                    <Input
                      id="amount"
                      value={tokenAmount}
                      onChange={(event) => setTokenAmount(event.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger id="unit" className="w-full rounded-none">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sat">sat</SelectItem>
                        <SelectItem value="usd">usd</SelectItem>
                        <SelectItem value="api">api</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mint">Mint URL</Label>
                  <Select value={mint} onValueChange={setMint}>
                    <SelectTrigger id="mint" className="w-full rounded-none">
                      <SelectValue placeholder="Select mint" />
                    </SelectTrigger>
                    <SelectContent>
                      {acceptedMints.map((mintUrl) => (
                        <SelectItem key={mintUrl} value={mintUrl}>
                          {mintUrl}
                        </SelectItem>
                      ))}
                      <SelectItem value="https://mint.invalid">https://mint.invalid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <label className="flex items-center gap-3 border p-3 text-xs">
                  <input
                    type="checkbox"
                    checked={lockConditionSatisfied}
                    onChange={(event) => setLockConditionSatisfied(event.target.checked)}
                    className="accent-primary size-3"
                  />
                  Include proof for required NUT-10 lock condition
                </label>

                <Separator />

                <div className="flex flex-wrap gap-3">
                  <Button onClick={runNextStep} disabled={demoStep === 4}>
                    {getNextStepLabel()}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                  <Button variant="outline" onClick={resetDemo}>
                    <RotateCcw data-icon="inline-start" />
                    Reset flow
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className={cn("border-border/80 bg-card/80", revealMotion)}>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-[0.08em]">Protocol Inspector</CardTitle>
                <CardDescription>Server headers, decoded payload, and validation decisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-[0.12em]">Request log</p>
                    <pre className="bg-background/80 min-h-28 overflow-x-auto border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                      {requestLog.length > 0 ? requestLog.join("\n\n") : "No requests sent yet"}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-[11px] uppercase tracking-[0.12em]">Response log</p>
                    <pre className="bg-background/80 min-h-28 overflow-x-auto border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                      {responseLog.join("\n")}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-[0.12em]">Server header (raw)</p>
                  <pre className="bg-background/80 overflow-x-auto border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {`X-Cashu: ${encodedHeader}`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-[0.12em]">Decoded on client</p>
                  <pre className="bg-background/80 min-h-32 overflow-x-auto border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {decodedRequest ? JSON.stringify(decodedRequest, null, 2) : "Run step 2 to decode X-Cashu"}
                  </pre>
                  {decodeError ? (
                    <p className="inline-flex items-center gap-2 text-xs text-destructive">
                      <CircleDotDashed className="size-3.5" />
                      {decodeError}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-[0.12em]">Validation checks</p>
                  <div className="space-y-2">
                    {validation.length === 0 ? (
                      <p className="text-muted-foreground border p-3 text-xs">Run until final step to evaluate checks.</p>
                    ) : (
                      validation.map((item) => (
                        <div key={item.label} className="flex items-start justify-between gap-4 border p-3">
                          <div>
                            <p className="text-xs font-medium">{item.label}</p>
                            <p className="text-muted-foreground mt-1 text-xs">{item.detail}</p>
                          </div>
                          <Badge variant={item.pass ? "secondary" : "destructive"} className="rounded-none">
                            {item.pass ? "pass" : "fail"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 border-t">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Final status</p>
                <p className="text-sm">
                  {validation.length === 0 ? (
                    "No final status yet"
                  ) : finalOk ? (
                    <span className="inline-flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="size-4" />
                      200 OK - payment accepted, content unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-orange-600">
                      <ShieldAlert className="size-4" />
                      400 Bad Request - payment request checks failed
                    </span>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  This demo follows NUT-24 expectations: 402 with encoded request, client decode, token retry,
                  then strict server-side checks.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <Badge variant="outline" className="rounded-none">
                    Required amount: {paymentRequest.a} sat
                  </Badge>
                  <Badge variant="outline" className="rounded-none">
                    Accepted mints: {paymentRequest.m.length}
                  </Badge>
                  <Badge variant="outline" className="rounded-none">
                    <LockKeyhole className="mr-1 size-3" />
                    NUT-10 lock check
                  </Badge>
                  <Badge variant="outline" className="rounded-none">
                    <Coins className="mr-1 size-3" />
                    Header + token flow
                  </Badge>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
