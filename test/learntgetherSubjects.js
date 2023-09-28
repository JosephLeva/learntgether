const { ethers, waffle, network } = require("hardhat");
const { expect } = require("chai");

const subjectName = "Cryptogrphy";
const subjectName2= "Science"
const numReviewsForAcceptance = 1;
const credsNeededForReview = 1;
const percentAcceptsNeeded = 50;
const reviewTime= 2630000
const consenousTypes = ["Hello", "World"]
const minCredsToProposeVote = 1;
const minCredsToVote = 1;
const maxCredsCountedForVote = 10;
const minProposalVotes = 1;
const proposalTime = 2630000;
const proposalDelay= 604800
const mockFeePrice = ethers.utils.parseEther("1"); // Example fee in LINK

describe("Learntgether Subjects Contract", function() {
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

    // Deploy our mock Link contract
    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    mockLinkToken = await MockLinkToken.deploy();
    await mockLinkToken.deployed();

    // Deploy mock automation contract
    const MockAutomationContract = await ethers.getContractFactory("MockAutomationContract");
    mockAutomationContract = await MockAutomationContract.deploy(mockLinkToken.address);
    await mockAutomationContract.deployed();

    
    const LearntgetherRev = await ethers.getContractFactory("learntgetherReviewers");
    ltgr = await LearntgetherRev.deploy();
    await ltgr.deployed();

    const LearntgetherSubj = await ethers.getContractFactory("learntgetherSubjects");
    ltgs = await LearntgetherSubj.deploy(mockLinkToken.address, mockAutomationContract.address, mockFeePrice);
    await ltgs.deployed();
    
    
    await ltgr.connect(owner).setlearntgetherSubjects(ltgs.address)
    await ltgs.connect(owner).setlearntgetherReviewer(ltgr.address)



  });


  describe("createSubject", function() {

    it("Should create a new subject", async function() {

        await ltgs.connect(owner).createSubject(
            subjectName,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            minCredsToProposeVote,
            minCredsToVote,
            maxCredsCountedForVote,
            minProposalVotes,
            proposalTime,
            proposalDelay
        );
        
        const subjectDetails = await ltgs.subjects(subjectName);
        const [
            _owner,
            _numReviewsForAcceptance,
            _credsNeededForReview,
            _percentAcceptsNeeded,
            _reviewTime,
            _minCredsToProposeVote,
            _minCredsToVote,
            _maxCredsCountedForVote,
            _minProposalVotes,
            _proposalTime,
            _proposalDelay
        ] = subjectDetails;


        const _consenousTypes = await ltgs.getSubjectConsensousTypes(subjectName);

        
        expect(_owner).to.equal(owner.address);
        expect(_numReviewsForAcceptance).to.equal(numReviewsForAcceptance);
        expect(_credsNeededForReview).to.equal(credsNeededForReview);
        expect(_percentAcceptsNeeded).to.equal(percentAcceptsNeeded);
        expect(_reviewTime).to.equal(reviewTime);
        expect(_consenousTypes).to.deep.equal(consenousTypes);
        expect(_minCredsToProposeVote).to.equal(minCredsToProposeVote);
        expect(_minCredsToVote).to.equal(minCredsToVote);
        expect(_maxCredsCountedForVote).to.equal(maxCredsCountedForVote);
        expect(_minProposalVotes).to.equal(minProposalVotes);
        expect(_proposalTime).to.equal(proposalTime);
        expect(_proposalDelay).to.equal(proposalDelay);
        


  

      });


    it("Should fail to create duplicate subject a new subject", async function() {

      await ltgs.connect(owner).createSubject(
        subjectName,
        numReviewsForAcceptance,
        credsNeededForReview,
        percentAcceptsNeeded,
        reviewTime,
        consenousTypes,
        minCredsToProposeVote,
        minCredsToVote,
        maxCredsCountedForVote,
        minProposalVotes,
        proposalTime,
        proposalDelay
        );

      await expect(
        ltgs.connect(owner).createSubject(
            subjectName,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            minCredsToProposeVote,
            minCredsToVote,
            maxCredsCountedForVote,
            minProposalVotes,
            proposalTime,
            proposalDelay,
      )).to.be.revertedWith("Subject already exists.");
    });

});




  describe("propose", function() {

    beforeEach(async function() {

        await ltgs.connect(owner).createSubject(
            subjectName,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            minCredsToProposeVote,
            minCredsToVote,
            maxCredsCountedForVote,
            minProposalVotes,
            proposalTime,
            proposalDelay
        )
        await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
        await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
        await ltgr.connect(addr3).addSelfAsReviewer(subjectName);


        await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address); 


        await mockLinkToken.mint(owner.address, ethers.utils.parseEther("1000"));
        await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));

        // Approve link transfer from user to our contract
        await mockLinkToken.connect(addr1).approve(ltgs.address, mockFeePrice)

        });

    it("Should allow a user to propose a vote on a subject", async function() {


        await ltgs.connect(addr1).propose(
        subjectName,
        numReviewsForAcceptance + 1,
        credsNeededForReview + 1,
        percentAcceptsNeeded + 1,
        reviewTime + 1,
        ["Test"],
        minCredsToProposeVote + 1,
        minCredsToVote + 1,
        maxCredsCountedForVote + 1,
        minProposalVotes + 1,
        proposalTime + 1,
        proposalDelay+ 1
        )
  
        const proposalDetails = await ltgs.proposals(1);
        const [
            _proposer,
            _subjectName,
            _numReviewsForAcceptance,
            _credsNeededForReview,
            _percentAcceptsNeeded,
            _reviewTime,
            _minCredsToProposeVote,
            _minCredsToVote,
            _maxCredsCountedForVote,
            _minProposalVotes,
            _proposalTime,
            _proposalDelay
        ] = proposalDetails;

        const _consenousTypes = await ltgs.getPoroposalConesnous(1);
        expect(_proposer).to.equal(addr1.address);
        expect(_subjectName).to.equal(subjectName);
        expect(_numReviewsForAcceptance).to.equal(numReviewsForAcceptance+ 1);
        expect(_credsNeededForReview).to.equal(credsNeededForReview+ 1);
        expect(_percentAcceptsNeeded).to.equal(percentAcceptsNeeded+ 1);
        expect(_reviewTime).to.equal(reviewTime+ 1);
        expect(_consenousTypes).to.deep.equal(["Test"]);
        expect(_minCredsToProposeVote).to.equal(minCredsToProposeVote+ 1);
        expect(_minCredsToVote).to.equal(minCredsToVote+ 1);
        expect(_maxCredsCountedForVote).to.equal(maxCredsCountedForVote+ 1);
        expect(_minProposalVotes).to.equal(minProposalVotes+ 1);
        expect(_proposalTime).to.equal(proposalTime+ 1);
        expect(_proposalDelay).to.equal(proposalDelay+ 1);
        

    });

    it("Should not allow a non-reviewer to create a proposal", async function() {

        await expect(ltgs.connect(owner).propose(          
            subjectName,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+ 1)).to.be.revertedWith("You are not a reviewer for this subject.");
    });


    it("Should not allow reviewers with less than the minimum amount of credits to propose", async function() {

        await expect(ltgs.connect(addr3).propose(          
            subjectName,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+ 1
        )).to.be.revertedWith("Insufficient creds to propose.");

    });

    it("Should not allow a user to create more than 1 proposal", async function() {

        await ltgs.connect(addr1).propose(          
            subjectName,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+ 1
        )

        await expect(ltgs.connect(addr1).propose(          
            subjectName,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+ 1
        )).to.be.revertedWith("User has Open Review, Please wait untill it is processed.");

    });

});






