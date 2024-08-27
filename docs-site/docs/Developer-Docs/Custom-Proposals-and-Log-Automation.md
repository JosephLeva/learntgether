---
sidebar_position: 4
---

# Custom Proposals

In tgether, **Community Consensus** is actually an example of a custom proposal system. You can set new parameters and implement unique logic using a similar approach. By following this guide, you’ll learn how to create and manage custom proposals using tgether’s interfaces and Chainlink Automation.

**Note** Always audit your own contracts before deploying them to mainnet. Never just assume any solidity code will work how you expect.

## Interfaces for Custom Proposals

To create custom proposals, you’ll need to use the following interfaces:

```solidity
import "@chainlink/contracts/src/v0.8/automation/interfaces/ILogAutomation.sol";

interface tgetherCommunitiesInterface {
    function getCommunityOwner(string memory _communityName) external view returns (address);
    function CustomProposal(string memory _communityName, address _contractAddress) external payable returns (uint256);
    function getProposalResults(uint256 _proposalId) external view returns (bool isActive, bool passed);
    function getFee() external view returns (uint256);
}
```

### Submitting a Proposal

To submit a custom proposal, a user must be a community member and meet the cred requirements set by their community. Here’s what to keep in mind:

1. **Include the Fee in Your Contract Call**:  
   Submitting a proposal requires a fee, so make sure to include the required payment when calling the contract. In our implementation, we combine two fees into a single "total fee" value. This makes it easy for us to track fees for our log automation differently than our proposal automation.

   ```solidity
   require(msg.value == totalFee, "Fee price not sent");
   ```

2. **Submit the Proposal**:  
   Use the community contract to submit the proposal while specifying your contract address so it can be indexed properly for automation:

   ```solidity
   uint256 proposalId = CommunityContract.CustomProposal{value: communityFee}(_communityName, address(this));
   ```

3. **Store and Reference the Proposal ID**:  
   The proposal ID returned from this call ensures you can track the proposal accurately and avoid mismatches. For example:

   ```solidity
   CCProposalParams memory ccPP = CommunityConsensusProposals[proposalId];
   ```

### Chainlink Automation: Using Check Log

To monitor and process custom proposals, we rely on Chainlink Automation’s **check log** feature. Keep your implementation aligned with the latest Chainlink documentation: 
- [Chainlink Automation Reference - ILogAutomation Interface](https://docs.chain.link/chainlink-automation/reference/automation-interfaces/#ilogautomation)
- [Chainlink Automation Refrence - Deployment Guide](https://docs.chain.link/chainlink-automation/guides/log-trigger)

Here’s an example of how we implement `checkLog`:

```solidity
function checkLog(
    Log calldata log,
    bytes memory /* checkData */
) external view returns (bool upkeepNeeded, bytes memory performData) {
    address _contractAddress = bytes32ToAddress(log.topics[1]);
    uint256 _proposalId = uint256(log.topics[2]);

    if (
        _contractAddress == thisAddress &&
        CommunityConsensusProposals[_proposalId].proposer != address(0) &&
        CommunityConsensusProposals[_proposalId].upkeeped == false
    ) {
        upkeepNeeded = true;
    }
    
    return (upkeepNeeded, abi.encode(_proposalId));
}
```

### Key Points to Note:

- We only check logs from our contract to ensure that the proposals being processed are relevant.
- We confirm that the proposal exists by checking the proposer’s address (if it’s set to address(0), it means the proposal is invalid or doesn’t exist).
- We also check that the proposal hasn’t already been processed (upkeeped) to avoid redundancy or manipulation.

**Log Topics:** The log topic IDs are incremented by 1 compared to the event. For instance:

```solidity
event CustomProposalResult(address indexed contractAddress, uint256 indexed proposalId, bool indexed passed);
```

We don’t check whether the proposal has passed or failed during this stage because we need to process it either way—our focus is only on whether it needs processing.

### Processing the Proposal in Perform Upkeep

Once `checkLog` triggers the need for upkeep, we double-check the conditions and then retrieve the proposal result from the community contract. The proposal results allow you to process any custom logic on your contract:

```solidity
function performUpkeep(bytes calldata _performData) external {
    uint256 _proposalId = abi.decode(_performData, (uint256));

    if (CommunityConsensusProposals[_proposalId].proposer != address(0)) {
        (bool _isActive, bool _passed) = CommunityContract.getProposalResults(_proposalId);

        // Execute custom logic based on the proposal results
        if (_passed) {
            // Implement your custom behavior here
        }
    }
}
```

With this setup, you can use custom proposals to implement a wide range of features, from updating parameters to executing complex workflows based on community votes. The flexibility provided by Chainlink Automation and tgether’s interfaces allows for endless possibilities.

---

Next up: [Membership and Creds](./membership-and-creds.md)
