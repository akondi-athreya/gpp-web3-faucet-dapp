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

  // Deploy Token contract with deployer as temporary minter
  // (We'll set Faucet as minter later)
  console.log("Deploying Token contract...");
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("Token deployed to:", tokenAddress);
  console.log("Token name:", await token.name());
  console.log("Token symbol:", await token.symbol());
  console.log("Max supply:", ethers.formatEther(await token.MAX_SUPPLY()), "tokens");
  console.log("Current minter:", await token.minter());
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

  // Verify minter is correctly set (should be deployer initially)
  const minter = await token.minter();
  console.log("Current minter:", minter);
  console.log();

  // MINT TOKENS TO FAUCET
  console.log("Minting 10,000 tokens to TokenFaucet contract...");
  
  try {
    // Mint tokens while deployer is still the minter
    const mintAmount = ethers.parseEther("10000");
    const mintTx = await token.mint(faucetAddress, mintAmount);
    console.log("Mint transaction sent:", mintTx.hash);
    
    const mintReceipt = await mintTx.wait();
    console.log("✓ Minting completed in block", mintReceipt.blockNumber);
    
    // Verify balance
    const faucetBalance = await token.balanceOf(faucetAddress);
    console.log("✓ Faucet balance verified:", ethers.formatEther(faucetBalance), "tokens");
    console.log();
    
    // Now transfer minter role to Faucet
    console.log("Transferring minter role to Faucet contract...");
    const roleTx = await token.transferMinterRole(faucetAddress);
    console.log("Role transfer transaction sent:", roleTx.hash);
    
    const roleReceipt = await roleTx.wait();
    console.log("✓ Minter role transferred in block", roleReceipt.blockNumber);
    
    const newMinter = await token.minter();
    console.log("✓ New minter is:", newMinter);
    console.log();
  } catch (error) {
    console.error("✗ ERROR during minting:", error.message);
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

  // Contract verification on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations before verification...");
    // Wait for 5 block confirmations
    const tokenReceipt = await token.deploymentTransaction().wait(5);
    const faucetReceipt = await faucet.deploymentTransaction().wait(5);
    console.log("Block confirmations completed\n");

    console.log("Verifying Token contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [futureFaucetAddress],
      });
      console.log("✓ Token contract verified");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✓ Token contract already verified");
      } else {
        console.error("✗ Token verification failed:", error.message);
      }
    }
    console.log();

    console.log("Verifying TokenFaucet contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: faucetAddress,
        constructorArguments: [tokenAddress],
      });
      console.log("✓ TokenFaucet contract verified");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✓ TokenFaucet contract already verified");
      } else {
        console.error("✗ TokenFaucet verification failed:", error.message);
      }
    }
    console.log();
  } else {
    console.log("⚠ ETHERSCAN_API_KEY not found in environment variables");
    console.log("Skipping contract verification");
    console.log("To verify contracts manually, run:");
    console.log(`npx hardhat verify --network sepolia ${tokenAddress} ${futureFaucetAddress}`);
    console.log(`npx hardhat verify --network sepolia ${faucetAddress} ${tokenAddress}`);
    console.log();
  }

  console.log("=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Token Address:", tokenAddress);
  console.log("TokenFaucet Address:", faucetAddress);
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
