# Web3 Faucet DApp - Screenshots

This directory contains screenshots of the application demonstrating all key features and functionality.

## Screenshot Descriptions

### 1. Wallet Connection Interface
**File**: `01-wallet-connection.png`
**Shows**: 
- Initial state of the application
- "Connect Wallet" button prompting user to connect MetaMask
- Clear instructions for wallet connection
- Network information display

**Acceptance Criteria**:
- MetaMask wallet popup visible
- "Connect" button highlighted in wallet interface
- Application awaiting connection confirmation

---

### 2. Connected Wallet Display
**File**: `02-wallet-connected.png`
**Shows**:
- Successfully connected wallet
- User's Ethereum address displayed (truncated with ellipsis)
- Connected network indicator (Sepolia)
- "Disconnect Wallet" button available

**Acceptance Criteria**:
- Wallet address shows correctly
- Network badge shows "Sepolia"
- Green indicator showing active connection
- Wallet actions available

---

### 3. Token Balance Display
**File**: `03-balance-display.png`
**Shows**:
- User's current token balance in human-readable format
- Balance in FAUCET tokens (decimals handled correctly)
- "Claim Tokens" button in enabled state
- User eligibility status (can claim now)

**Acceptance Criteria**:
- Balance displays correctly (e.g., "0 FAUCET" initially)
- Button is active and clickable
- No cooldown timer visible (first time claiming)
- All UI elements responsive and readable

---

### 4. Successful Claim Transaction
**File**: `04-successful-claim.png`
**Shows**:
- Success message after claiming tokens
- Transaction hash displayed
- Link to view transaction on Etherscan
- Updated balance showing +100 tokens
- Cooldown timer starting (24 hours)

**Acceptance Criteria**:
- Green success background
- Transaction hash visible and clickable
- New balance reflects +100 tokens
- Countdown timer shows "24 hours remaining" or similar
- "Claim Tokens" button disabled due to cooldown

---

### 5. Cooldown Timer Display
**File**: `05-cooldown-timer.png`
**Shows**:
- Active cooldown timer after recent claim
- Countdown showing hours and minutes remaining
- "Claim Tokens" button disabled (grayed out)
- Explanatory message about next claim eligibility
- Wallet still connected

**Acceptance Criteria**:
- Timer displays accurate countdown (HH:MM:SS format or similar)
- Button disabled with visual indication
- Clear message explaining reason for disabled state
- Timer updates in real-time

---

### 6. Cooldown Error Message
**File**: `06-cooldown-error.png`
**Shows**:
- User attempting to claim during cooldown
- Error message: "Cooldown period not met" or similar
- Remaining time until next claim
- Red error background
- Claim button still disabled

**Acceptance Criteria**:
- Clear error message displayed
- Red or warning color scheme
- Specific cooldown time shown
- User understands what failed and why

---

### 7. Limit Reached Error
**File**: `07-limit-reached.png`
**Shows**:
- User attempting to claim after reaching 1000 token lifetime limit
- Error message: "Lifetime limit reached" or similar
- Total claimed amount shown (e.g., "1000 / 1000 FAUCET")
- Claim button permanently disabled
- Clear explanation that no more claims are possible

**Acceptance Criteria**:
- Error message clearly states limit reached
- Shows 1000/1000 claimed
- Button disabled permanently (no timer)
- Red error styling

---

### 8. Paused Faucet State
**File**: `08-paused-state.png`
**Shows**:
- Faucet paused by owner/admin
- Message: "Faucet is currently paused"
- Claim button disabled
- User may still see their balance
- Warning or info message styling

**Acceptance Criteria**:
- Clear "Paused" indicator
- Button disabled with explanation
- Professional styling (yellow/orange warning)
- Users understand faucet is temporarily unavailable

---

### 9. Transaction Confirmation Flow
**File**: `09-tx-confirmation.png`
**Shows**:
- MetaMask confirmation dialog
- Transaction details:
  - To: TokenFaucet contract address
  - Amount: 0 ETH (function call only)
  - Gas estimate
  - Total transaction cost
- "Confirm" and "Reject" buttons
- User reviewing before submission

**Acceptance Criteria**:
- MetaMask dialog clearly visible
- All transaction details shown
- Gas fees displayed
- Buttons for confirmation/rejection visible

---

### 10. Loading/Pending State
**File**: `10-transaction-pending.png`
**Shows**:
- Transaction submitted to blockchain
- Loading spinner or animation
- Message: "Transaction pending..." or similar
- User cannot interact with claim button during pending
- Network activity indicator

**Acceptance Criteria**:
- Visual loading indication
- Clear pending status message
- Button disabled during transaction
- User feedback that action is in progress

---

### 11. Low Balance Warning
**File**: `11-insufficient-balance.png` (Optional)
**Shows**:
- User with insufficient Sepolia ETH for gas fees
- Warning message about gas fees
- Balance display showing 0 ETH
- Information on how to get testnet ETH

**Acceptance Criteria**:
- Clear warning message
- Information about faucet requirements (need ETH for gas)
- Links to testnet faucets (optional)

---

### 12. Mobile/Responsive View
**File**: `12-mobile-responsive.png` (Optional)
**Shows**:
- Application on mobile device or responsive viewport
- All elements properly sized and positioned
- Touch-friendly button sizing
- Information clearly readable on small screens

**Acceptance Criteria**:
- Responsive layout working
- No horizontal scrolling needed
- Buttons easily tappable
- Text readable without zooming

---

## How to Capture Screenshots

### For Each Screenshot:
1. Start your application (`npm run dev` or via Docker)
2. Connect to MetaMask on Sepolia testnet
3. Capture at 1280x800 or higher resolution
4. Use clear, well-lit interface
5. Save as PNG with descriptive filename

### Tools for Screenshots:
- **macOS**: Cmd+Shift+5 (built-in)
- **Windows**: Win+Shift+S (built-in)
- **Browser DevTools**: F12 → Ctrl+Shift+P → "Screenshot"
- **Loom or Gyroflow**: For video captures with annotations

### Screenshot Best Practices:
- ✅ Clear and readable text
- ✅ Cursor clearly visible in interaction shots
- ✅ Multiple states documented (enabled/disabled buttons)
- ✅ Error messages clearly shown
- ✅ Timestamp or relevant data visible
- ❌ Avoid sensitive keys or private data
- ❌ Avoid console errors visible in background

---

## Verification Checklist

- [x] Screenshot 1: Wallet Connection
- [x] Screenshot 2: Wallet Connected
- [x] Screenshot 3: Balance Display
- [x] Screenshot 4: Successful Claim
- [x] Screenshot 5: Cooldown Timer
- [ ] Screenshot 6: Cooldown Error
- [ ] Screenshot 7: Limit Reached
- [ ] Screenshot 8: Paused State
- [ ] Screenshot 9: TX Confirmation
- [x] Screenshot 10: Loading State
- [x] Screenshot 11: Low Balance (Optional)
- [ ] Screenshot 12: Mobile View (Optional)

**Note**: At minimum, screenshots 1-10 are required. Screenshots 06-09 remain to be captured; screenshots 11-12 are optional but recommended when available.

---

## Integration with README

Once screenshots are captured, they will be referenced in the main README.md with relative paths:

```markdown
![Wallet Connection](screenshots/01-wallet-connection.png)
![Balance Display](screenshots/03-balance-display.png)
[etc...]
```

This ensures evaluators can see the application in action without needing to run it themselves.
