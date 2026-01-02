# API Reference

## window.__EVAL__ Interface

### Overview

The `window.__EVAL__` object provides programmatic access to all faucet functionality for automated testing and evaluation. All methods are async unless noted otherwise.

### Initialization

The interface is automatically initialized when the page loads:

```javascript
// Check if initialized
if (typeof window.__EVAL__ !== 'undefined') {
  console.log('Evaluation interface ready');
}
```

---

## Wallet Management Methods

### connectWallet()

Connects the user's MetaMask wallet.

**Returns**: `Promise<string>` - Connected account address

**Example**:
```javascript
const address = await window.__EVAL__.connectWallet();
console.log('Connected:', address);
// Output: 0x742d35Cc6634C0532925a3b844Bc61e4f21A2dE5
```

**Throws**: Error if user rejects or MetaMask not installed

---

### disconnectWallet()

Disconnects the current wallet session.

**Returns**: `void`

**Example**:
```javascript
window.__EVAL__.disconnectWallet();
console.log('Wallet disconnected');
```

---

### getConnectedAccount()

Gets the currently connected account address.

**Returns**: `string | null` - Account address or null if not connected

**Example**:
```javascript
const account = window.__EVAL__.getConnectedAccount();
if (account) {
  console.log('Connected to:', account);
} else {
  console.log('Wallet not connected');
}
```

---

### isWalletConnected()

Checks if a wallet is currently connected.

**Returns**: `boolean` - True if connected

**Example**:
```javascript
if (window.__EVAL__.isWalletConnected()) {
  // Perform wallet operations
}
```

---

### getChainId()

Gets the current blockchain chain ID.

**Returns**: `Promise<string>` - Chain ID as string

**Example**:
```javascript
const chainId = await window.__EVAL__.getChainId();
console.log('Chain ID:', chainId);
// Sepolia: "11155111"
// Mainnet: "1"
```

---

### switchToSepolia()

Switches the connected wallet to the Sepolia testnet.

**Returns**: `Promise<boolean>` - True if successful

**Example**:
```javascript
const switched = await window.__EVAL__.switchToSepolia();
if (switched) {
  console.log('Switched to Sepolia');
}
```

**Throws**: Error if MetaMask doesn't recognize Sepolia (user must add manually)

---

## Token Balance Methods

### getBalance(address)

Gets the token balance for an address.

**Parameters**:
- `address` (string): Ethereum address (checksummed or not)

**Returns**: `Promise<string>` - Balance in wei as string

**Example**:
```javascript
const balance = await window.__EVAL__.getBalance('0x742d35Cc6634C0532925a3b844Bc61e4f21A2dE5');
console.log('Balance:', balance);
// Output: "100000000000000000000" (100 tokens)

// Convert to tokens
const tokens = Number(balance) / 1e18;
console.log('Tokens:', tokens); // 100
```

**Throws**: Error if address is invalid

---

### getTotalClaimed(address)

Gets the total amount claimed by an address since deployment.

**Parameters**:
- `address` (string): Ethereum address

**Returns**: `Promise<string>` - Total claimed in wei as string

**Example**:
```javascript
const total = await window.__EVAL__.getTotalClaimed('0x742d35Cc6634C0532925a3b844Bc61e4f21A2dE5');
const tokens = Number(total) / 1e18;
console.log('Total claimed:', tokens); // 300
```

---

## Claim Management Methods

### canClaim(address)

Checks if an address is eligible to claim tokens.

**Parameters**:
- `address` (string): Ethereum address

**Returns**: `Promise<boolean>` - True if eligible to claim

**Example**:
```javascript
const eligible = await window.__EVAL__.canClaim('0x742d35Cc6634C0532925a3b844Bc61e4f21A2dE5');
if (eligible) {
  console.log('Ready to claim!');
} else {
  console.log('Must wait for cooldown period');
}
```

---

### getRemainingAllowance(address)

Gets the remaining lifetime allowance for an address.

