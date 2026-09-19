import { abi, createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

// Escrow-enabled Redress contract. Kept separate from src/lib/genlayer.ts so the
// original /demo flow and its contract stay untouched.
export const ESCROW_CONTRACT_ADDRESS =
  "0x83d50E8B3DF9a949329BAe4Fd570917D65b403F1" as `0x${string}`;

export const DEFAULT_MERCHANT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

type ClientChain = NonNullable<NonNullable<Parameters<typeof createClient>[0]>["chain"]>;
const studioDevnetChain = studioDevnet as unknown as ClientChain;

function getProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask or a compatible wallet is not installed.");
  }
  return window.ethereum;
}

function readValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["return_data", "returnData", "result", "data", "value"]) {
      if (key in record) return readValue(record[key]);
    }
  }
  return "";
}

function getReadClient() {
  return createClient({ chain: studioDevnetChain });
}

async function getWriteClient() {
  const provider = getProvider();
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const account = accounts[0];
  if (!account) throw new Error("No wallet account was selected.");

  return createClient({
    chain: studioDevnetChain,
    account: account as `0x${string}`,
    provider,
  });
}

function toContractInt(value: unknown, label: string): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number before it can be sent to the contract.`);
  }
  return Math.trunc(parsed);
}

// GEN amounts are entered in whole/decimal GEN and sent as wei-scaled values.
export function toWei(amount: number): bigint {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("The escrow amount must be a valid, non-negative number.");
  }
  const [whole = "0", fraction = ""] = amount.toString().split(".");
  const paddedFraction = (fraction + "000000000000000000").slice(0, 18);
  return BigInt(whole) * 10n ** 18n + BigInt(paddedFraction || "0");
}

async function write(functionName: string, args: Array<string | number>, value: bigint = 0n) {
  const client = await getWriteClient();
  const safeArgs = args.map((arg) =>
    typeof arg === "number" ? toContractInt(arg, `${functionName} argument`) : arg,
  );
  const estimate = await client.estimateTransactionFeesForWrite({
    address: ESCROW_CONTRACT_ADDRESS,
    functionName,
    args: safeArgs,
    value,
  });
  const fees = {
    distribution: estimate.distribution,
    feeValue: estimate.feeValue,
    ...(estimate.messageAllocations ? { messageAllocations: estimate.messageAllocations } : {}),
  };
  const hash = await client.writeContract({
    address: ESCROW_CONTRACT_ADDRESS,
    functionName,
    args: safeArgs,
    value,
    fees,
  });

  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    interval: 2000,
    retries: 90,
  });

  const receiptRecord = receipt as Record<string, unknown>;
  const statusName = String(receiptRecord["statusName"] ?? "");
  const terminalFailureStatuses = new Set([
    "CANCELED",
    "UNDETERMINED",
    "LEADER_TIMEOUT",
    "VALIDATORS_TIMEOUT",
  ]);
  if (terminalFailureStatuses.has(statusName)) {
    throw new Error(`The GenLayer transaction ended with status ${statusName}. Please retry.`);
  }

  if (receiptRecord["txExecutionResultName"] === "FINISHED_WITH_ERROR") {
    const reason = readValue(receiptRecord["genvmLog"]) || readValue(receiptRecord["stderr"]);
    throw new Error(
      reason
        ? `The contract rejected the transaction: ${reason}`
        : "The contract rejected the transaction. Please review the intent and retry.",
    );
  }

  if (!isSuccessful(receipt)) {
    throw new Error(
      `The GenLayer transaction did not complete successfully (status: ${statusName || "unknown"}). Please retry.`,
    );
  }

  const result = extractReturnValue(receiptRecord);
  return result || String(hash);
}

function extractReturnValue(receipt: Record<string, unknown>): string {
  const consensus = receipt["consensus_data"];
  if (!consensus || typeof consensus !== "object") return "";
  const leaders = (consensus as Record<string, unknown>)["leader_receipt"];
  const entries = Array.isArray(leaders) ? leaders : leaders ? [leaders] : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const result = (entry as Record<string, unknown>)["result"];
    if (!result || typeof result !== "object") continue;
    const resultRecord = result as Record<string, unknown>;
    if (resultRecord["status"] && resultRecord["status"] !== "return") continue;
    const payload = resultRecord["payload"];
    if (!payload || typeof payload !== "object") continue;
    const payloadRecord = payload as Record<string, unknown>;

    const raw = payloadRecord["raw"];
    if (Array.isArray(raw)) {
      try {
        const decoded = abi.calldata.decode(new Uint8Array(raw as number[]));
        if (typeof decoded === "string" && decoded) return decoded;
        if (typeof decoded === "number" || typeof decoded === "bigint") return String(decoded);
      } catch {
        // fall through to the readable rendering below
      }
    }

    const readable = payloadRecord["readable"];
    if (typeof readable === "string" && readable) {
      return readable.replace(/^["']|["']$/g, "");
    }
  }
  return "";
}

export function parseContractJson(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  const text = readValue(value);
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function createEscrowMandate(
  product: string,
  specs: string,
  maxPrice: number,
  deadlineDays: number,
  returnDays: number,
  escrowGen: number,
) {
  return write(
    "create_mandate",
    [
      product,
      specs,
      toContractInt(maxPrice, "Max price"),
      toContractInt(deadlineDays, "Delivery deadline"),
      toContractInt(returnDays, "Return window"),
    ],
    toWei(escrowGen),
  );
}

export async function recordEscrowPurchase(
  mandateId: string,
  product: string,
  specs: string,
  price: number,
  deliveryDays: number,
  returnDaysOffered: number,
  merchantAddress: string,
) {
  return write("record_purchase", [
    mandateId,
    product,
    specs,
    toContractInt(price, "Price"),
    toContractInt(deliveryDays, "Delivery days"),
    toContractInt(returnDaysOffered, "Return window"),
    merchantAddress,
  ]);
}

export async function adjudicateEscrow(mandateId: string) {
  return write("adjudicate", [mandateId]);
}

async function read(functionName: string, args: string[]) {
  const client = getReadClient();
  return client.readContract({ address: ESCROW_CONTRACT_ADDRESS, functionName, args });
}

export async function getEscrowVerdict(mandateId: string) {
  return parseContractJson(await read("get_verdict", [mandateId]));
}

export async function getEscrowMandate(mandateId: string) {
  return parseContractJson(await read("get_mandate", [mandateId]));
}

export async function getEscrowPurchase(mandateId: string) {
  return parseContractJson(await read("get_purchase", [mandateId]));
}

// Translate whatever settlement fields the contract exposes into a plain
// sentence, falling back to the verdict when the contract stays silent.
export function describeSettlement(
  verdictResult: string,
  escrowGen: number,
  mandateData: Record<string, unknown>,
  verdictData: Record<string, unknown>,
) {
  const merged = { ...mandateData, ...verdictData };
  const amountRaw =
    merged["settled_amount"] ??
    merged["escrow_amount"] ??
    merged["escrow"] ??
    merged["amount"] ??
    null;
  const amount =
    amountRaw !== null && Number.isFinite(Number(amountRaw))
      ? formatGen(Number(amountRaw))
      : String(escrowGen);
  const settledTo = String(merged["settled_to"] ?? merged["settlement"] ?? "").toLowerCase();
  const fulfilled = settledTo.includes("merchant")
    ? true
    : settledTo.includes("buyer") || settledTo.includes("refund")
      ? false
      : verdictResult.toUpperCase().includes("FULFILLED");

  return {
    fulfilled,
    message: fulfilled
      ? `${amount} GEN released to the merchant.`
      : `${amount} GEN refunded to your wallet.`,
  };
}

function formatGen(value: number) {
  // Contract-reported amounts may be wei-scaled; normalize large integers.
  const gen = value > 1e12 ? value / 1e18 : value;
  return String(Number(gen.toFixed(6)));
}
