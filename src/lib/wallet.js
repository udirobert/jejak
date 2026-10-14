import { base44 } from "@/api/base44Client";
import {
  STELLAR_NETWORK,
  STELLAR_NETWORK_LABEL,
  SOROBAN_RPC_URL,
  OZ_SMART_ACCOUNT_TESTNET,
  getEffectiveRpId,
} from "./stellarConfig";

const WALLET_STORAGE_KEY = "jejak_smart_wallet_v1";
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function bytesToBase64Url(bytes) {
  let bin = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Preliminary C... placeholder derived locally before the relayer responds —
// the relayer replaces it with the real preimage-derived contract address.
async function deriveSmartAccountAddress(credentialId) {
  const input = `smart-account-kit:${OZ_SMART_ACCOUNT_TESTNET.accountWasmHash}:${STELLAR_NETWORK}:${credentialId}`;
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  );
  let chars = "C";
  for (let i = 0; i < 55; i++) {
    chars += BASE32_ALPHABET[digest[i % digest.length] % 32];
  }
  return chars;
}

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(session) {
  try {
    if (!session) localStorage.removeItem(WALLET_STORAGE_KEY);
    else localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

export function isPasskeySupported() {
  return Boolean(
    typeof window !== "undefined" &&
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === "function"
  );
}

// Verify Soroban Testnet RPC health before contract operations
async function checkSorobanRpcHealth() {
  const res = await fetch(SOROBAN_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
    signal: AbortSignal.timeout(6000),
  }).catch(() => null);
  if (!res || !res.ok) {
    const err = new Error(
      "Could not reach Soroban Testnet RPC. Check your connection and try again."
    );
    err.code = "RPC_FAILURE";
    throw err;
  }
  return true;
}

// Extract the 65-byte uncompressed secp256r1 public key from a WebAuthn
// credential response (last 65 bytes of the DER SubjectPublicKeyInfo).
function getPasskeyPublicKey65(cred) {
  const der = cred?.response?.getPublicKey?.();
  if (!der) return null;
  const bytes = new Uint8Array(der);
  const tail = bytes.slice(-65);
  return tail[0] === 0x04 ? tail : null;
}

async function deploySmartAccountSession({
  credentialId,
  rpId,
  simulatedPasskey = false,
  passkeyPublicKey = null,
}) {
  const placeholderContractId = await deriveSmartAccountAddress(credentialId);
  const nowIso = new Date().toISOString();

  const relayRes = await base44.functions
    .invoke("stellarFeeRelayer", {
      action: "deploy_smart_account",
      contractId: placeholderContractId,
      credentialId,
      passkeyPublicKey: passkeyPublicKey
        ? bytesToBase64Url(passkeyPublicKey)
        : null,
      targetContract: OZ_SMART_ACCOUNT_TESTNET.webauthnVerifierContract,
      meta: `rp:${rpId.slice(0, 14)}`,
    })
    .catch((e) => ({ data: { ok: false, error: e?.message } }));

  if (!relayRes?.data?.ok) {
    const err = new Error(
      relayRes?.data?.error ||
        "Fee-sponsoring relayer failed to register the smart account on Testnet."
    );
    err.code = relayRes?.data?.code || "RELAYER_FAILURE";
    throw err;
  }

  // The relayer returns the real preimage-derived contract address — already
  // deployed on Soroban Testnet when `deployed === true`.
  const contractId =
    typeof relayRes.data.contractId === "string" &&
    relayRes.data.contractId.startsWith("C")
      ? relayRes.data.contractId
      : placeholderContractId;
  const deployed = Boolean(relayRes.data.deployed);
  const contractExplorerUrl =
    relayRes.data.contractExplorerUrl ||
    `https://stellar.expert/explorer/testnet/contract/${contractId}`;

  const session = {
    provider: "smart-account-kit",
    address: contractId,
    deployed,
    credentialId,
    rpId,
    simulatedPasskey,
    network: STELLAR_NETWORK,
    networkLabel: STELLAR_NETWORK_LABEL,
    accountWasmHash: OZ_SMART_ACCOUNT_TESTNET.accountWasmHash,
    verifierContract: OZ_SMART_ACCOUNT_TESTNET.webauthnVerifierContract,
    spendingPolicyContract:
      OZ_SMART_ACCOUNT_TESTNET.spendingLimitPolicyContract,
    spendingLimit: {
      dailyCapAmount: 25,
      category: "All categories",
      active: true,
    },
    signers: [
      {
        id: credentialId.slice(0, 10),
        type: "passkey_secp256r1",
        label: simulatedPasskey
          ? "Preview P-256 passkey"
          : "Primary device passkey",
        addedAt: nowIso,
      },
    ],
    passportActions: [
      {
        id: `act-create-${Date.now()}`,
        type: "Passport created",
        detail: deployed
          ? simulatedPasskey
            ? "Smart account deployed on Testnet (preview key)"
            : "Smart account deployed on Testnet with passkey"
          : "Smart account registered (deployment pending)",
        hash: relayRes.data.hash,
        ledger: relayRes.data.ledger,
        explorerUrl: relayRes.data.explorerUrl,
        createdAt: nowIso,
        simulated: false,
      },
    ],
    sponsoredTxHash: relayRes.data.hash,
    sponsoredLedger: relayRes.data.ledger,
    explorerUrl: relayRes.data.explorerUrl,
    contractExplorerUrl,
    createdAt: nowIso,
  };

  saveStoredSession(session);
  return session;
}

/**
 * Create a new passkey-backed OpenZeppelin Smart Account ("Jejak passport")
 * with fee sponsorship handled by the isolated server-side `stellarFeeRelayer`.
 */
export async function createWallet({
  displayName = "Jejak Shopper",
  allowPreviewFallback = false,
} = {}) {
  const rpId = getEffectiveRpId();

  if (allowPreviewFallback) {
    const rawKey = crypto.getRandomValues(new Uint8Array(24));
    const credentialId = bytesToBase64Url(rawKey);
    // Well-formed 65-byte uncompressed P-256 pubkey placeholder so the
    // relayer can still perform a real contract deployment for previews.
    const previewKey = new Uint8Array(65);
    previewKey[0] = 0x04;
    crypto.getRandomValues(previewKey.subarray(1));
    return deploySmartAccountSession({
      credentialId,
      rpId,
      simulatedPasskey: true,
      passkeyPublicKey: previewKey,
    });
  }

  if (!isPasskeySupported()) {
    const err = new Error(
      "This browser or device does not support WebAuthn passkeys."
    );
    err.code = "UNSUPPORTED_BROWSER";
    throw err;
  }

  await checkSorobanRpcHealth();

  const userId = crypto.getRandomValues(new Uint8Array(16));
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  let cred;
  try {
    cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "Jejak Provenance Passport",
          id: rpId,
        },
        user: {
          id: userId,
          name: `passport-${Date.now()}@${rpId}`,
          displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -8 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    });
  } catch (e) {
    const err = new Error(
      e?.name === "SecurityError"
        ? "Passkey prompts are blocked inside an embedded preview iframe."
        : "Biometric prompt was cancelled or unavailable."
    );
    err.code =
      e?.name === "SecurityError" ? "IFRAME_BLOCKED" : "PASSKEY_CANCELLED";
    throw err;
  }

  const credentialId = bytesToBase64Url(cred.rawId);
  return deploySmartAccountSession({
    credentialId,
    rpId,
    simulatedPasskey: false,
    passkeyPublicKey: getPasskeyPublicKey65(cred),
  });
}

