# Project File Structure & Reference

## Root Directory Files

### Configuration & Setup
- **package.json** - Root project dependencies (Hardhat, ethers, etc.)
- **hardhat.config.js** - Hardhat configuration for Sepolia deployment
- **.env** - Environment variables (contract addresses, RPC URL, private key)
- **.env.example** - Template for environment variables
- **.gitignore** - Git ignore patterns
- **docker-compose.yml** - Docker orchestration configuration

### Documentation
- **README.md** - Comprehensive project documentation (500+ lines)
- **QUICK_REFERENCE.md** - Quick start and common tasks
- **API_REFERENCE.md** - Complete window.__EVAL__ interface documentation
- **IMPLEMENTATION_SUMMARY.md** - Project completion checklist and statistics
- **FILE_STRUCTURE.md** - This file

### Smart Contracts
- **contracts/Token.sol** - ERC-20 token contract
- **contracts/TokenFaucet.sol** - Faucet distribution contract
- **scripts/deploy.js** - Deployment script (handles circular dependency)
- **scripts/verify.js** - Contract verification script

### Testing
- **test/faucet.test.js** - Comprehensive test suite (46 tests)

### Generated
- **artifacts/** - Compiled contract ABIs and bytecode
- **deployments/** - Deployment records and addresses
- **cache/** - Hardhat compilation cache
- **node_modules/** - Root dependencies

---

## Frontend Directory (`frontend/`)

### Docker & DevOps
- **Dockerfile** - Multi-stage production image build
- **.dockerignore** - Files to exclude from Docker image
- **docker-compose.yml** - (top-level) Docker service configuration

### Build Configuration
- **package.json** - Frontend dependencies (React, Vite, ethers.js, etc.)
- **package-lock.json** - Locked versions of dependencies
- **vite.config.js** - Vite build configuration
- **index.html** - HTML entry point

### Development & Production
- **server.js** - Health check endpoint for Docker
- **public/** - Static assets (favicon, etc.)
- **dist/** - Production build output (generated)
- **node_modules/** - Frontend dependencies

### Source Code (`src/`)

#### Main Files
- **main.jsx** - Application entry point (initializes eval interface)
- **App.jsx** - Root React component with full application logic
- **App.css** - Component styling
- **index.css** - Global styles

#### Utilities (`src/utils/`)
- **index.js** - Barrel export for all utilities
- **wallet.js** - WalletManager singleton class
  - MetaMask connection management
  - Chain switching
  - Event listeners
  
- **contracts.js** - ContractManager singleton class
  - Token contract interaction
  - Faucet contract interaction
  - Balance queries, claim eligibility checks
  - Event listening
  - Error parsing

- **eval.js** - window.__EVAL__ interface
  - **⭐ CRITICAL FILE** for automated evaluation
  - 20+ methods for programmatic access
  - All numeric values as strings
  - Complete error handling

- **Token.json** - ERC-20 Token contract ABI
- **TokenFaucet.json** - Faucet contract ABI

#### Components (`src/components/`)
- (Reserved for future component organization)

---

## Smart Contract File Details

### Token.sol

**Purpose**: ERC-20 compliant token

**Key Components**:
```solidity
- MAX_SUPPLY: 1,000,000 tokens (1e24 wei)
- minterRole: Only faucet can mint
- Functions: mint(), transfer(), balanceOf() (+ ERC-20 standard)
- Events: Transfer, Approval (ERC-20 standard)
```

**Lines of Code**: ~100

**Deployed**: `0x426C1217EE4B94dcb63BD9561864Ec72F8B9e2df`

---

### TokenFaucet.sol

**Purpose**: Token distribution with cooldown and limits

**Key Components**:
```solidity
- FAUCET_AMOUNT: 100 tokens per claim
- COOLDOWN_TIME: 86400 seconds (24 hours)
- MAX_CLAIM_AMOUNT: 1000 tokens lifetime
- State: lastClaimAt[], totalClaimed[], paused
- Functions: requestTokens(), canClaim(), remainingAllowance(), setPaused()
- Events: TokensClaimed, FaucetPaused
```

**Lines of Code**: ~150

**Deployed**: `0xb65a086501207b787c60b2e9bA9dCD2c147bc654`

---

## Frontend Component Hierarchy

```
main.jsx
└── App.jsx
    ├── Header Section
    │   ├── Title
    │   ├── Account Info (if connected)
    │   └── Connect/Disconnect Button
    ├── Main Content
    │   ├── Loading Overlay (if loading)
    │   ├── Error Message (if error)
    │   ├── Success Message (if success)
    │   └── Content
    │       ├── Connection Prompt (if not connected)
    │       └── Faucet Container (if connected)
    │           ├── Balance Section
    │           │   ├── Your Balance Card
    │           │   └── Remaining Allowance Card
    │           ├── Claim Section
    │           │   ├── Ready to Claim (if eligible)
    │           │   ├── Cooldown Active (if in cooldown)
    │           │   └── Limit Reached (if maxed out)
    │           └── Info Section
    │               ├── Claim Amount
    │               ├── Cooldown Period
    │               ├── Total Claimed
    │               └── Faucet Status
    └── Footer Section
```

---

## Key Files by Purpose

### Smart Contract Deployment
1. **contracts/Token.sol** - Define token
2. **contracts/TokenFaucet.sol** - Define faucet
3. **scripts/deploy.js** - Deploy contracts
4. **deployment-addresses.json** - Store addresses
5. **test/faucet.test.js** - Verify functionality

### Frontend Development
1. **frontend/package.json** - Install dependencies
2. **frontend/src/main.jsx** - Start app
3. **frontend/src/App.jsx** - Main component
4. **frontend/src/utils/wallet.js** - MetaMask integration
5. **frontend/src/utils/contracts.js** - Contract interaction
6. **frontend/src/utils/eval.js** - Evaluation interface ⭐

### Docker Deployment
1. **frontend/Dockerfile** - Build production image
2. **frontend/server.js** - Health check
3. **docker-compose.yml** - Orchestration
4. **frontend/.dockerignore** - Optimize image

### Documentation
1. **README.md** - Full guide
2. **QUICK_REFERENCE.md** - Quick start
3. **API_REFERENCE.md** - API docs
4. **IMPLEMENTATION_SUMMARY.md** - Status

---

## File Statistics

### Smart Contracts
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| Token.sol | Solidity | ~100 | ERC-20 token |
| TokenFaucet.sol | Solidity | ~150 | Faucet logic |
| deploy.js | JavaScript | ~80 | Deployment |
| faucet.test.js | JavaScript | ~600 | 46 tests |

### Frontend
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| main.jsx | JSX | ~10 | Entry point |
| App.jsx | JSX | ~400 | Main component |
| wallet.js | JS | ~120 | Wallet mgmt |
| contracts.js | JS | ~250 | Contract mgmt |
| eval.js | JS | ~280 | Eval interface |
| App.css | CSS | ~350 | Styling |
| index.css | CSS | ~50 | Global styles |

### Configuration
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| hardhat.config.js | JS | ~30 | Hardhat setup |
| vite.config.js | JS | ~15 | Vite setup |
| Dockerfile | Docker | ~25 | Image build |
| docker-compose.yml | YAML | ~30 | Orchestration |

### Documentation
| File | Type | Lines | Purpose |
|------|------|-------|---------|
| README.md | MD | ~500 | Full docs |
| QUICK_REFERENCE.md | MD | ~200 | Quick guide |
| API_REFERENCE.md | MD | ~400 | API docs |
| IMPLEMENTATION_SUMMARY.md | MD | ~300 | Checklist |

---

## Critical Files (Must Not Be Modified)

⚠️ These files are deployed on-chain and cannot be changed:

1. **contracts/Token.sol** - Token contract is live on Sepolia
2. **contracts/TokenFaucet.sol** - Faucet contract is live on Sepolia

**Why**: Modifying and redeploying would create new addresses and break the application.

---

## Configuration Files

### .env (Root)
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
```

### .env.local (Frontend)
```
VITE_TOKEN_ADDRESS=0x426C1...
VITE_FAUCET_ADDRESS=0xb65a...
VITE_RPC_URL=https://sepolia.infura.io/v3/...
```

### .env (Docker)
```
PORT=5000
VITE_TOKEN_ADDRESS=0x426C1...
VITE_FAUCET_ADDRESS=0xb65a...
VITE_RPC_URL=https://sepolia.infura.io/v3/...
```

---

## Build Outputs

### Smart Contract Build
- **artifacts/** - Compiled ABIs and bytecode
- **cache/** - Compilation cache
- **deployments/** - Deployment records

### Frontend Build
- **frontend/dist/** - Production bundle
  - index.html - HTML file
  - assets/index-*.js - JavaScript
  - assets/index-*.css - Stylesheets

### Docker Build
- **Dockerfile builds to**:
  - /app/dist (from builder stage)
  - Served by `serve` on port 5000

---

## Development Workflow

### Smart Contracts
1. Edit **contracts/Token.sol** or **contracts/TokenFaucet.sol**
2. Run `npm test` to verify
3. Deploy with `npm run deploy`

### Frontend
1. Edit **frontend/src/** files
2. Dev server automatically reloads
3. Build with `npm run build`
4. Test with `npm run preview`

### Docker
1. Ensure **frontend/Dockerfile** is valid
2. Build with `docker-compose build`
3. Run with `docker-compose up`

---

## Deployment Artifacts

### deployment-addresses.json
Records deployed contract addresses:
```json
{
  "network": "sepolia",
  "token": "0x426C1217EE4B94dcb63BD9561864Ec72F8B9e2df",
  "faucet": "0xb65a086501207b787c60b2e9bA9dCD2c147bc654",
  "deployer": "0x..."
}
```

### deployments/ Directory
Contains deployment transaction records and verification data.

---

## Important Paths

| Path | Purpose |
|------|---------|
| `/frontend` | React application |
| `/frontend/src/utils` | **Critical**: Utility modules |
| `/contracts` | Smart contract sources |
| `/test` | Test suite |
| `/scripts` | Deployment scripts |
| `/artifacts` | Compiled contracts |
| `/docs` | All documentation |

---

## Version Control

### Committed Files
✅ All source files (.sol, .js, .jsx, .css, .md)  
✅ Configuration files (package.json, hardhat.config.js)  
✅ Documentation  

### Ignored Files
❌ node_modules/  
❌ .env (private keys)  
❌ dist/ (generated)  
❌ artifacts/ (generated)  
❌ cache/ (generated)  

---

## Summary

- **Total Contracts**: 2 (Token + Faucet)
- **Total Tests**: 46 (all passing)
- **Frontend Components**: 1 main + utilities
- **Documentation Files**: 4
- **Docker Configuration**: 2 files
- **Configuration Files**: 3
- **Total Lines of Code**: ~2,500+
- **Deployment Status**: ✅ Live on Sepolia

---

*Last Updated: January 2, 2025*
*Status: Complete & Verified*
