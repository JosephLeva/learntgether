const { expect } = require("chai");

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
    

    const tgetherPost = await ethers.getContractFactory("tgetherPosts");
    tgp = await tgetherPost.deploy();
    await tgp.deployed();




  });

  describe("Post Creation", function() {
    it("Should create a post", async function() {
        await tgp.connect(addr1).mintPost("endpoint.com/thisisalink", "A test Post", "Joe","this is a test post");   
        const post = await tgp.connect(addr1).getPost(1);
        expect(post[0]).to.equal("endpoint.com/thisisalink");
        expect(post[1]).to.equal("A test Post");
        expect(post[2]).to.equal(addr1.address);
        expect(post[3]).to.equal("Joe");
        expect(post[4]).to.equal("this is a test post");
     });
    });
});