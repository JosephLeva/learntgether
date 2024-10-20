require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Set the fee dynamically from environment variables, fallback to 0 for testnet if not defined
  const FEE = 100000000000000;

  // // 1. Deploy Fund Contract
  // const Fund = await hre.ethers.getContractFactory("tgetherFund");
  // const fund = await Fund.deploy();
  // await fund.deployed();
  // console.log("Fund contract deployed to:", fund.address);

  // // 2. Deploy Communities Contract with the fee parameter
  // const Communities = await hre.ethers.getContractFactory("tgetherCommunities");
  // const communities = await Communities.deploy(FEE);
  // await communities.deployed();
  // console.log("Communities contract deployed to:", communities.address);

  // // 3. Deploy Members Contract
  // const Members = await hre.ethers.getContractFactory("tgetherMembers");
  // const members = await Members.deploy();
  // await members.deployed();
  // console.log("Members contract deployed to:", members.address);

  // // 4. Call setMembersContract on the Communities contract
  // await communities.settgetherMembersContract(members.address);
  // console.log("Communities contract updated with Members contract address.");

  // // 5. Call setCommunitiesContract on the Members contract
  // await members.settgetherCommunities(communities.address);
  // console.log("Members contract updated with Communities contract address.");

  // // 6. Deploy Lane Registry Contract
  // const LaneRegistry = await hre.ethers.getContractFactory("LaneRegistry");
  // const laneRegistry = await LaneRegistry.deploy(communities.address);
  // await laneRegistry.deployed();
  // console.log("Lane Registry contract deployed to:", laneRegistry.address);

  // // 7. Call setRegistry on the Communities contract
  // await communities.setLaneRegistryContract(laneRegistry.address);
  // console.log("Communities contract updated with Lane Registry contract address.");

  // // 8. Deploy Lane Contract
  // const Lane = await hre.ethers.getContractFactory("CommunitiesLane");
  // const lane = await Lane.deploy(fund.address, communities.address, laneRegistry.address);
  // await lane.deployed();
  // console.log("Lane contract deployed to:", lane.address);

  // // 9. Deploy Community Consensus Contract
  // const CommunityConsensus = await hre.ethers.getContractFactory("tgetherCommunityConsensus");
  // const communityConsensus = await CommunityConsensus.deploy(FEE, communities.address, FEE, fund.address);
  // await communityConsensus.deployed();
  // console.log("Community Consensus contract deployed to:", communityConsensus.address);

  // // 10. Deploy Posts Contract
  // const Posts = await hre.ethers.getContractFactory("tgetherPosts");
  // const posts = await Posts.deploy();
  // await posts.deployed();
  // console.log("Posts contract deployed to:", posts.address);

  // 11. Deploy Posts Consensus Contract
  const PostsConsensus = await hre.ethers.getContractFactory("tgetherPostConsensus");
  const postsConsensus = await PostsConsensus.deploy("0x263B77866b4fE287f33F48bb97E12CD13DDFe883", "0xBF81C27d8e03a4f7ebDD5bC1De0A69285Ed79AAe", "0x1Dc3c742d9dFe008224291bEd882B07A5d4e1209", FEE);
  await postsConsensus.deployed();
  console.log("Posts Consensus contract deployed to:", postsConsensus.address);

  // 12. Deploy Another Instance of Registry Contract for Post Consensus
  const PostConsensusRegistry = await hre.ethers.getContractFactory("LaneRegistry");
  const postConsensusRegistry = await PostConsensusRegistry.deploy(postsConsensus.address);
  await postConsensusRegistry.deployed();
  console.log("Post Consensus Registry deployed to:", postConsensusRegistry.address);

  // 13. Call setLaneRegistry on the Posts Consensus Contract
  await postsConsensus.setLaneRegistry(postConsensusRegistry.address);
  console.log("Posts Consensus Lane Registry set.");

  // 14. Deploy Post Consensus Lane Contract
  const PostConsensusLane = await hre.ethers.getContractFactory("PostConsensusLane");
  const postConsensusLane = await PostConsensusLane.deploy("0x009359A28115f5b336101FEb4D371b87d423cf4f", postsConsensus.address, postConsensusRegistry.address);
  await postConsensusLane.deployed();
  console.log("Post Consensus Lane contract deployed to:", postConsensusLane.address);

  // // 15. Deploy Tgether Incentives Contract
  // const Incentives = await hre.ethers.getContractFactory("tgetherIncentives");
  // const incentives = await Incentives.deploy(FEE, communities.address, FEE, fund.address);
  // await incentives.deployed();
  // console.log("Tgether Incentives contract deployed to:", incentives.address);

  // // 16. Deploy Consensus Bounty Contract
  // const ConsensusBounty = await hre.ethers.getContractFactory("tgetherConsensusBounty");
  // const consensusBounty = await ConsensusBounty.deploy(fund.address, postsConsensus.address, communityConsensus.address, incentives.address, FEE);
  // await consensusBounty.deployed();
  // console.log("Consensus Bounty contract deployed to:", consensusBounty.address);

  // // 17. Deploy Tgether Parameter Group Registry
  // const ParameterGroupRegistry = await hre.ethers.getContractFactory("tgetherParameterGroupRegistry");
  // const parameterGroupRegistry = await ParameterGroupRegistry.deploy();
  // await parameterGroupRegistry.deployed();
  // console.log("Tgether Parameter Group Registry deployed to:", parameterGroupRegistry.address);

  // // 18. Deploy Community Enrollment Contract
  // const CommunityEnrollment = await hre.ethers.getContractFactory("CommunityEnrollment");
  // const communityEnrollment = await CommunityEnrollment.deploy(parameterGroupRegistry.address, communities.address);
  // await communityEnrollment.deployed();
  // console.log("Community Enrollment contract deployed to:", communityEnrollment.address);

  // // 19. Call setCommunityEnrollmentContract on Tgether Parameter Group Registry
  // await parameterGroupRegistry.setCommunityEnrollmentContract(communityEnrollment.address);
  // console.log("Tgether Parameter Group Registry updated with Community Enrollment contract address.");

  // // 20. Deploy Members Info Contract
  // const MemberInfo = await hre.ethers.getContractFactory("tgetherMembersInfo");
  // const memberInfo = await MemberInfo.deploy();
  // await memberInfo.deployed();
  // console.log("Members Info contract deployed to:", memberInfo.address);

  // Automation and Chainlink registration (steps 21 to 30)
  // These steps would involve interacting with Chainlink Automation, which is not done directly in this script.
  // You will need to register each contract (Lane, Incentives, etc.) with Chainlink's Keepers Upkeep service.
  // This can be done using the Chainlink UI or Chainlink SDK for automating the process.

  console.log("All contracts deployed successfully and configurations set!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
