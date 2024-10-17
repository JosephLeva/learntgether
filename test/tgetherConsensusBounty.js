const { expect } = require("chai");

const communityName = "Cryptogrphy";
const minCredsToProposeVote = 1;
const minCredsToVote = 1;
const maxCredsCountedForVote = 10;
const minProposalVotes = 1;
const proposalTime = 2630000;
const proposalDelay= 604800
const isInviteOnly = false;

const numReviewsForAcceptance = 1;
const credsNeededForReview = 1;
const percentAcceptsNeeded = 50;
const consensusTime= 2630000
const consensusTypes = ["Hello", "World"]

const zeroAddress = "0x0000000000000000000000000000000000000000";
const memberAccessContract =zeroAddress

const feeAmount = ethers.utils.parseEther("1"); // Replace "1" with the actual fee amount
const ccfeeAmount = ethers.utils.parseEther("0.5"); // Replace "1" with the actual fee amount

describe("tgether Consensus Bounty Contract", function() {
  let tgr
  let tgs
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addrs;
  let autoAddr;

  beforeEach(async function() {
    [owner, autoAddr, addr1, addr2,addr3,addr4,addr5,  ...addrs] = await ethers.getSigners();
    const mockFeePrice = ethers.utils.parseEther("1"); // Example fee 
    
    const tgetherMem = await ethers.getContractFactory("tgetherMembers");
    tgm = await tgetherMem.deploy();
    await tgm.deployed();

    const tgetherFund = await ethers.getContractFactory("MOCKFundContract");
    tgf = await tgetherFund.deploy();
    await tgf.deployed();

    const tgetherCom = await ethers.getContractFactory("tgetherCommunities");
    tgc = await tgetherCom.deploy(mockFeePrice);
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

    const tgetherComCon = await ethers.getContractFactory("tgetherCommunityConsensus");
    tgcc = await tgetherComCon.deploy(ccfeeAmount, tgc.address, mockFeePrice, tgf.address );
    await tgcc.deployed();    
    await tgm.connect(owner).settgetherCommunities(tgc.address);
    await tgc.connect(owner).settgetherMembersContract(tgm.address);

    await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
    await tgc.connect(owner).createCommunity("No Consensous Community", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
    await tgc.connect(owner).createCommunity("NoCommunityFEE", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
    await tgc.connect(owner).createCommunity("UnsetCommunity", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);

    await tgm.connect(owner).addSelfAsMember(communityName);
    await tgm.connect(addr1).addSelfAsMember(communityName);
    await tgm.connect(addr2).addSelfAsMember(communityName);
    await tgm.connect(addr3).addSelfAsMember(communityName);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr3.address);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr2.address);
    await tgm.connect(addr1).addPosCredsToMember(communityName, owner.address);
    
    await tgm.connect(owner).addSelfAsMember("NoCommunityFEE");
    await tgm.connect(addr1).addSelfAsMember("NoCommunityFEE");
    await tgm.connect(addr2).addSelfAsMember("NoCommunityFEE");
    await tgm.connect(addr3).addSelfAsMember("NoCommunityFEE");
    await tgm.connect(owner).addPosCredsToMember("NoCommunityFEE", addr3.address);
    await tgm.connect(addr3).addPosCredsToMember("NoCommunityFEE", owner.address);


    await tgm.connect(owner).addSelfAsMember("UnsetCommunity");
    await tgm.connect(addr1).addSelfAsMember("UnsetCommunity");
    await tgm.connect(addr2).addSelfAsMember("UnsetCommunity");
    await tgm.connect(addr3).addSelfAsMember("UnsetCommunity");

    await tgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
    await tgcc.connect(owner).setCCParams("No Consensous Community", numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, 0 /* consensusTime */, consensusTypes);
    await tgcc.connect(owner).setCCParams("NoCommunityFEE", numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
    await tgcc.connect(owner).setCCParams("UnsetCommunity", numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);

    const tgetherPost = await ethers.getContractFactory("tgetherPosts");
    tgp = await tgetherPost.deploy();
    await tgp.deployed();
    await tgp.connect(addr1).mintPost("endpoint.com/thisisalink", "A test Post", "Joe","this is a test post");   
    await tgp.connect(addr1).mintPost("endpoint.com/post2", "A  second test Post", "Joe","this is a test post");   
    await tgp.connect(addr1).mintPost("endpoint.com/post3", "A  second test Post", "Joe","this is a test post");   
    await tgp.connect(addr1).mintPost("endpoint.com/post4", "A  second test Post", "Joe","this is a test post");   
    await tgp.connect(addr1).mintPost("endpoint.com/post5", "A  second test Post", "Joe","this is a test post");   
    await tgp.connect(addr1).mintPost("endpoint.com/post6", "A  second test Post", "Joe","this is a test post");   


    const tgetherPostCon = await ethers.getContractFactory("tgetherPostConsensus");
    tgpc = await tgetherPostCon.deploy(tgcc.address, tgm.address, tgp.address, feeAmount );
    await tgcc.deployed();    
   
    // Deploy LaneRegistry with tgetherCommunities as the intakeContract (Step 3)
    const PCLaneRegistry = await ethers.getContractFactory("LaneRegistry");
    pcLaneRegistry = await PCLaneRegistry.deploy(tgpc.address);
    await pcLaneRegistry.deployed();

    await tgpc.connect(owner).setLaneRegistry(pcLaneRegistry.address);

    // Deploy CommunitiesLane with required addresses (Step 4)
    const Lane2 = await ethers.getContractFactory("PostConsensusLane");
    lane2 = await Lane2.deploy(tgf.address, tgpc.address, pcLaneRegistry.address );
    await lane2.deployed();
    await lane2.connect(owner).setForwarder( autoAddr.address);



    const TgetherIncentives = await ethers.getContractFactory("tgetherIncentives");
    tgi = await TgetherIncentives.deploy(feeAmount, tgc.address, feeAmount, tgf.address);
    await tgi.deployed();
    await tgi.connect(owner).setParams(communityName, 0, ccfeeAmount, owner.address);
    await tgi.connect(owner).setParams("NoCommunityFEE", 1, 0, owner.address);

    await tgpc.connect(addr1).submitToCommunity(1, communityName, {value: feeAmount});

    await tgpc.connect(addr1).submitToCommunity(2, communityName, {value: feeAmount});
    await tgpc.connect(addr1).submitToCommunity(3, communityName, {value: feeAmount});
    await tgpc.connect(addr1).submitToCommunity(4, "NoCommunityFEE", {value: feeAmount});
    await tgpc.connect(addr1).submitToCommunity(5, "NoCommunityFEE", {value: feeAmount});
    await tgpc.connect(addr1).submitToCommunity(6, "UnsetCommunity", {value: feeAmount});

    await tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr1).submitReview(1, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr2).submitReview(1, "Endpoint for review.com/thissicool", 3);

    await tgpc.connect(owner).submitReview(2, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr1).submitReview(2, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr3).submitReview(2, "Endpoint for review.com/thissicool", 3);


    await tgpc.connect(owner).submitReview(4, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr1).submitReview(4, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr3).submitReview(4, "Endpoint for review.com/thissicool", 3);

    await tgpc.connect(owner).submitReview(5, "Endpoint for review.com/thissicool", 3);
    await tgpc.connect(addr1).submitReview(5, "Endpoint for review.com/thissicool", 3);
    await tgpc.connect(addr3).submitReview(5, "Endpoint for review.com/thissicool", 2);

    await tgpc.connect(owner).submitReview(6, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr1).submitReview(6, "Endpoint for review.com/thissicool", 2);
    await tgpc.connect(addr3).submitReview(6, "Endpoint for review.com/thissicool", 3);

    const tgetherBounty = await ethers.getContractFactory("tgetherConsensusBounty");
    tgb = await tgetherBounty.deploy(tgf.address, tgpc.address, tgcc.address, tgi.address, feeAmount);
    await tgb.deployed();

    await tgb.connect(owner).setAutomationContractAddress(autoAddr.address);

  });

  const processPosts = async ()=> {
    await network.provider.send("evm_increaseTime", [consensusTime]);
    await network.provider.send("evm_mine");
    await lane2.connect(autoAddr).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");
    await lane2.connect(autoAddr).performUpkeep("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe");
    await lane2.connect(autoAddr).performUpkeep("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd");
    await lane2.connect(autoAddr).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000004");
    await lane2.connect(autoAddr).performUpkeep("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffb");
    await lane2.connect(autoAddr).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000006");



    const csub = await tgpc.connect(addr1).getCommunitySubmission(1);
    const csub2 = await tgpc.connect(addr1).getCommunitySubmission(2);
    const csub3 = await tgpc.connect(addr1).getCommunitySubmission(3);
    const csub4 = await tgpc.connect(addr1).getCommunitySubmission(4);
    const csub5 = await tgpc.connect(addr1).getCommunitySubmission(5);
    const csub6 = await tgpc.connect(addr1).getCommunitySubmission(6);
    expect(csub[3]).to.equal(2); 
    expect(csub2[3]).to.equal(3); 
    expect(csub3[3]).to.equal(3); 
    expect(csub4[3]).to.equal(2); 
    expect(csub5[3]).to.equal(3); 
    expect(csub6[3]).to.equal(2); 

  } 

  describe("Bounty Creation Tests", function () {
    it("should allow two different users to create bounties on the same post and store the bounty IDs", async function () {
      const submissionId = 1; // Using the first post created by addr1
  
      // Create the first bounty by addr1
      await tgb.connect(addr1).createBounty(submissionId, { value: feeAmount.add(ccfeeAmount).add(feeAmount) });
      const firstBounty = await tgb.bounties(1);
      expect(firstBounty.bountyCreator).to.equal(addr1.address);
      expect(firstBounty.bountyAmount).to.equal(feeAmount.add(ccfeeAmount));
  
      // Create the second bounty by addr2
      await tgb.connect(addr2).createBounty(submissionId, { value: feeAmount.add(ccfeeAmount).add(feeAmount) });
      const secondBounty = await tgb.bounties(2);
      expect(secondBounty.bountyCreator).to.equal(addr2.address);
      expect(secondBounty.bountyAmount).to.equal(feeAmount.add(ccfeeAmount));
  
      // Verify that both bounty IDs exist in postSubmissionBounties
      const submissionBounties = await tgb.GetPostSubmissionBounties(submissionId);
      expect(submissionBounties.length).to.equal(2);
      expect(submissionBounties[0]).to.equal(1);
      expect(submissionBounties[1]).to.equal(2);
    });
  });
  describe("Bounty Creation Failure Tests", function () {
    it("should fail to create a bounty if msg.value is less than the required fee", async function () {
      const submissionId = 1; // Using the first post created by addr1
  
      // Attempt to create a bounty with an insufficient fee (half of the required fee)
      const insufficientFee = ethers.utils.parseEther("0.5");
  
      await expect(
        tgb.connect(addr1).createBounty(submissionId, { value: insufficientFee })
      ).to.be.revertedWith("Fee must be paid to create a bounty");
    });
    it("should fail to create a bounty if the community does not have an incentive structure", async function () {
        await expect(tgb.connect(addr4).createBounty(6, { value: feeAmount.add(ccfeeAmount) }))
          .to.be.revertedWith("Community must have an incentive structure");
      });
  });
  
  const { expect } = require("chai");

  describe("CheckLog Tests", function () {
    beforeEach(async function () {
      // Assuming the setup for contracts, communities, members, and posts has been completed in the main setup.
  
      // Create bounties for submissions (1, 2, 3, 4, and 5) by two different users
      await tgb.connect(addr4).createBounty(1, { value: ethers.utils.parseEther("4.5") });
      await tgb.connect(addr5).createBounty(1, { value: ethers.utils.parseEther("4") });
  
      await tgb.connect(addr4).createBounty(2, { value: ethers.utils.parseEther("4") });
      await tgb.connect(addr5).createBounty(2, { value: ethers.utils.parseEther("4.5") });
  
      await tgb.connect(addr4).createBounty(3, { value: ethers.utils.parseEther("4") });
      await tgb.connect(addr5).createBounty(3, { value: ethers.utils.parseEther("4.5") });
  
      await tgb.connect(addr4).createBounty(4, { value: ethers.utils.parseEther("3") });
      await tgb.connect(addr5).createBounty(4, { value: ethers.utils.parseEther("3") });
  
      await tgb.connect(addr4).createBounty(5, { value: ethers.utils.parseEther("3") });
      await tgb.connect(addr5).createBounty(5, { value: ethers.utils.parseEther("3") });
  
      // Process posts to simulate consensus decision
      await processPosts();
    });
  
    // Helper to decode the performData
    const decodePerformData = (performData) => {
      return ethers.utils.defaultAbiCoder.decode(
        ["address[]", "uint256[]", "uint256"],
        performData
      );
    };
  
    // Test Case 1: Everyone gets paid equally for an approved outcome
    it("should equally distribute bounty for all participants when the review is approved", async function () {
      const log1 = {
        index: 0,
        timestamp: 1234567890,
        txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
        blockNumber: 1,
        blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
        source: tgc.address,
        topics: [ethers.utils.hexZeroPad(owner.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32)],
        data: "0xabcdef1234567890",
      };
  
      const [upkeepNeeded, performData] = await tgb.checkLog(log1, "0x");
      expect(upkeepNeeded).to.be.true;
  
      const [addresses, amounts, submissionId] = decodePerformData(performData);
      expect(submissionId).to.equal(1);
  
      // Calculate the expected amount per participant
      const expectedAmountPerPerson = ethers.utils.parseEther("3"); // Total of all bounties (3 ETH + 2 ETH)

      const _addrs = [owner.address,addr2.address]
      expect(addresses).to.be.deep.equal(_addrs);
      // Verify each participant receives the expected amount
      amounts.forEach((amount) => {
        expect(amount).to.equal(expectedAmountPerPerson);
      });
    });
  
    // Test Case 2: Everyone gets paid equally for a rejected outcome
    it("should equally distribute bounty for all participants when the review is rejected", async function () {
      const log2 = {
        index: 0,
        timestamp: 1234567890,
        txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
        blockNumber: 1,
        blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
        source: tgc.address,
        topics: [ethers.utils.hexZeroPad(owner.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(2).toHexString(), 32)],
        data: "0xabcdef1234567890",
      };
  
      const [upkeepNeeded, performData] = await tgb.checkLog(log2, "0x");
      expect(upkeepNeeded).to.be.true;
  
      const [addresses, amounts, submissionId] = decodePerformData(performData);
      expect(submissionId).to.equal(2);
  

      // Calculate the expected amount per participant
      const expectedAmountPerPerson = ethers.utils.parseEther("3"); // Total of all bounties (3 ETH + 2 ETH)

      const _addrs = [owner.address,addr3.address]
      expect(addresses).to.be.deep.equal(_addrs);
      // Verify each participant receives the expected amount
      amounts.forEach((amount) => {
        expect(amount).to.equal(expectedAmountPerPerson);
      });
    });
  
    // Test Case 3: Refund the amount of the bounty to the payer
    it("should refund the bounty amount to the payer in UnsetCommunity", async function () {
      const log3 = {
        index: 0,
        timestamp: 1234567890,
        txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
        blockNumber: 1,
        blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
        source: tgc.address,
        topics: [ethers.utils.hexZeroPad(owner.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(3).toHexString(), 32)],
        data: "0xabcdef1234567890",
      };
  
      const [upkeepNeeded, performData] = await tgb.checkLog(log3, "0x");
      expect(upkeepNeeded).to.be.true;
  
      const [addresses, amounts, submissionId] = decodePerformData(performData);
      expect(submissionId).to.equal(3);
  
      // Calculate the expected amount per participant
      const totalBountyAmount = ethers.utils.parseEther("2"); // Total of all bounties (3 ETH + 2 ETH)

      const _addrs = [addr4.address,addr5.address]
      const _amts = [ethers.utils.parseEther("3"),ethers.utils.parseEther("3.5")]
      expect(addresses).to.be.deep.equal(_addrs);
      expect(amounts).to.be.deep.equal(_amts);
    });
  
    // Test Case 4: Only people who accepted get paid
    it("should distribute bounty only to acceptors in NoCommunityFEE", async function () {
      const log4 = {
        index: 0,
        timestamp: 1234567890,
        txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
        blockNumber: 1,
        blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
        source: tgc.address,
        topics: [
            ethers.utils.hexZeroPad(owner.address, 32), 
            ethers.utils.hexZeroPad(ethers.BigNumber.from(4).toHexString(), 32)
        ],
        data: "0xabcdef1234567890",
      };
  
      const [upkeepNeeded, performData] = await tgb.checkLog(log4, "0x");
      expect(upkeepNeeded).to.be.true;
  
      const [addresses, amounts, submissionId] = decodePerformData(performData);
      expect(submissionId).to.equal(4);
  
      // Calculate the expected amount per participant
      const expectedAmountPerPerson = ethers.utils.parseEther("4"); 

      const _addrs = [owner.address]
      expect(addresses).to.be.deep.equal(_addrs);
      // Verify each participant receives the expected amount
      amounts.forEach((amount) => {
        expect(amount).to.equal(expectedAmountPerPerson);
      });
    });
  
    // Test Case 5: Only people who rejected get paid
    it("should distribute bounty only to rejectors in NoCommunityFEE", async function () {
        const log5 = {
            index: 0,
            timestamp: 1234567890,
            txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
            blockNumber: 1,
            blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
            source: tgc.address,
            topics: [
              ethers.utils.hexZeroPad(owner.address, 32), 
              ethers.utils.hexZeroPad(ethers.BigNumber.from(5).toHexString(), 32)
            ],
            data: "0x", // Ensure this matches the expected event format
        };
        
  
      const [upkeepNeeded, performData] = await tgb.checkLog(log5, "0x");
      expect(upkeepNeeded).to.be.true;
  
      const [addresses, amounts, submissionId] = decodePerformData(performData);
      expect(submissionId).to.equal(5);
  
      // Calculate the expected amount per participant
      const expectedAmountPerPerson = ethers.utils.parseEther("4"); // Total of all bounties (3 ETH + 2 ETH)

      const _addrs = [owner.address]
      expect(addresses).to.be.deep.equal(_addrs);
      // Verify each participant receives the expected amount
      amounts.forEach((amount) => {
        expect(amount).to.equal(expectedAmountPerPerson);
      });
    });
  });
  
  describe("PerformUpkeep Tests", function () {
    beforeEach(async function () {
      // Assuming the setup for contracts, communities, members, and posts has been completed in the main setup.
  
      // Create bounties for submissions (1, 3, and 5) by two different users
      await tgb.connect(addr4).createBounty(1, { value: ethers.utils.parseEther("4.5") });
      await tgb.connect(addr5).createBounty(1, { value: ethers.utils.parseEther("4") });
  
      await tgb.connect(addr4).createBounty(3, { value: ethers.utils.parseEther("4") });
      await tgb.connect(addr5).createBounty(3, { value: ethers.utils.parseEther("4.5") });
  
      await tgb.connect(addr4).createBounty(5, { value: ethers.utils.parseEther("3") });
      await tgb.connect(addr5).createBounty(5, { value: ethers.utils.parseEther("3") });
  
      // Process posts to simulate consensus decision
      await processPosts();
  
    });
  
    // Helper to get the balance of an address in ether
    const getBalance = async (address) => {
      return ethers.utils.formatEther(await ethers.provider.getBalance(address));
    };
  
    // Test Case 1: Perform upkeep for an approved scenario
    it("should correctly distribute bounty for the approved outcome in performUpkeep", async function () {
      // Encode the data for performUpkeep
      const performData = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "uint256"],
        [[addr4.address, addr5.address], [ethers.utils.parseEther("2"), ethers.utils.parseEther("2")], 1]
      );
  
      // Capture initial balances of involved addresses
      const initialAddr4Balance = await getBalance(addr4.address);
      const initialAddr5Balance = await getBalance(addr5.address);
  
      // Perform upkeep
      await tgb.connect(owner).performUpkeep(performData);
  
      // Capture final balances
      const finalAddr4Balance = await getBalance(addr4.address);
      const finalAddr5Balance = await getBalance(addr5.address);
  
      // Verify the balances increased by the expected amounts
      expect(parseFloat(finalAddr4Balance)).to.be.closeTo(parseFloat(initialAddr4Balance) + 2.0, 0.01);
      expect(parseFloat(finalAddr5Balance)).to.be.closeTo(parseFloat(initialAddr5Balance) + 2.0, 0.01);
    });
  
    // Test Case 3: Perform upkeep for the refund scenario
    it("should correctly refund the bounty amount to the payers in performUpkeep", async function () {
      // Encode the data for performUpkeep
      const performData = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "uint256"],
        [[addr4.address, addr5.address], [ethers.utils.parseEther("3"), ethers.utils.parseEther("3.5")], 3]
      );
  
      // Capture initial balances of involved addresses
      const initialAddr4Balance = await getBalance(addr4.address);
      const initialAddr5Balance = await getBalance(addr5.address);
  
      // Perform upkeep
      await tgb.connect(owner).performUpkeep(performData);
  
      // Capture final balances
      const finalAddr4Balance = await getBalance(addr4.address);
      const finalAddr5Balance = await getBalance(addr5.address);
  
      // Verify the balances increased by the expected amounts
      expect(parseFloat(finalAddr4Balance)).to.be.closeTo(parseFloat(initialAddr4Balance) + 3.0, 0.00001);
      expect(parseFloat(finalAddr5Balance)).to.be.closeTo(parseFloat(initialAddr5Balance) + 3.5, 0.000001);
    });
  
    // Test Case 5: Perform upkeep for only the rejectors
    it("should correctly distribute bounty only to rejectors in performUpkeep", async function () {
      // Encode the data for performUpkeep
      const performData = ethers.utils.defaultAbiCoder.encode(
        ["address[]", "uint256[]", "uint256"],
        [[owner.address], [ethers.utils.parseEther("4")], 5]
      );
  
      // Capture initial balance of the owner (rejector)
      const initialOwnerBalance = await getBalance(owner.address);
  
      // Perform upkeep
      await tgb.connect(owner).performUpkeep(performData);
  
      // Capture final balance of the owner
      const finalOwnerBalance = await getBalance(owner.address);
  
      // Verify the balance increased by the expected amount
      expect(parseFloat(finalOwnerBalance)).to.be.closeTo(parseFloat(initialOwnerBalance) + 4.0, 0.01);
    });
  });
  
  

  

});
