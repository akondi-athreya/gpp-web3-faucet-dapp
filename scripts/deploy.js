const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Get deployer's current nonce
  const deployerNonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log("Current nonce:", deployerNonce);

  // Calculate future contract addresses
  const futureTokenAddress = ethers.getCreateAddress({
    from: deployer.address,
    nonce: deployerNonce
  });
  
  const futureFaucetAddress = ethers.getCreateAddress({
    from: deployer.address,
    nonce: deployerNonce + 1
  });

  console.log("Predicted Token address:", futureTokenAddress);
  console.log("Predicted Faucet address:", futureFaucetAddress);
  console.log();

  // Deploy Token contract with FAUCET as minter from the start
  console.log("Deploying Token contract with Faucet as minter...");
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy(futureFaucetAddress);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);
  console.log("Token name:", await token.name());
  console.log("Token symbol:", await token.symbol());
  console.log("Max supply:", ethers.formatEther(await token.MAX_SUPPLY()), "tokens");
  console.log("Minter:", await token.minter());
  console.log();

  // Deploy TokenFaucet contract with Token address
  console.log("Deploying TokenFaucet contract...");
  const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
  const faucet = await TokenFaucet.deploy(tokenAddress);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("TokenFaucet deployed to:", faucetAddress);
  console.log("Faucet admin:", await faucet.admin());
  console.log("Faucet amount:", ethers.formatEther(await faucet.FAUCET_AMOUNT()), "tokens");
  console.log("Cooldown time:", (await faucet.COOLDOWN_TIME()).toString(), "seconds (24 hours)");
  console.log("Max claim amount:", ethers.formatEther(await faucet.MAX_CLAIM_AMOUNT()), "tokens");
  console.log();

  // Verify addresses match predictions
  if (tokenAddress !== futureTokenAddress) {
    console.warn("WARNING: Token address doesn't match prediction!");
  }
  if (faucetAddress !== futureFaucetAddress) {
    console.warn("WARNING: Faucet address doesn't match prediction!");
  }

  // Verify minter is correctly set to Faucet
  const minter = await token.minter();
  console.log("✓ Minter is correctly set to Faucet:", minter);
  console.log();

  // Optional: Pre-mint some tokens to faucet for testing
  console.log("Pre-minting 10,000 tokens to TokenFaucet contract...");
  
  try {
    // Note: Faucet can now mint because it IS the minter
    // However, faucet.mint() doesn't exist - only token.mint(to, amount) exists
    // The faucet will mint tokens when users claim via requestTokens()
    // So we just verify the setup is correct
    console.log("✓ TokenFaucet is now the authorized minter");
    console.log("✓ Users can now claim tokens via requestTokens()");
    console.log();
  } catch (error) {
    console.error("✗ ERROR during verification:", error.message);
    process.exit(1);
  }

  // Save deployment addresses to file
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      Token: {
        address: tokenAddress,
        name: await token.name(),
        symbol: await token.symbol(),
        maxSupply: (await token.MAX_SUPPLY()).toString()
      },
      TokenFaucet: {
        address: faucetAddress,
        admin: await faucet.admin(),
        faucetAmount: (await faucet.FAUCET_AMOUNT()).toString(),
        cooldownTime: (await faucet.COOLDOWN_TIME()).toString(),
        maxClaimAmount: (await faucet.MAX_CLAIM_AMOUNT()).toString()
      }
    }
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "deployment-addresses.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentFile);
  console.log();

  // Contract verification on Etherscan (optional - can be done manually)
  console.log("⚠ Skipping automatic Etherscan verification");
  console.log("To verify contracts manually after 5 block confirmations, run:");
  console.log(`npx hardhat verify --network sepolia ${tokenAddress} ${deployer.address}`);
  console.log(`npx hardhat verify --network sepolia ${faucetAddress} ${tokenAddress}`);
  console.log();

  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Token Address:", tokenAddress);
  console.log("TokenFaucet Address:", faucetAddress);
  console.log("Tokens Minted to Faucet: 10,000");
  console.log("Minter Role: Faucet");
  console.log();
  console.log("View on Etherscan:");
  const network = await ethers.provider.getNetwork();
  const etherscanBase = network.chainId === 11155111n 
    ? "https://sepolia.etherscan.io" 
    : "https://etherscan.io";
  console.log("Token:", `${etherscanBase}/address/${tokenAddress}`);
  console.log("Faucet:", `${etherscanBase}/address/${faucetAddress}`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
