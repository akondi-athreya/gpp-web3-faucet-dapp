/**
 * Wallet utility for managing MetaMask/Web3 wallet connections
 * Handles account changes, network switching, and disconnection events
 */

class WalletManager {
  constructor() {
    this.account = null;
    this.provider = window.ethereum || null;
    this.listeners = [];
  }

  /**
   * Check if wallet provider is available
   */
  isProviderAvailable() {
    return this.provider !== null;
  }

  /**
   * Get current connected account
   */
  getAccount() {
    return this.account;
  }

  /**
   * Connect wallet - request account access
   */
  async connect() {
    if (!this.provider) {
      throw new Error("MetaMask is not installed");
    }

    try {
      const accounts = await this.provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        this.account = accounts[0];
        this.setupListeners();
        this.notifyListeners("accountChanged", this.account);
        return this.account;
      }
    } catch (error) {
      if (error.code === 4001) {
        throw new Error("User rejected wallet connection");
      }
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.account = null;
    this.removeListeners();
    this.notifyListeners("disconnected", null);
  }

  /**
   * Check if wallet is connected
   */
  isConnected() {
    return this.account !== null;
  }

  /**
   * Get chain ID
   */
  async getChainId() {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    try {
      const chainId = await this.provider.request({
        method: "eth_chainId",
      });
      return parseInt(chainId, 16);
    } catch (error) {
      throw new Error("Failed to get chain ID");
    }
  }

  /**
   * Check if connected to Sepolia testnet (chainId: 11155111)
   */
  async isOnSepolia() {
    const chainId = await this.getChainId();
    return chainId === 11155111;
  }

  /**
   * Request chain switch to Sepolia
   */
  async switchToSepolia() {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    try {
      await this.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2AAE4E" }], // 11155111 in hex
      });
    } catch (error) {
      // Chain doesn't exist, try adding it
      if (error.code === 4902) {
        await this.addSepoliaChain();
      } else {
        throw new Error("Failed to switch to Sepolia network");
      }
    }
  }

  /**
   * Add Sepolia network to MetaMask
   */
  async addSepoliaChain() {
    if (!this.provider) {
      throw new Error("Provider not available");
    }

    try {
      await this.provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x2AAE4E", // 11155111
            chainName: "Sepolia Testnet",
            nativeCurrency: {
              name: "ETH",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [
              "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
            ],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
    } catch (error) {
      throw new Error("Failed to add Sepolia network");
    }
  }

  /**
   * Setup event listeners for account and network changes
   */
  setupListeners() {
    if (!this.provider) return;

    // Listen for account changes
    this.provider.on("accountsChanged", this.handleAccountsChanged.bind(this));

    // Listen for chain/network changes
    this.provider.on("chainChanged", this.handleChainChanged.bind(this));

    // Listen for disconnection
    this.provider.on("disconnect", this.handleDisconnect.bind(this));
  }

  /**
   * Remove event listeners
   */
  removeListeners() {
    if (!this.provider) return;

    this.provider.removeAllListeners("accountsChanged");
    this.provider.removeAllListeners("chainChanged");
    this.provider.removeAllListeners("disconnect");
  }

  /**
   * Handle account change event
   */
  handleAccountsChanged(accounts) {
    if (accounts.length > 0) {
      this.account = accounts[0];
      this.notifyListeners("accountChanged", this.account);
    } else {
      this.disconnect();
    }
  }

  /**
   * Handle chain/network change event
   */
  handleChainChanged(chainId) {
    this.notifyListeners("chainChanged", parseInt(chainId, 16));
  }

  /**
   * Handle disconnect event
   */
  handleDisconnect(error) {
    this.disconnect();
    this.notifyListeners("error", error?.message || "Wallet disconnected");
  }

  /**
   * Subscribe to wallet events
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(eventType, data) {
    this.listeners.forEach((callback) => {
      try {
        callback({ type: eventType, data });
      } catch (error) {
        console.error("Listener error:", error);
      }
    });
  }

  /**
   * Check if currently connected to wallet and restore connection
   */
  async checkConnection() {
    if (!this.provider) {
      return false;
    }

    try {
      const accounts = await this.provider.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        this.account = accounts[0];
        this.setupListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking connection:", error);
      return false;
    }
  }
}

// Create singleton instance
const walletManager = new WalletManager();

export default walletManager;
