const { expect } = require("chai");

const communityName = "Cryptography";
const InviteOnlyCommunityName = "SuperSecretCryptography";
const minCredsToProposeVote = 1;
const minCredsToVote = 1;
const maxCredsCountedForVote = 10;
const minProposalVotes = 1;
const proposalTime = 2630000;
const proposalDelay = 604800;
const isInviteOnly = false;
const zeroAddress = "0x0000000000000000000000000000000000000000";
const memberAccessContract = zeroAddress;

const feeAmount = ethers.utils.parseEther("1"); // Example fee amount

describe("tgether Communities Contract with Lane Registry", function () {
  let tgc, tgm, tgf, laneRegistry, lane1, owner, addr1, addr2, addr3, addr4, addr5, addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();
    const mockFeePrice = ethers.utils.parseEther("1");

    // Deploy tgetherCommunities (Step 1)
    const tgetherCom = await ethers.getContractFactory("tgetherCommunities");
    tgc = await tgetherCom.deploy(mockFeePrice);
    await tgc.deployed();

    // Deploy tgetherMembers (Mock contract)
    const tgetherMem = await ethers.getContractFactory("tgetherMembers");
    tgm = await tgetherMem.deploy();
    await tgm.deployed();

    // Deploy MOCKFundContract (Step 2 - fund contract)
    const tgetherFund = await ethers.getContractFactory("MOCKFundContract");
    tgf = await tgetherFund.deploy();
    await tgf.deployed();

    // Deploy LaneRegistry with tgetherCommunities as the intakeContract (Step 3)
    const LaneRegistry = await ethers.getContractFactory("LaneRegistry");
    laneRegistry = await LaneRegistry.deploy(tgc.address);
    await laneRegistry.deployed();

    // Deploy CommunitiesLane with required addresses (Step 4)
    const Lane = await ethers.getContractFactory("CommunitiesLane");
    lane1 = await Lane.deploy(tgf.address, tgc.address, laneRegistry.address);
    await lane1.deployed();


    // Set required contracts in tgetherCommunities
    await tgc.connect(owner).settgetherMembersContract(tgm.address);
    await tgm.connect(owner).settgetherCommunities(tgc.address);
    await tgc.connect(owner).setLaneRegistryContract(laneRegistry.address);
  });


  describe("Community Creation", function() {

    it("Should create a community", async function() {
        await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
        const communitySaved = await tgc.getCommunityExists(communityName)
        expect(communitySaved).to.be.true
    });
    it("Should fail to create a community that already exsists", async function() {
      await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
      
      await expect(tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, proposalDelay, isInviteOnly)).to.be.revertedWith("Community already exists.")
    });

  });

  describe("Community Proposal Creation", function() {
      beforeEach(async function() {
        await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
        await tgm.connect(owner).addSelfAsMember(communityName);
        await tgm.connect(addr1).addSelfAsMember(communityName);
        await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
  
      });
  
      it ("Should create a Community Proposals", async function() {
        const _bal = await ethers.provider.getBalance(tgf.address)
        await tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001" , proposalTime+1, proposalDelay +1, !isInviteOnly, { value: feeAmount });
        const propType = await tgc.getProposalType(1);
        expect(propType).to.equal(1);
        const [ _minCredsToProposeVote, _minCredsToVote, _maxCredsCountedForVote, _minProposalVotes, _memberAccessContract, _proposalTime, _proposalDelay, _isInviteOnly]= await tgc.CommunityProposals(1);
        const _afterbal = await ethers.provider.getBalance(tgf.address)

        expect(_minCredsToProposeVote).to.equal(minCredsToProposeVote +1);
        expect(_minCredsToVote).to.equal(minCredsToVote +1);
        expect(_maxCredsCountedForVote).to.equal(maxCredsCountedForVote+1);
        expect(_minProposalVotes).to.equal(minProposalVotes+1);
        expect(_memberAccessContract).to.equal("0x0000000000000000000000000000000000000001")
        expect(_proposalTime).to.equal(proposalTime+1);
        expect(_proposalDelay).to.equal(proposalDelay+1);
        expect(_isInviteOnly).to.equal(!isInviteOnly);
        expect( _afterbal).to.equal(_bal.add(feeAmount));
  
        
      });
  
      it("Should fail to create a Community Proposal when not a member", async function() {
        await expect(tgc.connect(addr2).CommunityProposal(communityName,minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001", proposalTime+1, proposalDelay +1, { value: feeAmount })).to.be.revertedWith("You are not a member for this community.");
      });
  
      it("Should fail to create a Community Proposal when not enough fee", async function() {
        await expect(tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001" , proposalTime+1, proposalDelay +1, { value: feeAmount.sub(1) })).to.be.revertedWith('Must send proposal fee');
      });
  
    });  



    describe("Custom Proposal Creation", function() {
      beforeEach(async function() {
        await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
        await tgm.connect(owner).addSelfAsMember(communityName);
        await tgm.connect(addr1).addSelfAsMember(communityName);
        await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
  
      });
  
      it ("Should create a Custom Proposals", async function() {
        const _bal = await ethers.provider.getBalance(tgf.address)
        await tgc.connect(addr1).CustomProposal(communityName, "0x0000000000000000000000000000000000000001", { value: feeAmount });
        const _afterbal = await ethers.provider.getBalance(tgf.address)
        const propType = await tgc.getProposalType(1);
        expect(propType).to.equal(2);
        const customprop = await tgc.CustomProposals(1);
        expect(customprop).to.equal("0x0000000000000000000000000000000000000001")

        expect( _afterbal).to.equal(_bal.add(feeAmount));

        
      });
  
      it("Should fail to create a Custom Proposal when not a member", async function() {
        await expect(tgc.connect(addr2).CustomProposal(communityName, "0x0000000000000000000000000000000000000000", { value: feeAmount })).to.be.revertedWith("You are not a member for this community.");
      });
  
      it("Should fail to create a Custom Proposal when not enough fee", async function() {
        await expect(tgc.connect(addr1).CustomProposal(communityName, "0x0000000000000000000000000000000000000000", { value: feeAmount.sub(1) })).to.be.revertedWith('Must send proposal fee');
      });
  
    });
  


    describe("Vote Creation", function() {
      beforeEach(async function() {
        await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime,  0 /*proposalDelay*/, isInviteOnly);
        await tgm.connect(owner).addSelfAsMember(communityName);
        await tgm.connect(addr1).addSelfAsMember(communityName);
        await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
        await tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001" , proposalTime+1, proposalDelay +1, !isInviteOnly, { value: feeAmount });
      });
  
      it ("Should create a Community Vote", async function() {
        
        await tgc.connect(addr1).vote(1, true);
        const [_approveVotes, _approveCreds, _denyVotes, _denyCreds, _vote] = await tgc.getProposalVote(addr1.address, 1);
        expect(_vote).to.equal(true);
        
      });
  
      it("Should fail to create a Community Vote when not a member", async function() {
        await expect(tgc.connect(addr2).vote(1, true)).to.be.revertedWith("You are not a member of this community.");
      });
  
      it("Should fail to create a Community Vote when member has already voted", async function() {
        await tgc.connect(addr1).vote(1, true);
        await expect(tgc.connect(addr1).vote(1, true)).to.be.revertedWith('You have already voted.');
      });
  
      it("Should fail to create a Vote when user does not have enough creds", async function() {
        await expect( tgc.connect(owner).vote(1, true)).to.be.revertedWith("Insufficient creds to vote.");
      });
  
      it( "Should fail to create a Vote when proposal is not open", async function() {
        // after delay
        await network.provider.send("evm_increaseTime", [proposalTime+10]);
        await expect(tgc.connect(addr1).vote(1, true)).to.be.revertedWith("Not Active Voting Time");
        // before delay (need new proposal)
        await tgc.connect(owner).createCommunity("2", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, proposalDelay, isInviteOnly);
        await tgm.connect(owner).addSelfAsMember("2");
        await tgm.connect(addr1).addSelfAsMember("2");
        await tgm.connect(addr1).addPosCredsToMember("2", owner.address);
        await tgc.connect(owner).CommunityProposal("2", minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001",  proposalTime+1, proposalDelay +1, !isInviteOnly, { value: feeAmount });
        await expect(tgc.connect(owner).vote(1, true)).to.be.revertedWith("Not Active Voting Time");
  
      });
    });


    describe("Check Upkeep in Lane" , function() {
      beforeEach(async function() {
          // Create Community
          await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, 0 /*proposalDelay*/, isInviteOnly);
          
          // Add members to the community
          await tgm.connect(owner).addSelfAsMember(communityName);
          await tgm.connect(addr1).addSelfAsMember(communityName);
          
          // Give positive creds to member
          await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
          await tgm.connect(addr1).addPosCredsToMember(communityName, owner.address);
          
          // Create Community Proposal
          await tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1, "0x0000000000000000000000000000000000000001", proposalTime+1, proposalDelay+1, !isInviteOnly, { value: feeAmount });
          
          // Increase time for proposal delay and mine block
          await network.provider.send("evm_increaseTime", [proposalDelay+1]);
          await network.provider.send("evm_mine");
          
          // Vote on proposal
          await tgc.connect(owner).vote(1, true);
      });
  
      it ("Should pass upkeep check in the lane", async function() {
          // Increase time for proposal time and mine block
          await network.provider.send("evm_increaseTime", [proposalTime]);
          await network.provider.send("evm_mine");
          
          // Perform upkeep check within the lane contract
          const [upkeepNeeded, performData] = await lane1.connect(owner).checkUpkeep('0x');
          
          // Expect upkeep to be needed
          expect(upkeepNeeded).to.be.true;
      });
  
      it ("Should fail upkeep check when time has not passed", async function() {
          // Check upkeep within the lane contract before time has passed
          const [upkeepNeeded, performData] = await lane1.connect(owner).checkUpkeep('0x');
          
          // Expect no upkeep needed as the time hasn't passed
          expect(upkeepNeeded).to.be.false;   
      });
  
      it ("Should choose the second proposal as higher priority for upkeep", async function() {
          // Create second community and proposal with earlier upkeep time
          await tgc.connect(owner).createCommunity("2", 0 /* minCredsToProposeVote */, minCredsToVote, maxCredsCountedForVote, 1 /*minProposalVotes*/, "0x0000000000000000000000000000000000000001", 0 /* Proposal time*/, 0 /*proposalDelay*/, isInviteOnly);
          await tgm.connect(owner).addSelfAsMember("2");
          await tgc.connect(owner).CommunityProposal("2", minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1, "0x0000000000000000000000000000000000000001", proposalTime+1, proposalDelay+1, !isInviteOnly, { value: feeAmount });
          
          // Increase time for both proposals and mine block
          await network.provider.send("evm_increaseTime", [proposalDelay+1]);
          await network.provider.send("evm_increaseTime", [proposalTime]);
          await network.provider.send("evm_mine");
          
          // Check upkeep within the lane contract
          const [upkeepNeeded, performData] = await lane1.connect(owner).checkUpkeep('0x');
          
          // Expect upkeep needed and the performData to match the second proposal
          expect(upkeepNeeded).to.be.true;
          expect(performData).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002"); 
      });
  });
  
  describe("Perform Upkeep in Lane", function() {
    beforeEach(async function() {
        // Create Community
        await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime, 0 /*proposalDelay*/, isInviteOnly);
        
        // Add members to the community
        await tgm.connect(owner).addSelfAsMember(communityName);
        await tgm.connect(addr1).addSelfAsMember(communityName);
        await tgm.connect(addr2).addSelfAsMember(communityName);
        await tgm.connect(addr3).addSelfAsMember(communityName);
        
        // Add creds to members
        await tgm.connect(owner).addPosCredsToMember(communityName, addr3.address);
        await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
        await tgm.connect(owner).addPosCredsToMember(communityName, addr2.address);
        await tgm.connect(addr1).addPosCredsToMember(communityName, owner.address);
        
        // Create proposals
        await tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1, "0x0000000000000000000000000000000000000001", proposalTime+1, proposalDelay+1, !isInviteOnly, { value: feeAmount });
        await tgc.connect(addr2).CustomProposal(communityName, "0x0000000000000000000000000000000000000001", { value: feeAmount });
        await tgc.connect(addr3).CustomProposal(communityName, "0x0000000000000000000000000000000000000001", { value: feeAmount });
    });

    it("Should perform upkeep - Community Proposal fails, update registry length and proposal array", async function() {
        await network.provider.send("evm_increaseTime", [proposalDelay+1]);
        await network.provider.send("evm_increaseTime", [proposalTime]);
        await network.provider.send("evm_mine");

        let _id = await laneRegistry.laneAddresses(lane1.address);
        let _updatedLaneLength = await laneRegistry.laneMap(_id);
        expect(_updatedLaneLength.laneLength).to.equal(3);  // One proposal should be removed

        // Perform upkeep in lane1 contract
        await lane1.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");

        // Check that proposal 1 is no longer active
        const [isactive, passed] = await tgc.connect(owner).getProposalResults(1);
        expect(isactive).to.be.false;
        expect(passed).to.be.false;

        let id = await laneRegistry.laneAddresses(lane1.address);
        let updatedLaneLength = await laneRegistry.laneMap(id);
        expect(updatedLaneLength.laneLength).to.equal(2);  // One proposal should be removed


        // Check the proposal array in lane1 is updated correctly
        const remainingProposal1 = await lane1.connect(owner).getProposalByIndex(0);
        const remainingProposal2 = await lane1.connect(owner).getProposalByIndex(1);
        expect(remainingProposal1).to.equal(3);  // Proposal 2 should now be at index 0
        expect(remainingProposal2).to.equal(2);  // Proposal 3 should now be at index 1

        // Check that proposal 1's index is removed
        await expect(lane1.connect(owner).getProposalIndex(1)).to.be.revertedWith("Proposal does not exist");
    });

    it("Should perform upkeep - Community Proposal passes, update registry length and proposal array", async function() {
        await network.provider.send("evm_increaseTime", [proposalDelay]);
        await network.provider.send("evm_mine");

        // Vote on proposal
        await tgc.connect(owner).vote(1, true);
        
        // Increase time for proposal
        await network.provider.send("evm_increaseTime", [proposalTime]);
        await network.provider.send("evm_mine");

        // Perform upkeep in lane1 contract
        await lane1.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");

        // Check that proposal 1 is no longer active and passed
        const [isactive, passed] = await tgc.connect(owner).getProposalResults(1);
        expect(isactive).to.be.false;
        expect(passed).to.be.true;

        // Verify that the lane registry has the correct updated length
        let id = await laneRegistry.laneAddresses(lane1.address);
        let updatedLaneLength = await laneRegistry.laneMap(id);
        expect(updatedLaneLength.laneLength).to.equal(2);  // One proposal should be removed


        // Check the proposal array in lane1 is updated correctly
        const remainingProposal1 = await lane1.connect(owner).getProposalByIndex(0);
        const remainingProposal2 = await lane1.connect(owner).getProposalByIndex(1);
        expect(remainingProposal1).to.equal(3);  // Proposal 2 should now be at index 0
        expect(remainingProposal2).to.equal(2);  // Proposal 3 should now be at index 1
    });

    it("Should perform upkeep - Custom Proposal passes, update registry length and proposal array", async function() {
        await network.provider.send("evm_increaseTime", [proposalDelay]);
        await network.provider.send("evm_mine");

        // Vote on custom proposal
        await tgc.connect(owner).vote(3, true);
        
        // Increase time for custom proposal
        await network.provider.send("evm_increaseTime", [proposalTime]);
        await network.provider.send("evm_mine");

        // Perform upkeep in lane1 contract for the custom proposal
        await lane1.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000003");

        // Check that proposal 3 is no longer active and passed
        const [isactive, passed] = await tgc.connect(owner).getProposalResults(3);
        expect(isactive).to.be.false;
        expect(passed).to.be.true;

        // Verify that the lane registry has the correct updated length
        let id = await laneRegistry.laneAddresses(lane1.address);
        let updatedLaneLength = await laneRegistry.laneMap(id);
        expect(updatedLaneLength.laneLength).to.equal(2);  // One proposal should be removed

        // Check that proposal 3 is removed from the active queue
        await expect(lane1.connect(owner).getProposalIndex(3)).to.be.revertedWith("Proposal does not exist");
    });
});




});