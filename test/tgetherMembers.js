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
const memberAccessContract =zeroAddress


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
    
    
    await tgm.connect(owner).settgetherCommunities(tgc.address)



    await tgc.connect(owner).createCommunity(communityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime,  proposalDelay, isInviteOnly);


    await tgc.connect(owner).createCommunity(InviteOnlyCommunityName, minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, memberAccessContract, proposalTime,  proposalDelay, !isInviteOnly);

    const communitySaved = await tgc.getCommunityExists(communityName)
    expect(communitySaved).to.be.true

  });


  describe('Add self as Reviewer', () => { 

    it("Should add self as Reviewer", async function() {
      await tgm.connect(addr1).addSelfAsMember(communityName);
      const isMember = await tgm.getIsMember(addr1.address, communityName)
      expect(isMember).to.be.true
    }
    );
    it("Should fail to add self as Reviewer if already part of a community", async function() {
      await tgm.connect(addr1).addSelfAsMember(communityName);
      
      await expect(tgm.connect(addr1).addSelfAsMember(communityName)).to.be.revertedWith("You are already a member of this community.");
    }
    );

    it("Should fail to add self as Reviewer invite only community", async function() {
      await expect(tgm.connect(addr1).addSelfAsMember(InviteOnlyCommunityName)).to.be.revertedWith("You are not invited to this community.");

    }
    );


    it("Should add self as Reviewer invite only community", async function() {


      await tgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await tgm.connect(addr1).addSelfAsMember(communityName);
      const isMember = await tgm.getIsMember(addr1.address, communityName)
      expect(isMember).to.be.true

    }
    );

   });

   describe('Invite Member', async () => {

    it("Should invite member", async function() {
      await tgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      const isInvited = await tgm.connect(owner).getIsInvited(addr1.address,InviteOnlyCommunityName)
      expect(isInvited).to.be.true
    }
    );

    it("Should fail to invite member if not owner", async function() {
      await expect(tgm.connect(addr1).inviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("You dont have permission invite Members");
    }
    );

    it("Should fail to invite member if not invited only", async function() {
      await expect(tgm.connect(owner).inviteMember(communityName, addr1.address )).to.be.revertedWith("This community is not invite only.");
    }
    );

    it("Should fail to invite member if already a member", async function() {
      await tgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await tgm.connect(addr1).addSelfAsMember(InviteOnlyCommunityName);
      await expect(tgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("Member already exists of this community.");
    }
    );

    it("Should fail to invite member if already invited", async function() {
      await tgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await expect(tgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("User Already Invited");
    }
    );


   });


   describe('Uninvite Member', async () => {

    it("Should uninvite member", async function() {
      await tgm.connect(owner).inviteMember(InviteOnlyCommunityName, addr1.address )
      await tgm.connect(owner).uninviteMember(InviteOnlyCommunityName, addr1.address )
      const isInvited = await tgm.connect(owner).getIsInvited(addr1.address,InviteOnlyCommunityName)
      expect(isInvited).to.be.false
    }
    );

    it("Should fail to uninvite member if not owner", async function() {
      await expect(tgm.connect(addr1).uninviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("You dont have permission uninvite Members");
    });

    it("Should fail to uninvite member if not invited only", async function() {
      await expect(tgm.connect(owner).uninviteMember(communityName, addr1.address )).to.be.revertedWith("This community is not invite only.");
    });

    it("Should fail to uninvite member if not invited", async function() {
      await expect(tgm.connect(owner).uninviteMember(InviteOnlyCommunityName, addr1.address )).to.be.revertedWith("Member Not Invited");
    });
   })



   describe('Remove Self as Member', async () => {
      
      it("Should remove self as member", async function() {
        await tgm.connect(addr1).addSelfAsMember(communityName);
        await tgm.connect(addr1).removeSelfAsMember(communityName);
        const isMember = await tgm.getIsMember(addr1.address,communityName)
        expect(isMember).to.be.false
      }
      );
  
      it("Should fail to remove self as member if not member", async function() {
        await expect(tgm.connect(addr1).removeSelfAsMember(communityName)).to.be.revertedWith("You are not a member of this community.");
      }
      );
  

   });

   describe('Add Positive Cred', async () => {
    beforeEach(async function() {

      await tgm.connect(addr1).addSelfAsMember(communityName);
      await tgm.connect(addr2).addSelfAsMember(communityName);

    });

    it("Should add positive cred", async function() {

      await tgm.connect(addr1).addPosCredsToMember(communityName, addr2.address);
      const creds= await tgm.connect(owner).getMemberCreds(addr2.address, communityName);
      expect(creds).to.equal(1);

      const pcreds = await tgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
      expect(pcreds).to.deep.equal([zeroAddress, addr1.address]);
      const ncreds =await tgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
      expect(ncreds).to.deep.equal([zeroAddress]);

    });

    it("Should fail to add positive cred if adder is not a member", async function() {

      await expect(tgm.connect(addr3).addPosCredsToMember(communityName, addr2.address)).to.be.revertedWith("You are not a member.");
    });

    it("Should fail to add positive cred if target is not a member", async function() {
      await expect(tgm.connect(addr2).addPosCredsToMember(communityName, addr3.address)).to.be.revertedWith("Target member DNE");
    });

    it("Should fail to add positive cred if already added", async function() {
      await tgm.connect(addr1).addPosCredsToMember(communityName, addr2.address);
      await expect(tgm.connect(addr1).addPosCredsToMember(communityName, addr2.address)).to.be.revertedWith("You've already given a cred to this member.");
    });

    it("Should fail to add positive cred if target is self", async function() {
      await expect(tgm.connect(addr2).addPosCredsToMember(communityName, addr2.address)).to.be.revertedWith("You cannot edit own creds.");
    });
      
   });

   describe('Add Negative Cred', async () => {
    beforeEach(async function() {

      await tgm.connect(addr1).addSelfAsMember(communityName);
      await tgm.connect(addr2).addSelfAsMember(communityName);

    });

    it("Should add negative cred", async function() {

      await tgm.connect(addr1).addNegCredsToMember(communityName, addr2.address);
      const creds= await tgm.connect(owner).getMemberCreds(addr2.address, communityName);
      expect(creds).to.equal(-1);

      expect (await tgm.connect(owner).getMemberCredIndex(addr2.address, addr1.address, communityName)).to.equal(-1);

      const pcreds = await tgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
      expect(pcreds).to.deep.equal([zeroAddress]);

      const ncreds =await tgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
      expect(ncreds).to.deep.equal([zeroAddress, addr1.address]);

    });

    it("Should fail to add negative cred if adder is not a member", async function() {

      await expect(tgm.connect(addr3).addNegCredsToMember(communityName, addr2.address)).to.be.revertedWith("You are not a member.");
    });

    it("Should fail to add negative cred if target is not a member", async function() {
      await expect(tgm.connect(addr2).addNegCredsToMember(communityName, addr3.address)).to.be.revertedWith("Target member DNE");
    });

    it("Should fail to add negative cred if already added", async function() {
      await tgm.connect(addr1).addNegCredsToMember(communityName, addr2.address);
      await expect(tgm.connect(addr1).addNegCredsToMember(communityName, addr2.address)).to.be.revertedWith("You've already given a cred to this member.");
    });

    it("Should fail to add negative cred if target is self", async function() {
      await expect(tgm.connect(addr2).addNegCredsToMember(communityName, addr2.address)).to.be.revertedWith("You cannot edit own creds.");
    });
      
   });


    describe('Remove Positive Cred', async () => {

      beforeEach(async function() {  
        await tgm.connect(addr1).addSelfAsMember(communityName);
        await tgm.connect(addr2).addSelfAsMember(communityName);
        await tgm.connect(addr3).addSelfAsMember(communityName);
        await tgm.connect(addr4).addSelfAsMember(communityName);

        await tgm.connect(addr5).addSelfAsMember(communityName);
        await tgm.connect(addr1).addPosCredsToMember(communityName, addr2.address);
        await tgm.connect(addr3).addPosCredsToMember(communityName, addr2.address);
        await tgm.connect(addr4).addPosCredsToMember(communityName, addr2.address);

      });



      it("Should remove positive cred", async function() {
        // we removed 1 cred from addr2
        await tgm.connect(addr1).removePosCredsFromMember(communityName, addr2.address);
        const creds= await tgm.connect(owner).getMemberCreds(addr2.address, communityName);
        expect(creds).to.equal(2);

        // addr1 is removed from the list and addr4 has replaced it
        const pcreds = await tgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
        expect(pcreds).to.deep.equal([zeroAddress,  addr4.address, addr3.address,]);


        // check to make sure indexes have been updated correctly
        const giverIndex = await tgm.connect(owner).getMemberCredIndex(addr2.address, addr1.address, communityName);
        expect(giverIndex).to.equal(0);

        const prevLastGiverIndex = await tgm.connect(owner).getMemberCredIndex(addr2.address,addr4.address, communityName);
        expect(prevLastGiverIndex).to.equal(1);


        const ncreds =await tgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
        expect(ncreds).to.deep.equal([zeroAddress]);

      });


      it("Should fail to remove positive cred if adder has not given any", async function() {
        await expect(tgm.connect(addr5).removePosCredsFromMember(communityName, addr2.address)).to.be.revertedWith("You have not given a positive cred to this member yet.");
      });
      it("Should fail to remove positive cred if adder has only given negative", async function() {
        await tgm.connect(addr5).addNegCredsToMember(communityName, addr2.address)
        const negindex = await tgm.connect(owner).getMemberCredIndex(addr2.address, addr5.address, communityName);
        expect(negindex).to.equal(-1);

        
        await expect(tgm.connect(addr5).removePosCredsFromMember(communityName, addr2.address)).to.be.revertedWith("You have not given a positive cred to this member yet.");
      });
      
    });

    describe('Remove Negative Cred', async () => {

      beforeEach(async function() {  
        await tgm.connect(addr1).addSelfAsMember(communityName);
        await tgm.connect(addr2).addSelfAsMember(communityName);
        await tgm.connect(addr3).addSelfAsMember(communityName);
        await tgm.connect(addr4).addSelfAsMember(communityName);

        await tgm.connect(addr5).addSelfAsMember(communityName);
        await tgm.connect(addr1).addNegCredsToMember(communityName, addr2.address);
        await tgm.connect(addr3).addNegCredsToMember(communityName, addr2.address);
        await tgm.connect(addr4).addNegCredsToMember(communityName, addr2.address);

      });



      it("Should remove negative cred", async function() {
        // we removed 1 cred from addr2
        await tgm.connect(addr1).removeNegCredsFromMember(communityName, addr2.address);
        const creds= await tgm.connect(owner).getMemberCreds(addr2.address, communityName);
        expect(creds).to.equal(-2);

        // addr1 is removed from the list and addr4 has replaced it
        const ncreds = await tgm.connect(owner).getMemberNegCredsList(addr2.address, communityName);
        expect(ncreds).to.deep.equal([zeroAddress,  addr4.address, addr3.address,]);


        // check to make sure indexes have been updated correctly
        const giverIndex = await tgm.connect(owner).getMemberCredIndex(addr2.address, addr1.address, communityName);
        expect(giverIndex).to.equal(0);

        const prevLastGiverIndex = await tgm.connect(owner).getMemberCredIndex(addr2.address,addr4.address, communityName);
        expect(prevLastGiverIndex).to.equal(-1);


        const pcreds =await tgm.connect(owner).getMemberPosCredsList(addr2.address, communityName);
        expect(pcreds).to.deep.equal([zeroAddress]);

      });


      it("Should fail to remove positive cred if adder has not given any", async function() {
        await expect(tgm.connect(addr5).removeNegCredsFromMember(communityName, addr2.address)).to.be.revertedWith("Have not given a negative cred yet.");
      });
      it("Should fail to remove positive cred if adder has only given negative", async function() {
        await tgm.connect(addr5).addPosCredsToMember(communityName, addr2.address)
        const posindex = await tgm.connect(owner).getMemberCredIndex(addr2.address, addr5.address, communityName);
        expect(posindex).to.equal(1);

        
        await expect(tgm.connect(addr5).removeNegCredsFromMember(communityName, addr2.address)).to.be.revertedWith("Have not given a negative cred yet.");
      });
      
    });


    describe('Set Creds When Cred Contract', async () => {

      beforeEach(async function() {  
        const MockCredAccess = await ethers.getContractFactory("MOCKCredAccess");
        mca = await MockCredAccess.deploy(tgm.address,"CredCommunity");
        await mca.deployed();


        await tgc.connect(owner).createCommunity("CredCommunity", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, mca.address, proposalTime,  proposalDelay, isInviteOnly);
        await tgc.connect(owner).createCommunity("CredCommunityInvite", minCredsToProposeVote, minCredsToVote, maxCredsCountedForVote, minProposalVotes, mca.address, proposalTime,  proposalDelay, true);

        await tgm.connect(addr1).addSelfAsMember("CredCommunity");

        await tgm.connect(addr2).addSelfAsMember("CredCommunity");
        await tgm.connect(addr1).addSelfAsMember(communityName);

        

      });


      it("Should set creds when cred contract", async function() {

        await mca.connect(addr1).setMemberCred(addr1.address, 1);
        const creds= await tgm.connect(owner).getMemberCreds(addr1.address, "CredCommunity");
        expect(creds).to.equal(1);

      });

      
      it("Should fail to set creds if not the correct community ", async function() {
        await mca.updateCommunity(communityName);
        await expect(mca.connect(owner).setMemberCred(addr1.address, 1)).to.be.revertedWith("Not the cred access contract or User not member");
      });


      
      it("Should fail to allow users to add pos cred when contract is responsible ", async function() {
        await expect(tgm.connect(addr1).addPosCredsToMember("CredCommunity", addr2.address)).to.be.revertedWith("Commmunity Uses a cred access contract");
      });
      it("Should fail to allow users to add neg cred when contract is responsible ", async function() {
        await expect(tgm.connect(addr1).addNegCredsToMember("CredCommunity", addr2.address)).to.be.revertedWith("Commmunity Uses a cred access contract");
      });
      it("Should fail to allow users to remove pos cred when contract is responsible ", async function() {
        await expect(tgm.connect(addr1).removePosCredsFromMember("CredCommunity", addr2.address)).to.be.revertedWith("Community Uses a cred access contract");
      });
      it("Should fail to allow users to remove neg cred when contract is responsible ", async function() {
        await expect(tgm.connect(addr1).removeNegCredsFromMember("CredCommunity", addr2.address)).to.be.revertedWith("Community Uses a cred access contract");
      });

      it("Should allow cred access contract to invite members", async function() {
        await mca.updateCommunity("CredCommunityInvite");
        await mca.connect(owner).inviteMember(addr2.address);
        const isInvited = await tgm.connect(owner).getIsInvited(addr2.address,"CredCommunityInvite")
        expect(isInvited).to.be.true
      });

      it("Should allow cred access contract to uninvite members ", async function() {
        await mca.updateCommunity("CredCommunityInvite");
        await mca.connect(owner).inviteMember(addr2.address);
        const isInvited1 = await tgm.connect(owner).getIsInvited(addr2.address,"CredCommunityInvite")
        expect(isInvited1).to.be.true  
        await mca.connect(owner).uninviteMember(addr2.address);
        const isInvited2 = await tgm.connect(owner).getIsInvited(addr2.address,"CredCommunityInvite")
        expect(isInvited2).to.be.false    
    
    });

    it("Should fail to invite and uninvite for wrong community ", async function() {
      await mca.updateCommunity(communityName);
      await expect(mca.connect(owner).inviteMember(addr3.address)).to.be.revertedWith("You dont have permission invite Members");
      await expect(mca.connect(owner).uninviteMember(addr3.address)).to.be.revertedWith("You dont have permission uninvite Members");

    });
    it("Should fail when an owner tries to update a credaccess controlled community ", async function() {
      await expect(tgm.connect(owner).inviteMember("CredCommunityInvite",addr3.address)).to.be.revertedWith("You dont have permission invite Members");
      await mca.updateCommunity("CredCommunityInvite");
      const ads =await mca.connect(owner).inviteMember(addr3.address);

      await expect(tgm.connect(owner).uninviteMember("CredCommunityInvite", addr3.address)).to.be.revertedWith("You dont have permission uninvite Members");

  });

  });





  
});