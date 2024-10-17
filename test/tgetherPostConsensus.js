const { expect } = require("chai");

const communityName = "Cryptogrphy";
const InviteOnlyCommunityName= "SuperSecretCrpytogrphy";
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

describe("tgether Post Consensus Contract", function() {
  let tgr
  let tgs
  let auto;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addrs;

  beforeEach(async function() {
    [owner, auto, addr1, addr2,addr3,addr4,addr5, ...addrs] = await ethers.getSigners();
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


    const tgetherComCon = await ethers.getContractFactory("tgetherCommunityConsensus");
    tgcc = await tgetherComCon.deploy(ccfeeAmount, tgc.address, mockFeePrice, tgf.address );
    await tgcc.deployed();    
    await tgm.connect(owner).settgetherCommunities(tgc.address);
    await tgc.connect(owner).settgetherMembersContract(tgm.address);

    await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
    await tgc.connect(owner).createCommunity("No Consensous Community", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);

    await tgm.connect(owner).addSelfAsMember(communityName);
    await tgm.connect(addr1).addSelfAsMember(communityName);
    await tgm.connect(addr2).addSelfAsMember(communityName);
    await tgm.connect(addr3).addSelfAsMember(communityName);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr3.address);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr2.address);
    await tgm.connect(addr1).addPosCredsToMember(communityName, owner.address);
    await tgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
    await tgcc.connect(owner).setCCParams("No Consensous Community", numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, 0 /* consensusTime */, consensusTypes);

    const tgetherPost = await ethers.getContractFactory("tgetherPosts");
    tgp = await tgetherPost.deploy();
    await tgp.deployed();
    await tgp.connect(addr1).mintPost("endpoint.com/thisisalink", "A test Post", "Joe","this is a test post");   


    const tgetherPostCon = await ethers.getContractFactory("tgetherPostConsensus");
    tgpc = await tgetherPostCon.deploy(tgcc.address, tgm.address, tgp.address, feeAmount );
    await tgcc.deployed();    
   
    // Deploy LaneRegistry with tgetherCommunities as the intakeContract (Step 3)
    const LaneRegistry = await ethers.getContractFactory("LaneRegistry");
    laneRegistry = await LaneRegistry.deploy(tgpc.address);
    await laneRegistry.deployed();

    // Deploy CommunitiesLane with required addresses (Step 4)
    const Lane = await ethers.getContractFactory("PostConsensusLane");
    lane1 = await Lane.deploy(tgf.address, tgpc.address, laneRegistry.address, );
    await lane1.deployed();
    
    await lane1.connect(owner).setForwarder(auto.address);


    // Set required contracts in tgetherCommunities
    await tgpc.connect(owner).setLaneRegistry(laneRegistry.address);


  });

  describe("Community Submission", function() {

    it("Should submit a post to a community with consensus", async function() {
        
        const _balance1 = await ethers.provider.getBalance(tgf.address);

        await tgpc.connect(addr1).submitToCommunity(1, communityName, {value: feeAmount});
        const cs = await tgpc.connect(addr1).getCommunitySubmission(1);
        const _balance2 = await ethers.provider.getBalance(tgf.address);

        expect(cs[0]).to.equal(communityName);
        expect(cs[3]).to.equal(1);
        expect(_balance2).to.equal(_balance1.add(feeAmount));
     });
     it("Should submit a post to a community without consensus", async function() {
        await tgpc.connect(addr1).submitToCommunity(1, "No Consensous Community");
        const cs = await tgpc.connect(addr1).getCommunitySubmission(1);
        expect(cs[0]).to.equal("No Consensous Community");
        expect(cs[3]).to.equal(0);
     });

     it("Should Fail for consensus community without fee", async function() {
        await expect(tgpc.connect(addr1).submitToCommunity(1, communityName)).to.be.revertedWith("Must send proposal fee");

     });

});


describe("Reviews", function() {
    beforeEach(async function() {
        await tgpc.connect(addr1).submitToCommunity(1, communityName, {value: feeAmount});

    });

    it("It should Review a post and accpet", async function() {
        await tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2);
        const review = await tgpc.connect(addr1).getReview(1);
        expect(review[3]).to.equal("Accepted");

    });
    it("It should Review a post and reject custom", async function() {
        await tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 4);
        const review = await tgpc.connect(addr1).getReview(1);
        expect(review[3]).to.equal("Hello");

    });


    it("It should fail going above bounds", async function() {
        await expect(tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 10)).to.be.revertedWith("Consensous Not In Bounds");
    });
    it("It should fail duplicate reviews", async function() {
        await tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2);
        await expect(tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2)).to.be.revertedWith("You've already reviewed this post");

    });

});