/**
 * Connect an existing passkey smart account OR fallback external wallet (Stellar Wallets Kit / Freighter).
 */
export async function connect({
  mode = "passkey",
  externalAddress = "",
} = {}) {
  if (mode === "external") {
    if (typeof window !== "undefined" && window.freighterApi) {
      try {
        const pubObj = await window.freighterApi.getAddress();
        const address =
          typeof pubObj === "string" ? pubObj : pubObj?.address || "";
        if (address) {
          const nowIso = new Date().toISOString();
          const session = {
            provider: "stellar-wallets-kit",
            walletName: "Freighter",
            address,
            network: STELLAR_NETWORK,
            networkLabel: STELLAR_NETWORK_LABEL,
            spendingLimit: {
              dailyCapAmount: 25,
              category: "All categories",
              active: true,
            },
            signers: [
              { id: "ext-1", type: "ed25519", label: "Freighter extension" },
            ],
            passportActions: [
              {
                id: `act-connect-${Date.now()}`,
                type: "Passport connected",
                detail: "Freighter wallet linked",
                hash: "",
                explorerUrl: `https://stellar.expert/explorer/testnet/account/${address}`,
                createdAt: nowIso,
              },
            ],
            createdAt: nowIso,
          };
          saveStoredSession(session);
          return session;
        }
      } catch {
        const err = new Error("Freighter connection was cancelled.");
        err.code = "PASSKEY_CANCELLED";
        throw err;
      }
    }

    const cleaned = String(externalAddress || "").trim().toUpperCase();
    if (
      (!cleaned.startsWith("G") && !cleaned.startsWith("C")) ||
      cleaned.length < 32
    ) {
      const err = new Error(
        "Enter a valid Stellar Testnet address (G… or C…) or install Freighter."
      );
      err.code = "INVALID_EXTERNAL_ADDRESS";
      throw err;
    }

    const nowIso = new Date().toISOString();
    const contractId = cleaned.startsWith("C")
      ? cleaned
      : `C${cleaned.slice(1)}`;
    const relayRes = await base44.functions
      .invoke("stellarFeeRelayer", {
        action: "deploy_smart_account",
        contractId,
        targetContract: OZ_SMART_ACCOUNT_TESTNET.ed25519VerifierContract,
        meta: `ext:${cleaned.slice(0, 10)}`,
      })
      .catch(() => null);

    const session = {
      provider: "stellar-wallets-kit",
      walletName: "External Stellar Wallet",
      address: cleaned,
      network: STELLAR_NETWORK,
      networkLabel: STELLAR_NETWORK_LABEL,
      spendingLimit: {
        dailyCapAmount: 25,
        category: "All categories",
        active: true,
      },
      signers: [
        {
          id: cleaned.slice(0, 8),
          type: "ed25519",
          label: "External wallet signer",
        },
      ],
      passportActions: [
        {
          id: `act-ext-${Date.now()}`,
          type: "Passport created",
          detail: "External signer registered",
          hash: relayRes?.data?.hash || "",
          ledger: relayRes?.data?.ledger || 0,
          explorerUrl:
            relayRes?.data?.explorerUrl ||
            `https://stellar.expert/explorer/testnet/account/${cleaned}`,
          createdAt: nowIso,
        },
      ],
      sponsoredTxHash: relayRes?.data?.hash || "",
      sponsoredLedger: relayRes?.data?.ledger || 0,
      explorerUrl:
        relayRes?.data?.explorerUrl ||
        `https://stellar.expert/explorer/testnet/account/${cleaned}`,
      createdAt: nowIso,
    };
    saveStoredSession(session);
    return session;
  }

  if (!isPasskeySupported()) {
    const err = new Error(
      "This browser or device does not support WebAuthn passkeys."
    );
    err.code = "UNSUPPORTED_BROWSER";
    throw err;
  }

  const existing = loadStoredSession();
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: getEffectiveRpId(),
        allowCredentials: existing?.credentialId
          ? [
              {
                type: "public-key",
                id: base64UrlToBytes(existing.credentialId),
              },
            ]
          : undefined,
        userVerification: "required",
        timeout: 60000,
      },
    });
    const credentialId = bytesToBase64Url(assertion.rawId);
    if (existing) {
      saveStoredSession(existing);
      return existing;
    }
    return deploySmartAccountSession({
      credentialId,
      rpId: getEffectiveRpId(),
      simulatedPasskey: false,
    });
  } catch (e) {
    const err = new Error(
      e?.name === "SecurityError"
        ? "Passkey prompts are blocked inside an embedded preview iframe."
        : "Passkey sign-in was cancelled."
    );
    err.code =
      e?.name === "SecurityError" ? "IFRAME_BLOCKED" : "PASSKEY_CANCELLED";
    throw err;
  }
}

