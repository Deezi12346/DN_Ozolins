# Student Token Dashboard

A lightweight static dashboard for connecting a wallet, checking classroom ERC-20 tokens, and making ordinary token transfers on **Ethereum Sepolia only**. It uses ethers.js v6 and is designed for root-based GitHub Pages hosting.

- **Dashboard:** https://deezi12346.github.io/DN_Ozolins/
- **Repository:** https://github.com/Deezi12346/DN_Ozolins
- **Explorer:** https://sepolia.etherscan.io/

DN and Study Points (SP) are educational test assets and have no guaranteed monetary value. The dashboard does not show fiat prices, make swaps, or request approvals. Transfers require SepoliaETH for gas and may be irreversible after confirmation.

## Project overview

The project demonstrates how a browser wallet can read ERC-20 metadata and balances and submit a token transfer to a smart contract. The interface checks contract code and the expected on-chain metadata before making a token available. Each token is verified independently, so a missing or mismatched contract does not make another verified token unusable.

| File | Purpose |
|---|---|
| [`index.html`](./index.html) | Responsive dashboard markup and styling |
| [`app.js`](./app.js) | Wallet, Sepolia, ERC-20 verification, balance, and transfer logic |
| [`contracts/Deeznats.sol`](./contracts/Deeznats.sol) | DN token source |
| [`contracts/StudyPoints.sol`](./contracts/StudyPoints.sol) | Local source declares `Study Points` / `SP`; it has not been verified as the deployed source |

## Token economics and deployment status

The two tokens have different classroom roles and supplies. **DN** represents scarce, special achievements and premium rewards. **Study Points (SP)** is intended for more frequent rewards such as participation, quizzes, and attendance. Separating the tokens makes those reward categories and their intended scarcity visible without assigning either token a monetary value.

On-chain values below were queried from a public Ethereum Sepolia JSON-RPC endpoint on 2026-10-23. The endpoint reported chain ID `0xaa36a7` (11155111) and returned contract code for the configured Study Points address. Its on-chain name (`Study Points`), symbol (`SP`), decimals (`18`), and total supply (`1,000,000`) match the dashboard's expected metadata. The connected wallet balance is also read live by the dashboard; no wallet-specific balance was queried for this documentation. Editing the local source does not change the already deployed contract, and the deployed bytecode has not been verified against that source.

