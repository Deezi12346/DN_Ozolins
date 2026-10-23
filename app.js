import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.min.js";

const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";
const ETHERSCAN_URL = "https://sepolia.etherscan.io";
const EXPECTED_DECIMALS = 18;

const TOKENS = [
  {
    id: "dn",
    name: "Deeznats",
    symbol: "DN",
    address: "0x991C9ad3c61281714b16F3713Cf8def01b3133cE",
    expectedSupply: 100_000n,
  },
  {
    id: "study",
    name: "Study Points",
    symbol: "SP",
    address: "0x60d73B9e259A544eC98f1dB5B0417003CE6Cf4f4",
    expectedSupply: 1_000_000n,
  },
];

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
let tokenStates = new Map();
let operationVersion = 0;
let transactionPending = false;

function setStatus(message, kind = "info", link = null) {
  const status = $("status");
  status.replaceChildren(document.createTextNode(message));
  status.dataset.kind = kind;
  if (link) {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.label;
    status.append(" ", anchor);
  }
}

function setNetworkStatus({ connected, onSepolia }) {
  $("networkDot").className = `dot${connected && onSepolia ? " ok" : connected ? " error" : ""}`;
  $("networkLabel").textContent = connected && onSepolia
    ? "Connected to Sepolia · Chain ID 11155111"
    : connected
      ? "Wrong network · Sepolia required"
      : "Ethereum Sepolia · Chain ID 11155111";
  $("networkWarning").classList.toggle("visible", connected && !onSepolia);
}

function renderTokenCards() {
  const cards = $("tokenCards");
  cards.replaceChildren();

  for (const token of TOKENS) {
    const state = tokenStates.get(token.id);
    const card = document.createElement("article");
    card.className = "card token-card";
    card.dataset.token = token.id;

    const heading = document.createElement("div");
    heading.className = "card-heading";
    const title = document.createElement("div");
    title.className = "token-title";
    const icon = document.createElement("span");
    icon.className = "token-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = (state?.symbol ?? token.symbol).slice(0, 1);
    const titleBlock = document.createElement("div");
    const name = document.createElement("h3");
    name.textContent = state?.name ?? token.name;
    const symbol = document.createElement("p");
    symbol.textContent = state?.symbol ?? token.symbol;
    titleBlock.append(name, symbol);
    title.append(icon, titleBlock);

    const verification = document.createElement("span");
    verification.className = "verification";
    verification.dataset.state = state?.verified ? "verified" : state?.error ? "error" : "pending";
    verification.textContent = state?.verified
      ? "● Verified"
      : state?.error
        ? "● Verification failed"
        : account
          ? "● Checking"
          : "● Not checked";
    heading.append(title, verification);

    const balanceLabel = document.createElement("p");
    balanceLabel.className = "balance-label";
    balanceLabel.textContent = "Wallet balance";
    const balance = document.createElement("div");
    balance.className = "balance-value";
    balance.textContent = state?.balance !== undefined
      ? `${state.balance} ${state.symbol}`
      : account
        ? "Loading…"
        : "Connect wallet";

    const details = document.createElement("div");
    details.className = "token-details";
    details.append(
      detail("Decimals", state?.decimals ?? "—"),
      detail("Total supply", state?.totalSupply ?? "—"),
    );

    const foot = document.createElement("div");
    foot.className = "card-foot";
    const message = document.createElement("span");
    message.className = "muted";
    message.textContent = state?.error ?? (state?.verified ? "Contract metadata matches the expected specification." : "Waiting for wallet connection.");
    const contract = document.createElement("a");
    if (ethers.isAddress(token.address)) {
      contract.href = `${ETHERSCAN_URL}/address/${token.address}`;
      contract.target = "_blank";
      contract.rel = "noopener noreferrer";
      contract.textContent = "View contract ↗";
    } else {
      contract.textContent = "Address not configured";
      contract.removeAttribute("href");
    }
    foot.append(message, contract);
    card.append(heading, balanceLabel, balance, details, foot);
    cards.append(card);
  }
}

function detail(labelText, valueText) {
  const wrapper = document.createElement("div");
  const label = document.createElement("span");
  label.className = "detail-label";
  label.textContent = labelText;
  const value = document.createElement("span");
  value.className = "detail-value";
  value.textContent = String(valueText);
  wrapper.append(label, value);
  return wrapper;
}

function renderAccount() {
  $("account").textContent = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : "Wallet not connected";
  $("account").title = account ?? "";
  $("connectBtn").textContent = account ? "Disconnect" : "Connect Wallet";
  $("copyBtn").hidden = !account;
  updateTransferControls();
}

function selectedToken() {
  return TOKENS.find((token) => token.id === $("tokenSelect").value) ?? null;
}

