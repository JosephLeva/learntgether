const { ethers, waffle, network } = require("hardhat");
const { expect } = require("chai");

const subjectName = "Cryptogrphy";
const subjectName2= "Science"
const numReviewsForAcceptance = 2;
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

const ipfsHash = "QmSomeHash";
const title = "Test Article";
const authorName = "Alice";
const description = "This is a test article";


function toTwosComplement(value) {
    const inputValue = ethers.BigNumber.from(value);
    if (inputValue.isNegative()) {
        const NEGATIVE_ONE = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
        return NEGATIVE_ONE.add(inputValue).add(1);
    } else {
        // For positive numbers, return the number itself.
        return inputValue;
    }
}


describe("Learntgether Articles Contract", function() {
  let ltgr
  let ltgs
  let ltga
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

    const LearntgetherArt = await ethers.getContractFactory("learntgetherArticles");
    ltga = await LearntgetherArt.deploy(ltgs.address,ltgr.address, mockAutomationContract.address, mockLinkToken.address, mockFeePrice);
    await ltga.deployed();


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
    await ltgs.connect(owner).createSubject(
        subjectName2,
        numReviewsForAcceptance,
        credsNeededForReview,
        33,//percentAcceptsNeeded
        0, //reviewTime
        [],//consenousTypes
        minCredsToProposeVote,
        minCredsToVote,
        maxCredsCountedForVote,
        minProposalVotes,
        proposalTime,
        proposalDelay
        );

        await ltga.setMaxReviews(5);



  });

  describe("Minting Articles", function() {

    it("Should mint an article successfully No Review", async function() {

        // We should not need to mint or approve for subject2

        await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName2);

        const article = await ltga.articles(1); // Assuming 1 is the first token ID
        expect(article.ipfsHash).to.equal(ipfsHash);
        expect(article.title).to.equal(title);
        expect(article.authorName).to.equal(authorName);
        expect(article.description).to.equal(description);
        expect(article.subjectName).to.equal(subjectName2);
        const con = await ltga.getArticleConsesous(1)
        expect(con).to.equal("No Review")
        const l = await ltga.getActiveReviewsLength()
        expect(l).to.equal(1)
    });

    it("Should mint an article successfully (ReviewTime>0)", async function() {
        
        // We  need to mint or approve for subject1
        await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
        await mockLinkToken.connect(addr1).approve(ltga.address, mockFeePrice)

        await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName);

        const article = await ltga.articles(1); // Assuming 1 is the first token ID
        expect(article.ipfsHash).to.equal(ipfsHash);
        expect(article.title).to.equal(title);
        expect(article.authorName).to.equal(authorName);
        expect(article.description).to.equal(description);
        expect(article.subjectName).to.equal(subjectName);
        const con = await ltga.getArticleConsesous(1)
        expect(con).to.equal("Review Pending")
        const l = await ltga.getActiveReviewsLength()
        expect(l).to.equal(2)
    });

    it("Should fail to mint an article successfully due to not approving link transfer (ReviewTime>0)", async function() {
        await expect(ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName)).to.be.revertedWith('Insufficient balance')
    });
    
    it("Should fail to mint due to subject not exsisting", async function() {
    await expect(ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, "Astrology")).to.be.revertedWith('Subject Does Not Exist')
    });

    it("Should fail to mint the same ipfshash twice for the same subject", async function() {
       await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName2)
       await expect(ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName2)).to.be.revertedWith("IPFS hash already used with this Subject")
        });
    it("Should fail to mint the same ipfshash twice for the same subject", async function() {
        await expect(ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, "Astrology")).to.be.revertedWith("Subject Does Not Exist")
        });

    });


    describe("Reviewing Articles", function() {
        beforeEach(async function() {
    
            await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.connect(addr1).approve(ltga.address, mockFeePrice)
            await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName);
            await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName2);
            
            await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr3).addSelfAsReviewer(subjectName2);


        })
        it("Should submit a review for an existing article", async function() {
            const ipfsHashReview = "QmReviewHash";
            const consensous = 2; // Assuming 1 is a valid consensous value
            const articleId = 1; // Assuming 1 is the ID of an existing article

            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);

            // Assuming you have a function to retrieve reviews for an article
            const reviews = await ltga.getReviewsForArticle(articleId);
            const review = await ltga.reviews(reviews[0])
            expect(review.ipfsHash).to.equal(ipfsHashReview);
            expect(review.consensous).to.equal(consensous);
            expect(review.consensousType).to.equal("Accepted");     
    

        });
        it("Should fail to allow a non reviewer to review ", async function() {
            const ipfsHashReview = "QmReviewHash";
            const consensous = 1; // Assuming 1 is a valid consensous value
            const articleId = 1; // Assuming 1 is the ID of an existing article


            await expect(ltga.connect(addr3).submitReview(articleId, ipfsHashReview, consensous)).to.be.revertedWith("Reviewer Does Not Exist For this subject");
  

        });

        it("Should fail when submitting a review for a non-existent article", async function() {
            const ipfsHashReview = "QmReviewHash2";
            const consensous = 1;
            const nonExistentArticleId = 9999;

            await expect(ltga.connect(addr1).submitReview(nonExistentArticleId, ipfsHashReview, consensous)).to.be.revertedWith("Article does not exist");
        });

        it("Should fail when submitting a review with consensous 0", async function() {
            const ipfsHashReview = "QmReviewHash3";
            const consensous = 0;
            const articleId = 1;

            // Assuming addr3 doesn't have enough creds
            await expect(ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous)).to.be.reverted; // Adjust the revert message if you have a specific one
        });
        it("Should fail when submitting a review with consensous > possible options", async function() {
            const ipfsHashReview = "QmReviewHash3";
            const consensous = 5;
            const articleId = 2;

            // Assuming addr3 doesn't have enough creds
            await expect(ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous)).to.be.reverted; // Adjust the revert message if you have a specific one
        });
        it("Should fail to allow someone to submit a second review to an article", async function() {
            const ipfsHashReview = "QmReviewHash3";
            const consensous = 1;
            const articleId = 2;


            ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);
            // Assuming addr3 doesn't have enough creds
            await expect(ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous)).to.be.reverted; // Adjust the revert message if you have a specific one
  
        });

        it("Should submit a review with a custom consesnous type", async function() {
            const ipfsHashReview = "QmReviewHash3";
            const consensous = 5;
            const articleId = 1;

            // Assuming addr3 doesn't have enough creds
            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);

            // Assuming you have a function to retrieve reviews for an article
            const reviews = await ltga.getReviewsForArticle(articleId);
            const review = await ltga.reviews(reviews[0])
            expect(review.ipfsHash).to.equal(ipfsHashReview);
            expect(review.consensous).to.equal(consensous);
            expect(review.consensousType).to.equal("World");     
         

        
        });
        it("Should submit multiple reviews", async function() {
            const ipfsHashReview = "QmReviewHash3";
            const consensous = 5;
            const articleId = 1;

            // Assuming addr3 doesn't have enough creds
            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);
            await ltga.connect(addr2).submitReview(articleId, ipfsHashReview, consensous);

            // Assuming you have a function to retrieve reviews for an article
            const reviews = await ltga.getReviewsForArticle(articleId);
            expect(reviews).to.be.deep.equals([1,2])
            const counter = await ltga.reviewCounter();
            expect(counter).to.equal(3)

        
        });



    });



    describe("CheckUpkeep", function() {

        
        beforeEach(async function() {
    
            await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.connect(addr1).approve(ltga.address, mockFeePrice)
            await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName);
            await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName2);
            
            await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr3).addSelfAsReviewer(subjectName2);


        })

        it("Should Return false 0 as no reviews have been passed", async function() {
            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.false
            expect(ethers.BigNumber.from(data)).to.equal(0)


        
        });  
        
        it("Should Return false 0 Not enough time passed", async function() {
            const ipfsHashReview = "QmReviewHash";
            const consensous = 2; // Assuming 1 is a valid consensous value
            const articleId = 1; // Assuming 1 is the ID of an existing article
            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);
            await ltga.connect(addr2).submitReview(articleId, ipfsHashReview, consensous);
            
            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.false
            expect(ethers.BigNumber.from(data)).to.equal(0)


        
        });   
        
        it("Should Return true -3 new subject has lower review time", async function() {
            const ipfsHashReview = "QmReviewHash";
            const consensous = 2; // Assuming 1 is a valid consensous value
            const articleId = 1; // Assuming 1 is the ID of an existing article
            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);
            await ltga.connect(addr2).submitReview(articleId, ipfsHashReview, consensous);
            await ltgs.connect(owner).createSubject(
                "Subject3",
                numReviewsForAcceptance,
                credsNeededForReview,
                percentAcceptsNeeded,
                reviewTime-100,
                consenousTypes,
                minCredsToProposeVote,
                minCredsToVote,
                maxCredsCountedForVote,
                minProposalVotes,
                proposalTime,
                proposalDelay
                );
            await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.connect(addr1).approve(ltga.address, mockFeePrice)       
            await ltga.connect(addr1).mintArticle(ipfsHash, "TEST", authorName, description, "Subject3");


                // 1 and 3 are ready but 3 is earlier 
            await network.provider.send("evm_increaseTime", [proposalTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect


            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.true
            const negativeOneInTwosComplement = toTwosComplement(-3);
            expect(ethers.BigNumber.from(data)).to.equal(negativeOneInTwosComplement);

        
        }); 

        it("Should Return true -1 Enough time passed, but not enough reviews", async function() {
            const ipfsHashReview = "QmReviewHash";
            const consensous = 1; // Assuming 1 is a valid consensous value
            const articleId = 1; // Assuming 1 is the ID of an existing article
            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);
            await network.provider.send("evm_increaseTime", [proposalTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.true
            const negativeOneInTwosComplement = toTwosComplement(-1);
            expect(ethers.BigNumber.from(data)).to.equal(negativeOneInTwosComplement);


        
        });   

        it("Should Return true -1 Enough time passed, but reviews fails", async function() {
            const ipfsHashReview = "QmReviewHash";
            const consensous = 2; // Assuming 1 is a valid consensous value
            const articleId = 1; // Assuming 1 is the ID of an existing article
            await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address); 
            await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address); 



            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, consensous);
            await ltga.connect(addr2).submitReview(articleId, ipfsHashReview, consensous);

            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.true
            const negativeOneInTwosComplement = toTwosComplement(-1);
            expect(ethers.BigNumber.from(data)).to.equal(negativeOneInTwosComplement);

        
        });   

        it("Should Return true -1 Enough time passed, The only accepting review does not have enough creds", async function() {
            const ipfsHashReview = "QmReviewHash";
            const articleId = 1; // Assuming 1 is the ID of an existing article
            await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address); 



            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, 2);
            await ltga.connect(addr2).submitReview(articleId, ipfsHashReview, 1);


            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.true
            const negativeOneInTwosComplement = toTwosComplement(-1);
            expect(ethers.BigNumber.from(data)).to.equal(negativeOneInTwosComplement);

        
        });   
        it("Should Return true 1 Enough time passed, Reviews accepted", async function() {
            const ipfsHashReview = "QmReviewHash";
            const articleId = 1; // Assuming 1 is the ID of an existing article
            await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address); 
            await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address); 



            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, 1);
            await ltga.connect(addr2).submitReview(articleId, ipfsHashReview, 1);

            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.true
            expect(ethers.BigNumber.from(data)).to.equal(1);

        
        });   

        it("Should Return true -1 Enough time passed, Reviews reject", async function() {
            const ipfsHashReview = "QmReviewHash";
            const articleId = 1; // Assuming 1 is the ID of an existing article
            await ltgr.connect(addr1).addCredsToReviewer(subjectName, addr2.address); 
            await ltgr.connect(addr2).addCredsToReviewer(subjectName, addr1.address); 



            await ltga.connect(addr1).submitReview(articleId, ipfsHashReview, 2);
            await ltga.connect(addr2).submitReview(articleId, ipfsHashReview, 2);

            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect

            const [upkeepNeeded, data]= await ltga.checkUpKeep("0x")
            expect(upkeepNeeded).to.be.true
            const negativeOneInTwosComplement = toTwosComplement(-1);
            expect(ethers.BigNumber.from(data)).to.equal(negativeOneInTwosComplement);

        
        });   



    });




    describe("performUpkeep", function() {
        beforeEach(async function() {
    
            await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.connect(addr1).approve(ltga.address, mockFeePrice)
            await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName);

            await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.connect(addr1).approve(ltga.address, mockFeePrice)
            await ltga.connect(addr1).mintArticle("ThisIstotalanipfshash", title, authorName, description, subjectName);

            await ltga.connect(addr1).mintArticle(ipfsHash, title, authorName, description, subjectName2);
            

            await mockLinkToken.mint(addr1.address, ethers.utils.parseEther("1000"));
            await mockLinkToken.connect(addr1).approve(ltga.address, mockFeePrice)
            await ltga.connect(addr1).mintArticle("and this 4th thing", title, authorName, description, subjectName);

            await ltgr.connect(addr1).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr2).addSelfAsReviewer(subjectName);
            await ltgr.connect(addr3).addSelfAsReviewer(subjectName2);

        })


        it("Should fail if caller is not the automation or owner address ", async function() {
            await expect(ltga.connect(addr1).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000000")).to.be.revertedWith("Not the contract owner or Automation Registry Contract");
            
 
        
        });   
        it("Should not effect active reviews when 0 is passed in ", async function() {

            await ltga.connect(mockAutomationContract.signer).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000000")
            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,1,2,4])
        
        });   

        it("Should not effect active reviews when 0 is passed in ", async function() {

            await ltga.connect(mockAutomationContract.signer).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000000")
            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,1,2,4])
        
        });   


        it("Should not effect active reviews when 1 is passed in but time hasn't passed", async function() {

            await ltga.connect(mockAutomationContract.signer).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001")
            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,1,2,4])
            const c = await ltga.getArticleConsesous(1)
            expect(c).to.equal("Review Pending")
        });   



        it("Should set a review to accepted", async function() {


            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect


            await ltga.connect(mockAutomationContract.signer).performUpkeep("0x0000000000000000000000000000000000000000000000000000000000000001")

            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,4,2])
            const c = await ltga.getArticleConsesous(1)
            expect(c).to.equal("Accepted")
        });   

        it("Should set a review to Rejected", async function() {

            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect


            await ltga.connect(mockAutomationContract.signer).performUpkeep(ethers.utils.defaultAbiCoder.encode(["int256"], [-1]))


            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,4,2])
            const c = await ltga.getArticleConsesous(1)
            expect(c).to.equal("Rejected")
        });     
        it("Should set last review to accepted", async function() {

            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect


            await ltga.connect(mockAutomationContract.signer).performUpkeep(ethers.utils.defaultAbiCoder.encode(["int256"], [4]))


            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,1,2])
            const c = await ltga.getArticleConsesous(4)
            expect(c).to.equal("Accepted")
        });          

        it("Should not effect A non reviewable Article", async function() {

            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
    
            await ltga.connect(mockAutomationContract.signer).performUpkeep(ethers.utils.defaultAbiCoder.encode(["int256"], [3]))
    
    
            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,1,2,4])
            const c = await ltga.getArticleConsesous(3)
            expect(c).to.equal("No Review")
        });    
        
        it("Should not effect A NonExistant Article", async function() {
    
            await network.provider.send("evm_increaseTime", [reviewTime+1]);
            await network.provider.send("evm_mine");  // you have to force a new block to be mined for the time change to take effect
    
    
            await ltga.connect(mockAutomationContract.signer).performUpkeep(ethers.utils.defaultAbiCoder.encode(["int256"], [100]))
    
    
            const l = await ltga.getActiveReviews()
            expect(l).to.be.deep.equal([0,1,2,4])

        }); 
    
    });



});

