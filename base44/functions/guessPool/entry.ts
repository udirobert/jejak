// @ts-nocheck
// Staked provenance guesses. Commit a guess hash onchain (provably fair —
// nobody can edit after reveal), settle the pool to the closest guess via a
// claimable balance (the pot is on-ledger, not custodial). Testnet.
import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Memo,
  Claimant,
} from "npm:@stellar/stellar-sdk@12.3.0";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.53";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";
const EXPLORER_TX = (h: string) => `https://stellar.expert/explorer/testnet/tx/${h}`;
const STAKE_XLM = "1";
const POT_XLM = "10"; // sponsored demo pot per pool
const POOL_SEED = "jejak-guess-pool-signer-v1";

async function deriveKp(seed: string): Promise<Keypair> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  return Keypair.fromRawEd25519Seed(new Uint8Array(d));
}
const hex = (b: Uint8Array) => Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
async function sha256(s: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
}
async function ensureFunded(server: Horizon.Server, pk: string) {
  try { return await server.loadAccount(pk); } catch {
    await fetch(`${FRIENDBOT_URL}?addr=${pk}`, { signal: AbortSignal.timeout(8000) });
    return await server.loadAccount(pk);
  }
}

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;
  const server = new Horizon.Server(HORIZON_URL);
  const poolKp = await deriveKp(POOL_SEED);

  try {
    const body = await req.json();
    const { action } = body || {};

    // ---- commit: anchor the guess hash onchain before the reveal ----
    if (action === "commit") {
      const { product_id, guess_pct, user_id } = body;
      const pct = Number(guess_pct);
      if (!product_id || !isFinite(pct) || pct < 1 || pct > 40) {
        return Response.json({ ok: false, reason: "bad_guess" }, { status: 400 });
      }
      const salt = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
      const canonical = `jejak.guess.v1|${product_id}|${pct}|${salt}`;
      const guessHash = await sha256(canonical);

      // Anchor: 0.1 XLM self-payment with the guess hash as Memo.hash
      const { Asset } = await import("npm:@stellar/stellar-sdk@12.3.0");
      const acct = await ensureFunded(server, poolKp.publicKey());
      const tx = new TransactionBuilder(acct, { fee: "200" })
        .addOperation(Operation.payment({ destination: poolKp.publicKey(), asset: Asset.native(), amount: "0.1" }))
        .addMemo(Memo.hash(guessHash))
        .setNetworkPassphrase(Networks.TESTNET)
        .setTimeout(120)
        .build();
      tx.sign(await deriveKp(POOL_SEED));
      const res = await server.submitTransaction(tx);

      const record = await sr.entities.Guess.create({
        product_id,
        guess_pct: pct,
        user_id: user_id || "anonymous",
        salt,
        guess_hash: guessHash,
        commit_tx: res.hash,
        explorer_url: EXPLORER_TX(res.hash),
        status: "committed",
        stake_xlm: STAKE_XLM,
      });
      return Response.json({
        ok: true,
        guess_id: record.id,
        guess_hash: guessHash,
        commit_tx: res.hash,
        ledger: res.ledger,
        explorer_url: EXPLORER_TX(res.hash),
        canonical,
      });
    }

    // ---- resolve: rank committed guesses, settle pot to the closest ----
    if (action === "resolve") {
      const { product_id, labour_pct } = body;
      const actual = Number(labour_pct);
      if (!product_id || !isFinite(actual)) {
        return Response.json({ ok: false, reason: "bad_input" }, { status: 400 });
      }
      const guesses = await sr.entities.Guess.filter({ product_id, status: "committed" }, "-created_date", 50);
      if (!guesses?.length) return Response.json({ ok: true, pool_size: 0, settled: false });

      const ranked = guesses
        .map((g: any) => ({ g, err: Math.abs(Number(g.guess_pct) - actual) }))
        .sort((a, b) => a.err - b.err);
      const winner = ranked[0];
      // Winner's demo claim wallet: deterministic per user_id (testnet only).
      const winnerKp = await deriveKp(`jejak-guess-winner-${winner.g.user_id || "anon"}-v1`);

      const { Asset } = await import("npm:@stellar/stellar-sdk@12.3.0");
      const settle = await (async () => {
        const acct = await ensureFunded(server, poolKp.publicKey());
        const kp = await deriveKp(POOL_SEED);
        const tx = new TransactionBuilder(acct, { fee: "200" })
          .addOperation(
            Operation.createClaimableBalance({
              asset: Asset.native(),
              amount: POT_XLM,
              claimants: [new Claimant(winnerKp.publicKey(), Claimant.predicateUnconditional())],
            })
          )
          .addMemo(Memo.text(`JEJAK-POOL:${String(product_id).slice(0, 8)}:WIN`))
          .setNetworkPassphrase(Networks.TESTNET)
          .setTimeout(120)
          .build();
        tx.sign(kp);
        return server.submitTransaction(tx);
      })();

      const updates = await Promise.all(
        guesses.map((g: any) =>
          sr.entities.Guess.update(g.id, {
            status: g.id === winner.g.id ? "won" : "lost",
            reveal_error_pct: Math.abs(Number(g.guess_pct) - actual),
            settle_tx: g.id === winner.g.id ? settle.hash : "",
            settle_explorer: g.id === winner.g.id ? EXPLORER_TX(settle.hash) : "",
            winner_claim_address: g.id === winner.g.id ? winnerKp.publicKey() : "",
          })
        )
      );

      return Response.json({
        ok: true,
        pool_size: guesses.length,
        actual_labour_pct: actual,
        winner: {
          guess_id: winner.g.id,
          user_id: winner.g.user_id,
          guess_pct: winner.g.guess_pct,
          error_pct: winner.err,
          claim_address: winnerKp.publicKey(),
          settle_tx: settle.hash,
          settle_explorer: EXPLORER_TX(settle.hash),
          pot_xlm: POT_XLM,
        },
      });
    }

    // ---- pool_state: committed guesses for a product ----
    if (action === "pool_state") {
      const guesses = await sr.entities.Guess.filter({ product_id: body.product_id }, "-created_date", 100);
      return Response.json({
        ok: true,
        pool_size: guesses?.length || 0,
        guesses: (guesses || []).map((g: any) => ({
          id: g.id, guess_pct: g.guess_pct, status: g.status,
          commit_tx: g.commit_tx, explorer_url: g.explorer_url,
          settle_explorer: g.settle_explorer || "",
        })),
      });
    }

    return Response.json({ ok: false, reason: "unknown_action" }, { status: 400 });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
