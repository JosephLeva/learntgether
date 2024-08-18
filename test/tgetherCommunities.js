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
const zeroAddress = "0x0000000000000000000000000000000000000000";
const memberAccessContract = zeroAddress;

const feeAmount = ethers.utils.parseEther("1"); // Replace "1" with the actual fee amount

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

    const tgetherCom = await ethers.getContractFactory("tgetherCommunities");
    tgc = await tgetherCom.deploy(mockFeePrice, owner.address);
    await tgc.deployed();
    
    await tgm.connect(owner).settgetherCommunities(tgc.address);
    await tgc.connect(owner).settgetherMembersContract(tgm.address);

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
        const _bal = await ethers.provider.getBalance(owner.address)
        await tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001" , proposalTime+1, proposalDelay +1, !isInviteOnly, { value: feeAmount });
        const propType = await tgc.getProposalType(1);
        expect(propType).to.equal(1);
        const [ _minCredsToProposeVote, _minCredsToVote, _maxCredsCountedForVote, _minProposalVotes, _memberAccessContract, _proposalTime, _proposalDelay, _isInviteOnly]= await tgc.CommunityProposals(1);
        const _afterbal = await ethers.provider.getBalance(owner.address)

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
        const _bal = await ethers.provider.getBalance(owner.address)
        await tgc.connect(addr1).CustomProposal(communityName, "0x0000000000000000000000000000000000000001", { value: feeAmount });
        const _afterbal = await ethers.provider.getBalance(owner.address)
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


  describe("Check Upkeep" , function() {
    beforeEach(async function() {
      await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime,  0 /*proposalDelay*/, isInviteOnly);
      await tgm.connect(owner).addSelfAsMember(communityName);
      await tgm.connect(addr1).addSelfAsMember(communityName);
      await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
      await tgm.connect(addr1).addPosCredsToMember(communityName, owner.address);
      await tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001" , proposalTime+1, proposalDelay +1, !isInviteOnly, { value: feeAmount });
      await network.provider.send("evm_increaseTime", [proposalDelay+1]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).vote(1, true);
    });

    it ("Should pass upkeep check", async function() {
      await network.provider.send("evm_increaseTime", [proposalTime]);
      await network.provider.send("evm_mine");
      const [upkeepneeded, performdata] =await tgc.connect(owner).checkUpkeep('0x');
      expect(upkeepneeded).to.be.true;
      
    });

    it ("Should fail upkeep check when time has not passed", async function() {
      const [upkeepneeded, performdata] =await tgc.connect(owner).checkUpkeep('0x');
      expect(upkeepneeded).to.be.false;   
      
    });

    it ("Should have the second proposal be chosen as it is higher priority ", async function() {
      await tgc.connect(owner).createCommunity("2", 0 /* minCredsToProposeVote */ , minCredsToVote, maxCredsCountedForVote, 1 /*minProposalVotes*/, "0x0000000000000000000000000000000000000001", 0 /* Proposal time*/, 0 /*proposalDelay set to 0 for it to evaluate sooner*/, isInviteOnly);
      await tgm.connect(owner).addSelfAsMember("2");
      await tgc.connect(owner).CommunityProposal("2" /* community name */, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001", proposalTime+1, proposalDelay +1, !isInviteOnly, { value: feeAmount });

      await network.provider.send("evm_increaseTime", [proposalDelay+1]);
      await network.provider.send("evm_increaseTime", [proposalTime]);
      await network.provider.send("evm_mine");
      const [upkeepneeded, performdata] =await tgc.connect(owner).checkUpkeep('0x');
      expect(upkeepneeded).to.be.true; 
      expect(performdata).to.equal("0x0000000000000000000000000000000000000000000000000000000000000002"); 
    });


  });


  describe("Perform Upkeep" , function() {
    beforeEach(async function() {
      await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime,  0 /*proposalDelay*/, isInviteOnly);
      await tgm.connect(owner).addSelfAsMember(communityName);
      await tgm.connect(addr1).addSelfAsMember(communityName);
      await tgm.connect(addr2).addSelfAsMember(communityName);
      await tgm.connect(addr3).addSelfAsMember(communityName);
      await tgm.connect(owner).addPosCredsToMember(communityName, addr3.address);
      await tgm.connect(owner).addPosCredsToMember(communityName, addr1.address);
      await tgm.connect(owner).addPosCredsToMember(communityName, addr2.address);
      await tgm.connect(addr1).addPosCredsToMember(communityName, owner.address);
      await tgc.connect(addr1).CommunityProposal(communityName, minCredsToProposeVote+1, minCredsToVote+1, maxCredsCountedForVote+1, minProposalVotes+1,"0x0000000000000000000000000000000000000001" , proposalTime+1, proposalDelay +1, !isInviteOnly, { value: feeAmount });
      await tgc.connect(addr2).CustomProposal(communityName, "0x0000000000000000000000000000000000000001", { value: feeAmount });
      await tgc.connect(addr3).CustomProposal(communityName, "0x0000000000000000000000000000000000000001", { value: feeAmount });

    });

    it ("Should perform upkeep- Comunity Proposal Fails and is removed from active queue", async function() {
      await network.provider.send("evm_increaseTime", [proposalDelay+1]);
      await network.provider.send("evm_increaseTime", [proposalTime]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");
      const [isactive, passed]= await tgc.connect(owner).getProposalResults(1)
      expect(isactive).to.be.false;
      expect(passed).to.be.false;
      
      const index1 = await tgc.connect(owner).getActiveProposalIndex(3);
      expect(index1).to.equal(1);
      const indexold = await tgc.connect(owner).getActiveProposalIndex(1);
      expect(indexold).to.equal(0);

    });



    it ("Should perform upkeep- Community Proposal passes and is removed from active queue", async function() {
      await network.provider.send("evm_increaseTime", [proposalDelay]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).vote(1, true);
      await network.provider.send("evm_increaseTime", [proposalTime]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");
      const [isactive, passed]= await tgc.connect(owner).getProposalResults(1)
      expect(isactive).to.be.false;
      expect(passed).to.be.true;
      
      const index1 = await tgc.connect(owner).getActiveProposalIndex(3);
      expect(index1).to.equal(1);
      const indexold = await tgc.connect(owner).getActiveProposalIndex(2);
      expect(indexold).to.equal(2);

      const[ _owner, _minCredsToProposeVote, _minCredsToVote, _maxCredsCountedForVote, _minProposalVotes,_memberAccessContract, _proposalTime, _proposalDelay, _isInviteOnly] = await tgc.connect(owner).communities(communityName);
      expect(_owner).to.equal(owner.address);
      expect(_minCredsToProposeVote).to.equal(minCredsToProposeVote+1);
      expect(_minCredsToVote).to.equal(minCredsToVote+1);
      expect(_maxCredsCountedForVote).to.equal(maxCredsCountedForVote +1);
      expect(_minProposalVotes).to.equal(minProposalVotes+1);
      expect(_memberAccessContract).to.equal("0x0000000000000000000000000000000000000001");
      expect(_proposalTime).to.equal(proposalTime+1);
      expect(_proposalDelay).to.equal(proposalDelay+1);
      expect(_isInviteOnly).to.equal(!isInviteOnly);
    });

    it ("Should perform upkeep- Custom Proposal passes and is removed from active queue", async function() {
      await network.provider.send("evm_increaseTime", [proposalDelay]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).vote(3, true);
      await network.provider.send("evm_increaseTime", [proposalTime]);
      await network.provider.send("evm_mine");
      await tgc.connect(owner).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000003");
      const [isactive, passed]= await tgc.connect(owner).getProposalResults(3)
      expect(isactive).to.be.false;
      expect(passed).to.be.true;
      

      const indexold = await tgc.connect(owner).getActiveProposalIndex(3);
      expect(indexold).to.equal(0);



    });
  });




});