describe("vote", function() {

    beforeEach(async function() {
        // Fund Address
        const mockFeePrice = ethers.utils.parseEther("1");
        await mockLinkToken.mint(owner.address, ethers.utils.parseEther("1000"));
        await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));

        // Approve link transfer from user to our contract
        await mockLinkToken.connect(addr1).approve(ltgs.address, mockFeePrice)


        await ltgs.connect(owner).createSubject(
            subjectName,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            minCredsToProposeVote,
            1, //minCredsToVote
            2, //maxCredsCountedForVote
            minProposalVotes,
            proposalTime,
            0 //proposalDelay,
        );



        // create reviewers
        await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
        await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
        await ltgr.connect(addr3).addSelfAsReviewer(subjectName);
        await ltgr.connect(addr4).addSelfAsReviewer(subjectName);


        // add cred (add2 1, addr 1, addr3 1, addr4 0 )
        
        await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address);
        await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address);
        await ltgr.connect(addr3).addCredsToReviewer(subjectName, addr2.address);
        await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr3.address);


        await ltgs.connect(addr1).propose(          
            subjectName,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+1 );

            
    });

    
    it("Should allow user to approve a proposal", async function() {

        await ltgs.connect(addr3).vote(1, true)
        const [approveV, approveC, denyV, denyC, v] = await ltgs.getProposalVote(addr3.address, 1)



        expect(approveV).to.equal(1);
        expect(approveC).to.equal(1);
        expect(denyV).to.equal(0);
        expect(denyC).to.equal(0);
        expect(v).to.equal(true);

    });
    

    it("Should allow user to deny a proposal ", async function() {

        await ltgs.connect(addr3).vote(1, false)
        const [approveV, approveC, denyV, denyC, v] = await ltgs.getProposalVote(addr3.address, 1)

        expect(approveV).to.equal(0);
        expect(approveC).to.equal(0);
        expect(denyV).to.equal(1);
        expect(denyC).to.equal(1);
        expect(v).to.equal(true);

    });
    it("Should have user creds = max ", async function() {

        await ltgs.connect(addr2).vote(1, false)
        const [approveV, approveC, denyV, denyC, v] = await ltgs.getProposalVote(addr2.address, 1)

        expect(approveV).to.equal(0);
        expect(approveC).to.equal(0);
        expect(denyV).to.equal(1);
        expect(denyC).to.equal(2);
        expect(v).to.equal(true);

    });

    it("Should not allow a vote on an inactive proposal", async function() {
        await ltgs.setProposalInactive(1)
        await expect(ltgs.connect(addr2).vote(1, false)).to.be.revertedWith("Proposal is no longer Active")

    });

    it("Should not allow someone to vote twice", async function() {
        await ltgs.connect(addr2).vote(1, false)
        await expect(ltgs.connect(addr2).vote(1, false)).to.be.revertedWith("You have already voted.")
        await expect(ltgs.connect(addr2).vote(1, true)).to.be.revertedWith("You have already voted.")


    });

    it("Should not allow someone to vote with less than the minumum credits", async function() {
        await expect(ltgs.connect(addr4).vote(1, false)).to.be.revertedWith("Insufficient creds to vote.")

    });


    it("Should have all creds remain 0", async function() { 


        await ltgs.connect(owner).createSubject(
            subjectName2,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            2, //minCredsToProposeVote
            1, //minCredsToVote
            0, //maxCredsCountedForVote
            minProposalVotes,
            proposalTime,
            0 //proposalDelay
            );
        await ltgr.connect(addr1).addSelfAsReviewer(subjectName2);
        await ltgr.connect(addr2).addSelfAsReviewer(subjectName2);
        await ltgr.connect(addr3).addSelfAsReviewer(subjectName2);
        await ltgr.connect(addr4).addSelfAsReviewer(subjectName2);

        // address1: 1c, address2: 3c, address3: 0c

        await ltgr.connect(addr1).addCredsToReviewer(subjectName2, addr2.address);
        await ltgr.connect(addr3).addCredsToReviewer(subjectName2, addr2.address);
        await ltgr.connect(addr3).addCredsToReviewer(subjectName2, addr1.address);



        await mockLinkToken.mint(addr2.address, ethers.utils.parseEther("1000"));

        // Approve link transfer from user to our contract
        await mockLinkToken.connect(addr2).approve(ltgs.address, mockFeePrice)


        await ltgs.connect(addr2).propose(          
            subjectName2,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+ 1);


        await ltgs.connect(addr1).vote(2, false)
        const [approveV, approveC, denyV, denyC, v] = await ltgs.getProposalVote(addr1.address, 2)
        expect(approveV).to.equal(0);
        expect(approveC).to.equal(0);
        expect(denyV).to.equal(1);
        expect(denyC).to.equal(0);
        expect(v).to.equal(true);

    });
    it("Should Revert Delay We are in delay", async function() { 


        await ltgs.connect(owner).createSubject(
            subjectName2,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            0, //minCredsToProposeVote
            0, //minCredsToVote
            0, //maxCredsCountedForVote
            minProposalVotes,
            proposalTime,
            10 //proposalDelay
        );
        await ltgr.connect(addr2).addSelfAsReviewer(subjectName2);

        await mockLinkToken.mint(addr2.address, ethers.utils.parseEther("1000"));

        // Approve link transfer from user to our contract
        await mockLinkToken.connect(addr2).approve(ltgs.address, mockFeePrice)

        await ltgs.connect(addr2).propose(          
            subjectName2,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+ 1);


            await expect(ltgs.connect(addr1).vote(2, false)).to.be.revertedWith("Not Active Voting Time")

    });

    it("Should Revert voting period ended", async function() { 


        await ltgs.connect(owner).createSubject(
            subjectName2,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            0, //minCredsToProposeVote
            0, //minCredsToVote
            0, //maxCredsCountedForVote
            minProposalVotes,
            0, //proposalTime,
            10 //proposalDelay
        );
        await ltgr.connect(addr2).addSelfAsReviewer(subjectName2);

        await mockLinkToken.mint(addr2.address, ethers.utils.parseEther("1000"));

        // Approve link transfer from user to our contract
        await mockLinkToken.connect(addr2).approve(ltgs.address, mockFeePrice)

        await ltgs.connect(addr2).propose(          
            subjectName2,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+ 1);


        await expect(ltgs.connect(addr1).vote(2, false)).to.be.revertedWith("Not Active Voting Time")



        });
    });






