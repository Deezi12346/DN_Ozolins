// Token dashboard - Ethereum Sepolia only (chain ID 11155111). ethers.js v6.
import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.min.js";

// ---- CONFIG: edit these after deploying ------------------------------------
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";
const ETHERSCAN = "https://sepolia.etherscan.io";

const TOKENS = [
  {
    key: "DN",
    name: "Deeznats",
    symbol: "DN",
    address: "0x991C9ad3c61281714b16F3713Cf8def01b3133cE",
  },
  {
    key: "TOKEN_B",
    name: "Second token (placeholder)",
    symbol: "TOKB",
    // TODO: paste the second token's Sepolia contract address here.
    address: "",
  },
];
// ------------------------------------------------------------------------------

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const $ = (id) => document.getElementById(id);
let provider = null;
let signer = null;
let account = null;
const meta = {}; // key -> { decimals, symbol }

const isConfigured = (t) => ethers.isAddress(t.address);

function setStatus(msg, kind = "info") {
  const el = $("status");
  el.textContent = msg;
  el.className = "status " + kind;
}

function setNetworkWarning(show) {
  $("netWarning").hidden = !show;
}

async function onSepolia() {
  const net = await provider.getNetwork();
  return net.chainId === SEPOLIA_CHAIN_ID;
}

async function switchToSepolia() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
  } catch (e) {
    // user rejected or switch failed; the warning stays visible
  }
}

function contractFor(token, runner) {
  return new ethers.Contract(token.address, ERC20_ABI, runner);
}

async function refreshBalances() {
  const list = $("balances");
  list.innerHTML = "";
  for (const t of TOKENS) {
    const li = document.createElement("li");
    if (!isConfigured(t)) {
      li.textContent = `${t.symbol}: contract address not configured yet`;
      list.appendChild(li);
      continue;
    }
    try {
      const c = contractFor(t, provider);
      const [decimals, symbol, raw, supply] = await Promise.all([
        c.decimals(),
        c.symbol(),
        c.balanceOf(account),
        c.totalSupply(),
      ]);
      meta[t.key] = { decimals, symbol };
      const link = `<a href="${ETHERSCAN}/token/${t.address}" target="_blank" rel="noopener">contract</a>`;
      li.innerHTML =
        `<strong>${symbol}</strong>: ${ethers.formatUnits(raw, decimals)} ` +
        `<small>(total supply ${ethers.formatUnits(supply, decimals)}, ${link})</small>`;
    } catch (e) {
      li.textContent = `${t.symbol}: could not read balance (wrong network?)`;
    }
    list.appendChild(li);
  }
}

function fillTokenSelector() {
  const sel = $("tokenSelect");
  sel.innerHTML = "";
  for (const t of TOKENS) {
    if (!isConfigured(t)) continue;
    const opt = document.createElement("option");
    opt.value = t.key;
    opt.textContent = `${t.name} (${t.symbol})`;
    sel.appendChild(opt);
  }
}

async function connect() {
  if (!window.ethereum) {
    setStatus("MetaMask not found. Install it and reload.", "error");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    if (!(await onSepolia())) {
      setNetworkWarning(true);
      await switchToSepolia();
      provider = new ethers.BrowserProvider(window.ethereum);
      if (!(await onSepolia())) {
        setStatus("Please switch MetaMask to Ethereum Sepolia.", "error");
        return;
      }
    }
    setNetworkWarning(false);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    $("account").textContent = account;
    $("connectBtn").textContent = "Connected";
    $("app").hidden = false;
    fillTokenSelector();
    await refreshBalances();
    setStatus("Connected to Sepolia.", "ok");
  } catch (e) {
    setStatus(friendlyError(e), "error");
  }
}

function friendlyError(e) {
  if (e?.code === "ACTION_REJECTED" || e?.code === 4001) {
    return "Transaction cancelled in MetaMask. Nothing was sent.";
  }
  if (e?.code === "INSUFFICIENT_FUNDS") {
    return "Not enough SepoliaETH to pay gas.";
  }
  return e?.shortMessage || e?.message || "Something went wrong.";
}

async function send(ev) {
  ev.preventDefault();
  const btn = $("sendBtn");
  try {
    if (!signer) throw new Error("Connect your wallet first.");
    if (!(await onSepolia())) {
      setNetworkWarning(true);
      throw new Error("Wrong network. Switch MetaMask to Ethereum Sepolia.");
    }
    const token = TOKENS.find((t) => t.key === $("tokenSelect").value);
    if (!token || !isConfigured(token)) throw new Error("Select a configured token.");

    const to = $("recipient").value.trim();
    if (!ethers.isAddress(to)) throw new Error("Invalid destination address.");
    if (to.toLowerCase() === account.toLowerCase()) {
      throw new Error("Destination is your own address.");
    }

    const amountStr = $("amount").value.trim();
    const c = contractFor(token, signer);
    const decimals = await c.decimals();
    let amount;
    try {
      amount = ethers.parseUnits(amountStr, decimals);
    } catch {
      throw new Error("Invalid amount format.");
    }
    if (amount <= 0n) throw new Error("Amount must be greater than zero.");
    const bal = await c.balanceOf(account);
    if (amount > bal) {
      throw new Error(`Insufficient balance. You have ${ethers.formatUnits(bal, decimals)}.`);
    }

    btn.disabled = true;
    setStatus("Confirm the transaction in MetaMask...", "info");
    const tx = await c.transfer(to, amount);
    setStatus("Transaction sent, waiting for confirmation...", "info");
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("Transaction failed on-chain.");
    $("status").innerHTML =
      `Transfer confirmed. <a href="${ETHERSCAN}/tx/${tx.hash}" target="_blank" rel="noopener">View on Etherscan</a>`;
    $("status").className = "status ok";
    await refreshBalances();
  } catch (e) {
    setStatus(friendlyError(e), "error");
  } finally {
    btn.disabled = false;
  }
}

if (window.ethereum) {
  window.ethereum.on?.("chainChanged", () => window.location.reload());
  window.ethereum.on?.("accountsChanged", () => window.location.reload());
}

$("connectBtn").addEventListener("click", connect);
$("sendForm").addEventListener("submit", send);
