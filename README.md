# Redress Agent

Build a polished, modern web app called "Redress" — a demo for a GenLayer hackathon (Agent Tank).

Concept

Redress judges whether an AI shopping agent's purchase actually satisfied the human's original stated intent — not whether the merchant fulfilled its own promise, but whether what was bought matches what was asked for. Example: a human asks for black running shoes, size 42; the agent buys blue shoes, size 41. The merchant delivered exactly what was ordered, but the purchase still fails the human's intent. Redress uses a GenLayer Intelligent Contract to judge this and decide the remedy.

Visual style

Clean, modern, dark-themed SaaS aesthetic (similar to Stripe/Linear). Confident typography, generous whitespace, subtle animations between steps. Use a single accent color (deep blue or teal) for primary actions. Make it feel like a real product, not a rough prototype — this needs to look genuinely polished.

Flow — 4 screens/steps in a single-page wizard

Step 1 — Create Purchase Intent

A form where the "human" states what they want:

Product (text, default: "Running shoes")

Color (text, default: "black")

Size (text, default: "42")

Max price (number, default: 150)

Delivery deadline in days (number, default: 5)

Return window required in days (number, default: 30)

Button: "Submit Intent" — on click, call the smart contract's create_mandate method (see Blockchain Integration below) with these values combined into a specs string like "color:black,size:42". Store the returned mandate_id. Show a loading state while the transaction confirms.

Step 2 — Agent Shops (simulated)

Show a short "🤖 Agent searching for matches..." loading animation (1-2 seconds, fake/simulated, no real search). Then reveal a "found" product card with details that DON'T match what was requested:

Product: "Running shoes"

Color: "blue"

Size: "41"

Price: "$129"

Delivery: "3 days"

Return window offered: "30 days"

Button: "Confirm Purchase" — on click, call record_purchase with these mismatched values (color:blue,size:41) plus price=129, delivery_days=3, return_days_offered=30.

Step 3 — Redress Adjudicates

Show a clean side-by-side comparison table: "What you asked for" vs "What the agent bought" — highlight mismatched fields in red/orange, matched fields in green.

Button: "Request Redress" — calls adjudicate with the mandate_id. Show a realistic loading state ("Validators reviewing the claim...") since this takes a few seconds on-chain.

Then call get_verdict and display the result prominently:

Large badge: BREACH (red) or FULFILLED (green)

Remedy: EXCHANGE / REFUND / RETURN / NONE

The reason text from the contract, shown as a quote/callout

Step 4 — Try the happy path (optional toggle/button)

A "Try again with a matching purchase" button that restarts the flow but lets Step 2 show a product that DOES match (black, size 42, price 140, delivery 4 days, return 30 days) — to demonstrate the contract also correctly returns FULFILLED when everything matches, not just breaches.

Blockchain integration

Use genlayer-js to connect to the deployed contract. Network config:

import { createClient, createWalletClient } from 'genlayer-js';

const customNetwork = {
  id: 61997,
  name: 'GenLayer Studio Next',
  rpcUrls: {
    default: { http: ['https://studio-next.genlayer.com/api'] }
  }
};

export const readClient = createClient({ network: customNetwork });

export async function getWriteClient() {
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  return createWalletClient({
    network: customNetwork,
    account: window.ethereum,
  });
}


Contract address: 0x562BbB4B400124904bDd18B337844f87e269B7c2

Contract methods to call:

create_mandate(product: string, specs: string, max_price: number, deadline_days: number, return_days: number) -> string (write)

record_purchase(mandate_id: string, product: string, specs: string, price: number, delivery_days: number, return_days_offered: number) -> None (write)

adjudicate(mandate_id: string) -> string (write)

get_verdict(mandate_id: string) -> string (view, returns a JSON string — parse it)

get_mandate(mandate_id: string) -> string (view, returns a JSON string)

get_purchase(mandate_id: string) -> string (view, returns a JSON string)

Write calls require MetaMask (or similar) connected to the network above. Read calls (get_verdict, get_mandate, get_purchase) don't need a wallet.

Handle loading and error states gracefully — if MetaMask isn't installed or the network isn't added, show a clear message asking the user to connect their wallet, with a button to trigger the connection.

Scope — keep this tight

Do NOT build: a real product catalog, real payment processing, user accounts, a database beyond what's needed to hold wizard state in memory, or any screens beyond the 4 described above. This is a focused demo of ONE purchase scenario, not a full marketplace. Polish over scope.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/23509ff6-a55c-4ac6-8ca3-19e74370e0a6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
