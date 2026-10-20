# Student Token Dashboard (Ethereum Sepolia)

A web dashboard where a student connects MetaMask, views two ERC-20 token balances, sends a token to another group member and confirms the transfer on Etherscan.

**Strictly Ethereum Sepolia testnet (chain ID 11155111). Never Mainnet. Test ETH and these tokens have no real monetary value.**

- **Public dashboard:** https://deezi12346.github.io/DN_Ozolins/
- **Repository:** https://github.com/Deezi12346/DN_Ozolins

## Token specification

| Property | Token A | Token B |
|---|---|---|
| Name | Deeznats | TODO |
| Symbol | DN | TODO |
| Decimals | 18 | TODO (18 recommended) |
| Initial / total supply | 100,000 | TODO |
| Mint policy | Fixed supply, no additional mint (supply minted once in the constructor, no public mint function) | TODO |
| Initial supply recipient | TODO: deployer wallet address | TODO |
| Use in the game | TODO | TODO |
| Contract address (Sepolia) | [`0x991C9ad3c61281714b16F3713Cf8def01b3133cE`](https://sepolia.etherscan.io/address/0x991C9ad3c61281714b16F3713Cf8def01b3133cE) | TODO |
| Creator wallet | TODO | TODO |
| Deployment transaction | TODO (Etherscan link) | TODO (Etherscan link) |
| Solidity file | [`contracts/Deeznats.sol`](contracts/Deeznats.sol) | TODO (`contracts/<Name>.sol`) |

### Why two separate tokens?

TODO: One or two sentences giving each token a different classroom purpose (for example, a rare token for premium achievements and a common token for basic rewards), and explaining the token economics: supply, who receives it first, and why the supplies differ.

### Differences between the two contracts

TODO: Describe the changes between the two `.sol` files (name, symbol, supply, any other change).

## How to get the tokens

1. Install MetaMask and switch it to **Sepolia**. Use a dedicated test wallet.
2. Get a little free SepoliaETH from a Sepolia faucet to pay gas.
3. Send your public wallet address to the deploying wallet owner (TODO: name and public address) and ask for a small amount of each token.
4. Open the dashboard and connect your wallet. If a token does not show in MetaMask, use Import tokens and paste the contract address from the table above.

## Using the dashboard

1. Click **Connect Wallet**. The page asks MetaMask to use Sepolia if you are on another network.
2. Your address and both token balances are shown.
3. Choose a token, enter the destination wallet and an amount, then click **Send**.
4. Confirm in MetaMask. After confirmation the page shows an Etherscan link and refreshes the balances.

## What is gas?

Every on-chain transaction costs gas, paid in SepoliaETH to the network that processes it. Gas is separate from the token being sent: an ERC-20 `transfer()` moves tokens between balances, while SepoliaETH pays for the computation. Without SepoliaETH, a wallet cannot send tokens.

## Safety checks in the UI

- Blocks the wrong network and asks MetaMask to switch to Sepolia.
- Rejects an invalid destination address (`ethers.isAddress`) before any wallet request.
- Rejects zero, malformed and excess amounts with a clear message.
- Reads `decimals()` from the contract and uses `parseUnits` and `formatUnits`; no hardcoded scale.
- Waits for the transaction receipt before saying the transfer succeeded.
- A rejected MetaMask prompt shows "cancelled" and never claims success.
- No private key or seed phrase fields anywhere. Never enter these on any web page.

## Test evidence

| Test | Expected behavior | Result / evidence |
|---|---|---|
| Both deployments | Two unique valid Sepolia contract addresses | TODO |
| Initial supply | Correct `totalSupply` and deployer balance | TODO |
| Transfers | Recipient gets the amount, sender is reduced, supply unchanged | TODO (Etherscan tx links) |
| UI balances | Correct balances for two distinct wallets | TODO (screenshots) |
| Wrong address | UI rejects before the wallet request | TODO (screenshot) |
| Zero / excess amount | UI rejects with clear feedback | TODO (screenshot) |
| Wrong chain | App blocks the transaction or requests Sepolia | TODO (screenshot) |
| MetaMask cancellation | App does not claim success | TODO (screenshot) |
| Reload | Balances still match blockchain state | TODO |

### Transfer proof (Etherscan)

- Token A transfer: TODO
- Token B transfer: TODO

## Repository structure

```
DN_Ozolins/
├── index.html
├── app.js
├── contracts/
│   ├── Deeznats.sol
│   └── <SecondToken>.sol
└── README.md
```

## Team and roles

| Member | Role | Sepolia transaction |
|---|---|---|
| TODO | Token A owner | TODO |
| TODO | Token B owner | TODO |
| TODO | Frontend owner | TODO |
| TODO | QA / documentation owner | TODO |

## Deployment

GitHub Pages: Settings -> Pages -> Deploy from a branch -> `main` / (root). The dashboard is an ES module, so to test locally serve it over HTTP (`python3 -m http.server`) instead of opening the file directly.
