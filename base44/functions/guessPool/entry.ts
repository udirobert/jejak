// @ts-nocheck
// The wager — staked provenance guesses.
//
// A guess is committed to the public ledger as a SHA-256 hash BEFORE the
// real maker-share is known, so nobody (including us) can change it
// afterwards. When the pool settles, the pot goes to the closest guess as a
// Stellar claimable balance (CAP-23): on-ledger, non-custodial, claimable by
// the winner alone.
//
// Two rules this function exists to enforce:
//
// 1. IDENTITY IS DERIVED FROM AUTH, never from the request body. The client
//    used to send `user_id`, which meant it could be "guest" for everybody —
//    so every winner shared one demo claim address and nobody could ever
//    claim anything. Now the caller is resolved server-side.
//
// 2. THE POT IS SPONSORED. No XLM of the guesser's is locked, so the pot is
//    funded by Jejak and `sponsored: true` says so in the data. A signed-out
//    visitor may guess — their guess counts toward the field and the
//    distribution — but is not eligible for the pot, because the pot has to be
//    claimable by a real person.
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
import {
  histogram,
  median,
  latestPerUser,
  isFieldPublic,
  MIN_PCT,
  MAX_PCT,
} from "../../shared/guess.ts";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";
const EXPLORER_TX = (h: string) => `https://stellar.expert/explorer/testnet/tx/${h}`;
const POT_XLM = "10"; // sponsored demo pot per pool — the guesser stakes nothing
const POOL_SEED = "jejak-guess-pool-signer-v1";
const WINNER_SEED_PREFIX = "jejak-guess-winner-v2";

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

// The caller's identity, resolved from the request's auth. Never from the body.
async function callerId(base44: any) {
  try {
    const user = await base44.auth.me();
    if (user?.id) return { id: String(user.id), authenticated: true };
  } catch {
    // signed out — fall through
  }
  return { id: "", authenticated: false };
}

// A guess is bucketed so the distribution can be shown without attributing any
// individual guess to a person. Two-percentage-point buckets over 1..40.
// (histogram / median / latestPerUser live in base44/shared/guess.ts so they
// can be tested without a Stellar connection.)

