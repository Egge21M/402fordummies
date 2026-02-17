"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
      {/* ===== HERO SECTION ===== */}
      <section
        className={cn(
          "relative bg-primary px-6 pb-24 pt-20 sm:px-10 lg:px-16",
          revealMotion,
          "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <Badge
              className="w-fit border-2 border-foreground bg-primary px-3 py-1 text-xs uppercase tracking-[0.2em] text-foreground"
              variant="secondary"
            >
              NUT-24 / HTTP 402 + Cashu
            </Badge>
          </div>

          {/* Logo + headline */}
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Image
              src="/for-dummies-logo.png"
              alt="For Dummies logo"
              width={100}
              height={100}
              className="shrink-0 w-20 h-20 sm:w-24 sm:h-24"
              priority
            />
            <h1
              className={cn(
                "text-5xl leading-tight font-bold sm:text-7xl",
                revealMotion,
                "motion-safe:animate-in motion-safe:fade-in"
              )}
            >
              <span className="dummies-highlight">
                <span className="font-bold">402</span>{" "}
                <span className="font-dummies">for dummies</span>
              </span>
            </h1>
          </div>

          <p
            className={cn(
              "max-w-2xl text-base leading-relaxed sm:text-lg text-foreground",
              revealMotion,
              "motion-safe:animate-in motion-safe:fade-in"
            )}
          >
            Everything you need to master HTTP 402 micropayments without the headaches.
            Your server responds with a standard <code className="bg-foreground text-primary px-1 rounded font-bold">402 Payment Required</code>,
            the client decodes the payment request, retries with <code className="bg-foreground text-primary px-1 rounded font-bold">cashuB</code>,
            and unlocks access after validation.
          </p>

          <div
            className={cn(
              "flex flex-wrap items-center gap-4",
              revealMotion,
              "motion-safe:animate-in motion-safe:fade-in"
            )}
          >
            <Button
              asChild
              size="lg"
              className="h-auto rounded-md border-2 border-foreground bg-primary px-6 py-3 text-sm font-bold text-foreground shadow-[4px_4px_0_oklch(0.15_0_0/30%)] hover:bg-primary/90"
            >
              <Link href="/tldr">Give me the TL;DR</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-auto rounded-md border-2 border-foreground bg-white px-6 py-3 text-sm font-bold text-foreground shadow-[4px_4px_0_oklch(0.15_0_0/30%)] hover:bg-white/90"
            >
              <a href="#demo">
                Try Interactive Demo
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>

          {/* NUT cards */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              ["NUT-24", "HTTP 402 payment negotiation"],
              ["NUT-18", "Encoded request structure"],
              ["NUT-12", "Token handling for clients"],
            ].map(([label, text]) => (
              <Card
                key={label}
                className={cn(
                  "border-foreground/30 bg-foreground",
                  revealMotion,
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
                )}
              >
                <CardHeader>
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{label}</CardTitle>
                  <CardDescription className="text-background/80">{text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ANGLED SEPARATOR (hero → flow) ===== */}
      <div className="h-6 bg-primary dummies-separator-bottom" />

      {/* ===== FLOW SECTION ===== */}
      <section className="px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold sm:text-5xl">Flow that falls into place</h2>
              <p className="text-muted-foreground mt-2 max-w-2xl text-base sm:text-lg">
                Scroll through the request/response lifecycle used by NUT-24.
              </p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="outline">
                5-step handshake
              </Badge>
              <Button asChild variant="secondary">
                <a href="https://github.com/cashubtc/nuts/blob/main/24.md" target="_blank" rel="noreferrer">
                  Read NUT-24 Spec
                </a>
              </Button>
            </div>
          </div>

          <div className="grid gap-5">
            {flowSteps.map((step, index) => (
              <div key={step.title}>
                <Card
                  data-flow-step
                  data-step-index={index}
                  data-visible={revealed.includes(index)}
                  className={cn(
                    "opacity-0 translate-y-8 scale-[0.985]",
                    revealMotion,
                    "data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 data-[visible=true]:scale-100"
                  )}
                  style={{ transitionDelay: `${index * 110}ms` }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.08em]">
                      <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-foreground bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                      {step.title}
                    </CardTitle>
                    <CardDescription>{step.detail}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-foreground/5 overflow-x-auto rounded-md border-2 border-border p-4 font-mono text-xs leading-relaxed">
                      {step.packet}
                    </pre>
                  </CardContent>
                </Card>
                {/* Speech bubble tip after step 2 */}
                {index === 1 && (
                  <div className="dummies-speech-bubble ml-10 mt-4 text-sm">
                    <strong>What is HTTP 402?</strong> It&apos;s a status code reserved for &quot;Payment Required&quot; &mdash; and NUT-24 finally gives it a real purpose!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEMO SECTION ===== */}
      <section id="demo" className="px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold sm:text-4xl">Interactive multi-step demo</h2>
              <p className="text-muted-foreground mt-2 text-base">
                Walk through the actual lifecycle: 402 header issuance, client-side decode, retry with
                payment token, and final server validation.
              </p>
            </div>
            <Badge variant="secondary" className="border-2 border-border">
              Current step: {activeStepLabel}
            </Badge>
          </div>

          {/* Demo phase indicators */}
          <div className="grid gap-2 sm:grid-cols-5">
            {demoPhases.map((phase, index) => {
              const complete = index < demoStep;
              const active = index === demoStep;
              return (
                <div
                  key={phase}
                  className={cn(
                    "rounded-md border-2 border-border p-3",
                    revealMotion,
                    complete && "border-emerald-600 bg-emerald-500/10",
                    active && "border-primary bg-primary/15"
                  )}
                >
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Step {index + 1}</p>
                  <p className="mt-1 text-sm font-bold leading-relaxed">{phase}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Client Controls */}
            <Card className={cn(revealMotion)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-[0.08em]">
                  <Sparkles className="size-4 text-primary" />
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
                      <SelectTrigger id="unit" className="w-full">
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
                    <SelectTrigger id="mint" className="w-full">
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

                <div className="dummies-tip text-sm">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={lockConditionSatisfied}
                      onChange={(event) => setLockConditionSatisfied(event.target.checked)}
                      className="accent-primary size-3.5"
                    />
                    Include proof for required NUT-10 lock condition
                  </label>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={runNextStep}
                    disabled={demoStep === 4}
                    className="shadow-[3px_3px_0_oklch(0.15_0_0/30%)]"
                  >
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

            {/* Protocol Inspector */}
            <Card className={cn("bg-card/80", revealMotion)}>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-[0.08em]">Protocol Inspector</CardTitle>
                <CardDescription>Server headers, decoded payload, and validation decisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Request log</p>
                    <pre className="bg-foreground/5 min-h-28 overflow-x-auto rounded-md border-2 border-border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {requestLog.length > 0 ? requestLog.join("\n\n") : "No requests sent yet"}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Response log</p>
                    <pre className="bg-foreground/5 min-h-28 overflow-x-auto rounded-md border-2 border-border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {responseLog.join("\n")}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Server header (raw)</p>
                  <pre className="bg-foreground/5 overflow-x-auto rounded-md border-2 border-border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {`X-Cashu: ${encodedHeader}`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Decoded on client</p>
                  <pre className="bg-foreground/5 min-h-32 overflow-x-auto rounded-md border-2 border-border p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {decodedRequest ? JSON.stringify(decodedRequest, null, 2) : "Run step 2 to decode X-Cashu"}
                  </pre>
                  {decodeError ? (
                    <p className="inline-flex items-center gap-2 text-sm text-destructive">
                      <CircleDotDashed className="size-3.5" />
                      {decodeError}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs uppercase tracking-[0.12em]">Validation checks</p>
                  <div className="space-y-2">
                    {validation.length === 0 ? (
                      <p className="text-muted-foreground rounded-md border-2 border-border p-3 text-sm">Run until final step to evaluate checks.</p>
                    ) : (
                      validation.map((item) => (
                        <div key={item.label} className="flex items-start justify-between gap-4 rounded-md border-2 border-border p-3">
                          <div>
                            <p className="text-sm font-bold">{item.label}</p>
                            <p className="text-muted-foreground mt-1 text-sm">{item.detail}</p>
                          </div>
                          <Badge variant={item.pass ? "secondary" : "destructive"}>
                            {item.pass ? "pass" : "fail"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 border-t">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Final status</p>
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
                <p className="text-muted-foreground text-sm">
                  This demo follows NUT-24 expectations: 402 with encoded request, client decode, token retry,
                  then strict server-side checks.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    Required amount: {paymentRequest.a} sat
                  </Badge>
                  <Badge variant="outline">
                    Accepted mints: {paymentRequest.m.length}
                  </Badge>
                  <Badge variant="outline">
                    <LockKeyhole className="mr-1 size-3" />
                    NUT-10 lock check
                  </Badge>
                  <Badge variant="outline">
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
