---
sidebar_position: 2
---
# Deployment and Data Model

This guide walks you through the steps to deploy tgether’s contracts in the correct order, as well as an overview of where different pieces of data are stored in the system.

## Deployment Steps

To deploy the tgether platform, follow these steps in the correct order:

1. **Deploy the `Communities` Contract**:  
   Start by deploying the `Communities` contract. This contract will manage all community-related data and proposals.

2. **Deploy the `Members` Contract**:  
   Next, deploy the `Members` contract, which will handle membership management and creds. 

3. **Set Contract Addresses**:  
   Once both contracts are deployed, add the Members contract address to the Communities contract via the `settgetherMembersContract()`function. Then, set the address of Communities in the Members contract via the `settgetherCommunities()` function. *Note these functions are owner only.*

4. **Deploy the `MembersInfo` Contract**:  
   Deploy the `MembersInfo` contract, which allows members to define their profile information, such as names and credentials.

5. **Deploy the `CommunityConsensus` Contract**:  
   Deploy the `CommunityConsensus` contract using the address of the `Communities` in the constructor. This contract will manage the consensus rules for the community.

6. **Deploy the `Posts` Contract**:  
   Deploy the `Posts` contract, which will store post content.

7. **Deploy the `PostConsensus` Contract**:  
   Finally, deploy the `PostConsensus` contract, which requires the addresses of the `CommunityConsensus`, `Posts`, and `Members` contracts in the constructor. This contract stores community submissions and their reviews.

After completing these steps, your contracts should be deployed and interconnected correctly, ready for community interactions.

**Fees and Fees Addresses** Where applicable, fees are set by the owner of the contract and are sent by default to the Fees Addresses, no fee values are stored in the contracts themselves.

## Data Model Overview

Understanding where different data is stored within tgether is key to working with the platform. Here’s a breakdown of the data model:

- **Communities and Proposals**:  
  Stored in the `Communities` contract. This contract holds all community-related settings and tracks proposals made within the community.

- **Membership and Creds**:  
  Managed by the `Members` contract. This contract keeps track of member information, creds, and membership rules.

- **Member Profiles**:  
  Stored in the `MembersInfo` contract. This optional contract allows members to define their profile information, such as display names and credentials.

- **Community Consensus Parameters**:  
  Managed by the `CommunityConsensus` contract. This contract holds the rules and parameters that define how consensus is reached in the community, such as the number of reviews needed and the percentage of approvals required.

- **Posts**:  
  Content submissions from members are stored in the `Posts` contract. **Note** Posts are not tied to communities at all. So any one can create a post for any purpose, even if they are not a member of any community on the platform.

- **Community Submissions and Reviews**:  
  Stored in the `PostConsensus` contract. This contract manages the review process, including who can participate in reviews and how those reviews impact the consensus process.

---

By following this deployment process and understanding the data model, you’ll have a solid foundation for working with tgether’s decentralized consensus platform.

Next up: [Chainlink Automation](./chainlink-automation)
