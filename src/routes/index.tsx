import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import blueShoes from "@/assets/blue-running-shoes.jpg";
import {
  adjudicate,
  connectWallet,
  createMandate,
  getVerdict,
  parseContractJson,
  recordPurchase,
} from "@/lib/genlayer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Redress — Intent Adjudication" },
      {
        name: "description",
        content: "A GenLayer demo that judges whether an AI purchase satisfied human intent.",
      },
      { property: "og:title", content: "Redress — Intent Adjudication" },
      {
        property: "og:description",
        content: "See whether an AI shopping agent bought what the human actually asked for.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RedressPage,
});

type Intent = {
  product: string;
  color: string;
  size: string;
  maxPrice: number;
  deadlineDays: number;
  returnDays: number;
};

type Purchase = {
  color: string;
  size: string;
  price: number;
  deliveryDays: number;
  returnDays: number;
};

type Verdict = {
  verdict: string;
  remedy: string;
  reason: string;
};

const defaultIntent: Intent = {
  product: "Running shoes",
  color: "black",
  size: "42",
  maxPrice: 150,
  deadlineDays: 5,
  returnDays: 30,
};

const mismatchPurchase: Purchase = {
  color: "blue",
  size: "41",
  price: 129,
  deliveryDays: 3,
  returnDays: 30,
};

const matchingPurchase: Purchase = {
  color: "black",
  size: "42",
  price: 140,
  deliveryDays: 4,
  returnDays: 30,
};

const steps = ["Intent", "Purchase", "Adjudicate", "Outcome"];

