import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT = "0x562BbB4B400124904bDd18B337844f87e269B7c2";
const account = createAccount(generatePrivateKey());
const client = createClient({ chain: studionet, account });

// 1) What does the read of a bogus mandate say?
try {
  const r = await client.readContract({ address: CONTRACT, functionName: "get_mandate", args: ["0xdeadbeef"] });
  console.log("get_mandate bogus ->", JSON.stringify(r));
} catch (e) { console.log("get_mandate bogus ERROR:", e.message?.slice(0,300)); }

// 2) Estimate fees for record_purchase with a bogus mandate id (simulation executes the contract)
try {
  const est = await client.estimateTransactionFeesForWrite({
    address: CONTRACT, functionName: "record_purchase",
    args: ["0xdeadbeef", "Running shoes", "color:blue,size:41", 129, 3, 30],
    value: 0n,
  });
  console.log("estimate bogus id OK", est);
} catch (e) { console.log("estimate bogus id ERROR:", e.message?.slice(0,400)); }