| Property | Deeznats (DN) | Study Points (SP) |
|---|---|---|
| Purpose | Rare achievements and premium rewards | Everyday participation and basic rewards |
| Configured Sepolia address | [`0x991C9ad3c61281714b16F3713Cf8def01b3133cE`](https://sepolia.etherscan.io/address/0x991C9ad3c61281714b16F3713Cf8def01b3133cE) | [`0x60d73B9e259A544eC98f1dB5B0417003CE6Cf4f4`](https://sepolia.etherscan.io/address/0x60d73B9e259A544eC98f1dB5B0417003CE6Cf4f4) |
| On-chain contract code | **Verified present** | **Verified present** |
| On-chain name / symbol | `Deeznats` / `DN` | `Study Points` / `SP` |
| On-chain decimals | `18` | `18` |
| On-chain total supply | `100,000 DN` | `1,000,000 SP` |
| Expected initial supply | `100,000 DN` | `1,000,000 SP` |
| Local contract source | [`contracts/Deeznats.sol`](./contracts/Deeznats.sol) | [`contracts/StudyPoints.sol`](./contracts/StudyPoints.sol) |
| Dashboard verification | Matches configured metadata | On-chain name, symbol, decimals, and supply match; connected wallet balance is read live |
| Deployment / source verification | Deployment observed; local-source match and explorer source verification not established | Deployment and metadata observed by RPC; local-source match and explorer source verification not established |

The DN source sets `Deeznats` / `DN` and mints 100,000 tokens once in the constructor. It inherits the OpenZeppelin ERC-20 18-decimal default and has no public mint function. The deployed contract returned the matching name, symbol, decimals, and total supply. This RPC metadata check does not prove the deployed bytecode matches the local source.

The configured Study Points address, [`0x60d73B9e259A544eC98f1dB5B0417003CE6Cf4f4`](https://sepolia.etherscan.io/address/0x60d73B9e259A544eC98f1dB5B0417003CE6Cf4f4), returned non-empty bytecode on Sepolia. Direct `eth_call` reads returned `Study Points`, `SP`, `18`, and a raw total supply of `1000000000000000000000000` (1,000,000 tokens), matching the dashboard's expected metadata. After a wallet connects on Sepolia, the dashboard also reads `balanceOf(connectedWallet)`; that account-specific value is not documented here. The local Solidity constructor now declares `SP` for future deployments; this source change does not alter the already deployed contract or establish a local-source match.

## Technology and network

- Static HTML, CSS, and JavaScript modules; no application build step.
- ethers.js **v6.13.4** loaded from its existing CDN URL.
- Wallet access through MetaMask (or another compatible injected EIP-1193 wallet).
- Ethereum Sepolia, chain ID **11155111** (`0xaa36a7`).
- Minimal ERC-20 interface for metadata, balances, total supply, and `transfer`.

## Getting started

1. Install MetaMask and create or select a dedicated test wallet. Never enter a seed phrase or private key into this dashboard.
2. Select **Ethereum Sepolia** in the wallet. The dashboard can request a network switch, but it blocks token use if the wallet remains on another chain.
3. Obtain SepoliaETH for gas from a faucet that is currently available to you. Faucet policies and eligibility can change; examples include [Alchemy's Sepolia faucet](https://www.alchemy.com/faucets/ethereum-sepolia) and the [Google Cloud Web3 faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).
4. Serve the static files over HTTP for local testing (ES modules do not work reliably from a `file://` URL). For example:

   ```sh
   python3 -m http.server 8000
   ```

   Then open `http://localhost:8000/`.
5. Select **Connect Wallet**. The dashboard reads the active account's token balances from the contracts on Sepolia.
6. To transfer a verified token, select it, enter the destination address and a positive amount, then choose **Send Tokens**. Check the details in MetaMask and confirm. The page reports success only after a successful transaction receipt.

### Import a token into MetaMask

In MetaMask's token/asset view, choose **Import tokens** and paste the contract address from the table above. Confirm the displayed token details before importing.

### Inspect contracts and transfers

Open the token address on [Sepolia Etherscan](https://sepolia.etherscan.io/) to inspect contract activity and metadata. After a transfer is submitted, the dashboard provides a Sepolia transaction link; a submitted transaction is not confirmed until its receipt succeeds. Do not infer source verification, deployment ownership, or a transfer from a configured address alone.

## Safety and behavior

- Requests wallet account access only after a user selects **Connect Wallet**.
- Blocks balance operations and transfers unless the active wallet is on Sepolia.
- Checks deployed code and compares on-chain name, symbol, decimals, and total supply against each token's expected specification.
- Uses on-chain decimals with `parseUnits` / `formatUnits`, validates the destination and amount, and compares the amount with the sender's live balance before asking for a signature.
- Does not automatically submit transactions, request ETH, or request token approvals.
- Waits for the transaction receipt and requires receipt status `1` before showing a confirmed-success state.
- Displays transaction status and a Sepolia Etherscan link after submission; account and chain changes refresh the relevant dashboard state.
- Uses DOM text APIs for wallet- and contract-derived content. No private key or seed phrase is requested.

## QA status and testing checklist

| Check | Status / evidence |
|---|---|
| DN address contains code on Sepolia | **Verified** by public Sepolia RPC query |
| DN name, symbol, decimals, and total supply | **Verified** as `Deeznats`, `DN`, `18`, and `100,000 DN` by RPC query |
| Study Points address contains code on Sepolia | **Verified present** by public Sepolia RPC query at `0x60d73B9e259A544eC98f1dB5B0417003CE6Cf4f4` |
| Study Points name, symbol, decimals, and total supply | **Verified** by Sepolia RPC as `Study Points`, `SP`, `18`, and `1,000,000` |
| Study Points connected-wallet balance | Queried dynamically with `balanceOf(connectedWallet)` on Sepolia when a wallet connects; no wallet was connected for this check |
| JavaScript syntax | **Passed** with Node.js module syntax check |
| Static HTML-to-JavaScript ID references | **Passed**: no missing or duplicate IDs among the checked references |
| Unsafe HTML insertion | **Passed**: no `innerHTML` usage in the app |
| Git whitespace check | **Passed** with `git diff --check` |
| Static HTTP serving | **Passed**: dashboard, app module, and both Solidity source paths returned HTTP 200 locally |
| Solidity compilation | **Pending**: no `solc` compiler or contract build configuration is available in this repository environment |
| Live MetaMask, transfer, cancellation, and balance-change tests | **Pending manual testing**; these require a connected wallet, funded test account, and wallet confirmation |
| Responsive layout and browser console | **Pending manual browser testing** |
| Screenshots and transfer evidence for submission | **Pending**; no screenshots, wallet addresses, or transaction hashes are claimed here |

Manual wallet test checklist:

- Connect on Sepolia and confirm the connected address and DN balance match Sepolia Etherscan.
- Confirm DN and Study Points (SP) pass metadata verification and display the connected wallet's balances.
- Switch to another network and confirm the warning appears and transfers are blocked; switch back and refresh.
- Try an empty or malformed recipient, malformed amount, zero/negative amount, excess precision, and an amount above the live balance. Invalid input must be rejected before a wallet signature request.
- Test a small DN transfer only with an intended recipient and sufficient SepoliaETH. Confirm submission and then receipt on Sepolia Etherscan; refresh and compare balances.
- Reject a MetaMask confirmation and confirm the dashboard does not report success.
- Reload the page and check that displayed balances are freshly read from chain.
- Test a small SP transfer only with an intended recipient, sufficient token balance, and sufficient SepoliaETH; confirm the receipt on Sepolia Etherscan.

## Deployment and remaining work

The dashboard is intended for GitHub Pages configured to deploy the `main` branch from the repository root. The currently published site will not contain local changes until they are committed and pushed and GitHub Pages republishes them. This work does not commit, push, deploy a contract, sign a transaction, approve a token, or add liquidity.

Before final submission:

- Complete the manual browser and wallet checks above.
- Add genuine screenshots, transfer transaction hashes, and deployment/source-verification evidence where required by the instructor.
- Confirm GitHub Pages has republished the updated root-site files.

There is no automated wallet/browser test suite or contract build configuration in this repository. The Solidity source imports OpenZeppelin contracts; compile it using the assignment's chosen Solidity/OpenZeppelin environment before deployment.
