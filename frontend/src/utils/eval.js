/**
 * Evaluation Interface - window.__EVAL__
 * Exposes core faucet functionality for automated testing and evaluation
 * All numeric values returned as strings to handle BigInt properly
 */

import { walletManager, contractManager } from "./index.js";
import { ethers } from "ethers";

// Initialize the evaluation interface
const initializeEval = () => {
  window.__EVAL__ = {
    /**
     * Connect wallet and return the account address
     * @returns {Promise<string>} Connected account address
     */
    async connectWallet() {
      try {
        const address = await walletManager.connect();
        
        // Initialize contracts with signer after connection
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        await contractManager.initializeWithSigner(signer);
        
        return address;
      } catch (error) {
        throw new Error(`Failed to connect wallet: ${error.message}`);
      }
    },

    /**
     * Request tokens from the faucet
     * @returns {Promise<string>} Transaction hash
     */
    async requestTokens() {
      try {
        const txHash = await contractManager.requestTokens();
        return txHash;
      } catch (error) {
        throw new Error(`Failed to request tokens: ${error.message}`);
      }
    },

    /**
     * Get token balance for an address
     * @param {string} address - Ethereum address
     * @returns {Promise<string>} Balance in wei as string
     */
    async getBalance(address) {
      try {
        if (!address || !ethers.isAddress(address)) {
          throw new Error("Invalid address provided");
        }
        
        const balance = await contractManager.getBalance(address);
        return balance; // Already a string from the contract manager
      } catch (error) {
        throw new Error(`Failed to get balance: ${error.message}`);
      }
    },

    /**
     * Check if an address can claim tokens
     * @param {string} address - Ethereum address
     * @returns {Promise<boolean>} True if eligible to claim
     */
    async canClaim(address) {
      try {
        if (!address || !ethers.isAddress(address)) {
          throw new Error("Invalid address provided");
        }
        
        return await contractManager.canClaim(address);
      } catch (error) {
        throw new Error(`Failed to check claim eligibility: ${error.message}`);
      }
    },

    /**
     * Get remaining lifetime allowance for an address
     * @param {string} address - Ethereum address
     * @returns {Promise<string>} Remaining allowance in wei as string
     */
    async getRemainingAllowance(address) {
      try {
        if (!address || !ethers.isAddress(address)) {
          throw new Error("Invalid address provided");
        }
        
        const allowance = await contractManager.getRemainingAllowance(address);
        return allowance; // Already a string from the contract manager
      } catch (error) {
        throw new Error(`Failed to get remaining allowance: ${error.message}`);
      }
    },

    /**
     * Get last claim timestamp for an address
     * @param {string} address - Ethereum address
     * @returns {Promise<string>} Last claim timestamp as string (0 if never claimed)
     */
    async getLastClaimAt(address) {
      try {
        if (!address || !ethers.isAddress(address)) {
          throw new Error("Invalid address provided");
        }
        
        const timestamp = await contractManager.getLastClaimAt(address);
        return timestamp; // Already a string
      } catch (error) {
        throw new Error(`Failed to get last claim timestamp: ${error.message}`);
      }
    },

    /**
     * Get contract addresses
     * @returns {Object} Object with token and faucet addresses
     */
    getContractAddresses() {
      try {
        return contractManager.getAddresses();
      } catch (error) {
        throw new Error(`Failed to get contract addresses: ${error.message}`);
      }
    },

    /**
     * Get faucet amount per claim in wei
     * @returns {Promise<string>} Faucet amount as string
     */
    async getFaucetAmount() {
      try {
        const amount = await contractManager.getFaucetAmount();
        return amount; // Already a string
      } catch (error) {
        throw new Error(`Failed to get faucet amount: ${error.message}`);
      }
    },

    /**
     * Get cooldown time in seconds
     * @returns {Promise<string>} Cooldown time as string
     */
    async getCooldownTime() {
      try {
        const cooldown = await contractManager.getCooldownTime();
        return cooldown; // Already a string
      } catch (error) {
        throw new Error(`Failed to get cooldown time: ${error.message}`);
      }
    },

    /**
     * Get max claim amount per user in wei
     * @returns {Promise<string>} Max claim amount as string
     */
    async getMaxClaimAmount() {
      try {
        const maxAmount = await contractManager.getMaxClaimAmount();
        return maxAmount; // Already a string
      } catch (error) {
        throw new Error(`Failed to get max claim amount: ${error.message}`);
      }
    },

    /**
     * Check if faucet is paused
     * @returns {Promise<boolean>} True if paused
     */
    async isFaucetPaused() {
      try {
        return await contractManager.isFaucetPaused();
      } catch (error) {
        throw new Error(`Failed to check faucet status: ${error.message}`);
      }
    },

    /**
     * Get total amount claimed by an address
     * @param {string} address - Ethereum address
     * @returns {Promise<string>} Total claimed amount as string
     */
    async getTotalClaimed(address) {
      try {
        if (!address || !ethers.isAddress(address)) {
          throw new Error("Invalid address provided");
        }
        
        const total = await contractManager.getTotalClaimed(address);
        return total; // Already a string
      } catch (error) {
        throw new Error(`Failed to get total claimed: ${error.message}`);
      }
    },

    /**
     * Get connected wallet account
     * @returns {string|null} Connected account address or null
     */
    getConnectedAccount() {
      return walletManager.getAccount();
    },

    /**
     * Check if wallet is connected
     * @returns {boolean} True if connected
     */
    isWalletConnected() {
      return walletManager.isConnected();
    },

    /**
     * Disconnect wallet
     * @returns {void}
     */
    disconnectWallet() {
      walletManager.disconnect();
    },

    /**
     * Get current blockchain chain ID
     * @returns {Promise<string>} Chain ID as string
     */
    async getChainId() {
      try {
        const chainId = await walletManager.getChainId();
        return chainId ? chainId.toString() : "0";
      } catch (error) {
        throw new Error(`Failed to get chain ID: ${error.message}`);
      }
    },

    /**
     * Switch to Sepolia network
     * @returns {Promise<boolean>} True if successful
     */
    async switchToSepolia() {
      try {
        await walletManager.switchToSepolia();
        return true;
      } catch (error) {
        throw new Error(`Failed to switch to Sepolia: ${error.message}`);
      }
    },
  };

  console.log("✓ window.__EVAL__ interface initialized");
};

// Initialize on module load
if (typeof window !== "undefined") {
  initializeEval();
}

// Also export as default for explicit imports
export default initializeEval;

// Export getEvalInterface for potential use
export const getEvalInterface = () => window.__EVAL__ || null;
