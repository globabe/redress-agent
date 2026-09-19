import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Scale, RefreshCw, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/redress-logo-symbol.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Redress — Accountability for the Agentic Era" },
      {
        name: "description",
        content:
          "When autonomous agents act on your behalf, Redress makes sure they stay true to your intent.",
      },
      {
        property: "og:title",
        content: "Redress — Accountability for the Agentic Era",
      },
      {
        property: "og:description",
        content:
          "When autonomous agents act on your behalf, Redress makes sure they stay true to your intent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-ink font-body text-foreground antialiased">
      <div
        className="glass-field pointer-events-none fixed inset-0 opacity-80"
        aria-hidden="true"
      />
      <div className="grid-field pointer-events-none fixed inset-0 opacity-50" aria-hidden="true" />

      <Header />

      <main className="relative">
        <Hero />
        <TheGap />
        <HowItWorks />
        <WhyGenLayer />
        <DemoScope />
        <Roadmap />
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="relative mx-auto max-w-5xl px-5 py-6 sm:px-8">
      <nav className="flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoAsset.url} alt="Redress" width={40} height={40} className="size-10" />
          <div>
            <p className="font-display text-lg font-semibold leading-none tracking-tight text-foreground">
              Redress
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Intent. Judgment. Remedy.
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/demo"
            className="hidden text-sm font-medium text-muted-foreground hover:text-teal sm:inline"
          >
            Demo
          </Link>
          <Link
            to="/demo-escrow"
            className="hidden items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 sm:inline-flex"
          >
            Try the escrow demo
          </Link>
          <Button
            asChild
            className="h-9 rounded-lg bg-teal px-3 text-xs font-semibold text-ink shadow-none hover:bg-teal/90 sm:px-4 sm:text-sm"
          >
            <Link to="/demo">
              Try the live demo
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16">
      <div className="flex flex-col items-center text-center">
        <div className="glow-teal grid size-20 place-items-center rounded-2xl border border-teal/40 bg-teal/10 sm:size-24">
          <img
            src={logoAsset.url}
            alt="Redress"
            width={96}
            height={96}
            className="size-14 sm:size-20"
          />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-teal">
          Intent. Judgment. Remedy.
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Accountability for the Agentic Era.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          When autonomous agents act on your behalf, Redress makes sure they stay true to your
          intent.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-xl bg-teal px-6 text-sm font-semibold text-ink shadow-none hover:bg-teal/90"
          >
            <Link to="/demo">
              Try the live demo
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-xl bg-gold px-6 text-sm font-semibold text-ink shadow-none hover:bg-gold/90"
          >
            <Link to="/demo-escrow">
              Try the escrow demo
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-xl border-border/70 bg-ink/60 px-6 text-sm font-medium text-foreground shadow-none hover:bg-ink-2/70 hover:text-foreground"
          >
            <a href="https://github.com/globabe/redress-agent.git" target="_blank" rel="noreferrer">
              <Github className="size-4" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TheGap() {
  return (
    <section className="relative border-t border-border/40 bg-ink-2/40 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">The Gap</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            The merchant can be right. The agent can still be wrong.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            When an AI agent buys something on a human&apos;s behalf, existing commerce protections
            check whether the merchant delivered what was ordered — not whether what was ordered
            actually matches what the human wanted.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            An agent can misread a request, and the merchant fulfills the (wrong) order perfectly.
            Nobody checks whether the human&apos;s actual intent was honored. That&apos;s the gap
            Redress fills.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      label: "INTENT",
      title: "You state exactly what you want.",
      body: "Product, specs, price, delivery, return terms. The contract locks it in before any purchase happens.",
    },
    {
      icon: Scale,
      label: "JUDGMENT",
      title: "We compare purchase against intent.",
      body: "When the agent's purchase is recorded, GenLayer's Intelligent Contracts compare it against your original intent — reasoning over natural language, not just exact-match rules.",
    },
    {
      icon: RefreshCw,
      label: "REMEDY",
      title: "Redress determines the right outcome.",
      body: "If the purchase doesn't satisfy your intent, Redress determines the appropriate remedy: exchange, refund, or return.",
    },
  ];

  return (
    <section className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">How it works</p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Three steps from intent to remedy
        </h2>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className="glow-teal rounded-2xl border border-teal/20 bg-ink-2/70 p-6"
          >
            <div className="grid size-12 place-items-center rounded-xl border border-teal/30 bg-teal/10 text-teal">
              <step.icon className="size-6" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-teal">
              {step.label}
            </p>
            <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyGenLayer() {
  return (
    <section className="relative border-y border-border/40 bg-ink-2/40 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              Why GenLayer
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Judgment, not just computation
            </h2>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Judging whether a purchase &quot;substantially matches&quot; a human&apos;s intent
            isn&apos;t a simple yes/no calculation — it requires interpretation. GenLayer&apos;s
            validators independently reason over the claim and reach consensus, which is what makes
            this kind of judgment possible on-chain.
          </p>
        </div>
      </div>
    </section>
  );
}

function DemoScope() {
  return (
    <section className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="rounded-2xl border border-teal/25 bg-teal/10 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full border border-teal/40 bg-teal/20 text-teal">
            <span className="text-sm font-bold">i</span>
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              Demo scope
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              This demo illustrates one purchase scenario (a shopping agent buying running shoes) to
              keep the walkthrough simple. The Redress contract itself is fully general-purpose —
              product, specifications, price, delivery terms, and return conditions are all open
              fields. The same mechanism applies to any purchase an autonomous agent makes on a
              human&apos;s behalf: travel bookings, subscriptions, electronics, services, and more.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  return (
    <section className="relative border-t border-border/40 bg-ink-2/40 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
          Roadmap / Vision
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          From purchases to any agent transaction
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Redress starts with purchases. The same accountability question — did the agent act within
          what it was authorized to do — applies anywhere agents transact on a human&apos;s behalf:
          booking travel, hiring contractors, subscribing to services, managing recurring payments.
          Redress is designed to extend to these cases, and eventually to offer a developer API so
          any agent platform can integrate accountability without building it themselves.
        </p>
        <ul className="mt-6 max-w-3xl space-y-3">
          <li className="flex items-start gap-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
            <span>
              Verifiable evidence — moving from simulated purchases to cryptographically signed
              merchant receipts or agent logs
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-border/40 bg-ink py-10">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Redress" width={32} height={32} className="size-8" />
            <div>
              <p className="font-display text-sm font-semibold text-foreground">Redress</p>
              <p className="text-[11px] text-muted-foreground">Built for GenLayer Agent Tank</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:items-end">
            <span>
              Contract:{" "}
              <span className="font-mono text-foreground/70">
                0x06a7Aaf8D575D5dC121bd0B185e2657fbB33d0c4
              </span>
            </span>
            <span>
              Escrow contract:{" "}
              <span className="font-mono text-foreground/70">
                0x83d50E8B3DF9a949329BAe4Fd570917D65b403F1
              </span>
            </span>
            <a
              href="https://github.com/globabe/redress-agent.git"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-teal"
            >
              <Github className="size-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