**Parameters**:
- `address` (string): Ethereum address

**Returns**: `Promise<string>` - Remaining allowance in wei as string

**Example**:
```javascript
const remaining = await window.__EVAL__.getRemainingAllowance('0x742d35Cc6634C0532925a3b844Bc61e4f21A2dE5');
const tokens = Number(remaining) / 1e18;
console.log('Can claim:', tokens, 'more tokens');
// Output: Can claim: 700 more tokens
```

---

### getLastClaimAt(address)

Gets the timestamp of the last successful claim.

**Parameters**:
- `address` (string): Ethereum address

**Returns**: `Promise<string>` - Unix timestamp as string (0 if never claimed)

**Example**:
```javascript
const lastClaim = await window.__EVAL__.getLastClaimAt('0x742d35Cc6634C0532925a3b844Bc61e4f21A2dE5');
if (lastClaim !== '0') {
  const date = new Date(Number(lastClaim) * 1000);
  console.log('Last claim:', date);
} else {
  console.log('Never claimed before');
}
```

---

### requestTokens()

Requests tokens from the faucet.

**Returns**: `Promise<string>` - Transaction hash

**Example**:
```javascript
try {
  const txHash = await window.__EVAL__.requestTokens();
  console.log('Claimed! Transaction:', txHash);
  console.log('View on Etherscan:', `https://sepolia.etherscan.io/tx/${txHash}`);
  
  // Wait for confirmation (optional)
  await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds
  
  // Refresh balance
  const address = window.__EVAL__.getConnectedAccount();
  const balance = await window.__EVAL__.getBalance(address);
  console.log('New balance:', Number(balance) / 1e18, 'tokens');
} catch (error) {
  console.error('Claim failed:', error.message);
}
```

**Throws**: Error if:
- Not connected to wallet
- In cooldown period
- Lifetime limit reached
- Faucet is paused
- Transaction rejected by user

---

## Faucet Information Methods

### getFaucetAmount()

Gets the amount of tokens distributed per claim.

**Returns**: `Promise<string>` - Amount in wei as string

**Example**:
```javascript
const amount = await window.__EVAL__.getFaucetAmount();
const tokens = Number(amount) / 1e18;
console.log('Claim amount:', tokens); // 100
```

---

### getCooldownTime()

Gets the cooldown period between claims.

**Returns**: `Promise<string>` - Time in seconds as string

**Example**:
```javascript
const cooldown = await window.__EVAL__.getCooldownTime();
const hours = Number(cooldown) / 3600;
console.log('Cooldown period:', hours, 'hours'); // 24
```

---

### getMaxClaimAmount()

Gets the maximum total amount a user can claim.

**Returns**: `Promise<string>` - Amount in wei as string

**Example**:
```javascript
const max = await window.__EVAL__.getMaxClaimAmount();
const tokens = Number(max) / 1e18;
console.log('Lifetime limit:', tokens); // 1000
```

---

### isFaucetPaused()

Checks if the faucet is currently paused.

**Returns**: `Promise<boolean>` - True if paused

**Example**:
```javascript
const paused = await window.__EVAL__.isFaucetPaused();
if (paused) {
  console.log('Faucet is paused');
} else {
  console.log('Faucet is active');
}
```

---

### getContractAddresses()

Gets the deployed contract addresses.

**Returns**: `Object` - Object with `token` and `faucet` addresses

**Example**:
```javascript
const {token, faucet} = window.__EVAL__.getContractAddresses();
console.log('Token:', token);
// 0x426C1217EE4B94dcb63BD9561864Ec72F8B9e2df
console.log('Faucet:', faucet);
// 0xb65a086501207b787c60b2e9bA9dCD2c147bc654
```

---

## Error Handling

All methods throw descriptive errors. Use try/catch:

```javascript
try {
  const balance = await window.__EVAL__.getBalance(address);
} catch (error) {
  console.error('Error:', error.message);
  // Output examples:
  // "Invalid address provided"
  // "Failed to get balance: network error"
  // "You must wait 24 hours between claims"
}
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Signer not initialized" | Not connected | Call `connectWallet()` first |
| "You must wait 24 hours between claims" | In cooldown | Wait until cooldown expires |
| "You have reached your lifetime claim limit" | Limit reached | No more claims possible |
| "Invalid address provided" | Bad address format | Verify address is 42 chars, starts with 0x |
| "The faucet is currently paused" | Faucet paused | Wait for owner to unpause |
| "Transaction was rejected by user" | User cancelled | User must approve in MetaMask |

