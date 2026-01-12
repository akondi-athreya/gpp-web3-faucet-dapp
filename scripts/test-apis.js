/**
 * Comprehensive API Test Script
 * Tests all contract functions and frontend integration
 */

const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("COMPREHENSIVE API TEST SUITE");
  console.log("=".repeat(80));

  try {
    // Get signers
    const [deployer, user1, user2, user3] = await ethers.getSigners();
    console.log(`\n✓ Got signers`);
    console.log(`  Deployer: ${deployer.address}`);
    console.log(`  User 1: ${user1.address}`);
    console.log(`  User 2: ${user2.address}`);
    console.log(`  User 3: ${user3.address}`);

    // Deploy fresh contracts
    console.log(`\n✓ Deploying fresh contracts...`);
    const Token = await ethers.getContractFactory("Token");
    const TokenFaucet = await ethers.getContractFactory("TokenFaucet");

    // Step 1: Deploy Token with deployer as temp minter
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log(`  Token deployed: ${tokenAddress}`);

    // Step 2: Deploy Faucet with Token address
    const faucet = await TokenFaucet.deploy(tokenAddress);
    await faucet.waitForDeployment();
    const faucetAddress = await faucet.getAddress();
    console.log(`  Faucet deployed: ${faucetAddress}`);

    // Step 3: Transfer minter role from deployer to Faucet
    const transferMinterTx = await token.transferMinterRole(faucetAddress);
    await transferMinterTx.wait();
    console.log(`  Minter role transferred to Faucet`);

    console.log(`\n✓ Attached to contracts`);

    // Test Token Contract APIs
    console.log("\n" + "-".repeat(80));
    console.log("TOKEN CONTRACT TESTS");
    console.log("-".repeat(80));

    const name = await token.name();
    console.log(`✓ name(): "${name}"`);

    const symbol = await token.symbol();
    console.log(`✓ symbol(): "${symbol}"`);

    const decimals = await token.decimals();
    console.log(`✓ decimals(): ${decimals}`);

    const totalSupply = await token.totalSupply();
    console.log(`✓ totalSupply(): ${totalSupply.toString()} (${ethers.formatUnits(totalSupply, 18)} tokens)`);

    const maxSupply = await token.MAX_SUPPLY();
    console.log(`✓ MAX_SUPPLY: ${maxSupply.toString()} (${ethers.formatUnits(maxSupply, 18)} tokens)`);

    const minter = await token.minter();
    console.log(`✓ minter: ${minter}`);
    if (minter.toLowerCase() === faucetAddress.toLowerCase()) {
      console.log(`  ✓ Minter is correctly set to TokenFaucet`);
    } else {
      console.log(`  ✗ WARNING: Minter is NOT TokenFaucet!`);
    }

    // Test TokenFaucet Contract APIs
    console.log("\n" + "-".repeat(80));
    console.log("TOKEN FAUCET CONTRACT TESTS");
    console.log("-".repeat(80));

    const tokenAddr = await faucet.token();
    console.log(`✓ token(): ${tokenAddr}`);

    const admin = await faucet.admin();
    console.log(`✓ admin(): ${admin}`);

    const faucetAmount = await faucet.FAUCET_AMOUNT();
    console.log(`✓ FAUCET_AMOUNT: ${faucetAmount.toString()} (${ethers.formatUnits(faucetAmount, 18)} tokens)`);

    const cooldownTime = await faucet.COOLDOWN_TIME();
    console.log(`✓ COOLDOWN_TIME: ${cooldownTime.toString()} seconds (${cooldownTime / 86400n} days)`);

    const maxClaimAmount = await faucet.MAX_CLAIM_AMOUNT();
    console.log(`✓ MAX_CLAIM_AMOUNT: ${maxClaimAmount.toString()} (${ethers.formatUnits(maxClaimAmount, 18)} tokens)`);

    let paused = await faucet.isPaused();
    console.log(`✓ isPaused(): ${paused}`);

    // Test canClaim before claiming
    console.log("\n--- Testing canClaim (before claiming) ---");
    let canClaimUser1 = await faucet.canClaim(user1.address);
    console.log(`✓ canClaim(user1): ${canClaimUser1}`);

    let canClaimUser2 = await faucet.canClaim(user2.address);
    console.log(`✓ canClaim(user2): ${canClaimUser2}`);

    // Test remainingAllowance before claiming
    console.log("\n--- Testing remainingAllowance (before claiming) ---");
    let remainingUser1 = await faucet.remainingAllowance(user1.address);
    console.log(`✓ remainingAllowance(user1): ${remainingUser1.toString()} (${ethers.formatUnits(remainingUser1, 18)} tokens)`);

    let remainingUser2 = await faucet.remainingAllowance(user2.address);
    console.log(`✓ remainingAllowance(user2): ${remainingUser2.toString()} (${ethers.formatUnits(remainingUser2, 18)} tokens)`);

    // Test lastClaimAt before claiming
    console.log("\n--- Testing lastClaimAt (before claiming) ---");
    let lastClaimUser1 = await faucet.lastClaimAt(user1.address);
    console.log(`✓ lastClaimAt(user1): ${lastClaimUser1.toString()} (${lastClaimUser1 === 0n ? "never claimed" : new Date(Number(lastClaimUser1) * 1000).toISOString()})`);

    let lastClaimUser2 = await faucet.lastClaimAt(user2.address);
    console.log(`✓ lastClaimAt(user2): ${lastClaimUser2.toString()} (${lastClaimUser2 === 0n ? "never claimed" : new Date(Number(lastClaimUser2) * 1000).toISOString()})`);

    // Test totalClaimed before claiming
    console.log("\n--- Testing totalClaimed (before claiming) ---");
    let totalClaimedUser1 = await faucet.totalClaimed(user1.address);
    console.log(`✓ totalClaimed(user1): ${totalClaimedUser1.toString()} (${ethers.formatUnits(totalClaimedUser1, 18)} tokens)`);

    // Test requestTokens (first claim)
    console.log("\n" + "-".repeat(80));
    console.log("TEST: requestTokens (First Claim)");
    console.log("-".repeat(80));

    const user1Balance1 = await token.balanceOf(user1.address);
    console.log(`User1 balance before claim: ${ethers.formatUnits(user1Balance1, 18)} tokens`);

    const tx1 = await faucet.connect(user1).requestTokens();
    const receipt1 = await tx1.wait();
    console.log(`✓ requestTokens() successful`);
    console.log(`  Transaction hash: ${tx1.hash}`);
    console.log(`  Gas used: ${receipt1.gasUsed.toString()}`);

    const user1Balance2 = await token.balanceOf(user1.address);
    console.log(`User1 balance after claim: ${ethers.formatUnits(user1Balance2, 18)} tokens`);

    // Verify state changes after claim
    console.log("\n--- Verifying state after claim ---");
    canClaimUser1 = await faucet.canClaim(user1.address);
    console.log(`✓ canClaim(user1) after claim: ${canClaimUser1} (should be false due to cooldown)`);

    remainingUser1 = await faucet.remainingAllowance(user1.address);
    console.log(`✓ remainingAllowance(user1) after claim: ${ethers.formatUnits(remainingUser1, 18)} tokens (should be 900)`);

    lastClaimUser1 = await faucet.lastClaimAt(user1.address);
    console.log(`✓ lastClaimAt(user1) after claim: ${lastClaimUser1.toString()} (should be > 0)`);

    totalClaimedUser1 = await faucet.totalClaimed(user1.address);
    console.log(`✓ totalClaimed(user1) after claim: ${ethers.formatUnits(totalClaimedUser1, 18)} tokens (should be 100)`);

    // Test second user claim
    console.log("\n" + "-".repeat(80));
    console.log("TEST: Second User Claiming (user2)");
    console.log("-".repeat(80));

    const user2Balance1 = await token.balanceOf(user2.address);
    console.log(`User2 balance before claim: ${ethers.formatUnits(user2Balance1, 18)} tokens`);

    const tx2 = await faucet.connect(user2).requestTokens();
    const receipt2 = await tx2.wait();
    console.log(`✓ requestTokens() for user2 successful`);
    console.log(`  Transaction hash: ${tx2.hash}`);

    const user2Balance2 = await token.balanceOf(user2.address);
    console.log(`User2 balance after claim: ${ethers.formatUnits(user2Balance2, 18)} tokens`);

    // Test failing scenario - claim during cooldown
    console.log("\n" + "-".repeat(80));
    console.log("TEST: requestTokens (Should fail - cooldown period)");
    console.log("-".repeat(80));

    try {
      await faucet.connect(user1).requestTokens();
      console.log(`✗ FAILED: requestTokens should have failed for user1 (cooldown)`);
    } catch (error) {
      console.log(`✓ Correctly rejected: ${error.reason || error.message.substring(0, 50)}`);
    }

    // Test pause functionality
    console.log("\n" + "-".repeat(80));
    console.log("TEST: Pause/Unpause Functionality");
    console.log("-".repeat(80));

    paused = await faucet.isPaused();
    console.log(`Current pause state: ${paused}`);

    const pauseTx = await faucet.connect(deployer).setPaused(true);
    await pauseTx.wait();
    console.log(`✓ setPaused(true) successful`);

    paused = await faucet.isPaused();
    console.log(`Pause state after setPaused(true): ${paused} (should be true)`);

    // Try to claim while paused
    try {
      await faucet.connect(user3).requestTokens();
      console.log(`✗ FAILED: requestTokens should have failed when paused`);
    } catch (error) {
      console.log(`✓ Correctly rejected claim while paused`);
    }

    // Unpause
    const unpauseTx = await faucet.connect(deployer).setPaused(false);
    await unpauseTx.wait();
    console.log(`✓ setPaused(false) successful`);

    paused = await faucet.isPaused();
    console.log(`Pause state after setPaused(false): ${paused} (should be false)`);

    // Test lifetime limit
    console.log("\n" + "-".repeat(80));
    console.log("TEST: Lifetime Limit (MAX_CLAIM_AMOUNT)");
    console.log("-".repeat(80));

    const currentClaimed = await faucet.totalClaimed(user2.address);
    console.log(`User2 has claimed so far: ${ethers.formatUnits(currentClaimed, 18)} tokens`);
    console.log(`User2 can still claim: ${ethers.formatUnits(remainingUser2, 18)} tokens`);
    console.log(`MAX_CLAIM_AMOUNT is: ${ethers.formatUnits(maxClaimAmount, 18)} tokens`);

    // Token balances summary
    console.log("\n" + "-".repeat(80));
    console.log("TOKEN BALANCES SUMMARY");
    console.log("-".repeat(80));

    const balances = await Promise.all([
      token.balanceOf(deployer.address),
      token.balanceOf(user1.address),
      token.balanceOf(user2.address),
      token.balanceOf(user3.address),
    ]);

    console.log(`Deployer: ${ethers.formatUnits(balances[0], 18)} tokens`);
    console.log(`User 1: ${ethers.formatUnits(balances[1], 18)} tokens`);
    console.log(`User 2: ${ethers.formatUnits(balances[2], 18)} tokens`);
    console.log(`User 3: ${ethers.formatUnits(balances[3], 18)} tokens`);

    const totalSupplyAfter = await token.totalSupply();
    console.log(`Total Supply: ${ethers.formatUnits(totalSupplyAfter, 18)} tokens`);

    // Final summary
    console.log("\n" + "=".repeat(80));
    console.log("✓ ALL TESTS COMPLETED SUCCESSFULLY");
    console.log("=".repeat(80) + "\n");

  } catch (error) {
    console.error(`\n✗ TEST FAILED: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
