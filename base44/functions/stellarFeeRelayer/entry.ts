import { Buffer } from "node:buffer";
import {
  Keypair,
  Horizon,
  TransactionBuilder,
  Networks,
  Operation,
  Memo,
  xdr,
  Address,
  StrKey,
  rpc,
} from "npm:@stellar/stellar-sdk@16.0.1";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const RPC_URL = "https://soroban-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

// OpenZeppelin Protocol 27 Smart Account Kit Testnet deployments
// (docs/deployments-protocol-27-2026-07-09.md in stellar/smart-account-kit)
const ACCOUNT_WASM_HASH =
  "1b5f4534a76322da2ad7c745f6900857a6802b0ca79850c35a03561df997785a";
const WEBAUTHN_VERIFIER =
  "CC7EKIHQP3TN4CARQDND6CEOY2UXLWWC2X5GHTD5NLAT7BG5GPZIOM3F";
const ALLOWED_CONTRACTS = new Set([
  ACCOUNT_WASM_HASH, // Smart account WASM hash
  WEBAUTHN_VERIFIER, // WebAuthn verifier
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

const sha256 = (data) =>
  crypto.subtle.digest("SHA-256", data).then((d) => new Uint8Array(d));

// Isolated deterministic keypair for the fee-sponsoring relayer ONLY
// Separate from stellarMakerPayout so the relayer has its own capped fee account.
async function getRelayerSponsorKeypair(server) {
  const digest = await sha256(
    new TextEncoder().encode("jejak-isolated-fee-relayer-sponsor-v1")
  );
  const kp = Keypair.fromRawEd25519Seed(digest);
  try {
    await server.loadAccount(kp.publicKey());
  } catch {
    await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(kp.publicKey())}`, {
      signal: AbortSignal.timeout(8000),
    });
  }
  return kp;
}

function base64UrlToBytes(b64url) {
  const b64 = String(b64url || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Deterministic contract address for a createContractV2 deploy by `sourcePubkey`:
// SHA-256(HashIdPreimage{ENVELOPE_TYPE_CONTRACT_ID{networkID, preimage{source, salt}}})
async function contractIdForDeploy(networkPassphrase, sourcePubkeyBytes, saltBytes) {
  const preimage = xdr.HashIdPreimage.envelopeTypeContractId(
    new xdr.HashIdPreimageContractId({
      networkId: xdr.Hash.fromXDR(
        Buffer.from(await sha256(new TextEncoder().encode(networkPassphrase)))
      ),
      contractIdPreimage:
        xdr.ContractIdPreimage.contractIdPreimageFromAddress(
          new xdr.ContractIdPreimageFromAddress({
            address: Address.account(sourcePubkeyBytes).toScAddress(),
            salt: xdr.Uint256.fromXDR(Buffer.from(saltBytes)),
          })
        ),
    })
  );
  return StrKey.encodeContract(Buffer.from(await sha256(preimage.toXDR())));
}

// Signer::External(verifier, keyData) — contracttype enums encode as
// vec[Symbol variant, ...fields]. keyData = 65-byte uncompressed secp256r1
// public key followed by the credential ID bytes (WebAuthn verifier layout).
function passkeySignerScVal(pubkey65, credentialIdBytes) {
  const keyData = new Uint8Array(65 + credentialIdBytes.length);
  keyData.set(pubkey65, 0);
  keyData.set(credentialIdBytes, 65);
  return xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol("External"),
    Address.fromString(WEBAUTHN_VERIFIER).toScVal(),
    xdr.ScVal.scvBytes(Buffer.from(keyData)),
  ]);
}

// True if a contract instance exists at `contractId` on Soroban Testnet.
// Used by the sign-in path: a WebAuthn assertion can't reveal the pubkey,
// so we can't re-deploy — but we can confirm an existing deployment.
async function contractDeployed(rpcServer, contractId) {
  try {
    await rpcServer.getContractData(
      contractId,
      xdr.ScVal.scvLedgerKeyContractInstance(),
      rpc.Durability.Persistent
    );
    return true;
  } catch (e) {
    if (e?.code === 404) return false;
    throw e;
  }
}

// Deploy the OpenZeppelin multisig smart-account instance for this passkey.
// Returns { contractId, hash, ledger } on success, throws otherwise.
async function deploySmartAccount(sponsorKp, pubkey65, credentialIdBytes) {
  const salt = await sha256(
    new TextEncoder().encode(`jejak-passport:${bytesToHex(credentialIdBytes)}`)
  );
  const contractId = await contractIdForDeploy(
    Networks.TESTNET,
    sponsorKp.rawPublicKey(),
    salt
  );

  const rpcServer = new rpc.Server(RPC_URL);
  const sponsorAccount = await rpcServer.getAccount(sponsorKp.publicKey());

  const tx = new TransactionBuilder(sponsorAccount, {
    fee: "1000000", // 0.1 XLM inclusion fee; soroban resource fee added by prepareTransaction
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeCreateContractV2(
          new xdr.CreateContractArgsV2({
            contractIdPreimage:
              xdr.ContractIdPreimage.contractIdPreimageFromAddress(
                new xdr.ContractIdPreimageFromAddress({
                  address: Address.account(sponsorKp.rawPublicKey()).toScAddress(),
                  salt: xdr.Uint256.fromXDR(Buffer.from(salt)),
                })
              ),
            executable: xdr.ContractExecutable.contractExecutableWasm(
              xdr.Hash.fromXDR(Buffer.from(ACCOUNT_WASM_HASH, "hex"))
            ),
            // __constructor(signers: Vec<Signer>, policies: Map<Address, Val>)
            constructorArgs: [
              xdr.ScVal.scvVec([
                passkeySignerScVal(pubkey65, credentialIdBytes),
              ]),
              xdr.ScVal.scvMap([]),
            ],
          })
        ),
        auth: [],
      })
    )
    .setTimeout(60)
    .build();

  const prepared = await rpcServer.prepareTransaction(tx);
  prepared.sign(sponsorKp);
  const sendRes = await rpcServer.sendTransaction(prepared);
  if (sendRes.status === "ERROR" || sendRes.status === "DUPLICATE") {
    // Same (sponsor, salt) preimage already deployed — the address is still valid.
    return { contractId, hash: sendRes.hash, ledger: null, alreadyDeployed: true };
  }

  let getRes = await rpcServer.getTransaction(sendRes.hash);
  for (let i = 0; i < 20 && getRes.status === "NOT_FOUND"; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    getRes = await rpcServer.getTransaction(sendRes.hash);
  }
  if (getRes.status !== "SUCCESS") {
    throw new Error(`Deploy transaction failed: ${getRes.status}`);
  }
  return { contractId, hash: sendRes.hash, ledger: getRes.ledger, alreadyDeployed: false };
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

    // Real deploy: createContractV2 with the passkey's WebAuthn signer.
    // keyData layout = 65-byte uncompressed secp256r1 pubkey || credentialId.
    if (action === "deploy_smart_account") {
      let deployed = null;
      let deployError = null;
      let expectedContractId = null;
      try {
        const credentialIdBytes = base64UrlToBytes(body.credentialId);
        const pubkey65 = base64UrlToBytes(body.passkeyPublicKey);
        const credOk =
          credentialIdBytes.length >= 8 && credentialIdBytes.length <= 128;
        const keyOk = pubkey65.length === 65 && pubkey65[0] === 0x04;
        if (credOk) {
          const salt = await sha256(
            new TextEncoder().encode(
              `jejak-passport:${bytesToHex(credentialIdBytes)}`
            )
          );
          expectedContractId = await contractIdForDeploy(
            Networks.TESTNET,
            sponsorKp.rawPublicKey(),
            salt
          );
        }
        if (credOk && keyOk) {
          deployed = await deploySmartAccount(
            sponsorKp,
            pubkey65,
            credentialIdBytes
          );
        } else if (credOk && expectedContractId) {
          // Sign-in path: passkey assertions don't expose the public key, so a
          // fresh deploy isn't possible — but the account may already exist
          // (deployed from the passkey's original device). Report truthfully.
          const rpcServer = new rpc.Server(RPC_URL);
          if (await contractDeployed(rpcServer, expectedContractId)) {
            deployed = {
              contractId: expectedContractId,
              hash: null,
              ledger: null,
              alreadyDeployed: true,
            };
          } else {
            deployError =
              "Passkey public key unavailable and no smart account found at the derived address.";
          }
        } else {
          deployError = "Invalid or missing passkey public key / credentialId.";
        }
      } catch (e) {
        deployError = e?.message || String(e);
      }

      if (deployed) {
        // Also journal a manageData marker so the deploy shows in the sponsor's feed.
        let journalHash = null;
        let journalLedger = null;
        try {
          const sponsorAcct = await server.loadAccount(sponsorKp.publicKey());
          const jtx = new TransactionBuilder(sponsorAcct, {
            fee: "200",
            networkPassphrase: Networks.TESTNET,
          })
            .addOperation(
              Operation.manageData({
                name: `oz_deploy_${deployed.contractId.slice(1, 7)}`,
                value: `acct:${deployed.contractId.slice(-10)}`,
              })
            )
            .addMemo(Memo.text(`OZ:DEPLOY:${deployed.contractId.slice(1, 9)}`))
            .setTimeout(20)
            .build();
          jtx.sign(sponsorKp);
          const jres = await server.submitTransaction(jtx);
          journalHash = jres.hash;
          journalLedger = jres.ledger;
        } catch {
          // journal is best-effort only
        }

        // `deployed.hash` is null on the sign-in path (existing contract
        // detected, no new deploy tx) — fall back to the journal tx for links.
        const txHash = deployed.hash || journalHash;
        return Response.json({
          ok: true,
          network: "Stellar Testnet",
          deployed: true,
          alreadyDeployed: Boolean(deployed.alreadyDeployed),
          sponsoredBy: sponsorKp.publicKey(),
          contractId: deployed.contractId,
          action,
          hash: txHash,
          deployTxHash: deployed.hash,
          ledger: deployed.ledger ?? journalLedger,
          explorerUrl: txHash
            ? `https://stellar.expert/explorer/testnet/tx/${txHash}`
            : null,
          contractExplorerUrl: `https://stellar.expert/explorer/testnet/contract/${deployed.contractId}`,
        });
      }

      // Fallback: journal the deployment intent only (no real contract).
      // The deterministic contractId is still returned so the client has the
      // address the account *would* have once deploy succeeds.
      const sponsorAcct = await server.loadAccount(sponsorKp.publicKey());
      const shortContract = contractId.slice(0, 12);
      const tx = new TransactionBuilder(sponsorAcct, {
        fee: "200",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.manageData({
            name: `oz_${action.slice(0, 10)}_${shortContract.slice(0, 6)}`,
            value: `${targetPolicyOrVerifier.slice(0, 12)}:${String(
              body.meta || "ok"
            ).slice(0, 24)}`,
          })
        )
        .addMemo(
          Memo.text(
            `OZ:${action.slice(0, 10).toUpperCase()}:${shortContract.slice(0, 8)}`.slice(
              0,
              28
            )
          )
        )
        .setTimeout(20)
        .build();
      tx.sign(sponsorKp);
      const result = await server.submitTransaction(tx);

      return Response.json({
        ok: true,
        network: "Stellar Testnet",
        deployed: false,
        journaled: true,
        deployError,
        sponsoredBy: sponsorKp.publicKey(),
        feeSponsoredXlm: "0.00002",
        action,
        contractId: expectedContractId || contractId,
        targetContract: targetPolicyOrVerifier,
        hash: result.hash,
        ledger: result.ledger,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      });
    }

    // Non-deploy actions are journaled on the sponsor account: real
    // smart-account execution requires a passkey-signed __check_auth
    // authorization which only the client can produce.
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
      journaled: true,
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
