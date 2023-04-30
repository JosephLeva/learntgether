const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArticleNFT", function () {
  let articleNFT;
  let owner;
  let alice;
  let bob;

  beforeEach(async function () {
    const ArticleNFT = await ethers.getContractFactory("ArticleNFT");
    articleNFT = await ArticleNFT.deploy("ArticleNFT", "ANFT");

    [owner, alice, bob] = await ethers.getSigners();
  });

  it("Should mint new NFTs with correct metadata", async function () {
    await articleNFT.connect(alice).mint(
        "Test Article 1",
        "Author 1",
        true,
        "ipfs://Qmabcdefg123",
        { from: alice.address }
      );
      await articleNFT.connect(bob).mint(
        "Test Article 2",
        "Author 2",
        false,
        "ipfs://Hijklmnop456",
        { from: bob.address }
      );

    const tokenId1 = 0;
    const tokenId2 = 1;

    // Verify that the token metadata is correct
    const [title1, author1, originatingAddress1, peerReviewed1, ipfsHash1] =
      await articleNFT.getArticle(tokenId1);
    expect(title1).to.equal("Test Article 1");
    expect(author1).to.equal("Author 1");
    expect(originatingAddress1).to.equal(await owner.getAddress());
    expect(peerReviewed1).to.equal(true);
    expect(ipfsHash1).to.equal("ipfs://Qmabcdefg123");

    const [title2, author2, originatingAddress2, peerReviewed2, ipfsHash2] =
      await articleNFT.getArticle(tokenId2);
    expect(title2).to.equal("Test Article 2");
    expect(author2).to.equal("Author 2");
    expect(originatingAddress2).to.equal(await owner.getAddress());
    expect(peerReviewed2).to.equal(false);
    expect(ipfsHash2).to.equal("ipfs://Hijklmnop456");

    // Verify that the token owner is correct
    expect(await articleNFT.ownerOf(tokenId1)).to.equal(await alice.getAddress());
    expect(await articleNFT.ownerOf(tokenId2)).to.equal(await bob.getAddress());
  });
});


  