function updateTokenSelector() {
  const select = $("tokenSelect");
  const previous = select.value;
  select.replaceChildren();
  const verified = TOKENS.filter((token) => tokenStates.get(token.id)?.verified);

  if (verified.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = account ? "No verified tokens available" : "Connect wallet to verify tokens";
    select.append(option);
    select.disabled = true;
  } else {
    for (const token of verified) {
      const option = document.createElement("option");
      option.value = token.id;
      option.textContent = `${tokenStates.get(token.id).name} (${tokenStates.get(token.id).symbol})`;
      select.append(option);
    }
    select.disabled = false;
    select.value = verified.some((token) => token.id === previous) ? previous : verified[0].id;
  }
  updateTransferControls();
}

function updateTransferControls() {
  const token = selectedToken();
  const state = token ? tokenStates.get(token.id) : null;
  const available = state?.balance ?? "—";
  $("availableBalance").textContent = `Available: ${available}${state?.symbol ? ` ${state.symbol}` : ""}`;
  $("amountLabel").textContent = state?.symbol ? `Amount (${state.symbol})` : "Amount";
  $("symbolHint").textContent = state?.verified
    ? `Amount is denominated in ${state.symbol}.`
    : "Select a verified token to see its symbol and balance.";
  $("maxBtn").disabled = !state?.verified || transactionPending;
  $("sendBtn").disabled = !state?.verified || !signer || transactionPending;
}

async function getNetworkStatus(currentProvider = provider) {
  if (!currentProvider) return false;
  const network = await currentProvider.getNetwork();
  return network.chainId === SEPOLIA_CHAIN_ID;
}

async function requestSepoliaSwitch() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
    return true;
  } catch (error) {
    if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
      setStatus("Network switch was cancelled. Select Sepolia in your wallet to continue.", "warning");
    } else {
      setStatus("Could not switch networks automatically. Select Ethereum Sepolia in your wallet.", "warning");
    }
    return false;
  }
}

function isRpcError(error) {
  const code = error?.code ?? error?.info?.error?.code;
  return ["NETWORK_ERROR", "SERVER_ERROR", "TIMEOUT", "UNKNOWN_ERROR", "ECONNRESET", "ECONNREFUSED"].includes(code)
    || (typeof code === "number" && code <= -32000);
}

function errorMessage(error) {
  const message = error?.shortMessage
    ?? error?.reason
    ?? error?.info?.error?.message
    ?? error?.message;
  return typeof message === "string" && message.trim()
    ? message.trim().slice(0, 240)
    : "No additional error details were provided.";
}

async function verifyToken(token, currentProvider, walletAddress) {
  if (!ethers.isAddress(token.address)) {
    return { error: "Configuration error: the contract address is missing or invalid." };
  }

  let bytecode;
  try {
    bytecode = await currentProvider.getCode(token.address);
  } catch (error) {
    return { error: `RPC error while checking contract code on Sepolia: ${errorMessage(error)}` };
  }
  if (!bytecode || /^0x0*$/i.test(bytecode)) {
    return { error: "No contract code exists at this address on Sepolia." };
  }

  const contract = new ethers.Contract(token.address, ERC20_ABI, currentProvider);
  let name;
  let symbol;
  let decimals;
  let rawSupply;
  let rawBalance;
  try {
    [name, symbol, decimals, rawSupply, rawBalance] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.balanceOf(walletAddress),
    ]);
  } catch (error) {
    const type = isRpcError(error) ? "RPC error" : "ERC-20 read error";
    return { error: `${type} while reading metadata, total supply, or this wallet's balance: ${errorMessage(error)}` };
  }

  const expectedRawSupply = token.expectedSupply * (10n ** BigInt(EXPECTED_DECIMALS));
  const mismatches = [];
  if (name !== token.name) mismatches.push(`name is “${name}”, expected “${token.name}”`);
  if (symbol !== token.symbol) mismatches.push(`symbol is “${symbol}”, expected “${token.symbol}”`);
  if (Number(decimals) !== EXPECTED_DECIMALS) mismatches.push(`decimals are ${decimals}, expected ${EXPECTED_DECIMALS}`);
  if (rawSupply !== expectedRawSupply) {
    mismatches.push(`total supply is ${ethers.formatUnits(rawSupply, decimals)} ${symbol}, expected ${token.expectedSupply.toLocaleString("en-US")} ${token.symbol}`);
  }

  const result = {
    name,
    symbol,
    decimals: Number(decimals),
    balance: ethers.formatUnits(rawBalance, decimals),
    rawBalance,
    totalSupply: `${ethers.formatUnits(rawSupply, decimals)} ${symbol}`,
    verified: mismatches.length === 0,
  };
  if (mismatches.length) result.error = `Verification mismatch: ${mismatches.join("; ")}.`;
  return result;
}