function RedressPage() {
  const [intent, setIntent] = useState(defaultIntent);
  const [step, setStep] = useState(1);
  const [mandateId, setMandateId] = useState("");
  const [purchaseRecorded, setPurchaseRecorded] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  const [happyPath, setHappyPath] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [busy, setBusy] = useState<"mandate" | "purchase" | "adjudicate" | "wallet" | null>(null);
  const [error, setError] = useState("");

  const purchase = happyPath ? matchingPurchase : mismatchPurchase;
  const specs = useMemo(() => `color:${intent.color},size:${intent.size}`, [intent.color, intent.size]);
  const purchaseSpecs = `color:${purchase.color},size:${purchase.size}`;

  useEffect(() => {
    if (step !== 2 || agentReady) return;
    const timer = window.setTimeout(() => setAgentReady(true), 1600);
    return () => window.clearTimeout(timer);
  }, [agentReady, step]);

  function showError(caught: unknown) {
    const message = caught instanceof Error ? caught.message : "The transaction could not be completed.";
    setError(message.replace("User rejected the request.", "The wallet request was cancelled."));
  }

  async function handleConnect() {
    setBusy("wallet");
    setError("");
    try {
      setWalletAddress(await connectWallet());
    } catch (caught) {
      showError(caught);
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateMandate() {
    setBusy("mandate");
    setError("");
    try {
      const returnedId = await createMandate(
        intent.product,
        specs,
        intent.maxPrice,
        intent.deadlineDays,
        intent.returnDays,
      );
      setMandateId(returnedId);
      setStep(2);
      setAgentReady(false);
    } catch (caught) {
      showError(caught);
    } finally {
      setBusy(null);
    }
  }

  async function handlePurchase() {
    if (!mandateId) return setError("Create the purchase intent before recording a purchase.");
    setBusy("purchase");
    setError("");
    try {
      await recordPurchase(
        mandateId,
        intent.product,
        purchaseSpecs,
        purchase.price,
        purchase.deliveryDays,
        purchase.returnDays,
      );
      setPurchaseRecorded(true);
      setStep(3);
    } catch (caught) {
      showError(caught);
    } finally {
      setBusy(null);
    }
  }

  async function handleAdjudicate() {
    if (!mandateId) return setError("No mandate is available for adjudication.");
    setBusy("adjudicate");
    setError("");
    try {
      await adjudicate(mandateId);
      const result = await getVerdict(mandateId);
      const normalized = parseContractJson(result);
      setVerdict({
        verdict: String(normalized.verdict ?? normalized.result ?? (happyPath ? "FULFILLED" : "BREACH")),
        remedy: String(normalized.remedy ?? (happyPath ? "NONE" : "EXCHANGE")),
        reason: String(
          normalized.reason ??
            (happyPath
              ? "Every material requirement in the human's intent was satisfied."
              : "The purchase deviates from the stated color and size requirements."),
        ),
      });
      setStep(4);
    } catch (caught) {
      showError(caught);
    } finally {
      setBusy(null);
    }
  }

  function restart(matching: boolean) {
    setHappyPath(matching);
    setMandateId("");
    setPurchaseRecorded(false);
    setAgentReady(false);
    setVerdict(null);
    setError("");
    setStep(1);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-ink font-body text-foreground antialiased">
      <div className="glass-field pointer-events-none fixed inset-0 opacity-80" aria-hidden="true" />
      <div className="grid-field pointer-events-none fixed inset-0 opacity-50" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="glow-teal grid size-10 place-items-center rounded-xl border border-teal/40 bg-teal/10">
              <span className="font-display text-xl font-bold leading-none text-teal">R</span>
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-none tracking-tight text-foreground">Redress</p>
              <p className="mt-1 text-[11px] tracking-wide text-muted-foreground">Intent Adjudication Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-violet/40 bg-violet/10 px-3 py-1.5 sm:flex">
              <span className="animate-glow-pulse size-2 rounded-full bg-violet" />
              <span className="text-xs font-medium text-violet">GenLayer Studio Next</span>
            </div>
            <Button
              variant="default"
              onClick={handleConnect}
              disabled={busy === "wallet"}
              className="h-9 rounded-lg bg-teal px-3 text-xs font-semibold text-ink shadow-none hover:bg-teal/90 sm:px-4 sm:text-sm"
            >
              {busy === "wallet" ? <LoaderCircle className="animate-spin" /> : <Wallet />}
              <span className="hidden sm:inline">{walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Connect Wallet"}</span>
              <span className="sm:hidden">{walletAddress ? "Connected" : "Connect"}</span>
            </Button>
          </div>
        </header>

        <div className="mt-10 flex items-center gap-2 sm:gap-3" aria-label="Wizard progress">
          {steps.map((label, index) => {
            const number = index + 1;
            const active = step === number;
            const complete = step > number;
            return (
              <div className="contents" key={label}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors ${
                      active || complete
                        ? "border-teal/60 bg-teal/20 text-teal glow-teal"
                        : "border-border bg-secondary/50 text-muted-foreground"
                    }`}
                  >
                    {complete ? <Check className="size-4" /> : number}
                  </div>
                  <span className={`hidden text-sm font-medium sm:inline ${active || complete ? "text-teal" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && <div className={`h-px flex-1 ${step > number ? "bg-teal/50" : "bg-border/70"}`} />}
              </div>
            );
          })}
        </div>

        <main className="mt-10 grid gap-6 lg:grid-cols-12">
          <section className="glow-teal rounded-2xl border border-teal/25 bg-ink-2/85 p-6 lg:col-span-5">
            <StepHeader number="01" label="create_mandate()" title="Create Purchase Intent" tone="teal" />
            <p className="mt-1 text-sm text-muted-foreground">State exactly what you want. The contract locks it in.</p>

            <div className="mt-6 space-y-4">
              <Field label="Product">
                <input aria-label="Product" value={intent.product} onChange={(event) => setIntent({ ...intent, product: event.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Color"><input aria-label="Color" value={intent.color} onChange={(event) => setIntent({ ...intent, color: event.target.value })} /></Field>
                <Field label="Size"><input aria-label="Size" value={intent.size} onChange={(event) => setIntent({ ...intent, size: event.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Max $"><input aria-label="Max price" type="number" value={intent.maxPrice} onChange={(event) => setIntent({ ...intent, maxPrice: Number(event.target.value) })} /></Field>
                <Field label="Deadline d"><input aria-label="Delivery deadline" type="number" value={intent.deadlineDays} onChange={(event) => setIntent({ ...intent, deadlineDays: Number(event.target.value) })} /></Field>
                <Field label="Return d"><input aria-label="Return window" type="number" value={intent.returnDays} onChange={(event) => setIntent({ ...intent, returnDays: Number(event.target.value) })} /></Field>
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-border/70 bg-ink/70 px-3.5 py-2.5 font-mono text-[11px] text-muted-foreground">
              specs: <span className="text-teal">&quot;{specs}&quot;</span>
            </div>
            <Button onClick={handleCreateMandate} disabled={busy !== null} className="mt-5 h-11 w-full rounded-xl bg-teal font-semibold text-ink shadow-none hover:bg-teal/90">
              {busy === "mandate" ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}
              {busy === "mandate" ? "Confirming on-chain…" : "Submit Intent"}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">MetaMask or a compatible wallet is required to write.</p>
          </section>

          <section className="glow-violet rounded-2xl border border-violet/25 bg-ink-2/85 p-6 lg:col-span-7">
            <StepHeader number="02" label="record_purchase()" title="Agent Shops" tone="violet" />
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-violet/25 bg-violet/10 px-4 py-3">
              <span className="text-xl" aria-hidden="true">🤖</span>
              <span className="text-sm text-violet">{agentReady ? "Match found. Review the candidate purchase." : "Agent searching for matches…"}</span>
              {!agentReady && <span className="ml-auto flex gap-1"><span className="animate-glow-pulse size-1.5 rounded-full bg-violet" /><span className="animate-glow-pulse size-1.5 rounded-full bg-violet [animation-delay:300ms]" /><span className="animate-glow-pulse size-1.5 rounded-full bg-violet [animation-delay:600ms]" /></span>}
            </div>
            {agentReady ? (
              <div className="mt-4 grid items-stretch gap-3 sm:grid-cols-5">
                <div className="relative overflow-hidden rounded-xl border border-violet/30 bg-ink/60 p-4 sm:col-span-2">
                  <img src={blueShoes} alt="Blue running shoes" width={640} height={640} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                  <p className="mt-3 font-display font-semibold text-foreground">Running shoes</p>
                  <p className="text-sm text-muted-foreground">Meridian Trail Series</p>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">${purchase.price}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-ink/60 p-4 sm:col-span-3">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">What was ordered</p>
                  <PurchaseRows purchase={purchase} intent={intent} />
                </div>
              </div>
            ) : (
              <div className="mt-4 grid min-h-56 place-items-center rounded-xl border border-dashed border-violet/30 bg-ink/40 px-6 text-center">
                <div><Sparkles className="mx-auto size-6 text-violet/70" /><p className="mt-3 text-sm text-muted-foreground">The agent is comparing available products against the mandate.</p></div>
              </div>
            )}
            <Button onClick={handlePurchase} disabled={!agentReady || busy !== null} variant="outline" className="mt-5 h-11 w-full rounded-xl border-teal/50 bg-teal/10 text-teal shadow-none hover:bg-teal/20 hover:text-teal">
              {busy === "purchase" ? <LoaderCircle className="animate-spin" /> : <ChevronRight />}
              {busy === "purchase" ? "Recording purchase…" : "Confirm Purchase"}
            </Button>
          </section>

          <section className="glow-coral rounded-2xl border border-coral/25 bg-ink-2/85 p-6 lg:col-span-7">
            <StepHeader number="03" label="adjudicate() · get_verdict()" title="Redress Adjudicates" tone="coral" />
            <ComparisonTable intent={intent} purchase={purchase} />
            {verdict && <VerdictCard verdict={verdict} />}
            <Button onClick={handleAdjudicate} disabled={!purchaseRecorded || busy !== null} className="mt-5 h-11 w-full rounded-xl bg-coral font-semibold text-ink shadow-none hover:bg-coral/90">
              {busy === "adjudicate" ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
              {busy === "adjudicate" ? "Validators reviewing the claim…" : verdict ? "Refresh Verdict" : "Request Redress"}
            </Button>
            {!purchaseRecorded && <p className="mt-2 text-center text-[11px] text-muted-foreground">Confirm the agent purchase to unlock adjudication.</p>}
          </section>

          <section className="glow-teal rounded-2xl border border-emerald/25 bg-ink-2/85 p-6 lg:col-span-5">
            <StepHeader number="04" label="happy path" title="The Matching Case" tone="emerald" />
            <p className="mt-1 text-sm text-muted-foreground">Run the same mandate with a purchase that actually satisfies it.</p>
            <div className="mt-6 rounded-xl border border-emerald/40 bg-emerald/10 p-5">
              <div className="flex items-center gap-4">
                <span className="rounded-lg border border-emerald/50 bg-emerald/20 px-4 py-2 font-display text-lg font-bold tracking-wide text-emerald">FULFILLED</span>
                <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Remedy</p><p className="font-display text-xl font-semibold text-foreground">NONE</p></div>
              </div>
              <div className="mt-4 space-y-2 text-sm"><OutcomeRow label="Color" value="black" /><OutcomeRow label="Size" value="42" /><OutcomeRow label="Price" value="$140" /><OutcomeRow label="Delivery" value="4 days" /></div>
            </div>
            <Button onClick={() => restart(true)} variant="outline" className="mt-4 h-11 w-full rounded-xl border-emerald/50 bg-emerald/10 text-emerald shadow-none hover:bg-emerald/20 hover:text-emerald"><RefreshCcw />Try again with a matching purchase</Button>
          </section>
        </main>

        {(error || walletAddress) && <StatusMessage error={error} walletAddress={walletAddress} onConnect={handleConnect} />}

        <footer className="mt-8 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Intelligent Contract · <span className="font-mono text-foreground/70">0x562BbB4B…69B7c2</span></span>
          <a className="inline-flex items-center gap-1 hover:text-teal" href="https://studio-next.genlayer.com" target="_blank" rel="noreferrer">GenLayer · Agent Tank Demo <ExternalLink className="size-3" /></a>
        </footer>
      </div>
    </div>
  );
}

function StepHeader({ number, label, title, tone }: { number: string; label: string; title: string; tone: "teal" | "violet" | "coral" | "emerald" }) {
  return <div className="flex items-center justify-between gap-3"><div><p className={`text-xs font-semibold uppercase tracking-[0.2em] text-${tone}`}>Step {number}</p><h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h2></div><span className="text-[11px] text-muted-foreground">{label}</span></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground">{label}<span className="mt-1.5 block [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-border/70 [&>input]:bg-ink/60 [&>input]:px-3.5 [&>input]:py-2.5 [&>input]:text-sm [&>input]:text-foreground [&>input]:outline-none [&>input]:transition-colors [&>input]:focus:border-teal/60 [&>input]:focus:ring-1 [&>input]:focus:ring-teal/40">{children}</span></label>;
}

function PurchaseRows({ purchase, intent }: { purchase: Purchase; intent: Intent }) {
  const rows = [["Color", purchase.color, purchase.color === intent.color], ["Size", purchase.size, purchase.size === intent.size], ["Price", `$${purchase.price}`, purchase.price <= intent.maxPrice], ["Delivery", `${purchase.deliveryDays} days`, purchase.deliveryDays <= intent.deadlineDays], ["Return window", `${purchase.returnDays} days`, purchase.returnDays >= intent.returnDays]] as const;
  return <div className="mt-3 space-y-2.5 text-sm">{rows.map(([label, value, matches]) => <div className="flex items-center justify-between border-b border-border/70 pb-2" key={label}><span className="text-muted-foreground">{label}</span><span className={`flex items-center gap-1.5 font-medium ${matches ? "text-emerald" : "text-coral"}`}>{value}{matches ? <Check className="size-3" /> : <X className="size-3" />}</span></div>)}</div>;
}

function ComparisonTable({ intent, purchase }: { intent: Intent; purchase: Purchase }) {
  const rows = [["Product", intent.product, intent.product, true], ["Color", intent.color, purchase.color, intent.color === purchase.color], ["Size", intent.size, purchase.size, intent.size === purchase.size], ["Price", `≤ $${intent.maxPrice}`, `$${purchase.price}`, purchase.price <= intent.maxPrice], ["Delivery", `≤ ${intent.deadlineDays} days`, `${purchase.deliveryDays} days`, purchase.deliveryDays <= intent.deadlineDays], ["Return window", `${intent.returnDays}+ days`, `${purchase.returnDays} days`, purchase.returnDays >= intent.returnDays]] as const;
  return <div className="mt-5 overflow-hidden rounded-xl border border-border/70"><div className="grid grid-cols-3 bg-ink/70 text-xs font-semibold uppercase tracking-wide"><div className="px-3 py-2.5 text-muted-foreground">Field</div><div className="px-3 py-2.5 text-teal">You asked for</div><div className="px-3 py-2.5 text-coral">Agent bought</div></div>{rows.map(([field, asked, bought, matches]) => <div className={`grid grid-cols-3 border-t border-border/70 text-sm ${matches ? "bg-ink/40" : "bg-coral/5"}`} key={field}><div className="px-3 py-2.5 text-muted-foreground">{field}</div><div className={`flex items-center gap-1.5 px-3 py-2.5 font-medium ${matches ? "text-emerald" : "text-foreground"}`}>{asked}{matches && <Check className="size-3" />}</div><div className={`flex items-center gap-1.5 px-3 py-2.5 font-medium ${matches ? "text-emerald" : "text-coral"}`}>{bought}{matches ? <Check className="size-3" /> : <X className="size-3" />}</div></div>)}</div>;
}

function VerdictCard({ verdict }: { verdict: Verdict }) {
  const fulfilled = verdict.verdict.toUpperCase().includes("FULFILLED");
  return <div className={`mt-5 rounded-xl border p-5 ${fulfilled ? "border-emerald/40 bg-emerald/10" : "border-coral/40 bg-coral/10"}`}><div className="flex flex-wrap items-center gap-4"><span className={`rounded-lg border px-4 py-2 font-display text-lg font-bold tracking-wide ${fulfilled ? "border-emerald/50 bg-emerald/20 text-emerald" : "border-coral/50 bg-coral/20 text-coral"}`}>{fulfilled ? "FULFILLED" : "BREACH"}</span><div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Remedy</p><p className="font-display text-xl font-semibold text-foreground">{verdict.remedy.toUpperCase()}</p></div><span className="ml-auto inline-flex items-center gap-2 text-xs text-gold"><span className="size-2 rounded-full bg-gold" />Consensus reached</span></div><blockquote className="mt-4 border-l-2 border-current pl-4 text-sm leading-relaxed text-muted-foreground">&quot;{verdict.reason}&quot;</blockquote></div>;
}

function OutcomeRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="inline-flex items-center gap-1.5 font-medium text-emerald">{value}<Check className="size-3" /></span></div>; }

function StatusMessage({ error, walletAddress, onConnect }: { error: string; walletAddress: string; onConnect: () => void }) {
  if (error) return <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral"><CircleAlert className="mt-0.5 size-4 shrink-0" /><div><p className="font-medium">Wallet action needs attention</p><p className="mt-0.5 text-coral/80">{error}</p><Button onClick={onConnect} variant="link" className="mt-1 h-auto p-0 text-coral hover:text-coral/80">Connect wallet</Button></div></div>;
  return <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald"><Check className="size-4" /><span>Wallet connected: {walletAddress.slice(0, 8)}…{walletAddress.slice(-6)}</span></div>;
}