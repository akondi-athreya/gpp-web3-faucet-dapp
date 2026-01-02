/**
 * Contract interaction utilities
 * Handles token and faucet contract interactions using ethers.js
 */

import { ethers } from "ethers";
import TokenABI from "./Token.json";
import TokenFaucetABI from "./TokenFaucet.json";

// Contract addresses - should be loaded from environment variables
const TOKEN_ADDRESS =
  import.meta.env.VITE_TOKEN_ADDRESS ||
  "0x426C1217EE4B94dcb63BD9561864Ec72F8B9e2df";
const FAUCET_ADDRESS =
  import.meta.env.VITE_FAUCET_ADDRESS ||
  "0xb65a086501207b787c60b2e9bA9dCD2c147bc654";
const RPC_URL =
  import.meta.env.VITE_RPC_URL || "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";

class ContractManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.tokenContract = null;
    this.faucetContract = null;
    this.listeners = [];
  }

  /**
   * Initialize provider and contracts with connected wallet signer
   */
  async initializeWithSigner(signerOrProvider) {
    try {
      this.signer = signerOrProvider;
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Create contract instances
      this.tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        TokenABI.abi,
        this.signer
      );
      
      this.faucetContract = new ethers.Contract(
        FAUCET_ADDRESS,
        TokenFaucetABI.abi,
        this.signer
      );

      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error("Error initializing contracts:", error);
      throw new Error("Failed to initialize contracts");
    }
  }

  /**
   * Initialize provider for read-only operations
   */
  initializeReadOnly() {
    try {
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Create contract instances with provider only (read-only)
      this.tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        TokenABI.abi,
        this.provider
      );
      
      this.faucetContract = new ethers.Contract(
        FAUCET_ADDRESS,
        TokenFaucetABI.abi,
        this.provider
      );

      return true;
    } catch (error) {
      console.error("Error initializing read-only contracts:", error);
      throw new Error("Failed to initialize contracts");
    }
  }

  /**
   * Get token balance for an address
   */
  async getBalance(address) {
    if (!this.tokenContract) {
      this.initializeReadOnly();
    }

    try {
      const balance = await this.tokenContract.balanceOf(address);
      return balance.toString();
    } catch (error) {
      console.error("Error getting balance:", error);
      throw new Error("Failed to get token balance");
    }
  }

  /**
   * Check if address can claim tokens
   */
  async canClaim(address) {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      return await this.faucetContract.canClaim(address);
    } catch (error) {
      console.error("Error checking claim eligibility:", error);
      throw new Error("Failed to check claim eligibility");
    }
  }

  /**
   * Get remaining allowance for an address
   */
  async getRemainingAllowance(address) {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      const allowance = await this.faucetContract.remainingAllowance(address);
      return allowance.toString();
    } catch (error) {
      console.error("Error getting remaining allowance:", error);
      throw new Error("Failed to get remaining allowance");
    }
  }

  /**
   * Get last claim timestamp for an address
   */
  async getLastClaimAt(address) {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      const timestamp = await this.faucetContract.lastClaimAt(address);
      return timestamp.toString();
    } catch (error) {
      console.error("Error getting last claim timestamp:", error);
      throw new Error("Failed to get last claim timestamp");
    }
  }

  /**
   * Get total claimed amount for an address
   */
  async getTotalClaimed(address) {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      const total = await this.faucetContract.totalClaimed(address);
      return total.toString();
    } catch (error) {
      console.error("Error getting total claimed:", error);
      throw new Error("Failed to get total claimed");
    }
  }

  /**
   * Check if faucet is paused
   */
  async isFaucetPaused() {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      return await this.faucetContract.isPaused();
    } catch (error) {
      console.error("Error checking faucet pause status:", error);
      throw new Error("Failed to check faucet status");
    }
  }

  /**
   * Request tokens from faucet
   */
  async requestTokens() {
    if (!this.faucetContract || !this.signer) {
      throw new Error("Signer not initialized. Please connect wallet first.");
    }

    try {
      const tx = await this.faucetContract.requestTokens();
      this.notifyListeners("transactionStarted", {
        hash: tx.hash,
        type: "requestTokens",
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      this.notifyListeners("transactionConfirmed", {
        hash: tx.hash,
        type: "requestTokens",
      });

      return tx.hash;
    } catch (error) {
      const message = this.parseError(error);
      this.notifyListeners("transactionFailed", {
        type: "requestTokens",
        error: message,
      });
      throw new Error(message);
    }
  }

  /**
   * Get faucet amount per claim
   */
  async getFaucetAmount() {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      const amount = await this.faucetContract.FAUCET_AMOUNT();
      return amount.toString();
    } catch (error) {
      console.error("Error getting faucet amount:", error);
      throw new Error("Failed to get faucet amount");
    }
  }

  /**
   * Get cooldown time in seconds
   */
  async getCooldownTime() {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      const cooldown = await this.faucetContract.COOLDOWN_TIME();
      return cooldown.toString();
    } catch (error) {
      console.error("Error getting cooldown time:", error);
      throw new Error("Failed to get cooldown time");
    }
  }

  /**
   * Get maximum claim amount per user
   */
  async getMaxClaimAmount() {
    if (!this.faucetContract) {
      this.initializeReadOnly();
    }

    try {
      const maxAmount = await this.faucetContract.MAX_CLAIM_AMOUNT();
      return maxAmount.toString();
    } catch (error) {
      console.error("Error getting max claim amount:", error);
      throw new Error("Failed to get max claim amount");
    }
  }

  /**
   * Setup event listeners for contract events
   */
  setupEventListeners() {
    if (!this.faucetContract) return;

    try {
      // Listen for TokensClaimed events
      this.faucetContract.on(
        "TokensClaimed",
        (user, amount, timestamp, event) => {
          this.notifyListeners("tokensClaimed", {
            user,
            amount: amount.toString(),
            timestamp: timestamp.toString(),
          });
        }
      );

      // Listen for FaucetPaused events
      this.faucetContract.on("FaucetPaused", (paused, event) => {
        this.notifyListeners("faucetPaused", { paused });
      });
    } catch (error) {
      console.error("Error setting up event listeners:", error);
    }
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    if (!this.faucetContract) return;

    try {
      this.faucetContract.removeAllListeners("TokensClaimed");
      this.faucetContract.removeAllListeners("FaucetPaused");
    } catch (error) {
      console.error("Error removing event listeners:", error);
    }
  }

  /**
   * Subscribe to contract events
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
   * Parse contract error messages
   */
  parseError(error) {
    // Handle revert reasons
    if (error.data?.message) {
      return error.data.message;
    }

    // Handle common error messages
    const message = error.message || "";

    if (message.includes("Cooldown period not elapsed")) {
      return "You must wait 24 hours between claims";
    }
    if (message.includes("Lifetime claim limit reached")) {
      return "You have reached your lifetime claim limit";
    }
    if (message.includes("Faucet is paused")) {
      return "The faucet is currently paused";
    }
    if (message.includes("insufficient")) {
      return "Insufficient balance or funds";
    }
    if (message.includes("User rejected")) {
      return "Transaction was rejected by user";
    }

    return message || "An error occurred. Please try again.";
  }

  /**
   * Get contract addresses
   */
  getAddresses() {
    return {
      token: TOKEN_ADDRESS,
      faucet: FAUCET_ADDRESS,
    };
  }
}

// Create singleton instance
const contractManager = new ContractManager();

export default contractManager;
