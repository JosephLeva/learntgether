---
sidebar_position: 3
---

# Chainlink Automation in tgether

Before diving into how tgether leverages Chainlink Automation, we recommend checking out the official Chainlink documentation: [Chainlink Automation Docs](https://docs.chain.link/chainlink-automation).

## How tgether Uses Chainlink Automation

In tgether, proposals and posts require member input for consensus, which takes time. We needed a way to handle the processing of these proposals and posts without incurring massive on-chain compute costs. To achieve this, we leverage Chainlink Automation’s custom logic to keep track of our active proposals array and process them efficiently.

### The Challenge: Efficient Consensus Processing

tgether manages an array of active proposals that need to be processed. However, each proposal has different timing constraints, such as varying voting periods and consensus durations. We can’t simply process proposals sequentially based on their position in the array because each proposal has its own unique deadlines. Managing this directly on-chain would be costly and inefficient.

### The Solution: Custom Logic Automation

To solve this problem, we use Chainlink Automation to perform the following:

1. **Off-Chain Sorting:** We continuously monitor and sort the active proposals array off-chain, identifying which proposals are ready to be processed based on their individual timers (like voting period and consensus time).

2. **Perform Upkeep:** Once a proposal is ready, Chainlink Automation triggers the `performUpkeep` function, which processes the proposal or post consensus on-chain.

Here’s a simplified version of our `checkUpkeep` logic:

```solidity
function checkUpkeep(bytes calldata /* checkData */)
    external
    view
    override
    returns (bool upkeepNeeded, bytes memory /* performData */) {
    
    upkeepNeeded = false;
    uint256 lowestId = 0;

    if (ActiveProposals.length > 0) {
        uint256 lowestVoteEnd = 0;

    /* Notice how we use the community's propoosalDelay and proposalTime, not the proposal's */ 

        for (uint256 i = 1; i < ActiveProposals.length; i++) {
            uint256 voteEnd = proposals[ActiveProposals[i]].timestamp 
                + communities[proposals[ActiveProposals[i]].communityName].proposalDelay  
                + communities[proposals[ActiveProposals[i]].communityName].proposalTime;  

            if (voteEnd <= block.timestamp && (voteEnd <= lowestVoteEnd || lowestVoteEnd == 0)) {
                upkeepNeeded = true;
                lowestId = ActiveProposals[i];
                lowestVoteEnd = voteEnd;
            }
        }
    }
    return (upkeepNeeded, abi.encode(lowestId));
}
```

### On-Chain Efficiency with Swap and Pop

To avoid expensive on-chain operations, we use the “swap and pop” method. When a proposal is processed:

- The proposal is swapped with the last element in the active proposals array.
- The last element is then removed (popped) from the array.

This ensures that our array operations remain O(1), keeping costs low and performance optimal.


```solidity
    function performUpkeep(bytes calldata _performData) external {

        // Check if we should be processing the id
        uint256 proposalId= abi.decode(_performData, (uint256));

        uint256 voteEnd= proposals[proposalId].timestamp + communities[proposals[proposalId].communityName].proposalDelay + communities[proposals[proposalId].communityName].proposalTime;

        // Proposal Id should never be 0 because we start the counter at 1, it should be after the vote end, and vote end shouldnt be 0 (someone  put in an id that isnt used yet)
        if ( proposalId != 0 && voteEnd <= block.timestamp  && voteEnd != 0){

            Proposal storage proposalToCheck = proposals[proposalId];
            
            // Check if the proposal has more approve votes than deny votes and [more approve creds than deny creds or maxCredsCountedForVote is set to 0] and [more votes than minumum]
            if ( (proposalToCheck.approveVotes > proposalToCheck.denyVotes) && (proposalToCheck.approveCreds > proposalToCheck.denyCreds || communities[proposalToCheck.communityName].maxCredsCountedForVote == 0 ) && (proposalToCheck.approveVotes + proposalToCheck.denyVotes >= communities[proposalToCheck.communityName].minProposalVotes) ){
                // Do Stuff
            }

        // Swap and pop

        // set our target index to the proposal in question
        uint256 index = proposals[proposalId].activeProposalsIndex;

        // check if index is last in array
        if (index != ActiveProposals.length -1) {
            // if it is not we let the last item take its spot
            ActiveProposals[index] = ActiveProposals[ActiveProposals.length - 1];

            // update the index in our mapping 
            proposals[ActiveProposals[index]].activeProposalsIndex= index;
            emit IndexChange(ActiveProposals[index], index);
            }

        //set our proposal index to 0 and pop the last index
        proposals[proposalId].activeProposalsIndex = 0;
        ActiveProposals.pop();
    }
```

- Note when we do this for post consensus we dont want to loop through all the reviews in our Perform Upkeep on chain. 
- To avoid this we abritrate the checkUpkeep to find if a post has been accepted, knowing the reviews act as a true receipt of how things were calculated
- With this we must add a modifier on performUpkeep to only allow the contract owner or the chainlink automation `FORWARDER` address to  call the function.
- You will want to create an owner only function to update the AutomationContractAddress in case you need to upgrade your upkeep in the future

```solidity 

 modifier ownerOrAutomation() {
        require(msg.sender == owner || msg.sender == AutomationContractAddress, "Not the contract owner or Automation Forwarder Contract");
        _;
    }  

function performUpkeep(bytes calldata _performData ) external ownerOrAutomation {}

function setAutomationRegistry(address _contractAddress) external ownerOnly {
        AutomationContractAddress= _contractAddress;

    }
```
>**Note** While some may believe adding owner to the modifier could be considered an attack vector, because the owner must have the ability to set automation,we feel it doesn't introduce a significant risk, but instead allows an owner the ability to debug in the unlikely event of a service outage. Always be sure to add robust controls to the owners of these contracts on mainnet.

### Bringing It All Together

By combining off-chain sorting and on-chain automation, tgether ensures that consensus processing is both decentralized and cost-efficient. Chainlink Automation helps us maintain trustless operations while avoiding heavy computational loads on-chain.

Ready to learn more about extending tgether’s functionality? Check out the next section on [Custom Proposals And Log Automation](./Custom-Proposals-and-Log-Automation).
