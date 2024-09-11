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

describe("tgether Reviewers Contract", function() {
  let tgr
  let tgs
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
    
    const tgetherMem = await ethers.getContractFactory("tgetherMembers");
    tgm = await tgetherMem.deploy();
    await tgm.deployed();

    const tgetherFund = await ethers.getContractFactory("MOCKFundContract");
    tgf = await tgetherFund.deploy();
    await tgf.deployed();

    const tgetherCom = await ethers.getContractFactory("tgetherCommunities");
    tgc = await tgetherCom.deploy(mockFeePrice, tgf.address);
    await tgc.deployed();


    const tgetherComCon = await ethers.getContractFactory("tgetherCommunityConsensus");
    tgcc = await tgetherComCon.deploy(ccfeeAmount, tgc.address, mockFeePrice, tgf.address );
    await tgcc.deployed();    
    await tgm.connect(owner).settgetherCommunities(tgc.address);
    await tgc.connect(owner).settgetherMembersContract(tgm.address);

    await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes,memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
    await tgm.connect(owner).addSelfAsMember(communityName);
    await tgm.connect(addr1).addSelfAsMember(communityName);
    await tgm.connect(addr2).addSelfAsMember(communityName);
    await tgm.connect(addr3).addSelfAsMember(communityName);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr3.address);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
    await tgm.connect(owner).addPosCredsToMember(communityName, addr2.address);
    await tgm.connect(addr1).addPosCredsToMember(communityName, owner.address);


  });


  describe("Community Creation", function() {

    it("Should allow owner of community to set inital values", async function() {
      await tgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
      const ccParams = await tgcc.connect(owner).getCCParams(communityName);
      expect(ccParams[0]).to.equal(numReviewsForAcceptance);
      expect(ccParams[1]).to.equal(credsNeededForReview);
      expect(ccParams[2]).to.equal(percentAcceptsNeeded);
      expect(ccParams[3]).to.equal(consensusTime);
      expect(ccParams[4]).to.deep.equal(consensusTypes);
      expect(ccParams[5]).to.be.true
    });

    it("Should fail to set a CCParam after nitial", async function() {
      await tgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
      await expect(tgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes)).to.be.revertedWith("Community Consensus Parameters already set");
    });

  });

  describe("CreateCCProposal", function() {

    it("Should allow a member to create a CCProposal", async function() {

    
      await tgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
      const _balance = await ethers.provider.getBalance(tgf.address);
      const prop = await tgcc.connect(addr1).CreateCCProposal(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes, { value: feeAmount.add(ccfeeAmount) });
      const _afterbal = await ethers.provider.getBalance(tgf.address);

      expect(_afterbal).to.equal(_balance.add(feeAmount.add(ccfeeAmount)));

      const proposal = await tgc.connect(owner).proposals(1)
      expect(proposal[3]).to.equal(2);
      
      const checkcustom = await tgc.connect(owner).CustomProposals(1)
      expect(checkcustom).to.equal(tgcc.address);
    });
    it("Should fail to allow a member to create a CCProposal with only CommunityFee", async function() {
      await tgcc.connect(owner).setCCParams(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes);
      await expect(tgcc.connect(addr1).CreateCCProposal(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes, { value: feeAmount })).to.be.revertedWith("Fee price not sent");

    });
    
    it("Should check to make sure the proposer owns the proposal", async function() {
      await tgcc.connect(owner).setCCParams(
        communityName,
        numReviewsForAcceptance,
        credsNeededForReview,
        percentAcceptsNeeded,
        consensusTime,
        consensusTypes
      );
    
      // Create the proposal
      await tgcc.connect(addr1).CreateCCProposal(
        communityName,
        numReviewsForAcceptance,
        credsNeededForReview,
        percentAcceptsNeeded,
        consensusTime,
        consensusTypes,
        { value: feeAmount.add(ccfeeAmount) }
      );
    
      // Fetch the proposal
      const proposal = await tgc.proposals(1); // Assuming the first proposal has ID 1
    
      // Check if the proposer address is correct
      expect(proposal.proposer).to.equal(addr1.address);
        });

  });


  describe("Check Log", function() {  
    beforeEach(async function() {

      const prop = await tgcc.connect(addr1).CreateCCProposal(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes, { value: feeAmount.add(ccfeeAmount) });
    });

    it("Should return proporsal true and proposal id 1 from the checkLog function", async function () {
      // Call the checkLog function with the appropriate parameters
      const result = await tgcc.checkLog(
        {
          index: 0,
          timestamp: 1234567890,
          txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
          blockNumber: 1,
          blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
          source: tgc.address,
          topics: [ethers.utils.hexZeroPad(tgcc.address, 32), ethers.utils.hexZeroPad(tgcc.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32)],
          data: "0xabcdef1234567890",
        },
        "0x"
      );

      expect(result[0]).to.equal(true);
      expect(result[1]).to.equal(ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32));

    });

    it("Should return proporsal false because contract is different", async function () {
      // Call the checkLog function with the appropriate parameters
      const result = await tgcc.checkLog(
        {
          index: 0,
          timestamp: 1234567890,
          txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
          blockNumber: 1,
          blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
          source: tgc.address,
          topics: [ethers.utils.hexZeroPad(zeroAddress, 32), /* wrong address*/ ethers.utils.hexZeroPad(tgc.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32)],
          data: "0xabcdef1234567890",
        },
        "0x"
      );
      expect(result[0]).to.equal(false);
      expect(result[1]).to.equal(ethers.utils.hexZeroPad(ethers.BigNumber.from(1).toHexString(), 32));

    });

    it("Should return proporsal false because proposalisnt right is different", async function () {
      // Call the checkLog function with the appropriate parameters
      const result = await tgcc.checkLog(
        {
          index: 0,
          timestamp: 1234567890,
          txHash: ethers.utils.formatBytes32String("0x1234567890abcdef"),
          blockNumber: 1,
          blockHash: ethers.utils.formatBytes32String("0xabcdef1234567890"),
          source: tgc.address,
          topics: [ethers.utils.hexZeroPad(zeroAddress, 32), ethers.utils.hexZeroPad(tgcc.address, 32), ethers.utils.hexZeroPad(ethers.BigNumber.from(2).toHexString(), 32)],
          data: "0xabcdef1234567890",
        },
        "0x"
      );

      expect(result[0]).to.equal(false);
      expect(result[1]).to.equal(ethers.utils.hexZeroPad(ethers.BigNumber.from(2).toHexString(), 32));

    });

  });



  describe("Pefrorm Upkeep" , function() {  

    beforeEach(async function() {

      const prop = await tgcc.connect(addr1).CreateCCProposal(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes, { value: feeAmount.add(ccfeeAmount) });
      const prop2 = await tgcc.connect(owner).CreateCCProposal(communityName, numReviewsForAcceptance, credsNeededForReview, percentAcceptsNeeded, consensusTime, consensusTypes, { value: feeAmount.add(ccfeeAmount) });

      await network.provider.send("evm_increaseTime", [proposalDelay]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).vote(1, true);
      await tgc.connect(owner).vote(2, false);
      await network.provider.send("evm_increaseTime", [proposalTime]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");
      await tgc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000002");

      const[act1, res1] = await tgc.connect(owner).getProposalResults(1);
      const[act2, res2] = await tgc.connect(owner).getProposalResults(2);
      expect(act1).to.be.false;
      expect(res1).to.be.true;
      expect(act2).to.be.false;
      expect(res2).to.be.false;

    });

      it("Should succesfully update for a passed proposal", async function () {
        await tgcc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");
        const ccParams = await tgcc.connect(owner).getCCParams(communityName);
        expect(ccParams[0]).to.equal(numReviewsForAcceptance);
        expect(ccParams[1]).to.equal(credsNeededForReview);
        expect(ccParams[2]).to.equal(percentAcceptsNeeded);
        expect(ccParams[3]).to.equal(consensusTime);
        expect(ccParams[4]).to.deep.equal(consensusTypes);
        expect(ccParams[5]).to.be.true

        const propparams= await tgcc.connect(owner).CommunityConsensusProposals(1);

        expect(propparams[6]).to.be.true;

        expect(propparams[7]).to.be.true;


      });


      it("Should not update proposal failed", async function () {
        await tgcc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000002");
        const ccParams = await tgcc.connect(owner).getCCParams(communityName);
        expect(ccParams[0]).to.equal(0);
        expect(ccParams[1]).to.equal(0);
        expect(ccParams[2]).to.equal(0);
        expect(ccParams[3]).to.equal(0);
        expect(ccParams[4]).to.deep.equal([]);
        expect(ccParams[5]).to.be.false
        

        const propparams= await tgcc.connect(owner).CommunityConsensusProposals(2);

        expect(propparams[6]).to.be.true;

        expect(propparams[7]).to.be.false;
      });







  });



});