describe("PostConsensusLane CheckUpkeep", function() {
    beforeEach(async function() {
        // Submit post to community via lane
        await tgpc.connect(addr1).submitToCommunity(1, communityName, { value: feeAmount });

        // Submit a review for the first post
        await tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thisiscool", 2);
    });

    it("Should not check upkeep because not enough time has passed", async function() {
        // Call checkUpkeep via the lane contract
        const data = await lane1.connect(addr1).checkUpkeep('0x');

        // Verify that upkeep is not needed because time hasn't passed
        expect(data[0]).to.equal(false);
    });

    it("Should check upkeep on first article and accept", async function() {
        // Simulate the passage of time to trigger upkeep
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");

        // Call checkUpkeep via the lane contract after the time has passed
        const data = await lane1.connect(addr1).checkUpkeep('0x');

        // Verify that upkeep is needed and matches the first submission
        expect(data[0]).to.equal(true);
        expect(data[1]).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001");
    });

    it("Should check upkeep on the article and reject", async function() {
        // Submit additional reviews to ensure the post gets rejected
        await tgpc.connect(addr1).submitReview(1, "Endpoint for review.com/thisiscool", 3);
        await tgpc.connect(addr2).submitReview(1, "Endpoint for review.com/thisiscool", 3);

        // Simulate the passage of time to trigger upkeep
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");

        // Call checkUpkeep via the lane contract
        const data = await lane1.connect(addr1).checkUpkeep('0x');

        // Verify that upkeep is needed and the post is rejected
        expect(data[0]).to.equal(true);
        expect(data[1]).to.equal("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    });
});



describe("PostConsensusLane performUpkeep", function() {
    
    beforeEach(async function() {

        // Submit post to community via PostConsensus contract
        await tgpc.connect(addr1).submitToCommunity(1, communityName, { value: feeAmount });

        // Submit a review for the first post
        await tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thisiscool", 2);
    });

    it("Should not perform upkeep because not enough time has passed", async function() {
        // Attempt to perform upkeep through the lane contract with automation forwarder
        await expect(
            lane1.connect(auto).performUpkeep("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        ).to.be.revertedWith("Upkeep not needed for this submission");

        // Verify that the submission has not been updated yet
        const csub = await tgpc.connect(addr1).getCommunitySubmission(1);
        expect(csub.communityName).to.equal(communityName);
        expect(csub.consensus).to.equal(1);  // Still in pending state
    });
    
    it("Should Accept the Submission", async function() {
        // Simulate the passage of time to trigger upkeep
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");

        // Perform upkeep using the automation forwarder
        await lane1.connect(auto).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");

        // Verify that the submission is now accepted
        const csub = await tgpc.connect(addr1).getCommunitySubmission(1);
        expect(csub.communityName).to.equal(communityName);
        expect(csub.consensus).to.equal(2);  // Consensus is now "Accepted"
    });

    it("Should Reject the Submission", async function() {
        // Submit additional reviews to reject the post
        await tgpc.connect(addr1).submitReview(1, "Endpoint for review.com/thisiscool", 3);
        await tgpc.connect(addr2).submitReview(1, "Endpoint for review.com/thisiscool", 3);

        // Simulate the passage of time to trigger upkeep
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");

        // Perform upkeep using the automation forwarder
        await lane1.connect(auto).performUpkeep("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        // Verify that the submission is now rejected
        const csub = await tgpc.connect(addr1).getCommunitySubmission(1);
        expect(csub.communityName).to.equal(communityName);
        expect(csub.consensus).to.equal(3);  // Consensus is now "Rejected"
    });
});


describe("Manual Upkeep", function() {
    beforeEach(async function() {
        // Submitting to community and submitting reviews
        await tgpc.connect(addr1).submitToCommunity(1, communityName, { value: feeAmount });
        await tgpc.connect(owner).submitReview(1, "Endpoint for review.com/thisiscool", 2);
    });

    it("Should not perform manual upkeep on a submission that is not ready (review period not expired)", async function() {
        // Attempt manual upkeep without enough time passing
        await expect(
            tgpc.connect(owner).manualUpkeepPost(1)
        ).to.be.revertedWith("Upkeep not needed for this submission");
    });

    it("Should not perform manual upkeep on an invalid submission ID", async function() {
        // Attempt manual upkeep on a non-existent submission ID
        await expect(
            tgpc.connect(owner).manualUpkeepPost(0)
        ).to.be.revertedWith("Invalid submission ID");
    });

    it("Should perform manual upkeep and accept the submission when conditions are met", async function() {
        // Simulate time passing for the consensus time to expire
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");

        // Manually trigger upkeep
        await tgpc.connect(owner).manualUpkeepPost(1);
        const csub = await tgpc.connect(addr1).getCommunitySubmission(1);

        // Expect the submission to be accepted
        expect(csub[0]).to.equal(communityName);
        expect(csub[3]).to.equal(2);
    });

    it("Should perform manual upkeep and reject the submission if reviews do not meet acceptance criteria", async function() {
        // Submitting additional reviews to ensure rejection
        await tgpc.connect(addr1).submitReview(1, "Endpoint for review.com/thisiscool", 3);
        await tgpc.connect(addr2).submitReview(1, "Endpoint for review.com/thisiscool", 3);

        // Simulate time passing for the consensus time to expire
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");

        // Manually trigger upkeep
        await tgpc.connect(owner).manualUpkeepPost(1);
        const csub = await tgpc.connect(addr1).getCommunitySubmission(1);

        // Expect the submission to be rejected
        expect(csub[0]).to.equal(communityName);
        expect(csub[3]).to.equal(3);
    });

    it("Should prevent manual upkeep with incorrect results encoding", async function() {
        // Simulate time passing
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");

        // Attempt manual upkeep with incorrect submission ID format
        await expect(
            tgpc.connect(owner).manualUpkeepPost(999)
        ).to.be.revertedWith("Submission does not exist or is not active");
    });
});


});