describe("checkUpkeep", function() {

    beforeEach(async function() {

        await ltgs.connect(owner).createSubject(
            subjectName,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            minCredsToProposeVote,
            minCredsToVote,
            maxCredsCountedForVote,
            minProposalVotes,
            proposalTime,
            0 //Proposal Delay
        )
        await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
        await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
        await ltgr.connect(addr3).addSelfAsReviewer(subjectName);


        await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address); 


        await mockLinkToken.mint(owner.address, ethers.utils.parseEther("1000"));
        await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));

        // Approve link transfer from user to our contract
        await mockLinkToken.connect(addr1).approve(ltgs.address, mockFeePrice)

        await ltgs.connect(addr1).propose(          
            subjectName,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+1 );

        // Force proposal 2 to come after proposal 1 (not in same second)
        await network.provider.send("evm_increaseTime", [10]);
        await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

        await ltgs.connect(owner).createSubject(
            subjectName2,
            numReviewsForAcceptance,
            credsNeededForReview,
            percentAcceptsNeeded,
            reviewTime,
            consenousTypes,
            0, //minCredsToProposeVote
            0, //minCredsToVote
            0, //maxCredsCountedForVote
            minProposalVotes,
            proposalTime, //proposalTime,
            0 //proposalDelay
            );
        await ltgr.connect(addr2).addSelfAsReviewer(subjectName2);
    
        await mockLinkToken.mint(addr2.address, ethers.utils.parseEther("1000"));

    
        // Approve link transfer from user to our contract
        await mockLinkToken.connect(addr2).approve(ltgs.address, mockFeePrice)
    
        await ltgs.connect(addr2).propose(          
            subjectName2,
            numReviewsForAcceptance + 1,
            credsNeededForReview + 1,
            percentAcceptsNeeded + 1,
            reviewTime + 1,
            ["Test"],
            minCredsToProposeVote + 1,
            minCredsToVote + 1,
            maxCredsCountedForVote + 1,
            minProposalVotes + 1,
            proposalTime + 1,
            proposalDelay+1 )
            
    });

    it("Should retrun false there is no need to do any upkeep", async function() {

        const [upkeepNeeded, data]= await ltgs.checkUpKeep("0x")
        expect(upkeepNeeded).to.be.false
        expect(ethers.BigNumber.from(data)).to.equal(0)


    });

    it("Should retrun true and our proposal id 1- Forced vote end", async function() {
        await network.provider.send("evm_increaseTime", [proposalTime]);
        await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

        const [upkeepNeeded, data]= await ltgs.checkUpKeep("0x")
        expect(upkeepNeeded).to.be.true
        expect(ethers.BigNumber.from(data)).to.equal(1)


    });

    // Needs Dev Functions
    it("Should retrun true and our proposal id 2 as we forced it to be 0", async function() {

        await ltgs.setSubjectProposalTime(subjectName2, 0)
        await network.provider.send("evm_increaseTime", [proposalTime]);
        await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

        const [upkeepNeeded, data]= await ltgs.checkUpKeep("0x")
        expect(upkeepNeeded).to.be.true
        expect(ethers.BigNumber.from(data)).to.equal(2)


    });
    });



  





    describe("performUpkeep", function() {

        beforeEach(async function() {
    
            await ltgs.connect(owner).createSubject(
                subjectName,
                numReviewsForAcceptance,
                credsNeededForReview,
                percentAcceptsNeeded,
                reviewTime,
                consenousTypes,
                minCredsToProposeVote,
                0, //minCredsToVote
                maxCredsCountedForVote,
                2, //minProposalVotes
                proposalTime,
                0 //proposalDelay
            )
    
    
            await ltgs.connect(owner).createSubject(
                subjectName2,
                numReviewsForAcceptance,
                credsNeededForReview,
                percentAcceptsNeeded,
                reviewTime,
                consenousTypes,
                0, //minCredsToProposeVote
                0, //minCredsToProposeVote
                0,//maxCredsCountedForVote
                minProposalVotes,
                proposalTime,
                0 //proposalDelay
                );
        
            await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr3).addSelfAsReviewer(subjectName);
    
            await ltgr.connect(addr1).addSelfAsReviewer(subjectName2);
            await ltgr.connect(addr2).addSelfAsReviewer(subjectName2);
            await ltgr.connect(addr3).addSelfAsReviewer(subjectName2);
            
            await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address);
            await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address);
            await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr3.address);
    
    
            await mockLinkToken.mint(owner.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.mint(addr2.address, ethers.utils.parseEther("1000"));
    
            // Approve link transfer from user to our contract
            await mockLinkToken.connect(addr1).approve(ltgs.address, mockFeePrice)
            await mockLinkToken.connect(addr2).approve(ltgs.address, mockFeePrice)
    
            await ltgs.connect(addr1).propose(          
                subjectName,
                numReviewsForAcceptance + 1,
                credsNeededForReview + 1,
                percentAcceptsNeeded + 1,
                reviewTime + 1,
                ["Test"],
                minCredsToProposeVote + 1,
                minCredsToVote + 1,
                maxCredsCountedForVote + 1,
                minProposalVotes + 1,
                proposalTime + 1,
                proposalDelay+1 );
            
            
                await ltgs.connect(addr2).propose(          
                subjectName2,
                numReviewsForAcceptance + 1,
                credsNeededForReview + 1,
                percentAcceptsNeeded + 1,
                reviewTime + 1,
                ["Test"],
                minCredsToProposeVote + 1,
                minCredsToVote + 1,
                maxCredsCountedForVote + 1,
                minProposalVotes + 1,
                proposalTime + 1,
                proposalDelay+1 );
    
            });
    
    
            it("Should do nothing because noone has voted yet", async function() {
                await network.provider.send("evm_increaseTime", [proposalTime]);
                await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
        
                await ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001");
        
                const [NewnumReviewsForAcceptance, NewcredsNeededForReview,NewpercentAcceptsNeeded]= await ltgs.getSubjectInfo(subjectName)
                expect(NewnumReviewsForAcceptance).to.equal(numReviewsForAcceptance)
        
            });
    
            it("Should do nothing Vote Yes Pass but not time yet ", async function() {
                await ltgs.connect(addr2).vote(1, true)
                await ltgs.connect(addr3).vote(1, true)
    
                await  expect(ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000000")).to.not.be.reverted    
        
            });
    
            it("Should execute through without reverting for 0 ", async function() {
                await ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000000")
        
            });
            it("Should execute through without reverting for proposal that doesnt exsit yet ", async function() {
                await  expect(ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000003")).to.not.be.reverted
                       
            });
    
    
            it("Should have proposal pass, (MAXC!=0)", async function() {
                await ltgs.connect(addr2).vote(1, true)
                await ltgs.connect(addr3).vote(1, true)
    
                await network.provider.send("evm_increaseTime", [proposalTime]);
                await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
                await  ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001")
    
                const [NewnumReviewsForAcceptance, NewcredsNeededForReview,NewpercentAcceptsNeeded]= await ltgs.getSubjectInfo(subjectName)
                expect(NewnumReviewsForAcceptance).to.equal(numReviewsForAcceptance+1)
    
    
                const p1= await ltgs.getActiveProposalIndex(1)
                const p2= await ltgs.getActiveProposalIndex(2)
    
                await expect(p1).to.equal(0)
                await expect(p2).to.equal(1)
    
            });
    
    
            it("Should have proposal pass, (MAXC==0)", async function() {
                await ltgs.connect(addr2).vote(2, true)
                await ltgs.connect(addr3).vote(2, true)
    
                await network.provider.send("evm_increaseTime", [proposalTime]);
                await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
                await  ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000002")
    
                const [NewnumReviewsForAcceptance, NewcredsNeededForReview,NewpercentAcceptsNeeded]= await ltgs.getSubjectInfo(subjectName2)
                expect(NewnumReviewsForAcceptance).to.equal(numReviewsForAcceptance+1)
    
    
                const p1= await ltgs.getActiveProposalIndex(1)
                const p2= await ltgs.getActiveProposalIndex(2)
    
                await expect(p1).to.equal(1)
                await expect(p2).to.equal(0)
    
            });
    
    
            it("Should have proposal pass, (MAXC==0)", async function() {
                await ltgs.connect(addr2).vote(2, true)
                await ltgs.connect(addr3).vote(2, true)
    
                await network.provider.send("evm_increaseTime", [proposalTime]);
                await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
                await  ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000002")
    
                const [NewnumReviewsForAcceptance, NewcredsNeededForReview,NewpercentAcceptsNeeded]= await ltgs.getSubjectInfo(subjectName2)
                expect(NewnumReviewsForAcceptance).to.equal(numReviewsForAcceptance+1)
    
    
                const p1= await ltgs.getActiveProposalIndex(1)
                const p2= await ltgs.getActiveProposalIndex(2)
    
                await expect(p1).to.equal(1)
                await expect(p2).to.equal(0)
    
            });
    
    
            it("Should have proposal fail, (MAXC==0)", async function() {
                await ltgs.connect(addr2).vote(2, false)
                await ltgs.connect(addr3).vote(2, false)
    
                await network.provider.send("evm_increaseTime", [proposalTime]);
                await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
                await  ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000002")
    
                const [NewnumReviewsForAcceptance, NewcredsNeededForReview,NewpercentAcceptsNeeded]= await ltgs.getSubjectInfo(subjectName2)
                expect(NewnumReviewsForAcceptance).to.equal(numReviewsForAcceptance)
    
    
                const p1= await ltgs.getActiveProposalIndex(1)
                const p2= await ltgs.getActiveProposalIndex(2)
    
                await expect(p1).to.equal(1)
                await expect(p2).to.equal(0)
    
            });
    
    
            it("Should have proposal fail, (MAXC==0)", async function() {
                await ltgs.connect(addr2).vote(2, false)
                await ltgs.connect(addr3).vote(2, false)
    
                await network.provider.send("evm_increaseTime", [proposalTime]);
                await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
                await  ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000002")
    
                const [NewnumReviewsForAcceptance, NewcredsNeededForReview,NewpercentAcceptsNeeded]= await ltgs.getSubjectInfo(subjectName2)
                expect(NewnumReviewsForAcceptance).to.equal(numReviewsForAcceptance)
    
    
                const p1= await ltgs.getActiveProposalIndex(1)
                const p2= await ltgs.getActiveProposalIndex(2)
    
                await expect(p1).to.equal(1)
                await expect(p2).to.equal(0)
    
            });
    
            it("Three review cycle", async function() {
                await mockLinkToken.mint(addr3.address, ethers.utils.parseEther("1000"));
    
                // Approve link transfer from user to our contract
                await mockLinkToken.connect(addr3).approve(ltgs.address, mockFeePrice)
                await ltgs.connect(addr3).propose(          
                    subjectName2,
                    numReviewsForAcceptance + 1,
                    credsNeededForReview + 1,
                    percentAcceptsNeeded + 1,
                    reviewTime + 1,
                    ["Test"],
                    minCredsToProposeVote + 1,
                    minCredsToVote + 1,
                    maxCredsCountedForVote + 1,
                    minProposalVotes + 1,
                    proposalTime + 1,
                    proposalDelay+1 );
    
                    
                await ltgs.connect(addr2).vote(1, false)
                await ltgs.connect(addr3).vote(1, false)
    
                await network.provider.send("evm_increaseTime", [proposalTime]);
                await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
                await  ltgs.performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001")
    
    
                const p1= await ltgs.getActiveProposalIndex(1)
                const p2= await ltgs.getActiveProposalIndex(2)
                const p3= await ltgs.getActiveProposalIndex(3)
    
                await expect(p1).to.equal(0)
                await expect(p2).to.equal(2)
                await expect(p3).to.equal(1)
    
            });
    
    
        });

});

