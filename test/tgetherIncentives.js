const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("tgetherIncentives Contract", function() {
  let owner, addr1, addr2;
  let tgIncentives, tgf, tgc;
  const communityName = "Blockchain";
  const feeAmount = ethers.utils.parseEther("1");
  const ccfeeAmount = ethers.utils.parseEther("0.5");
  
  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy Mock Fund Contract
    const MockFundContract = await ethers.getContractFactory("MOCKFundContract");
    tgf = await MockFundContract.deploy();
    await tgf.deployed();

    // Deploy Communities Contract
    const TgetherCommunities = await ethers.getContractFactory("tgetherCommunities");
    tgc = await TgetherCommunities.deploy(feeAmount);
    await tgc.deployed();

    // Deploy LaneRegistry with tgetherCommunities as the intakeContract (Step 3)
    const LaneRegistry = await ethers.getContractFactory("LaneRegistry");
    laneRegistry = await LaneRegistry.deploy(tgc.address);
    await laneRegistry.deployed();

    // Deploy CommunitiesLane with required addresses (Step 4)
    const Lane = await ethers.getContractFactory("CommunitiesLane");
    lane1 = await Lane.deploy(tgf.address, tgc.address, laneRegistry.address);
    await lane1.deployed();


    await tgc.connect(owner).setLaneRegistryContract(laneRegistry.address);

    const tgetherMem = await ethers.getContractFactory("tgetherMembers");
    tgm = await tgetherMem.deploy();
    await tgm.deployed();

    // Deploy Incentives Contract
    const TgetherIncentives = await ethers.getContractFactory("tgetherIncentives");
    tgIncentives = await TgetherIncentives.deploy(ccfeeAmount, tgc.address, feeAmount, tgf.address);
    await tgIncentives.deployed();

    await tgm.connect(owner).settgetherCommunities(tgc.address);
    await tgc.connect(owner).settgetherMembersContract(tgm.address);

    // Set up a community
    await tgc.connect(owner).createCommunity(communityName, 0, 0, 0, 1, ethers.constants.AddressZero, 2630000, 604800, false);
    await tgm.connect(owner).addSelfAsMember(communityName);
    await tgm.connect(addr1).addSelfAsMember(communityName);

  });


  describe("Initial Incentive Setup", function() {
    it("Should allow community owner to set initial incentive parameters", async function() {
      await tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address);
      const incentiveParams = await tgIncentives.IncentiveStructures(communityName);
      expect(incentiveParams.isSet).to.be.true;
      expect(incentiveParams.contractRecieveAddress).to.equal(owner.address);
    });

    it("Should fail to set incentive parameters after initial setup", async function() {
    
      await tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address);
      await expect(
        tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address)
      ).to.be.revertedWith("Parameters already set");
    });
  });

  describe("Create Incentive Proposal", function() {
    it("Should allow a member to create an incentive proposal", async function() {
      await tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address);
      const prop = await tgIncentives.connect(addr1).createProposal(
        communityName, 0, 5, owner.address,
        { value: feeAmount.add(ccfeeAmount)}
      );
      const incentiveProposal = await tgIncentives.IncentiveProposals(1);
      expect(incentiveProposal.proposer).to.equal(addr1.address);
    });

    it("Should fail to create an incentive proposal with insufficient fee", async function() {
      await tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address);
      await expect(
        tgIncentives.connect(addr1).createProposal(communityName, 0, 5, owner.address, { value: feeAmount })
      ).to.be.revertedWith("Incorrect fee");
    });
  });

  describe("Check Log Function", function() {
    it("Should return true and correct proposal ID from checkLog", async function() {
      await tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address);
      const prop = await tgIncentives.connect(addr1).createProposal(
        communityName, 0, 5, owner.address,
        { value: feeAmount.add(ccfeeAmount)}
      );

      // Mock log to pass to checkLog function
      const log= {
          index: 0,
          timestamp: 1234567890,
          txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
          blockNumber: 1,
          blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
          source: tgc.address,
          topics: [ethers.utils.hexZeroPad(tgIncentives.address, 32), ethers.utils.hexZeroPad(tgIncentives.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32)],
          data: "0xabcdef1234567890",
        }

      const [upkeepNeeded, performData] = await tgIncentives.checkLog(log, "0x");
      expect(upkeepNeeded).to.be.true;
      expect(ethers.BigNumber.from(performData)).to.equal(1);
    });

    it("Should return false if the contract address is different in checkLog", async function() {
      await tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address);
      const log= {
        index: 0,
        timestamp: 1234567890,
        txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
        blockNumber: 1,
        blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
        source: tgc.address,
        topics: [ethers.utils.hexZeroPad(owner.address, 32), ethers.utils.hexZeroPad(owner.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32)],
        data: "0xabcdef1234567890",
      }
      const [upkeepNeeded, performData] = await tgIncentives.checkLog(log, "0x");
      expect(upkeepNeeded).to.be.false;
    });
  });

  describe("Perform Upkeep", function() {
    it("Should update incentive parameters for a passed proposal", async function() {
      await tgIncentives.connect(owner).setParams(communityName, 0, 5, owner.address);
      await tgIncentives.connect(addr1).createProposal(
        communityName, 0, 5, owner.address,
        { value: feeAmount.add(ccfeeAmount) }
      );

      await tgIncentives.connect(owner).performUpkeep(ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32));
      const incentiveParams = await tgIncentives.IncentiveStructures(communityName);
      expect(incentiveParams.isSet).to.be.true;
    });
  });
});