async function refreshDashboard() {
  const version = ++operationVersion;
  const currentProvider = provider;
  const walletAddress = account;
  if (!currentProvider || !walletAddress) {
    tokenStates = new Map();
    setNetworkStatus({ connected: false, onSepolia: false });
    renderTokenCards();
    updateTokenSelector();
    return;
  }

  tokenStates = new Map(TOKENS.map((token) => [token.id, { loading: true }]));
  renderTokenCards();
  updateTokenSelector();

  try {
    const onSepolia = await getNetworkStatus(currentProvider);
    if (version !== operationVersion) return;
    setNetworkStatus({ connected: true, onSepolia });
    if (!onSepolia) {
      tokenStates = new Map(TOKENS.map((token) => [token.id, { error: "Wrong network. Switch to Ethereum Sepolia to read this token." }]));
      renderTokenCards();
      updateTokenSelector();
      return;
    }

    for (const token of TOKENS) {
      try {
        const state = await verifyToken(token, currentProvider, walletAddress);
        if (version !== operationVersion) return;
        tokenStates.set(token.id, state);
      } catch (error) {
        tokenStates.set(token.id, { error: `Verification error: ${errorMessage(error)}` });
      }
      renderTokenCards();
      updateTokenSelector();
    }
  } catch {
    if (version !== operationVersion) return;
    setNetworkStatus({ connected: true, onSepolia: false });
    tokenStates = new Map(TOKENS.map((token) => [token.id, { error: "Could not check the wallet network. Reconnect and retry." }]));
    renderTokenCards();
    updateTokenSelector();
  }
}

async function connectWallet() {
  if (account) {
    disconnectWallet();
    return;
  }
  if (!window.ethereum) {
    setStatus("MetaMask was not detected. Install a compatible wallet and reload this page.", "error");
    return;
  }

  try {
    const nextProvider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await nextProvider.send("eth_requestAccounts", []);
    if (!accounts.length) {
      setStatus("No wallet account was selected.", "warning");
      return;
    }
    provider = nextProvider;
    signer = await provider.getSigner();
    account = await signer.getAddress();
    operationVersion += 1;
    renderAccount();

    if (!(await getNetworkStatus())) {
      setNetworkStatus({ connected: true, onSepolia: false });
      await requestSepoliaSwitch();
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      account = await signer.getAddress();
    }
    await refreshDashboard();
    if (await getNetworkStatus()) {
      setStatus("Wallet connected. Token metadata and balances are read from Sepolia.", "success");
    }
  } catch (error) {
    if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
      setStatus("Wallet connection was cancelled.", "warning");
    } else {
      setStatus("Could not connect to the wallet. Check MetaMask and try again.", "error");
    }
  }
}

function disconnectWallet() {
  operationVersion += 1;
  provider = null;
  signer = null;
  account = null;
  tokenStates = new Map();
  setNetworkStatus({ connected: false, onSepolia: false });
  renderAccount();
  renderTokenCards();
  updateTokenSelector();
  setStatus("Wallet disconnected from this dashboard.", "info");
}

function friendlyTransactionError(error) {
  if (error?.code === 4001 || error?.code === "ACTION_REJECTED") {
    return { message: "Transaction cancelled in your wallet. Nothing was confirmed.", kind: "warning" };
  }
  if (error?.code === "INSUFFICIENT_FUNDS") {
    return { message: "Not enough SepoliaETH to pay the network gas fee.", kind: "error" };
  }
  return { message: error?.shortMessage ?? "The transaction failed or could not be completed.", kind: "error" };
}

function parseTransferAmount(value, decimals) {
  const amountText = value.trim();
  if (!amountText) throw new Error("Enter a token amount.");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(amountText)) {
    throw new Error("Enter a positive decimal amount using digits and at most one decimal point.");
  }
  let amount;
  try {
    amount = ethers.parseUnits(amountText, decimals);
  } catch {
    throw new Error(`Amount has more decimal places than this token supports (${decimals}).`);
  }
  if (amount <= 0n) throw new Error("Amount must be greater than zero.");
  return amount;
}

