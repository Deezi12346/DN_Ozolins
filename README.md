# Student Token Dashboard

A lightweight static dashboard for connecting a wallet, checking classroom ERC-20 tokens, and making ordinary token transfers on **Ethereum Sepolia only**. It uses ethers.js v6 and is designed for root-based GitHub Pages hosting.

- **Dashboard:** https://deezi12346.github.io/DN_Ozolins/
- **Repository:** https://github.com/Deezi12346/DN_Ozolins
- **Explorer:** https://sepolia.etherscan.io/

DN and STUDY are educational test assets and have no guaranteed monetary value. The dashboard does not show fiat prices, make swaps, or request approvals. Transfers require SepoliaETH for gas and may be irreversible after confirmation.

## Project overview

The project demonstrates how a browser wallet can read ERC-20 metadata and balances and submit a token transfer to a smart contract. The interface checks contract code and the expected on-chain metadata before making a token available. Each token is verified independently, so a missing or mismatched contract does not make another verified token unusable.

| File | Purpose |
|---|---|
| [`index.html`](./index.html) | Responsive dashboard markup and styling |
| [`app.js`](./app.js) | Wallet, Sepolia, ERC-20 verification, balance, and transfer logic |
| [`contracts/Deeznats.sol`](./contracts/Deeznats.sol) | DN token source |
| [`contracts/StudyPoints.sol`](./contracts/StudyPoints.sol) | Proposed fixed-supply STUDY token source; not evidence of deployment |

## Token economics and deployment status

The two tokens have different classroom roles and supplies. **DN** represents scarce, special achievements and premium rewards. **STUDY** is intended for more frequent rewards such as participation, quizzes, and attendance. Separating the tokens makes those reward categories and their intended scarcity visible without assigning either token a monetary value.

On-chain values below were queried from public Ethereum Sepolia JSON-RPC endpoints on 2026-10-23. DN metadata and supply were read from Sepolia; the STUDY no-code result was independently observed on two RPC endpoints. The dashboard independently checks code and expected metadata at runtime. An RPC observation is not proof that deployed bytecode was compiled from the local source.

| Property | Deeznats (DN) | Study Points (STUDY) |
|---|---|---|
| Purpose | Rare achievements and premium rewards | Everyday participation and basic rewards |
| Configured Sepolia address | [`0x991C9ad3c61281714b16F3713Cf8def01b3133cE`](https://sepolia.etherscan.io/address/0x991C9ad3c61281714b16F3713Cf8def01b3133cE) | [`0xd9145CCE52D386f254917e481eB44e9943F39138`](https://sepolia.etherscan.io/address/0xd9145CCE52D386f254917e481eB44e9943F39138) |
| On-chain contract code | **Verified present** | **Not found** at the configured address in the RPC query |
| On-chain name / symbol | `Deeznats` / `DN` | **Unavailable**: address returned no code |
| On-chain decimals | `18` | **Unavailable** |
| On-chain total supply | `100,000 DN` | **Unavailable; not verified** |
| Expected initial supply | `100,000 DN` | `1,000,000 STUDY` |
| Local contract source | [`contracts/Deeznats.sol`](./contracts/Deeznats.sol) | [`contracts/StudyPoints.sol`](./contracts/StudyPoints.sol) |
| Deployment / source verification | Deployment observed; local-source match and explorer source verification not established | **Not deployed or verified by this project** |

The DN source sets `Deeznats` / `DN` and mints 100,000 tokens once in the constructor. It inherits the OpenZeppelin ERC-20 18-decimal default and has no public mint function. The deployed contract returned the matching name, symbol, decimals, and total supply. This RPC metadata check does not prove the deployed bytecode matches the local source.

The supplied STUDY address returned `0x` for `eth_getCode` on the queried Sepolia RPC endpoint, so its ERC-20 metadata and supply could not be read. The dashboard therefore reports the exact unavailable status and disables STUDY operations while allowing a separately verified token to work. `StudyPoints.sol` is only a local source proposal; creating it did not deploy a contract or make the configured address valid. No replacement address has been invented.

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

In MetaMask's token/asset view, choose **Import tokens** and paste the contract address from the table above. Confirm the displayed token details before importing. The STUDY address is currently unverified and has no code according to the RPC query, so do not treat importing that address as evidence that STUDY exists.

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
| STUDY address contains code on Sepolia | **Not verified**: queried endpoint returned `0x` |
| STUDY metadata, supply, and wallet balance | **Blocked** until deployed code exists at the configured address |
| JavaScript syntax | **Passed** with Node.js module syntax check |
| Static HTML-to-JavaScript ID references | **Passed**: no missing or duplicate IDs among the checked references |
| Unsafe HTML insertion | **Passed**: no `innerHTML` usage in the app |
| Git whitespace check | **Passed** with `git diff --check` |
| Static HTTP serving | **Passed**: dashboard, app module, and both Solidity source paths returned HTTP 200 locally |
| Solidity compilation | **Pending**: no `solc` compiler or contract build configuration is available in this repository environment |
| Live MetaMask, transfer, cancellation, and balance-change tests | **Pending manual testing**; these require a wallet, funded test account, and a verified STUDY deployment for STUDY transfers |
| Responsive layout and browser console | **Pending manual browser testing** |
| Screenshots and transfer evidence for submission | **Pending**; no screenshots, wallet addresses, or transaction hashes are claimed here |

Manual wallet test checklist:

- Connect on Sepolia and confirm the connected address and DN balance match Sepolia Etherscan.
- Confirm STUDY shows an unavailable verification error and does not appear as a sendable token while its address has no code.
- Switch to another network and confirm the warning appears and transfers are blocked; switch back and refresh.
- Try an empty or malformed recipient, malformed amount, zero/negative amount, excess precision, and an amount above the live balance. Invalid input must be rejected before a wallet signature request.
- Test a small DN transfer only with an intended recipient and sufficient SepoliaETH. Confirm submission and then receipt on Sepolia Etherscan; refresh and compare balances.
- Reject a MetaMask confirmation and confirm the dashboard does not report success.
- Reload the page and check that displayed balances are freshly read from chain.
- If STUDY is deployed later, verify its address, code, metadata, and supply before testing a STUDY transfer.

## Deployment and remaining work

The dashboard is intended for GitHub Pages configured to deploy the `main` branch from the repository root. The currently published site will not contain local changes until they are committed and pushed and GitHub Pages republishes them. This work does not commit, push, deploy a contract, sign a transaction, approve a token, or add liquidity.

Before final submission:

- Deploy STUDY only if the assignment requires it, then independently verify its address and on-chain metadata; update the configured address only with an actual deployment address and evidence.
- Complete the manual browser and wallet checks above.
- Add genuine screenshots, transfer transaction hashes, and deployment/source-verification evidence where required by the instructor.
- Confirm GitHub Pages has republished the updated root-site files.

There is no automated wallet/browser test suite or contract build configuration in this repository. The Solidity source imports OpenZeppelin contracts; compile it using the assignment's chosen Solidity/OpenZeppelin environment before deployment.
