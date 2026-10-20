# Student Token Dashboard (Ethereum Sepolia)

A small web dashboard to connect MetaMask, view ERC-20 token balances and send tokens to another wallet. **Sepolia testnet only (chain ID 11155111). Tokens have no real monetary value.**

Live dashboard: `https://<your-github-username>.github.io/<repo-name>/`  <!-- TODO: fill in after enabling Pages -->

## Tokens

| Property | Token A | Token B |
|---|---|---|
| Name | Deeznats | TODO |
| Symbol | DN | TODO |
| Decimals | 18 | TODO |
| Total supply | 100,000 (fixed, minted once in constructor) | TODO |
| Mint policy | No mint function, supply is fixed | TODO |
| Contract (Sepolia) | [`0x991C9ad3c61281714b16F3713Cf8def01b3133cE`](https://sepolia.etherscan.io/address/0x991C9ad3c61281714b16F3713Cf8def01b3133cE) | TODO |
| Deployment tx | TODO | TODO |
| Deployer wallet | TODO (public address only) | TODO |
| Purpose in the game | TODO | TODO |

Deeznats extends OpenZeppelin `ERC20` and `ERC20Permit`. The constructor takes a `recipient` address and mints the whole supply to it.

## How to get tokens

Ask the deploying wallet owner (TODO: name / public address) to send you some DN on Sepolia. You need a little SepoliaETH in your own wallet to pay gas.

## Gas

Every on-chain transaction costs gas, paid in SepoliaETH, not in the token. Sending DN uses the token's `transfer()` function; the gas fee goes to the network, and the token amount goes to the recipient.

## Run / deploy

- Files: `index.html`, `app.js`, `contracts/`.
- Config is at the top of `app.js` (token addresses).
- Deploy with GitHub Pages: Settings -> Pages -> Deploy from a branch -> `main` / (root).
- For local testing serve over HTTP (`python3 -m http.server`) rather than opening the file directly, since `app.js` is an ES module.

## Safety checks in the UI

- Blocks wrong network (asks MetaMask to switch to Sepolia).
- Rejects invalid addresses before any wallet prompt.
- Rejects zero, malformed and excess amounts.
- Uses `decimals()` and `parseUnits`, never a hardcoded scale.
- A cancelled MetaMask prompt shows "cancelled", never success.
- No private key or seed phrase fields anywhere.

## Test evidence

TODO: add screenshots (balance display, successful transfer, invalid address, insufficient balance, wrong network) and Etherscan transfer links.