async function sendTokens(event) {
  event.preventDefault();
  if (transactionPending) return;

  let submittedHash = null;
  let transferSymbol = null;
  try {
    const token = selectedToken();
    const state = token ? tokenStates.get(token.id) : null;
    if (!token || !state?.verified) throw new Error("Choose a token that has passed Sepolia contract verification.");
    transferSymbol = state.symbol;

    const recipient = $("recipient").value.trim();
    if (!recipient) throw new Error("Enter a destination wallet address.");
    if (!ethers.isAddress(recipient)) throw new Error("Enter a valid Ethereum wallet address.");

    const amount = parseTransferAmount($("amount").value, state.decimals);
    if (!signer || !provider || !account) throw new Error("Connect your wallet before sending tokens.");
    setStatus(`Checking network and ${state.symbol} token…`, "info");
    if (!(await getNetworkStatus())) {
      setNetworkStatus({ connected: true, onSepolia: false });
      throw new Error("Wrong network. Transfers are allowed only on Ethereum Sepolia.");
    }

    const currentProvider = provider;
    const sendingAccount = account;
    const signerForSend = signer;
    const contract = new ethers.Contract(token.address, ERC20_ABI, currentProvider);
    const balance = await contract.balanceOf(sendingAccount);
    if (amount > balance) {
      throw new Error(`Insufficient ${state.symbol} balance. Available: ${ethers.formatUnits(balance, state.decimals)}.`);
    }

    if (!(await getNetworkStatus(currentProvider))) {
      setNetworkStatus({ connected: true, onSepolia: false });
      throw new Error("Wallet network changed. Switch back to Sepolia before sending.");
    }
    transactionPending = true;
    updateTransferControls();
    setStatus(`Awaiting MetaMask confirmation for ${state.symbol} transfer…`, "info");

    const signedContract = new ethers.Contract(token.address, ERC20_ABI, signerForSend);
    const transaction = await signedContract.transfer(ethers.getAddress(recipient), amount);
    submittedHash = transaction.hash;
    const transactionLink = {
      href: `${ETHERSCAN_URL}/tx/${submittedHash}`,
      label: "View on Sepolia Etherscan ↗",
    };
    setStatus(`${state.symbol} transfer submitted.`, "info", transactionLink);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    setStatus(`Waiting for ${state.symbol} transfer confirmation…`, "info", transactionLink);
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1) {
      throw new Error("The transaction was mined but did not succeed.");
    }

    const stillOnSepolia = await getNetworkStatus(currentProvider).catch(() => false);
    if (!stillOnSepolia) {
      setStatus(`The ${state.symbol} transfer receipt succeeded, but the wallet network changed during confirmation. Verify the transaction on Sepolia Etherscan.`, "warning", {
        href: `${ETHERSCAN_URL}/tx/${transaction.hash}`,
        label: "View transaction ↗",
      });
    } else {
      setStatus(`${state.symbol} transfer confirmed successfully on Sepolia.`, "success", {
        href: `${ETHERSCAN_URL}/tx/${transaction.hash}`,
        label: "View transaction ↗",
      });
    }
    $("amount").value = "";
    await refreshDashboard();
  } catch (error) {
    const result = error instanceof Error && !error.code
      ? { message: error.message, kind: "error" }
      : friendlyTransactionError(error);
    const message = transferSymbol ? `${transferSymbol} transfer: ${result.message}` : result.message;
    setStatus(message, result.kind, submittedHash ? {
      href: `${ETHERSCAN_URL}/tx/${submittedHash}`,
      label: "Check transaction on Sepolia Etherscan ↗",
    } : null);
  } finally {
    transactionPending = false;
    updateTransferControls();
  }
}

async function copyAccount() {
  if (!account) return;
  try {
    await navigator.clipboard.writeText(account);
    setStatus("Wallet address copied.", "success");
  } catch {
    setStatus("Could not copy the address. Select it from your wallet instead.", "warning");
  }
}

async function handleAccountsChanged(accounts) {
  operationVersion += 1;
  if (!accounts.length) {
    disconnectWallet();
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    renderAccount();
    await refreshDashboard();
  } catch {
    disconnectWallet();
    setStatus("Wallet account changed, but the dashboard could not reconnect. Connect again to continue.", "error");
  }
}

async function handleChainChanged() {
  operationVersion += 1;
  if (!account || !window.ethereum) return;
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    renderAccount();
    await refreshDashboard();
  } catch {
    setNetworkStatus({ connected: true, onSepolia: false });
    setStatus("Could not read the changed wallet network. Reconnect and try again.", "error");
  }
}

$("connectBtn").addEventListener("click", connectWallet);
$("copyBtn").addEventListener("click", copyAccount);
$("refreshBtn").addEventListener("click", refreshDashboard);
$("sendForm").addEventListener("submit", sendTokens);
$("tokenSelect").addEventListener("change", updateTransferControls);
$("maxBtn").addEventListener("click", () => {
  const token = selectedToken();
  const state = token ? tokenStates.get(token.id) : null;
  if (state?.verified) $("amount").value = state.balance;
});

if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", handleAccountsChanged);
  window.ethereum.on("chainChanged", handleChainChanged);
}

setNetworkStatus({ connected: false, onSepolia: false });
renderAccount();
renderTokenCards();
updateTokenSelector();
