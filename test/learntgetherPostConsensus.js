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

describe("Learntgether Post Consensus Contract", function() {
  let ltgr
  let ltgs
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addr5;
  let addrs;

  beforeEach(async function() {
    [owner, addr1, addr2,addr3,addr4,addr5, ...addrs] = await ethers.getSigners();
    const mockFeePrice = ethers.utils.parseEther("1"); // Example fee 
    
    const LearntgetherMem = await ethers.getContractFactory("learntgetherMembers");
    ltgm = await LearntgetherMem.deploy();
    await ltgm.deployed();

    const LearntgetherCom = await ethers.getContractFactory("learntgetherCommunities");
    ltgc = await LearntgetherCom.deploy(mockFeePrice, owner.address);
    await ltgc.deployed();


    const LearntgetherComCon = await ethers.getContractFactory("learntgetherCommunityConsensus");
    ltgcc = await LearntgetherComCon.deploy(ccfeeAmount, ltgc.address, mockFeePrice, addr5.address );
    await ltgcc.deployed();    
    await ltgm.connect(owner).setlearntgetherCommunities(ltgc.address);
    await ltgc.connect(owner).setlearntgetherMembersContract(ltgm.address);

    await ltgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
    await ltgc.connect(owner).createCommunity("No Consensous Community", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);

    await ltgm.connect(owner).addSelfAsMember(communityName);
    await ltgm.connect(addr1).addSelfAsMember(communityName);
    await ltgm.connect(addr2).addSelfAsMember(communityName);
    await ltgm.connect(addr3).addSelfAsMember(communityName);
    await ltgm.connect(owner).addPosCredsToMember(communityName, addr3.address);
    await ltgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
    await ltgm.connect(owner).addPosCredsToMember(communityName, addr2.address);
    await ltgm.connect(addr1).addPosCredsToMember(communityName, owner.address);
    await ltgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
    await ltgcc.connect(owner).setCCParams("No Consensous Community", numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, 0 /* consensusTime */, consensusTypes);

    const LearntgetherPost = await ethers.getContractFactory("learntgetherPosts");
    ltgp = await LearntgetherPost.deploy();
    await ltgp.deployed();
    await ltgp.connect(addr1).mintPost("endpoint.com/thisisalink", "A test Post", "Joe","this is a test post");   


    const LearntgetherPostCon = await ethers.getContractFactory("learntgetherPostConsensus");
    ltgpc = await LearntgetherPostCon.deploy(ltgcc.address, ltgm.address, ltgp.address, feeAmount, addr5.address );
    await ltgcc.deployed();    


  });

  describe("Community Submission", function() {

    it("Should submit a post to a community with consensus", async function() {
        
        const _balance1 = await ethers.provider.getBalance(addr5.address);

        await ltgpc.connect(addr1).submitToCommunity(1, communityName, {value: feeAmount});
        const cs = await ltgpc.connect(addr1).getCommunitySubmission(1);
        const _balance2 = await ethers.provider.getBalance(addr5.address);

        expect(cs[0]).to.equal(communityName);
        expect(cs[1]).to.equal("Consensous Pending");
        expect(_balance2).to.equal(_balance1.add(feeAmount));
     });
     it("Should submit a post to a community without consensus", async function() {
        await ltgpc.connect(addr1).submitToCommunity(1, "No Consensous Community");
        const cs = await ltgpc.connect(addr1).getCommunitySubmission(1);
        expect(cs[0]).to.equal("No Consensous Community");
        expect(cs[1]).to.equal("No Consensous");
     });

     it("Should Fail for consensus community without fee", async function() {
        await expect(ltgpc.connect(addr1).submitToCommunity(1, communityName)).to.be.revertedWith("Must send proposal fee");

     });

});


describe("Reviews", function() {
    beforeEach(async function() {
        await ltgpc.connect(addr1).submitToCommunity(1, communityName, {value: feeAmount});

    });

    it("It should Review a post and accpet", async function() {
        await ltgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2);
        const review = await ltgpc.connect(addr1).getReview(1);
        expect(review[3]).to.equal("Accepted");

    });
    it("It should Review a post and reject custom", async function() {
        await ltgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 4);
        const review = await ltgpc.connect(addr1).getReview(1);
        expect(review[3]).to.equal("Hello");

    });


    it("It should fail going above bounds", async function() {
        await expect(ltgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 10)).to.be.revertedWith("Consensous Not In Bounds");
    });
    it("It should fail duplicate reviews", async function() {
        await ltgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2);
        await expect(ltgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2)).to.be.revertedWith("You've already reviewed this post");

    });

});

describe("CheckUpkeep", function() {

    beforeEach(async function() {
        await ltgpc.connect(addr1).submitToCommunity(1, communityName, {value: feeAmount});
        await ltgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2);

    });

    it("Should not check upkeep because not enough time has passed", async function() {
        
       const data=  await ltgpc.connect(addr1).checkUpkeep();
       expect(data[0]).to.equal(false)
    });

    it("Should check upkeep on first article and accept", async function() {
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");
        const data=  await ltgpc.connect(addr1).checkUpkeep();
        expect(data[0]).to.equal(true)
        expect(data[1]).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001")
     });
     it("Should check upkeep on the article and reject", async function() {

        await ltgpc.connect(addr1).submitReview(1, "Endpoint for review.com/thissicool", 3);
        await ltgpc.connect(addr2).submitReview(1, "Endpoint for review.com/thissicool", 3);
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");
        const data=  await ltgpc.connect(addr1).checkUpkeep();
        expect(data[0]).to.equal(true)
        expect(data[1]).to.equal("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
     });
});


describe("performUpkeep", function() {
    beforeEach(async function() {
        await ltgpc.connect(addr1).submitToCommunity(1, communityName, {value: feeAmount});
        await ltgpc.connect(owner).submitReview(1, "Endpoint for review.com/thissicool", 2);
    });

    it("Should not perform upkeep because not enough time has passed", async function() {
        await ltgpc.connect(owner).performUpkeep("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const csub = await ltgpc.connect(addr1).getCommunitySubmission(1);
        expect(csub[0]).to.equal(communityName);
        expect(csub[1]).to.equal("Consensous Pending"); 
    });
    
    it("Should Accept the Submission", async function() {
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");
        await ltgpc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");
        const csub = await ltgpc.connect(addr1).getCommunitySubmission(1);
        expect(csub[0]).to.equal(communityName);
        expect(csub[1]).to.equal("Accepted"); 
    });

            
    it("Should Reject the Submission", async function() {
        await network.provider.send("evm_increaseTime", [consensusTime]);
        await network.provider.send("evm_mine");
        await ltgpc.connect(owner).performUpkeep("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        const csub = await ltgpc.connect(addr1).getCommunitySubmission(1);
        expect(csub[0]).to.equal(communityName);
        expect(csub[1]).to.equal("Rejected"); 
    });
});

});