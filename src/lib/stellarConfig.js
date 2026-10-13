// Single source of truth for Stellar network, Passkey RP ID, and OpenZeppelin
// Protocol 27 `smart-account-kit` contract deployments on Stellar Testnet.
//
// SDK Architecture Note:
// `passkey-kit` and `smart-account-kit` are both actively maintained sibling SDKs
// under github.com/stellar. We use the `smart-account-kit` architecture here because
// it targets the audited OpenZeppelin `stellar-contracts` account (commit 1e513890),
// which natively supports context rules, multi-signer recovery thresholds, and
// spending-limit policies used in Jejak's Bank view.
//
// IMPORTANT RP ID / DOMAIN WARNING:
// WebAuthn passkeys are permanently bound to their Relying Party ID (RP ID).
// Changing `CANONICAL_PASSKEY_RP_ID` to a different custom domain in the future
// will orphan wallets created on the old domain unless a secondary recovery signer
// was added.

export const STELLAR_NETWORK = "TESTNET"; // Never default to MAINNET in this demo
export const STELLAR_NETWORK_LABEL = "Demo wallet (testnet)";
export const STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

export const CANONICAL_PASSKEY_RP_ID = "jejak-trace-flow.base44.app";

export function getEffectiveRpId() {
  if (typeof window === "undefined") return CANONICAL_PASSKEY_RP_ID;
  return window.location.hostname || CANONICAL_PASSKEY_RP_ID;
}

export function isEmbeddedPreviewIframe() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

// Verified Protocol 27 Testnet deployments from:
// https://github.com/stellar/smart-account-kit/blob/main/docs/deployments-protocol-27-2026-07-09.md
export const OZ_SMART_ACCOUNT_TESTNET = {
  upstreamCommit: "1e513890ecf79833c9d6e7ef38a9358001c0b111",
  accountWasmHash:
    "1b5f4534a76322da2ad7c745f6900857a6802b0ca79850c35a03561df997785a",
  accountWasmUploadTx:
    "889f0e2322a03d5b2e4894e7d782c83a72259e5c9a04bc62295b538d4b16e263",
  webauthnVerifierContract:
    "CC7EKIHQP3TN4CARQDND6CEOY2UXLWWC2X5GHTD5NLAT7BG5GPZIOM3F",
  ed25519VerifierContract:
    "CAAVTMCBXEIBPR64EAASKFXERVPYFZA2JYP5A3BG6PESWEFUJX5IHKN4",
  thresholdPolicyContract:
    "CB3FATQKCIRIQOCYRUPCQ2KREQ7T4RPKS7EAEOZWPEPUKWEDRVROBCEG",
  spendingLimitPolicyContract:
    "CABXBYJNZ7IUW4G3D6BND5YCAQF3ASSDMDAOKQQ63UYFSO7WUU2TIP5G",
};

// Future SEP-10 / SEP-24 fiat ramp extension point (out of scope for current pass)
export const SEP_ANCHOR_CONFIG = {
  enabled: false,
  sep10AuthEndpoint: null,
  sep24TransferServer: null,
};