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


describe("Learntgether Reviewers Contract", function() {
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
    
    
    await ltgm.connect(owner).setlearntgetherCommunities(ltgc.address)



    await ltgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, proposalTime,  proposalDelay, isInviteOnly);


    await ltgc.connect(owner).createCommunity(InviteOnlyCommunityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, proposalTime,  proposalDelay, !isInviteOnly);

    const communitySaved = await ltgc.getCommunityExists(communityName)
    expect(communitySaved).to.be.true

  });


  describe('Add self as Reviewer', () => { 

    it("Should add self as Reviewer", async function() {
      await ltgm.connect(addr1).addSelfAsMember(communityName);
      const isMember = await ltgm.getIsMember(addr1.address, communityName)
      expect(isMember).to.be.true
    }
    );
    it("Should fail to add self as Reviewer if already part of a community", async function() {
      await ltgm.connect(addr1).addSelfAsMember(communityName);
      
      await expect(ltgm.connect(addr1).addSelfAsMember(communityName)).to.be.revertedWith("You are already a member of this community.");
    }
    );

    it("Should fail to add self as Reviewer invite only community", async function() {
      await expect(ltgm.connect(addr1).addSelfAsMember(InviteOnlyCommunityName)).to.be.revertedWith("You are not invited to this community.");

    }
    );


    it("Should add self as Reviewer invite only community", async function() {


      await ltgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await ltgm.connect(addr1).addSelfAsMember(communityName);
      const isMember = await ltgm.getIsMember(addr1.address, communityName)
      expect(isMember).to.be.true

    }
    );

   });

   describe('Invite Member', async () => {

    it("Should invite member", async function() {
      await ltgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      const isInvited = await ltgm.connect(owner).getIsInvited(addr1.address,InviteOnlyCommunityName)
      expect(isInvited).to.be.true
    }
    );

    it("Should fail to invite member if not owner", async function() {
      await expect(ltgm.connect(addr1).inviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("You are not the owner of this community.");
    }
    );

    it("Should fail to invite member if not invited only", async function() {
      await expect(ltgm.connect(owner).inviteMember(communityName, addr1.address )).to.be.revertedWith("This community is not invite only.");
    }
    );

    it("Should fail to invite member if already a member", async function() {
      await ltgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await ltgm.connect(addr1).addSelfAsMember(InviteOnlyCommunityName);
      await expect(ltgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("Member already exists of this community.");
    }
    );

    it("Should fail to invite member if already invited", async function() {
      await ltgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await expect(ltgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("User Already Invited");
    }
    );


   });


   describe('Uninvite Member', async () => {

    it("Should uninvite member", async function() {
      await ltgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await ltgm.connect(owner).uninviteMember(InviteOnlyCommunityName, addr1.address )
      const isInvited = await ltgm.connect(owner).getIsInvited(addr1.address,InviteOnlyCommunityName)
      expect(isInvited).to.be.false
    }
    );

    it("Should fail to uninvite member if not owner", async function() {
      await expect(ltgm.connect(addr1).uninviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("You are not the owner of this community.");
    });

    it("Should fail to uninvite member if not invited only", async function() {
      await expect(ltgm.connect(owner).uninviteMember(communityName, addr1.address )).to.be.revertedWith("This community is not invite only.");
    });

    it("Should fail to uninvite member if not invited", async function() {
      await expect(ltgm.connect(owner).uninviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("Member Not Invited");
    });
   })



   describe('Remove Self as Member', async () => {
      
      it("Should remove self as member", async function() {
        await ltgm.connect(addr1).addSelfAsMember(communityName);
        await ltgm.connect(addr1).removeSelfAsMember(communityName);
        const isMember = await ltgm.getIsMember(addr1.address,communityName)
        expect(isMember).to.be.false
      }
      );
  
      it("Should fail to remove self as member if not member", async function() {
        await expect(ltgm.connect(addr1).removeSelfAsMember(communityName)).to.be.revertedWith("You are not a member of this community.");
      }
      );
  

   });

   describe('Add Positive Cred', async () => {
    beforeEach(async function() {

      await ltgm.connect(addr1).addSelfAsMember(communityName);
      await ltgm.connect(addr2).addSelfAsMember(communityName);

    });

    it("Should add positive cred", async function() {

      await ltgm.connect(addr1).addPosCredsToMember(communityName, addr2.address);
      const creds= await ltgm.connect(owner).getMemberCreds(addr2.address, communityName);
      expect(creds).to.equal(1);

      const pcreds = await ltgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
      expect(pcreds).to.deep.equal([zeroAddress, addr1.address]);
      const ncreds =await ltgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
      expect(ncreds).to.deep.equal([zeroAddress]);

    });

    it("Should fail to add positive cred if adder is not a member", async function() {

      await expect(ltgm.connect(addr3).addPosCredsToMember(communityName, addr2.address)).to.be.revertedWith("You are not a member of this community.");
    });

    it("Should fail to add positive cred if target is not a member", async function() {
      await expect(ltgm.connect(addr2).addPosCredsToMember(communityName, addr3.address)).to.be.revertedWith("Target member doesn't exist of this community.");
    });

    it("Should fail to add positive cred if already added", async function() {
      await ltgm.connect(addr1).addPosCredsToMember(communityName, addr2.address);
      await expect(ltgm.connect(addr1).addPosCredsToMember(communityName, addr2.address)).to.be.revertedWith("You've already given a cred to this member.");
    });

    it("Should fail to add positive cred if target is self", async function() {
      await expect(ltgm.connect(addr2).addPosCredsToMember(communityName, addr2.address)).to.be.revertedWith("You cannot edit your own creds.");
    });
      
   });

   describe('Add Negative Cred', async () => {
    beforeEach(async function() {

      await ltgm.connect(addr1).addSelfAsMember(communityName);
      await ltgm.connect(addr2).addSelfAsMember(communityName);

    });

    it("Should add negative cred", async function() {

      await ltgm.connect(addr1).addNegCredsToMember(communityName, addr2.address);
      const creds= await ltgm.connect(owner).getMemberCreds(addr2.address, communityName);
      expect(creds).to.equal(-1);

      expect (await ltgm.connect(owner).getMemberCredIndex(addr2.address, addr1.address, communityName)).to.equal(-1);

      const pcreds = await ltgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
      expect(pcreds).to.deep.equal([zeroAddress]);

      const ncreds =await ltgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
      expect(ncreds).to.deep.equal([zeroAddress, addr1.address]);

    });

    it("Should fail to add negative cred if adder is not a member", async function() {

      await expect(ltgm.connect(addr3).addNegCredsToMember(communityName, addr2.address)).to.be.revertedWith("You are not a member of this community.");
    });

    it("Should fail to add negative cred if target is not a member", async function() {
      await expect(ltgm.connect(addr2).addNegCredsToMember(communityName, addr3.address)).to.be.revertedWith("Target member doesn't exist of this community.");
    });

    it("Should fail to add negative cred if already added", async function() {
      await ltgm.connect(addr1).addNegCredsToMember(communityName, addr2.address);
      await expect(ltgm.connect(addr1).addNegCredsToMember(communityName, addr2.address)).to.be.revertedWith("You've already given a cred to this member.");
    });

    it("Should fail to add negative cred if target is self", async function() {
      await expect(ltgm.connect(addr2).addNegCredsToMember(communityName, addr2.address)).to.be.revertedWith("You cannot edit your own creds.");
    });
      
   });


    describe('Remove Positive Cred', async () => {

      beforeEach(async function() {  
        await ltgm.connect(addr1).addSelfAsMember(communityName);
        await ltgm.connect(addr2).addSelfAsMember(communityName);
        await ltgm.connect(addr3).addSelfAsMember(communityName);
        await ltgm.connect(addr4).addSelfAsMember(communityName);

        await ltgm.connect(addr5).addSelfAsMember(communityName);
        await ltgm.connect(addr1).addPosCredsToMember(communityName, addr2.address);
        await ltgm.connect(addr3).addPosCredsToMember(communityName, addr2.address);
        await ltgm.connect(addr4).addPosCredsToMember(communityName, addr2.address);

      });



      it("Should remove positive cred", async function() {
        // we removed 1 cred from addr2
        await ltgm.connect(addr1).removePosCredsFromMember(communityName, addr2.address);
        const creds= await ltgm.connect(owner).getMemberCreds(addr2.address, communityName);
        expect(creds).to.equal(2);

        // addr1 is removed from the list and addr4 has replaced it
        const pcreds = await ltgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
        expect(pcreds).to.deep.equal([zeroAddress,  addr4.address, addr3.address,]);


        // check to make sure indexes have been updated correctly
        const giverIndex = await ltgm.connect(owner).getMemberCredIndex(addr2.address, addr1.address, communityName);
        expect(giverIndex).to.equal(0);

        const prevLastGiverIndex = await ltgm.connect(owner).getMemberCredIndex(addr2.address,addr4.address, communityName);
        expect(prevLastGiverIndex).to.equal(1);


        const ncreds =await ltgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
        expect(ncreds).to.deep.equal([zeroAddress]);

      });


      it("Should fail to remove positive cred if adder has not given any", async function() {
        await expect(ltgm.connect(addr5).removePosCredsFromMember(communityName, addr2.address)).to.be.revertedWith("You have not given a positive cred to this member yet.");
      });
      it("Should fail to remove positive cred if adder has only given negative", async function() {
        await ltgm.connect(addr5).addNegCredsToMember(communityName, addr2.address)
        const negindex = await ltgm.connect(owner).getMemberCredIndex(addr2.address, addr5.address, communityName);
        expect(negindex).to.equal(-1);

        
        await expect(ltgm.connect(addr5).removePosCredsFromMember(communityName, addr2.address)).to.be.revertedWith("You have not given a positive cred to this member yet.");
      });
      
    });

    describe('Remove Negative Cred', async () => {

      beforeEach(async function() {  
        await ltgm.connect(addr1).addSelfAsMember(communityName);
        await ltgm.connect(addr2).addSelfAsMember(communityName);
        await ltgm.connect(addr3).addSelfAsMember(communityName);
        await ltgm.connect(addr4).addSelfAsMember(communityName);

        await ltgm.connect(addr5).addSelfAsMember(communityName);
        await ltgm.connect(addr1).addNegCredsToMember(communityName, addr2.address);
        await ltgm.connect(addr3).addNegCredsToMember(communityName, addr2.address);
        await ltgm.connect(addr4).addNegCredsToMember(communityName, addr2.address);

      });



      it("Should remove negative cred", async function() {
        // we removed 1 cred from addr2
        await ltgm.connect(addr1).removeNegCredsFromMember(communityName, addr2.address);
        const creds= await ltgm.connect(owner).getMemberCreds(addr2.address, communityName);
        expect(creds).to.equal(-2);

        // addr1 is removed from the list and addr4 has replaced it
        const ncreds = await ltgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
        expect(ncreds).to.deep.equal([zeroAddress,  addr4.address, addr3.address,]);


        // check to make sure indexes have been updated correctly
        const giverIndex = await ltgm.connect(owner).getMemberCredIndex(addr2.address, addr1.address, communityName);
        expect(giverIndex).to.equal(0);

        const prevLastGiverIndex = await ltgm.connect(owner).getMemberCredIndex(addr2.address,addr4.address, communityName);
        expect(prevLastGiverIndex).to.equal(-1);


        const pcreds =await ltgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
        expect(pcreds).to.deep.equal([zeroAddress]);

      });


      it("Should fail to remove positive cred if adder has not given any", async function() {
        await expect(ltgm.connect(addr5).removeNegCredsFromMember(communityName, addr2.address)).to.be.revertedWith("You have not given a negative cred to this member yet.");
      });
      it("Should fail to remove positive cred if adder has only given negative", async function() {
        await ltgm.connect(addr5).addPosCredsToMember(communityName, addr2.address)
        const posindex = await ltgm.connect(owner).getMemberCredIndex(addr2.address, addr5.address, communityName);
        expect(posindex).to.equal(1);

        
        await expect(ltgm.connect(addr5).removeNegCredsFromMember(communityName, addr2.address)).to.be.revertedWith("You have not given a negative cred to this member yet.");
      });
      
    });

  
});