# Redress

**Intent. Judgment. Remedy.**

Redress is an accountability layer for autonomous commerce, built on GenLayer.
When an AI agent buys something on a human's behalf, Redress judges whether
the purchase actually satisfied the human's original intent — not just
whether the merchant fulfilled the order.

**Live demo:** https://redressagent.app/demo
**Landing page:** https://redressagent.app

## The problem

Agentic commerce is built around discover → negotiate → pay → execute. But
that flow stops at payment. Humans never stopped there — when a purchase is
wrong, we have returns, exchanges, and refunds.

The deeper issue: a merchant can deliver *exactly* what was ordered, and the
order can still be wrong. An agent can misread a request — buy blue sneakers
instead of black, size 41 instead of 42 — and the merchant's side of the deal
is completely fulfilled. Nobody checks whether the human's actual intent was
honored. That's the gap Redress fills.

## How it works

1. **Intent** — The human states exactly what they want: product, specs,
   max price, delivery deadline, return window. The contract locks this in
   as a mandate before any purchase happens.
2. **Purchase** — The agent's actual purchase is recorded on-chain: what it
   bought, its specs, price, delivery time, and return terms offered.
3. **Judgment** — GenLayer's Intelligent Contracts compare the purchase
   against the original mandate. This isn't a simple equality check —
   "does this substantially satisfy what was asked for" requires
   interpretation, which is why it needs on-chain AI reasoning with
   validator consensus, not just arithmetic.
4. **Remedy** — If the purchase breaches the mandate, Redress determines
   the appropriate remedy: exchange, refund, or return.

## Why GenLayer

Judging intent-fulfillment isn't deterministic. GenLayer's Intelligent
Contracts let independent AI validators reason over the mandate and the
purchase evidence, then reach consensus on the outcome — something a
traditional smart contract can't do. The contract's leader proposes a
verdict; each validator independently re-runs the same judgment against
the same evidence and only agrees if its own decision matches the
leader's — not just checking that the response looks well-formed. This
means the decision genuinely comes from the data, not from one node's
unverified claim.

## Contract

Deployed on GenLayer Studio Next (Consensus v0.6 RC, Chain ID 61997):

```
0x06a7Aaf8D575D5dC121bd0B185e2657fbB33d0c4
```

View on explorer: https://explorer-studio-dev.genlayer.com/address/0x06a7Aaf8D575D5dC121bd0B185e2657fbB33d0c4

### Methods

- `create_mandate(product, specs, max_price, deadline_days, return_days) -> mandate_id`
  Records the human's stated purchase intent.
- `record_purchase(mandate_id, product, specs, price, delivery_days, return_days_offered)`
  Records what the agent actually purchased.
- `adjudicate(mandate_id) -> result`
  Triggers GenLayer's judgment: compares the purchase against the mandate
  and returns FULFILLED or BREACH, with a remedy (NONE, EXCHANGE, REFUND,
  or RETURN) and a reason.
- `get_mandate(mandate_id)`, `get_purchase(mandate_id)`, `get_verdict(mandate_id)`
  Read the stored mandate, purchase, and verdict as JSON.

## Demo scope

The live demo illustrates one scenario — a shopping agent purchasing shoes
— to keep the walkthrough simple and testable. The contract itself is fully
general-purpose: product, specs, price, delivery terms, and return
conditions are all open fields. The same mechanism applies to any purchase
an autonomous agent makes on a human's behalf.

## Roadmap

Redress starts with purchases. The same accountability question — did the
agent act within what it was actually asked to do — applies anywhere agents
transact on a human's behalf: booking travel, hiring contractors,
subscribing to services, managing recurring payments. The long-term goal is
a developer API so any agent platform can integrate this accountability
layer without building it themselves.

Two specific next steps to make Redress fully load-bearing, not just a
judgment layer:
- **Verifiable evidence** — move from client-side purchase simulation to
  cryptographically signed merchant receipts or agent logs, so a verdict
  is backed by proof, not just a submitted claim.
- **Real settlement** — back verdicts with actual escrowed funds, so a
  BREACH verdict doesn't just state a remedy, it executes it.

## Built for

GenLayer Agent Tank Hackathon — Onchain Justice track.
