---
sidebar_position: 2
---
# Deployment and Data Model

This guide walks you through the steps to deploy tgether’s contracts in the correct order, as well as an overview of where different pieces of data are stored in the system.

## Deployment Steps

To deploy the tgether platform, follow these steps in the correct order:

1. **Deploy Fund Contract**
2. **Deploy Communities Contract**  
   - Requires fee price initially set to `2000000000000000`
3. **Deploy Members Contract**
4. **Call `setMembersContract` on the Communities contract**
5. **Call `setCommunitiesContract` on the Members contract**
6. **Deploy Lane Registry Contract**  
   - Takes the Communities contract as an argument
7. **Call `setRegistry` on the Communities contract**
8. **Deploy Lane Contract**  
   - Takes in the Fund contract address, Communities contract address, and Lane Registry contract address
9. **Deploy Community Consensus Contract**  
   - Takes in:
     - Initial fee: `2000000000000000`
     - Communities contract address
     - Community fee: `2000000000000000`
     - Fund contract address
10. **Deploy Posts Contract**
11. **Deploy Posts Consensus Contract**  
    - Takes in:
      - Community Consensus contract address
      - Members contract address
      - Posts contract address
      - Fee: `2000000000000000`
12. **Deploy Another Instance of Registry Contract**  
    - For the Post Consensus Contract
13. **Call `setLaneRegistry` on the Post Consensus Contract**  
    - Set the registry address
14. **Deploy Post Consensus Lane**  
    - Takes in:
      - Fund contract address
      - Post Consensus contract address
      - Post Consensus Lane Registry address
15. **Deploy Tgether Incentives Contract**  
    - Takes in:
      - Fee price: `2000000000000000`
      - Communities contract address
      - Community fee: `2000000000000000`
      - Fund contract address
16. **Deploy Consensus Bounty Contract**  
    - Takes in:
      - Fund contract address
      - Post Consensus contract address
      - Incentives contract address
      - Fee: `2000000000000000`
17. **Deploy Tgether Parameter Group Registry**
18. **Deploy Community Enrollment Contract**
19. **Call `setCommunityEnrollmentContract` from Tgether Parameter Group Registry Contract**
20. **Deploy Members Info Contract**
21. **Register Communities Contract Lane Upkeep with Chainlink Automation**
22. **Register Community Consensus Upkeep with Chainlink Automation**
23. **Register Post Consensus Lane Upkeep with Chainlink Automation**
24. **Call `setForwarder` on Post Consensus Lane Contract**  
    - Set the Chainlink Upkeep Forwarder address
25. **Register Incentives with Chainlink Automation**
26. **Register Consensus Bounty with Chainlink Automation**
27. **Call `setAutomationContractAddress` in Consensus Bounty Contract**  
    - Set the Chainlink Forwarder address
28. **Call Fund Contract to Create Mapping for Communities Lane to its Upkeep ID**
29. **Call Fund Contract to Create Mapping for Post Consensus Lane to its Upkeep ID**
30. **Call Fund Contract to Create Mapping for Incentives to its Upkeep ID**
31. **Call Fund Contract to Create Mapping for Consensus Bounty to its Upkeep ID**


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
