# Tgether - A Decentralized Consensus Platform

## Overview

Tgether is a decentralized platform built on the Arbitrum Sepolia Testnet, designed to facilitate consensus-driven decision-making in communities. The platform allows users to join communities, participate in discussions, submit proposals, and review contributions through decentralized mechanisms. Our modular architecture ensures scalability and flexibility across various use cases.

## Fees

To support decentralized arbitration of proposals and post consensus, Tgether utilizes Chainlink Automation. Fees are only charged for functionality that requires upkeep, such as proposal submissions and post reviews. These fees are necessary to fund the networks that process the underlying transactions, ensuring that the consensus mechanisms remain secure and decentralized. The fees are directly linked to the operational costs and vary depending on the specific tasks being performed.

## Smart Contracts Overview

### 1. **tgehterCommunities.sol**
   - **Purpose**: Manages the creation and administration of communities, including handling membership fees and tracking community information.
   - **Constructor**: Initializes the contract with the platform’s admin address and sets the base fee required for proposal submissions.
   - **Important Note**: After deploying this contract, you need to call the `setCommunityContract` function in other contracts to set its address where needed.

### 2. **tgehterMembers.sol**
   - **Purpose**: Handles membership management within communities. Functions include adding/removing members, managing credentials, and tracking invitations.
   - **Constructor**: Initializes the contract independently, without dependencies.
   - **Important Note**: The `setMembersContract` function in other contracts must be called with the deployed address of this contract.

### 3. **tgetherMemberInfo.sol** (Optional)
   - **Purpose**: Stores additional member profile information such as bio, degrees, awards, and other metadata.
   - **Constructor**: This contract does not require any external addresses but interacts with the `Members` contract to verify member identities.

### 4. **tgetherCommunityConsensus.sol**
   - **Purpose**: Implements the voting and consensus mechanisms within communities. This contract is critical for proposal evaluation.
   - **Constructor**: Initializes independently but requires the address of `Communities.sol` to be set via the `setCommunityContract` function.
   - **Important Note**: Call the `setCommunityContract` function after deployment to link this contract with the `Communities` contract.

### 5. **tgetherPosts.sol**
   - **Purpose**: Manages content and posts submitted by members within a community.
   - **Constructor**: Requires the address of the `CommunityConsensus.sol` contract to be set using the `setCommunityConsensusContract` function after deployment.

### 6. **tgetherPostConsensus.sol**
   - **Purpose**: Implements consensus mechanisms specifically for evaluating posts and comments. It ensures that content is peer-reviewed according to community standards.
   - **Constructor**: Initializes independently, but requires addresses of the following contracts:
     - `tgetherCommunityConsensus.sol`
     - `tgetherMembers.sol`
     - `tgehterPosts.sol`
   - **Important Note**: The addresses for these contracts must be set using the `setCommunityConsensusContract`, `setMembersContract`, and `setPostsContract` functions respectively.

## Deployment Instructions

Deploying the Tgether platform involves multiple steps due to the interdependencies between contracts. Follow these instructions carefully:

1. **Deploy `Communities.sol` and `Members.sol` first.**
   - Deploy `Communities` independently and note the contract address.
   - Deploy `Members`, noting the contract address as well.

2. **Update Contract Addresses:**
   - After deploying `Communities` and `Members`, call the `setCommunityContract` and `setMembersContract` functions in the relevant contracts to establish the necessary links and avoid circular dependencies.

3. **Deploy `MemberInfo.sol` (Optional).**
   - This contract is optional and can be deployed separately to store additional member profile data.

4. **Deploy `CommunityConsensus.sol`.**
   - Deploy independently and then call the `setCommunityContract` function with the address of the deployed `Communities` contract.

5. **Deploy `Posts.sol`.**
   - Deploy independently and call the `setCommunityConsensusContract` function with the address of the deployed `CommunityConsensus` contract.

6. **Deploy `PostConsensus.sol`.**
   - Deploy independently and call the following functions with the respective contract addresses:
     - `setCommunityConsensusContract` for `CommunityConsensus.sol`
     - `setMembersContract` for `Members.sol`
     - `setPostsContract` for `Posts.sol`

## How to Interact with the Contracts

Once deployed, the contracts can be interacted with using Web3.js, ethers.js, or directly via the Arbitrum Sepolia network.
---

This README provides a high-level overview of Tgether and its deployment process. For more detailed examples and interactions, refer to the documentation or explore the contract functions directly.