/**
 * Sign a payload / context rule using the active wallet and sponsor submission via relayer.
 */
export async function sign(payloadSummary = "verify_context_rule") {
  const session = loadStoredSession();
  if (!session) {
    const err = new Error("No wallet connected.");
    err.code = "NOT_CONNECTED";
    throw err;
  }

  if (
    session.provider === "smart-account-kit" &&
    !session.simulatedPasskey &&
    isPasskeySupported()
  ) {
    try {
      const challenge = new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(String(payloadSummary))
        )
      );
      await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: getEffectiveRpId(),
          allowCredentials: session.credentialId
            ? [
                {
                  type: "public-key",
                  id: base64UrlToBytes(session.credentialId),
                },
              ]
            : undefined,
          userVerification: "required",
          timeout: 60000,
        },
      });
    } catch (e) {
      const err = new Error(
        e?.name === "SecurityError"
          ? "Passkey signing is blocked inside an embedded iframe."
          : "Biometric signature was cancelled."
      );
      err.code =
        e?.name === "SecurityError" ? "IFRAME_BLOCKED" : "PASSKEY_CANCELLED";
      throw err;
    }
  }

  const relayRes = await base44.functions
    .invoke("stellarFeeRelayer", {
      action: "sign_session_challenge",
      contractId: session.address.startsWith("C")
        ? session.address
        : `C${session.address.slice(1)}`,
      targetContract: OZ_SMART_ACCOUNT_TESTNET.spendingLimitPolicyContract,
      meta: String(payloadSummary).slice(0, 20),
    })
    .catch((e) => ({ data: { ok: false, error: e?.message } }));

  if (!relayRes?.data?.ok) {
    const err = new Error(
      relayRes?.data?.error || "Relayer failed to sponsor signature."
    );
    err.code = relayRes?.data?.code || "RELAYER_FAILURE";
    throw err;
  }

  return relayRes.data;
}

