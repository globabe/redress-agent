import { createClient, type abi } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";

const CONTRACT_ADDRESS = "0x562BbB4B400124904bDd18B337844f87e269B7c2" as `0x${string}`;

const studioNext = {
  id: 61997,
  name: "GenLayer Studio Next",
  rpcUrls: { default: { http: ["https://studio-next.genlayer.com/api"] } },
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
} as const;

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
  return createClient({ chain: studioNext });
}

async function getWriteClient() {
  const provider = getProvider();
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  const account = accounts[0];
  if (!account) throw new Error("No wallet account was selected.");

  return createClient({
    chain: studioNext,
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

async function write(functionName: string, args: Array<string | number>, waitForFinality = true) {
  const client = await getWriteClient();
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: 0n,
  });

  if (!waitForFinality) return String(hash);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    interval: 2000,
    retries: 90,
  });
  const result = readValue(receipt);
  return result || String(hash);
}

export async function connectWallet() {
  const provider = getProvider();
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  return accounts[0] ?? "";
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
  return write("create_mandate", [product, specs, maxPrice, deadlineDays, returnDays]);
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
    price,
    deliveryDays,
    returnDaysOffered,
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