---

## Data Type Notes

### String Numbers

All numeric values are **strings** to safely handle large numbers:

```javascript
// Balance returned as string
const balance = await window.__EVAL__.getBalance(address);
console.log(typeof balance); // "string"
console.log(balance); // "100000000000000000000"

// Convert to number
const tokens = Number(balance) / 1e18; // 100
```

### Wei Units

Values are in **wei** (smallest unit of ETH/tokens):

```javascript
// 1 token = 1 * 10^18 wei
// 100 tokens = "100000000000000000000"

const weiString = "100000000000000000000";
const tokens = Number(weiString) / 1e18; // 100
const wei = Math.round(tokens * 1e18); // 100000000000000000000
```

### Addresses

Addresses are case-insensitive but can be checksummed:

```javascript
// All equivalent
await window.__EVAL__.getBalance('0x742d35cc6634c0532925a3b844bc61e4f21a2de5');
await window.__EVAL__.getBalance('0x742d35Cc6634C0532925a3b844Bc61e4f21A2dE5');
```

---

## Rate Limiting

No explicit rate limiting is implemented, but:
- RPC requests are made to Sepolia network (may have limits)
- MetaMask may throttle requests
- Recommended: Use reasonable delays between requests

---

## Complete Example

```javascript
async function testFaucet() {
  try {
    // 1. Connect wallet
    console.log('Connecting wallet...');
    const address = await window.__EVAL__.connectWallet();
    console.log('Connected:', address);
    
    // 2. Check network
    const chainId = await window.__EVAL__.getChainId();
    if (chainId !== '11155111') {
      console.log('Switching to Sepolia...');
      await window.__EVAL__.switchToSepolia();
    }
    
    // 3. Get balance
    const balance = await window.__EVAL__.getBalance(address);
    console.log('Balance:', Number(balance) / 1e18, 'tokens');
    
    // 4. Check eligibility
    const canClaim = await window.__EVAL__.canClaim(address);
    if (!canClaim) {
      const lastClaim = await window.__EVAL__.getLastClaimAt(address);
      const nextClaimTime = Number(lastClaim) + 86400;
      const now = Math.floor(Date.now() / 1000);
      const waitSeconds = nextClaimTime - now;
      console.log('Must wait:', waitSeconds, 'more seconds');
      return;
    }
    
    // 5. Claim tokens
    console.log('Claiming tokens...');
    const txHash = await window.__EVAL__.requestTokens();
    console.log('Success! Tx:', txHash);
    
    // 6. Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // 7. Verify new balance
    const newBalance = await window.__EVAL__.getBalance(address);
    console.log('New balance:', Number(newBalance) / 1e18, 'tokens');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run test
testFaucet();
```

---

## Network Configuration

**Sepolia Testnet**:
- Chain ID: `11155111`
- RPC URL: `https://sepolia.infura.io/v3/...`
- Block Explorer: [Etherscan Sepolia](https://sepolia.etherscan.io)

**To add Sepolia to MetaMask manually**:
1. Settings → Networks → Add Network
2. Network name: "Sepolia"
3. RPC URL: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
4. Chain ID: "11155111"
5. Currency: "ETH"
6. Block Explorer: "https://sepolia.etherscan.io"

---

*Last Updated: January 2, 2025*
*Status: Complete*
