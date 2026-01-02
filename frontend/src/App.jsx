import { useState, useEffect } from "react";
import { walletManager, contractManager } from "./utils";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [canClaim, setCanClaim] = useState(false);
  const [remainingAllowance, setRemainingAllowance] = useState("0");
  const [lastClaimAt, setLastClaimAt] = useState("0");
  const [faucetAmount, setFaucetAmount] = useState("0");
  const [cooldownTime, setCooldownTime] = useState(86400);
  const [isFaucetPaused, setIsFaucetPaused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const initializeApp = async () => {
    try {
      const isConnected = await walletManager.checkConnection();
      
      if (isConnected) {
        setAccount(walletManager.getAccount());
        await loadContractData(walletManager.getAccount());
      }

      contractManager.initializeReadOnly();
      await loadFaucetConstants();
    } catch (err) {
      console.error("Error initializing app:", err);
    }
  };

  const loadFaucetConstants = async () => {
    try {
      const amount = await contractManager.getFaucetAmount();
      const cooldown = await contractManager.getCooldownTime();
      
      setFaucetAmount(amount);
      setCooldownTime(parseInt(cooldown));
    } catch (err) {
      console.error("Error loading faucet constants:", err);
    }
  };

  const loadContractData = async (userAddress) => {
    try {
      setLoadingMessage("Loading wallet data...");

      const [
        userBalance,
        claimEligible,
        allowance,
        lastClaim,
        paused,
      ] = await Promise.all([
        contractManager.getBalance(userAddress),
        contractManager.canClaim(userAddress),
        contractManager.getRemainingAllowance(userAddress),
        contractManager.getLastClaimAt(userAddress),
        contractManager.isFaucetPaused(),
      ]);

      setBalance(userBalance);
      setCanClaim(claimEligible);
      setRemainingAllowance(allowance);
      setLastClaimAt(lastClaim);
      setIsFaucetPaused(paused);

      if (!claimEligible && parseInt(lastClaim) > 0) {
        const lastClaimTime = parseInt(lastClaim) * 1000;
        const nextClaimTime = lastClaimTime + cooldownTime * 1000;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((nextClaimTime - now) / 1000));
        setTimeRemaining(remaining);
      }

      setLoadingMessage("");
    } catch (err) {
      console.error("Error loading contract data:", err);
      setLoadingMessage("");
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadingMessage("Connecting wallet...");

      const connectedAddress = await walletManager.connect();
      setAccount(connectedAddress);

      const provider = new (await import("ethers")).BrowserProvider(
        window.ethereum
      );
      const signer = await provider.getSigner();
      await contractManager.initializeWithSigner(signer);

      await loadContractData(connectedAddress);

      setSuccess("Wallet connected successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const disconnectWallet = () => {
    walletManager.disconnect();
    setAccount(null);
    setBalance("0");
    setCanClaim(false);
    setRemainingAllowance("0");
    setLastClaimAt("0");
    setTimeRemaining(0);
  };

  const handleRequestTokens = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    if (isFaucetPaused) {
      setError("The faucet is currently paused");
      return;
    }

    if (!canClaim) {
      setError("You are not eligible to claim tokens at this time");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setLoadingMessage("Processing your claim...");

      const txHash = await contractManager.requestTokens();

      setSuccess(`Tokens claimed successfully! Tx: ${txHash.substring(0, 10)}...`);
      
      setTimeout(() => {
        loadContractData(account);
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to claim tokens");
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatBalance = (weiValue) => {
    try {
      const value = BigInt(weiValue);
      const decimals = BigInt(10 ** 18);
      const wholePart = value / decimals;
      const fractionalPart = value % decimals;
      const fractionalStr = fractionalPart
        .toString()
        .padStart(18, "0")
        .replace(/0+$/, "");

      if (fractionalStr.length === 0) {
        return wholePart.toString();
      }
      return `${wholePart}.${fractionalStr}`;
    } catch {
      return "0";
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <h1>Token Faucet</h1>
            <p className="header-subtitle">Decentralized Token Distribution</p>
          </div>
          {account ? (
            <div className="account-info">
              <div className="account-details">
                <span className="account-label">Connected Address</span>
                <span className="account-address">
                  {account.substring(0, 6)}...{account.substring(38)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="btn btn-secondary"
                disabled={loading}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {loadingMessage && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p className="loading-text">{loadingMessage}</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <span className="alert-title">Error</span>
              <span className="alert-message">{error}</span>
            </div>
            <button
              className="alert-close"
              onClick={() => setError(null)}
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-content">
              <span className="alert-title">Success</span>
              <span className="alert-message">{success}</span>
            </div>
            <button
              className="alert-close"
              onClick={() => setSuccess(null)}
              aria-label="Close success"
            >
              ×
            </button>
          </div>
        )}

        {!account ? (
          <div className="welcome-section">
            <div className="welcome-card">
              <h2>Connect Your Wallet</h2>
              <p className="welcome-description">
                Connect your MetaMask wallet to claim tokens on the Sepolia testnet
              </p>
              <button onClick={connectWallet} className="btn btn-primary btn-large">
                Connect MetaMask
              </button>
              
              <div className="info-section">
                <h3>Faucet Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Claim Amount</span>
                    <span className="info-value">{formatBalance(faucetAmount)} tokens</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Cooldown Period</span>
                    <span className="info-value">24 hours</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Lifetime Limit</span>
                    <span className="info-value">{formatBalance("1000000000000000000000")} tokens</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Network</span>
                    <span className="info-value">Sepolia Testnet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard">
            <div className="cards-grid">
              <div className="card">
                <div className="card-header">
                  <h3>Token Balance</h3>
                </div>
                <div className="card-body">
                  <div className="balance-display">
                    <span className="balance-value">{formatBalance(balance)}</span>
                    <span className="balance-unit">tokens</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Remaining Allowance</h3>
                </div>
                <div className="card-body">
                  <div className="balance-display">
                    <span className="balance-value">{formatBalance(remainingAllowance)}</span>
                    <span className="balance-unit">lifetime</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="claim-section">
              <div className="card">
                <div className="card-header">
                  <h3>Claim Tokens</h3>
                </div>
                <div className="card-body claim-body">
                  {timeRemaining > 0 && (
                    <div className="cooldown-info">
                      <p className="cooldown-label">Available in</p>
                      <p className="cooldown-timer">{formatTime(timeRemaining)}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleRequestTokens}
                    disabled={!canClaim || loading || isFaucetPaused}
                    className="btn btn-claim"
                  >
                    {isFaucetPaused
                      ? "Faucet Paused"
                      : !canClaim
                      ? "Not Eligible"
                      : "Claim Tokens"}
                  </button>

                  <div className="claim-details">
                    <div className="detail-item">
                      <span className="detail-label">Per Request</span>
                      <span className="detail-value">{formatBalance(faucetAmount)} tokens</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Cooldown</span>
                      <span className="detail-value">24 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="details-section">
              <div className="card">
                <div className="card-header">
                  <h3>Details</h3>
                </div>
                <div className="card-body details-body">
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge ${canClaim ? "status-available" : "status-unavailable"}`}>
                      {canClaim ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Faucet State</span>
                    <span className={`status-badge ${!isFaucetPaused ? "status-active" : "status-paused"}`}>
                      {isFaucetPaused ? "Paused" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
