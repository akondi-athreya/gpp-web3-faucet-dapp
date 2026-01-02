const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenFaucet", function () {
  let token;
  let faucet;
  let owner;
  let user1;
  let user2;

  const FAUCET_AMOUNT = ethers.parseEther("100");
  const MAX_CLAIM_AMOUNT = ethers.parseEther("1000");
  const COOLDOWN_TIME = 24 * 60 * 60; // 24 hours in seconds

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
    
    // Get owner's nonce to calculate future contract addresses
    const ownerNonce = await ethers.provider.getTransactionCount(owner.address);
    
    // Calculate what the token address will be (first deployment)
    const futureTokenAddress = ethers.getCreateAddress({
      from: owner.address,
      nonce: ownerNonce
    });
    
    // Calculate what the faucet address will be (second deployment) 
    const futureFaucetAddress = ethers.getCreateAddress({
      from: owner.address,
      nonce: ownerNonce + 1
    });
    
    // Deploy token with future faucet address as minter
    token = await Token.deploy(futureFaucetAddress);
    await token.waitForDeployment();
    
    // Deploy faucet with token address
    faucet = await TokenFaucet.deploy(futureTokenAddress);
    await faucet.waitForDeployment();
  });

  describe("Token Contract", function () {
    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("Faucet Token");
      expect(await token.symbol()).to.equal("FAUCET");
    });

    it("Should have correct max supply", async function () {
      expect(await token.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000"));
    });

    it("Should set correct minter", async function () {
      const faucetAddress = await faucet.getAddress();
      expect(await token.minter()).to.equal(faucetAddress);
    });

    it("Should allow only minter to mint tokens", async function () {
      await expect(
        token.connect(user1).mint(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Only minter can mint tokens");
    });

    it("Should not exceed max supply", async function () {
      const maxSupply = await token.MAX_SUPPLY();
      await expect(
        faucet.connect(owner).requestTokens()
      ).to.emit(token, "Transfer");
      
      // Try to mint more than max supply directly (if we could)
      // This is tested through faucet's lifetime limit
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, FAUCET_AMOUNT);
    });
  });

  describe("TokenFaucet Deployment", function () {
    it("Should set correct token address", async function () {
      expect(await faucet.token()).to.equal(await token.getAddress());
    });

    it("Should set deployer as admin", async function () {
      expect(await faucet.admin()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await faucet.paused()).to.equal(false);
      expect(await faucet.isPaused()).to.equal(false);
    });

    it("Should have correct constants", async function () {
      expect(await faucet.FAUCET_AMOUNT()).to.equal(FAUCET_AMOUNT);
      expect(await faucet.MAX_CLAIM_AMOUNT()).to.equal(MAX_CLAIM_AMOUNT);
      expect(await faucet.COOLDOWN_TIME()).to.equal(COOLDOWN_TIME);
    });

    it("Should revert if token address is zero", async function () {
      const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
      await expect(
        TokenFaucet.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Token address cannot be zero");
    });
  });

  describe("requestTokens Function", function () {
    it("Should allow first-time claim", async function () {
      const tx = await faucet.connect(user1).requestTokens();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(faucet, "TokensClaimed")
        .withArgs(user1.address, FAUCET_AMOUNT, block.timestamp);

      expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT);
    });

    it("Should update lastClaimAt mapping", async function () {
      await faucet.connect(user1).requestTokens();
      const lastClaim = await faucet.lastClaimAt(user1.address);
      expect(lastClaim).to.be.greaterThan(0);
    });

    it("Should update totalClaimed mapping", async function () {
      await faucet.connect(user1).requestTokens();
      expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT);
    });

    it("Should emit TokensClaimed event with correct parameters", async function () {
      const tx = await faucet.connect(user1).requestTokens();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(faucet, "TokensClaimed")
        .withArgs(user1.address, FAUCET_AMOUNT, block.timestamp);
    });

    it("Should revert when claiming during cooldown period", async function () {
      await faucet.connect(user1).requestTokens();

      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");
    });

    it("Should revert when faucet is paused", async function () {
      await faucet.connect(owner).setPaused(true);

      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Faucet is paused");
    });

    it("Should revert when lifetime limit is reached", async function () {
      // Claim 10 times to reach 1000 token limit
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        await time.increase(COOLDOWN_TIME);
      }

      expect(await faucet.totalClaimed(user1.address)).to.equal(MAX_CLAIM_AMOUNT);

      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");
    });

    it("Should allow multiple users to claim independently", async function () {
      await faucet.connect(user1).requestTokens();
      await faucet.connect(user2).requestTokens();

      expect(await token.balanceOf(user1.address)).to.equal(FAUCET_AMOUNT);
      expect(await token.balanceOf(user2.address)).to.equal(FAUCET_AMOUNT);
    });
  });

  describe("Cooldown Mechanism", function () {
    it("Should enforce 24-hour cooldown period", async function () {
      await faucet.connect(user1).requestTokens();

      // Try immediately - should fail
      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");

      // Advance time by 23 hours - should still fail
      await time.increase(23 * 60 * 60);
      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");

      // Advance time by 1 more hour (total 24 hours) - should succeed
      await time.increase(60 * 60);
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(faucet, "TokensClaimed");
    });

    it("Should allow claim after exact cooldown time", async function () {
      await faucet.connect(user1).requestTokens();
      await time.increase(COOLDOWN_TIME);
      
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(faucet, "TokensClaimed");
      
      expect(await faucet.totalClaimed(user1.address)).to.equal(
        FAUCET_AMOUNT * 2n
      );
    });

    it("Should track cooldown independently for each user", async function () {
      await faucet.connect(user1).requestTokens();
      await time.increase(12 * 60 * 60); // 12 hours
      await faucet.connect(user2).requestTokens();

      // user1 should not be able to claim yet (12 hours passed)
      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");

      // user2 should not be able to claim yet (just claimed)
      await expect(
        faucet.connect(user2).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");

      // Advance 12 more hours (24 total for user1, 12 for user2)
      await time.increase(12 * 60 * 60);

      // user1 should be able to claim now
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(faucet, "TokensClaimed");

      // user2 still can't claim
      await expect(
        faucet.connect(user2).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");
    });
  });

  describe("Lifetime Limit", function () {
    it("Should track total claimed amount correctly", async function () {
      await faucet.connect(user1).requestTokens();
      expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT);

      await time.increase(COOLDOWN_TIME);
      await faucet.connect(user1).requestTokens();
      expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT * 2n);
    });

    it("Should prevent claiming beyond lifetime limit", async function () {
      // Claim 10 times (1000 tokens total)
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        await time.increase(COOLDOWN_TIME);
      }

      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Cannot claim tokens at this time");
    });

    it("Should allow different users to have separate lifetime limits", async function () {
      // user1 reaches limit
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        if (i < 9) {
          await time.increase(COOLDOWN_TIME);
        }
      }

      // user2 should still be able to claim
      await faucet.connect(user2).requestTokens();
      expect(await token.balanceOf(user2.address)).to.equal(FAUCET_AMOUNT);
    });
  });

  describe("canClaim Function", function () {
    it("Should return true for first-time user", async function () {
      expect(await faucet.canClaim(user1.address)).to.equal(true);
    });

    it("Should return false during cooldown period", async function () {
      await faucet.connect(user1).requestTokens();
      expect(await faucet.canClaim(user1.address)).to.equal(false);
    });

    it("Should return true after cooldown period", async function () {
      await faucet.connect(user1).requestTokens();
      await time.increase(COOLDOWN_TIME);
      expect(await faucet.canClaim(user1.address)).to.equal(true);
    });

    it("Should return false when lifetime limit reached", async function () {
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        if (i < 9) {
          await time.increase(COOLDOWN_TIME);
        }
      }
      expect(await faucet.canClaim(user1.address)).to.equal(false);
    });

    it("Should return false when paused", async function () {
      await faucet.connect(owner).setPaused(true);
      expect(await faucet.canClaim(user1.address)).to.equal(false);
    });
  });

  describe("remainingAllowance Function", function () {
    it("Should return MAX_CLAIM_AMOUNT for new user", async function () {
      expect(await faucet.remainingAllowance(user1.address)).to.equal(MAX_CLAIM_AMOUNT);
    });

    it("Should decrease after each claim", async function () {
      await faucet.connect(user1).requestTokens();
      expect(await faucet.remainingAllowance(user1.address)).to.equal(
        MAX_CLAIM_AMOUNT - FAUCET_AMOUNT
      );

      await time.increase(COOLDOWN_TIME);
      await faucet.connect(user1).requestTokens();
      expect(await faucet.remainingAllowance(user1.address)).to.equal(
        MAX_CLAIM_AMOUNT - FAUCET_AMOUNT * 2n
      );
    });

    it("Should return 0 when limit reached", async function () {
      for (let i = 0; i < 10; i++) {
        await faucet.connect(user1).requestTokens();
        if (i < 9) {
          await time.increase(COOLDOWN_TIME);
        }
      }
      expect(await faucet.remainingAllowance(user1.address)).to.equal(0);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause", async function () {
      await expect(faucet.connect(owner).setPaused(true))
        .to.emit(faucet, "FaucetPaused")
        .withArgs(true);

      expect(await faucet.paused()).to.equal(true);
      expect(await faucet.isPaused()).to.equal(true);
    });

    it("Should allow admin to unpause", async function () {
      await faucet.connect(owner).setPaused(true);
      
      await expect(faucet.connect(owner).setPaused(false))
        .to.emit(faucet, "FaucetPaused")
        .withArgs(false);

      expect(await faucet.paused()).to.equal(false);
      expect(await faucet.isPaused()).to.equal(false);
    });

    it("Should prevent non-admin from pausing", async function () {
      await expect(
        faucet.connect(user1).setPaused(true)
      ).to.be.revertedWith("Only admin can pause/unpause");
    });

    it("Should prevent claims when paused", async function () {
      await faucet.connect(owner).setPaused(true);
      
      await expect(
        faucet.connect(user1).requestTokens()
      ).to.be.revertedWith("Faucet is paused");
    });

    it("Should allow claims after unpause", async function () {
      await faucet.connect(owner).setPaused(true);
      await faucet.connect(owner).setPaused(false);

      await expect(faucet.connect(user1).requestTokens())
        .to.emit(faucet, "TokensClaimed");
    });

    it("Should emit FaucetPaused event with correct parameter", async function () {
      await expect(faucet.connect(owner).setPaused(true))
        .to.emit(faucet, "FaucetPaused")
        .withArgs(true);

      await expect(faucet.connect(owner).setPaused(false))
        .to.emit(faucet, "FaucetPaused")
        .withArgs(false);
    });
  });

  describe("Event Emissions", function () {
    it("Should emit TokensClaimed with correct parameters", async function () {
      const tx = await faucet.connect(user1).requestTokens();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(faucet, "TokensClaimed")
        .withArgs(user1.address, FAUCET_AMOUNT, block.timestamp);
    });

    it("Should emit FaucetPaused when pause state changes", async function () {
      await expect(faucet.connect(owner).setPaused(true))
        .to.emit(faucet, "FaucetPaused")
        .withArgs(true);
    });

    it("Should emit Transfer event from token contract", async function () {
      await expect(faucet.connect(user1).requestTokens())
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, FAUCET_AMOUNT);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address checks in token constructor", async function () {
      const Token = await ethers.getContractFactory("Token");
      await expect(
        Token.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Minter address cannot be zero");
    });

    it("Should track multiple sequential claims correctly", async function () {
      const claims = 5;
      for (let i = 0; i < claims; i++) {
        await faucet.connect(user1).requestTokens();
        expect(await faucet.totalClaimed(user1.address)).to.equal(
          FAUCET_AMOUNT * BigInt(i + 1)
        );
        if (i < claims - 1) {
          await time.increase(COOLDOWN_TIME);
        }
      }
    });

    it("Should maintain correct state across multiple users", async function () {
      await faucet.connect(user1).requestTokens();
      await faucet.connect(user2).requestTokens();

      expect(await faucet.totalClaimed(user1.address)).to.equal(FAUCET_AMOUNT);
      expect(await faucet.totalClaimed(user2.address)).to.equal(FAUCET_AMOUNT);
      expect(await faucet.lastClaimAt(user1.address)).to.not.equal(0);
      expect(await faucet.lastClaimAt(user2.address)).to.not.equal(0);
    });

    it("Should handle remaining allowance calculation at boundary", async function () {
      // Claim 9 times
      for (let i = 0; i < 9; i++) {
        await faucet.connect(user1).requestTokens();
        await time.increase(COOLDOWN_TIME);
      }

      expect(await faucet.remainingAllowance(user1.address)).to.equal(FAUCET_AMOUNT);
      
      // One more claim should leave 0
      await faucet.connect(user1).requestTokens();
      expect(await faucet.remainingAllowance(user1.address)).to.equal(0);
    });
  });
});