/**
 * Add a secondary recovery signer to the OpenZeppelin threshold policy.
 */
export async function addRecoverySigner(label = "Recovery backup key") {
  const session = loadStoredSession();
  if (!session) throw new Error("Create your Jejak passport first.");

  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const recoveryId = `REC-${bytesToBase64Url(randomBytes).slice(0, 12).toUpperCase()}`;

  const relayRes = await base44.functions
    .invoke("stellarFeeRelayer", {
      action: "add_recovery_signer",
      contractId: session.address.startsWith("C")
        ? session.address
        : `C${session.address.slice(1)}`,
      targetContract: OZ_SMART_ACCOUNT_TESTNET.thresholdPolicyContract,
      meta: recoveryId,
    })
    .catch((e) => ({ data: { ok: false, error: e?.message } }));

  if (!relayRes?.data?.ok) {
    const err = new Error(
      relayRes?.data?.error || "Relayer failed to sponsor recovery signer."
    );
    err.code = relayRes?.data?.code || "RELAYER_FAILURE";
    throw err;
  }

  const nowIso = new Date().toISOString();
  const actionEntry = {
    id: `act-rec-${Date.now()}`,
    type: "Recovery signer added",
    detail: label,
    hash: relayRes.data.hash,
    ledger: relayRes.data.ledger,
    explorerUrl: relayRes.data.explorerUrl,
    createdAt: nowIso,
    simulated: false,
  };

  const updated = {
    ...session,
    signers: [
      ...(session.signers || []),
      {
        id: recoveryId,
        type: "ed25519_recovery",
        label,
        txHash: relayRes.data.hash,
        addedAt: nowIso,
      },
    ],
    passportActions: [actionEntry, ...(session.passportActions || [])],
    lastSponsoredTx: relayRes.data,
  };
  saveStoredSession(updated);
  return updated;
}

/**
 * Update the OpenZeppelin smart-account spending-limit policy (`CABXBYJNZ...`)
 * with amount + category, write it to Stellar Testnet via the fee relayer,
 * and append it to `passportActions` under "Your passport".
 */
export async function updateSpendingLimitPolicy(input) {
  const session = loadStoredSession();
  if (!session) throw new Error("Create your Jejak passport first.");

  const dailyCapAmount =
    typeof input === "object" && input !== null
      ? Number(input.dailyCapAmount) || 25
      : Number(input) || 25;
  const category =
    typeof input === "object" && input !== null && input.category
      ? String(input.category)
      : session.spendingLimit?.category || "All categories";
  const currency =
    typeof input === "object" && input !== null && input.currency
      ? String(input.currency)
      : "GBP";

  const catShort = category.replace(/[^a-zA-Z]/g, "").slice(0, 8) || "All";
  const relayRes = await base44.functions
    .invoke("stellarFeeRelayer", {
      action: "set_spending_policy",
      contractId: session.address.startsWith("C")
        ? session.address
        : `C${session.address.slice(1)}`,
      targetContract: OZ_SMART_ACCOUNT_TESTNET.spendingLimitPolicyContract,
      meta: `cap:${dailyCapAmount}:${catShort}`,
    })
    .catch((e) => ({ data: { ok: false, error: e?.message } }));

  if (!relayRes?.data?.ok) {
    const err = new Error(
      relayRes?.data?.error || "Relayer failed to update spending policy."
    );
    err.code = relayRes?.data?.code || "RELAYER_FAILURE";
    throw err;
  }

  const nowIso = new Date().toISOString();
  const sym = currency === "SGD" ? "S$" : "£";
  const actionEntry = {
    id: `act-limit-${Date.now()}`,
    type: "Limit set",
    detail: `${sym}${dailyCapAmount}/day · ${category}`,
    amount: dailyCapAmount,
    category,
    currency,
    hash: relayRes.data.hash,
    ledger: relayRes.data.ledger,
    explorerUrl: relayRes.data.explorerUrl,
    createdAt: nowIso,
    simulated: false,
  };

  const updated = {
    ...session,
    spendingLimit: {
      dailyCapAmount,
      category,
      currency,
      active: true,
      txHash: relayRes.data.hash,
      ledger: relayRes.data.ledger,
      explorerUrl: relayRes.data.explorerUrl,
      updatedAt: nowIso,
    },
    passportActions: [actionEntry, ...(session.passportActions || [])],
    lastSponsoredTx: relayRes.data,
  };
  saveStoredSession(updated);
  return updated;
}

export function getAddress() {
  return loadStoredSession()?.address || null;
}

export function getWalletSession() {
  return loadStoredSession();
}

export function disconnect() {
  saveStoredSession(null);
}