const { expect } = require("chai");

const subjectName = "Cryptogrphy";
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

    // Deploy our mock Link contract
    const MockLinkToken = await ethers.getContractFactory("MockLinkToken");
    mockLinkToken = await MockLinkToken.deploy();
    await mockLinkToken.deployed();

    // Deploy mock automation contract
    const MockAutomationContract = await ethers.getContractFactory("MockAutomationContract");
    mockAutomationContract = await MockAutomationContract.deploy(mockLinkToken.address);
    await mockAutomationContract.deployed();

    const mockFeePrice = ethers.utils.parseEther("1"); // Example fee in LINK
    
    const LearntgetherRev = await ethers.getContractFactory("learntgetherReviewers");
    ltgr = await LearntgetherRev.deploy();
    await ltgr.deployed();

    const LearntgetherSubj = await ethers.getContractFactory("learntgetherSubjects");
    ltgs = await LearntgetherSubj.deploy(mockLinkToken.address, mockAutomationContract.address, mockFeePrice);
    await ltgs.deployed();
    
    
    await ltgr.connect(owner).setlearntgetherSubjects(ltgs.address)



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
    const subjectsaved = await ltgs.getSubjectExists(subjectName)
    expect(subjectsaved).to.be.true



  });


  describe("addSelfAsReviewer", function() {

    it("Should allow a user to add themselves as a reviewer", async function() {
        await ltgr.connect(owner).addSelfAsReviewer(subjectName);

        const isReviewer = await ltgr.connect(owner).getIsReviewer(owner.address, subjectName);
        expect(isReviewer).to.equal(true);
    });


    it("Should not allow a user to add themselves as a reviewer if they're already a reviewer", async function() {
        await ltgr.connect(addr1).addSelfAsReviewer(subjectName);


        await expect(
            ltgr.connect(addr1).addSelfAsReviewer(
                subjectName
            )
        ).to.be.revertedWith("You are already a reviewer for this subject.");
    });


    it("Should not allow a user to add themselves as a reviewer for a non-existent subject", async function() {
        await expect(
            ltgr.connect(addr1).addSelfAsReviewer(
                "NonExistentSubject",
            )
        ).to.be.revertedWith("Subject Does not Exist");
    });


  });


  describe("removeSelfAsReviewer", function() {
    it("Should allow a reviewer to remove themselves", async function() {

        // Assuming the owner has already added themselves as a reviewer for the subject
        await ltgr.connect(owner).addSelfAsReviewer(subjectName);

        // Now, let's remove the owner as a reviewer
        await ltgr.connect(owner).removeSelfAsReviewer(subjectName);

        // Fetch the reviewer's info for the subject
        const isReviewer = await ltgr.getIsReviewer(owner.address, subjectName);
        
        // Check if the reviewer is no longer active for the subject
        expect(isReviewer).to.equal(false);
    });   
    it("Should Fail reviewer is not part of a Subject", async function() {
        await expect(ltgr.connect(owner).removeSelfAsReviewer(subjectName)).to.be.revertedWith('You are not a reviewer for this subject.');


    });   

    });

    describe("Add Info", function() {
        it("Should allow a reviewer to add information about themself", async function() {

            // Assuming the owner has already added themselves as a reviewer for the subject
            await ltgr.connect(owner).updateReviewerInfo("Joe", "Joe is testing if the description works", ["SUNY Geneseo Math", "Some Other Degree"], ['Im so certified', "the most"]);

            const[ myName, myDescription, myDegrees, myCerts] = await ltgr.connect(owner).getReviewerInfo(owner.address)

            // Check if the reviewer is no longer active for the subject
            expect(myName).to.equal("Joe");
            expect(myDescription).to.equal("Joe is testing if the description works");
            expect(myDegrees[0]).to.equal("SUNY Geneseo Math");
            expect(myDegrees[1]).to.equal("Some Other Degree");
            expect(myCerts[0]).to.equal("Im so certified");
            expect(myCerts[1]).to.equal("the most");
        });   
    });


    describe("addCredsToReviewer", function() {
        beforeEach(async function() {
          await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
          await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
      });
    
        it("Should allow a reviewer to add creds to another reviewer", async function() {
    
          // Allow addr1 to add creds to addr2
          await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address);
    
          // Fetch the creds of addr2 and check if they've increased
          const creds = await ltgr.getReviewerCreds(addr2.address, subjectName);
          expect(creds).to.equal(1);
      });
      it("Should allow a reviewer Index check", async function() {
    
        // Allow addr1 to add creds to addr2
        await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address);
  
        const l =await ltgr.getReviewerCredsList(addr2.address, subjectName);
        expect(l).to.deep.equal([ethers.constants.AddressZero,addr1.address])

        expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr1.address, subjectName )).to.equal(1)


        });
    
          it("Should not allow adding creds for a non-existent subject", async function() {
              await expect(ltgr.connect(addr1).addCredsToReviewer("NonExistentSubject", addr2.address)).to.be.revertedWith("Subject Does Not Exist");
          });
    
          it("Should not allow adding creds to a non-existent reviewer", async function() {
              await expect(ltgr.connect(addr1).addCredsToReviewer(subjectName, owner.address)).to.be.revertedWith("Target reviewer doesn't exist for this subject.");
          });
    
          it("Should not allow a reviewer to add creds to themselves", async function() {
              await expect(ltgr.connect(addr1).addCredsToReviewer(subjectName, addr1.address)).to.be.revertedWith("You cannot edit your own creds.");
          });
    
          it("Should not allow a reviewer to add creds to another reviewer more than once", async function() {
              await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address);
              await expect(ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address)).to.be.revertedWith("You've already given a cred to this reviewer.");
          });
      });


      describe("removeCredsFromReviewer", function() {
        beforeEach(async function() {
          // Create a subject before each test
          await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
          await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
          await ltgr.connect(addr3).addSelfAsReviewer(subjectName);
          await ltgr.connect(addr4).addSelfAsReviewer(subjectName);
          await ltgr.connect(addr5).addSelfAsReviewer(subjectName);

          await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address);
    
      });
    
    
        it("Should allow a reviewer to remove creds from another reviewer", async function() {
            
            // Assuming addr1 and addr2 have already been added as reviewers for the subject
            // and addr1 has given creds to addr2
    
            await ltgr.connect(addr1).removeCredsFromReviewer(subjectName, addr2.address);
            
            const creds = await ltgr.getReviewerCreds(addr2.address, subjectName);
            expect(creds).to.equal(0); // Assuming initial creds were 1 and now they are removed
            const l =await ltgr.getReviewerCredsList(addr2.address, subjectName);
            expect(l).to.deep.equal([ethers.constants.AddressZero])
        });


        it("Should allow a reviewer to remove creds from another with 2 ", async function() {
            
            // Assuming addr1 and addr2 have already been added as reviewers for the subject
            // and addr1 has given creds to addr2
            await ltgr.connect(addr3).addCredsToReviewer(subjectName, addr2.address);
            await ltgr.connect(addr1).removeCredsFromReviewer(subjectName, addr2.address);

            const creds = await ltgr.getReviewerCreds(addr2.address, subjectName);
            expect(creds).to.equal(1); // Assuming initial creds were 1 and now they are removed
            const l =await ltgr.getReviewerCredsList(addr2.address, subjectName);

            expect(l).to.deep.equal([ethers.constants.AddressZero,addr3.address])
        });


        it("Should allow a reviewer to remove creds from another with 4. Adress in gap - swap and pop ", async function() {
            
            // Assuming addr1 and addr2 have already been added as reviewers for the subject
            // and addr1 has given creds to addr2
            await ltgr.connect(addr3).addCredsToReviewer(subjectName, addr2.address);
            await ltgr.connect(addr4).addCredsToReviewer(subjectName, addr2.address);
            await ltgr.connect(addr5).addCredsToReviewer(subjectName, addr2.address);
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr3.address, subjectName )).to.equal(2)
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr4.address, subjectName )).to.equal(3)
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr5.address, subjectName )).to.equal(4)


            await ltgr.connect(addr3).removeCredsFromReviewer(subjectName, addr2.address);

            const creds = await ltgr.getReviewerCreds(addr2.address, subjectName);
            expect(creds).to.equal(3); // Assuming initial creds were 1 and now they are removed
            const l =await ltgr.getReviewerCredsList(addr2.address, subjectName);

            expect(l).to.deep.equal([ethers.constants.AddressZero,addr1.address,addr5.address,addr4.address])
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr3.address, subjectName )).to.equal(0)
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr4.address, subjectName )).to.equal(3)
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr5.address, subjectName )).to.equal(2)


        });
    

        it("Should allow a reviewer to remove creds. Last in list, does not efffect anyone else. ", async function() {
            
    
            await ltgr.connect(addr3).addCredsToReviewer(subjectName, addr2.address);
            await ltgr.connect(addr4).addCredsToReviewer(subjectName, addr2.address);
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr3.address, subjectName )).to.equal(2)
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr4.address, subjectName )).to.equal(3)


            await ltgr.connect(addr4).removeCredsFromReviewer(subjectName, addr2.address);

            const creds = await ltgr.getReviewerCreds(addr2.address, subjectName);
            expect(creds).to.equal(2); // Assuming initial creds were 1 and now they are removed
            const l =await ltgr.getReviewerCredsList(addr2.address, subjectName);

            expect(l).to.deep.equal([ethers.constants.AddressZero,addr1.address,addr3.address])
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr3.address, subjectName )).to.equal(2)
            expect(await ltgr.connect(addr3).getReviewerCredIndex(addr2.address,addr4.address, subjectName )).to.equal(0)


        });

        it("Should not allow a reviewer to remove creds when none were given", async function() {
            // assumes add2 has never given cred to addr1
            await expect(
                ltgr.connect(addr2).removeCredsFromReviewer(subjectName, addr1.address)
            ).to.be.revertedWith("You have not given a cred to this reviewer yet.");
        });
    
        it("Should not allow a reviewer to remove creds from themselves", async function() {
            await expect(
                ltgr.connect(addr1).removeCredsFromReviewer(subjectName, addr1.address)
            ).to.be.revertedWith("You cannot edit your own creds.");
        });
    
        it("Should not allow removal of creds for a non-existing subject", async function() {
            await expect(
                ltgr.connect(addr1).removeCredsFromReviewer("Astrology", addr2.address)
            ).to.be.revertedWith("Subject Does Not Exist");
        });
    
        it("Should not allow a non-reviewer to remove creds", async function() {            
            await expect(
                ltgr.connect(owner).removeCredsFromReviewer(subjectName, addr2.address)
            ).to.be.revertedWith("You are not a reviewer for this subject.");
        });
    
      });





});