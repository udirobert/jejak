import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Memo,
} from "npm:@stellar/stellar-sdk@12.3.0";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

// OpenZeppelin Protocol 27 Smart Account Kit Testnet allow-list
const ALLOWED_CONTRACTS = new Set([
  "1b5f4534a76322da2ad7c745f6900857a6802b0ca79850c35a03561df997785a", // Smart account WASM hash
  "CC7EKIHQP3TN4CARQDND6CEOY2UXLWWC2X5GHTD5NLAT7BG5GPZIOM3F", // WebAuthn verifier
  "CAAVTMCBXEIBPR64EAASKFXERVPYFZA2JYP5A3BG6PESWEFUJX5IHKN4", // Ed25519 verifier
  "CB3FATQKCIRIQOCYRUPCQ2KREQ7T4RPKS7EAEOZWPEPUKWEDRVROBCEG", // Threshold policy
  "CABXBYJNZ7IUW4G3D6BND5YCAQF3ASSDMDAOKQQ63UYFSO7WUU2TIP5G", // Spending-limit policy
]);

const ALLOWED_ACTIONS = new Set([
  "deploy_smart_account",
  "add_recovery_signer",
  "set_spending_policy",
  "sign_session_challenge",
]);

// Sliding-window rate limit per caller IP (max 10 sponsored ops per 60s)
const RATE_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const callerTimestamps = new Map();

function checkRateLimit(callerKey) {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const recent = (callerTimestamps.get(callerKey) || []).filter(
    (t) => t > windowStart
  );
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  recent.push(now);
  callerTimestamps.set(callerKey, recent);
  return true;
}

// Isolated deterministic keypair for the fee-sponsoring relayer ONLY
// Separate from stellarMakerPayout so the relayer has its own capped fee account.
async function getRelayerSponsorKeypair(server) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode("jejak-isolated-fee-relayer-sponsor-v1")
  );
  const kp = Keypair.fromRawEd25519Seed(new Uint8Array(digest));
  try {
    await server.loadAccount(kp.publicKey());
  } catch {
    await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(kp.publicKey())}`, {
      signal: AbortSignal.timeout(8000),
    });
  }
  return kp;
}

export default async function (req) {
  try {
    const forwarded =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") ||
      "anonymous";
    const callerIp = forwarded.split(",")[0].trim();

    if (!checkRateLimit(callerIp)) {
      return Response.json(
        {
          ok: false,
          code: "RATE_LIMITED",
          error:
            "Relayer rate limit reached (max 10 sponsored operations per minute). Please wait a moment.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const contractId = String(body.contractId || "").trim();
    const targetPolicyOrVerifier = String(
      body.targetContract ||
        "CC7EKIHQP3TN4CARQDND6CEOY2UXLWWC2X5GHTD5NLAT7BG5GPZIOM3F"
    ).trim();

    // Enforce strict action allow-list
    if (!ALLOWED_ACTIONS.has(action)) {
      return Response.json(
        {
          ok: false,
          code: "DISALLOWED_OPERATION",
          error: `Relayer only sponsors allow-listed smart-account operations (${Array.from(
            ALLOWED_ACTIONS
          ).join(", ")}).`,
        },
        { status: 403 }
      );
    }

    // Enforce contract allow-list + valid C... Soroban contract address format
    if (
      !contractId.startsWith("C") ||
      contractId.length < 32 ||
      !ALLOWED_CONTRACTS.has(targetPolicyOrVerifier)
    ) {
      return Response.json(
        {
          ok: false,
          code: "DISALLOWED_CONTRACT",
          error:
            "Target contract is not on the OpenZeppelin Protocol 27 smart-account allow-list.",
        },
        { status: 403 }
      );
    }

    const server = new Horizon.Server(HORIZON_URL);
    const sponsorKp = await getRelayerSponsorKeypair(server);
    const sponsorAcct = await server.loadAccount(sponsorKp.publicKey());

    const shortContract = contractId.slice(0, 12);
    const dataKey = `oz_${action.slice(0, 10)}_${shortContract.slice(0, 6)}`;
    const dataVal = `${targetPolicyOrVerifier.slice(0, 12)}:${String(
      body.meta || "ok"
    ).slice(0, 24)}`;
    const memoText = `OZ:${action.slice(0, 10).toUpperCase()}:${shortContract.slice(0, 8)}`.slice(
      0,
      28
    );

    // Fee-capped sponsored transaction (max 200 stroops = 0.00002 XLM, zero XLM transferred out)
    const tx = new TransactionBuilder(sponsorAcct, {
      fee: "200",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.manageData({
          name: dataKey,
          value: dataVal,
        })
      )
      .addMemo(Memo.text(memoText))
      .setTimeout(20)
      .build();

    tx.sign(sponsorKp);
    const result = await server.submitTransaction(tx);

    return Response.json({
      ok: true,
      network: "Stellar Testnet",
      sponsoredBy: sponsorKp.publicKey(),
      feeSponsoredXlm: "0.00002",
      action,
      contractId,
      targetContract: targetPolicyOrVerifier,
      hash: result.hash,
      ledger: result.ledger,
      explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        code: "RELAYER_FAILURE",
        error:
          error?.message ||
          "Fee-sponsoring relayer could not reach Stellar Testnet.",
      },
      { status: 502 }
    );
  }
}