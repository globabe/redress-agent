import { abi, createClient, isSuccessful } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT_ADDRESS = "0x562BbB4B400124904bDd18B337844f87e269B7c2" as `0x${string}`;

type ClientChain = NonNullable<NonNullable<Parameters<typeof createClient>[0]>["chain"]>;
const studioDevnetChain = studioDevnet as unknown as ClientChain;

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type ContractClient = ReturnType<typeof createClient>;

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

export function getReadClient() {
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

async function write(functionName: string, args: Array<string | number>, waitForReceipt = true) {
  const client = await getWriteClient();
  const safeArgs = args.map((arg) =>
    typeof arg === "number" ? toContractInt(arg, `${functionName} argument`) : arg,
  );
  const estimate = await client.estimateTransactionFeesForWrite({
    address: CONTRACT_ADDRESS,
    functionName,
    args: safeArgs,
    value: 0n,
  });
  const fees = {
    distribution: estimate.distribution,
    feeValue: estimate.feeValue,
    ...(estimate.messageAllocations ? { messageAllocations: estimate.messageAllocations } : {}),
  };
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args: safeArgs,
    value: 0n,
    fees,
  });

  if (!waitForReceipt) return String(hash);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    // ACCEPTED also resolves terminal states such as CANCELED and timeout
    // statuses, so failed consensus transactions do not leave the UI polling.
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
      `The GenLayer transaction did not complete successfully (status: ${statusName || "unknown"}, execution: ${String(receiptRecord["txExecutionResultName"] ?? "unknown")}). Please retry.`,
    );
  }

  const result = extractReturnValue(receiptRecord);
  return result || String(hash);
}

// The contract's return value is nested inside the consensus receipt:
// consensus_data.leader_receipt[0].result.payload.readable. A shallow scan of
// top-level receipt fields picks up the transaction's input "data" instead,
// which made record_purchase run against a mandate ID that never existed.
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

    // payload.readable is a display rendering: a returned string arrives quoted
    // (e.g. "\"m-1\""), which the contract then can't look up. Decode the raw
    // calldata bytes to recover the exact value the contract returned.
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


export async function connectWallet() {
  const provider = getProvider();
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  return accounts[0] ?? "";
}

export async function disconnectWallet() {
  const provider = getProvider();
  await provider.request({
    method: "wallet_revokePermissions",
    params: [{ eth_accounts: {} }],
  });
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

export async function createMandate(
  product: string,
  specs: string,
  maxPrice: number,
  deadlineDays: number,
  returnDays: number,
) {
  return write("create_mandate", [
    product,
    specs,
    toContractInt(maxPrice, "Max price"),
    toContractInt(deadlineDays, "Delivery deadline"),
    toContractInt(returnDays, "Return window"),
  ]);
}

export async function recordPurchase(
  mandateId: string,
  product: string,
  specs: string,
  price: number,
  deliveryDays: number,
  returnDaysOffered: number,
) {
  return write("record_purchase", [
    mandateId,
    product,
    specs,
    toContractInt(price, "Price"),
    toContractInt(deliveryDays, "Delivery days"),
    toContractInt(returnDaysOffered, "Return window"),
  ]);
}

export async function adjudicate(mandateId: string) {
  return write("adjudicate", [mandateId]);
}

async function read(functionName: string, args: string[]) {
  const client: ContractClient = getReadClient();
  return client.readContract({ address: CONTRACT_ADDRESS, functionName, args });
}

export async function getVerdict(mandateId: string) {
  return parseContractJson(await read("get_verdict", [mandateId]));
}

export async function getMandate(mandateId: string) {
  return parseContractJson(await read("get_mandate", [mandateId]));
}

export async function getPurchase(mandateId: string) {
  return parseContractJson(await read("get_purchase", [mandateId]));
}
