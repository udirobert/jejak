import { Keypair, Horizon, TransactionBuilder, Networks, Operation, Asset, Memo } from "npm:@stellar/stellar-sdk@12.3.0";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Deterministic per-origin Testnet Co-op destination accounts
const COOP_SEEDS = {
  Bangladesh: "jejak-coop-dhaka-bangladesh-garment-collective-v1",
  Vietnam: "jejak-coop-hochiminh-vietnam-footwear-union-v1",
  Ethiopia: "jejak-coop-sidamo-ethiopia-coffee-growers-v1",
  China: "jejak-coop-shenzhen-china-makers-assembly-v1",
  default: "jejak-coop-global-maker-solidarity-pool-v1",
};

const SENDER_SEED = "jejak-shopper-settlement-relayer-testnet-v1";

async function deriveKeypair(label) {
  const bytes = new TextEncoder().encode(label);
  const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
  return Keypair.fromRawEd25519Seed(new Uint8Array(hashBuf));
}

async function ensureFunded(server, publicKey) {
  try {
    return await server.loadAccount(publicKey);
  } catch {
    await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`, {
      signal: AbortSignal.timeout(12000),
    });
    return await server.loadAccount(publicKey);
  }
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const productId = String(body.productId || "hoodie").slice(0, 24);
    const origin = String(body.origin || "Bangladesh").slice(0, 32);
    const currency = body.currency === "SGD" ? "SGD" : "GBP";
    const rawAmount = Number(body.amount) || 1;
    const clampedAmount = Math.max(0.25, Math.min(250, rawAmount));

    // Convert GBP / SGD micro-boost into illustrative USDC & Testnet XLM settlement units
    const fxToUsdc = currency === "SGD" ? 0.74 : 1.28;
    const usdcEquivalent = +(clampedAmount * fxToUsdc).toFixed(2);
    const xlmAmount = Math.max(0.5, Math.min(50, +(clampedAmount * 2).toFixed(2))).toFixed(7);

    const server = new Horizon.Server(HORIZON_URL);
    const senderKp = await deriveKeypair(SENDER_SEED);
    const coopSeed = COOP_SEEDS[origin] || COOP_SEEDS.default;
    const coopKp = await deriveKeypair(coopSeed);

    const [senderAccount] = await Promise.all([
      ensureFunded(server, senderKp.publicKey()),
      ensureFunded(server, coopKp.publicKey()),
    ]);

    const memoStr = `JEJAK:${productId.toUpperCase().slice(0, 8)}:${origin.slice(0, 6).toUpperCase()}:${clampedAmount}${currency}`.slice(0, 28);

    const tx = new TransactionBuilder(senderAccount, {
      fee: "100", // 100 stroops = 0.00001 XLM (~$0.000001)
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: coopKp.publicKey(),
          asset: Asset.native(),
          amount: xlmAmount,
        })
      )
      .addMemo(Memo.text(memoStr))
      .setTimeout(30)
      .build();

    tx.sign(senderKp);
    const result = await server.submitTransaction(tx);

    return Response.json({
      ok: true,
      network: "Stellar Testnet",
      hash: result.hash,
      ledger: result.ledger,
      memo: memoStr,
      from: senderKp.publicKey(),
      destination: coopKp.publicKey(),
      coopLabel: `${origin} Maker Co-op Anchor`,
      fiatAmount: clampedAmount,
      fiatCurrency: currency,
      usdcEquivalent,
      xlmSettled: Number(xlmAmount),
      feeXlm: "0.00001",
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      horizonUrl: `${HORIZON_URL}/transactions/${result.hash}`,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Stellar settlement failed" },
      { status: 500 }
    );
  }
}