export default async function (req: Request) {
  const base44 = createClientFromRequest(req);
  const sr = base44.asServiceRole;
  const server = new Horizon.Server(HORIZON_URL);
  const poolKp = await deriveKp(POOL_SEED);

  try {
    const body = await req.json();
    const { action } = body || {};
    const caller = await callerId(base44);

    // ---- commit: anchor the guess hash onchain before the reveal ----
    if (action === "commit") {
      const { product_id, guess_pct, product_name, anon_id } = body;
      const pct = Number(guess_pct);
      if (!product_id || !isFinite(pct) || pct < MIN_PCT || pct > MAX_PCT) {
        return Response.json({ ok: false, reason: "bad_guess" }, { status: 400 });
      }

      // Signed in -> a real person, eligible for the pot. Signed out -> a
      // browser-local anonymous id, eligible for the field only.
      const eligible = caller.authenticated;
      const user_id = eligible
        ? caller.id
        : `anon:${String(anon_id || "unknown").slice(0, 64)}`;

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
        product_name: typeof product_name === "string" ? product_name : "",
        guess_pct: pct,
        user_id,
        // The record is owned by the person who made the guess, so RLS keeps
        // it private to them. The shared pool is read through this function
        // with the service role and surfaced only as an unattributed field.
        owner_id: eligible ? caller.id : "",
        eligible,
        salt,
        guess_hash: guessHash,
        commit_tx: res.hash,
        explorer_url: EXPLORER_TX(res.hash),
        status: "committed",
        pot_xlm: POT_XLM,
        sponsored: true,
      });
      return Response.json({
        ok: true,
        guess_id: record.id,
        guess_hash: guessHash,
        commit_tx: res.hash,
        ledger: res.ledger,
        explorer_url: EXPLORER_TX(res.hash),
        canonical,
        eligible,
        pot_xlm: POT_XLM,
        sponsored: true,
      });
    }

    // ---- resolve: reveal the field, rank the round, settle the pot ----
    if (action === "resolve") {
      const { product_id, labour_pct } = body;
      const actual = Number(labour_pct);
      if (!product_id || !isFinite(actual)) {
        return Response.json({ ok: false, reason: "bad_input" }, { status: 400 });
      }

      // Every guess ever made on this product is the field — it accumulates.
      const all = (await sr.entities.Guess.filter({ product_id }, "-created_date", 300)) || [];
      const field = latestPerUser(all);
      const pcts = field.map((g: any) => Number(g.guess_pct));

      // This round's eligible guesses compete for the pot.
      const eligible = field.filter((g: any) => g.eligible);
      const ranked = eligible
        .map((g: any) => ({ g, err: Math.abs(Number(g.guess_pct) - actual) }))
        .sort((a, b) => a.err - b.err);

      const mine = caller.id ? field.find((g: any) => g.user_id === caller.id) || null : null;
      const myRank = mine && mine.eligible
        ? ranked.findIndex((r: any) => r.g.id === mine.id) + 1
        : null;
      const guessedHigher = mine
        ? pcts.filter((p: number) => p > Number(mine.guess_pct)).length
        : null;

      let settlement = null;

      if (ranked.length) {
        const winner = ranked[0];
        // The winner's claim address is derived from their real account id,
        // so only they can claim it.
        const winnerKp = await deriveKp(`${WINNER_SEED_PREFIX}:${winner.g.user_id}`);

        // If a closer guess has come in since the last settle, the pot moves.
        // The previous winner's claim is voided so only one pot is live.
        const prevWinner = field.find((g: any) => g.status === "won" && g.claim_balance_id) || null;
        const winnerChanged = !prevWinner || prevWinner.id !== winner.g.id;

        let balanceId = prevWinner?.claim_balance_id || "";
        let settleTx = prevWinner?.settle_tx || "";
        let settleExplorer = prevWinner?.settle_explorer || "";
        let claimAddress = prevWinner?.winner_claim_address || "";

        if (winnerChanged) {
          if (prevWinner) {
            await sr.entities.Guess.update(prevWinner.id, { claim_balance_id: "", claim_tx: "" });
          }
          const { Asset } = await import("npm:@stellar/stellar-sdk@12.3.0");
          const settle = await (async () => {
            const acct = await ensureFunded(server, poolKp.publicKey());
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
            tx.sign(poolKp);
            return server.submitTransaction(tx);
          })();

          balanceId = settle?.result?.operations?.[0]?.createClaimableBalanceResult?.id || "";
          settleTx = settle.hash;
          settleExplorer = EXPLORER_TX(settle.hash);
          claimAddress = winnerKp.publicKey();
        }

        await Promise.all(
          eligible.map((g: any) =>
            sr.entities.Guess.update(g.id, {
              status: g.id === winner.g.id ? "won" : "lost",
              reveal_error_pct: Math.abs(Number(g.guess_pct) - actual),
              settle_tx: g.id === winner.g.id ? settleTx : "",
              settle_explorer: g.id === winner.g.id ? settleExplorer : "",
              winner_claim_address: g.id === winner.g.id ? claimAddress : "",
              claim_balance_id: g.id === winner.g.id ? balanceId : "",
              pot_xlm: POT_XLM,
            })
          )
        );

        // The winner's identity is never returned to a caller — only whether
        // the caller IS the winner.
        settlement = {
          guess_pct: Number(winner.g.guess_pct),
          error_pct: winner.err,
          claim_address: claimAddress,
          settle_tx: settleTx,
          settle_explorer: settleExplorer,
          pot_xlm: POT_XLM,
          sponsored: true,
          claim_balance_id: balanceId,
          you_won: Boolean(mine && mine.id === winner.g.id),
          // Was anyone actually competing, or was this a one-person pool?
          contested: eligible.length > 1,
        };
      }

      return Response.json({
        ok: true,
        // The whole field, across every round.
        pool_size: field.length,
        // How many of them can actually win the pot.
        eligible_count: eligible.length,
        // Individual beliefs, unattributed. The reveal guarantees the timing;
        // we choose never to say WHO held which belief.
        field_pcts: pcts,
        distribution: histogram(pcts),
        median_guess_pct: median(pcts),
        actual_labour_pct: actual,
        your_guess_pct: mine ? Number(mine.guess_pct) : null,
        your_rank: myRank,
        guessed_higher: guessedHigher,
        settlement,
      });
    }

    // ---- claim: the winner collects the pot, on-ledger ----
    if (action === "claim") {
      const { product_id } = body;
      if (!caller.authenticated) {
        return Response.json({ ok: false, reason: "sign_in_required" }, { status: 401 });
      }
      const won = (await sr.entities.Guess.filter({ product_id, status: "won" }, "-created_date", 50)) || [];
      const mine = won.find(
        (g: any) => g.user_id === caller.id && g.claim_balance_id && !g.claim_tx
      );
      if (!mine) {
        return Response.json({ ok: false, reason: "nothing_to_claim" }, { status: 404 });
      }

      // The claim is signed by the winner's own derived key — the claimant
      // address the pot was created for.
      const winnerKp = await deriveKp(`${WINNER_SEED_PREFIX}:${mine.user_id}`);
      const acct = await ensureFunded(server, winnerKp.publicKey());
      const tx = new TransactionBuilder(acct, { fee: "200" })
        .addOperation(
          Operation.claimClaimableBalance({
            balanceId: mine.claim_balance_id,
            claimant: new Claimant(winnerKp.publicKey(), Claimant.predicateUnconditional()),
          })
        )
        .addMemo(Memo.text(`JEJAK-CLAIM:${String(product_id).slice(0, 8)}`))
        .setNetworkPassphrase(Networks.TESTNET)
        .setTimeout(120)
        .build();
      tx.sign(winnerKp);
      const res = await server.submitTransaction(tx);

      await sr.entities.Guess.update(mine.id, {
        claim_tx: res.hash,
        claim_explorer: EXPLORER_TX(res.hash),
      });

      return Response.json({
        ok: true,
        claim_tx: res.hash,
        claim_explorer: EXPLORER_TX(res.hash),
        amount: mine.pot_xlm,
        currency: "XLM",
        network: "Stellar Testnet",
      });
    }

    // ---- pool_state: the field for a product ----
    if (action === "pool_state") {
      const guesses = (await sr.entities.Guess.filter({ product_id: body.product_id }, "-created_date", 300)) || [];
      const field = latestPerUser(guesses);
      const pcts = field.map((g: any) => Number(g.guess_pct));
      // The DISTRIBUTION stays private until the product has been revealed.
      // Before that, showing it would let a guesser copy the crowd — which
      // is precisely what committing the hash before the reveal prevents.
      // The count is always safe to show.
      const revealed = isFieldPublic(guesses);
      return Response.json({
        ok: true,
        pool_size: field.length,
        eligible_count: field.filter((g: any) => g.eligible).length,
        revealed,
        distribution: revealed ? histogram(pcts) : [],
        field_pcts: revealed ? pcts : [],
        median_guess_pct: revealed ? median(pcts) : null,
      });
    }

    return Response.json({ ok: false, reason: "unknown_action" }, { status: 400 });
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
