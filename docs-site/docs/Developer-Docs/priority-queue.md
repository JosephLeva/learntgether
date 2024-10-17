---
sidebar_position: 3
---
# Multi-Lane Delayed Priority Queues Powered by Chainlink Automation

## Introduction
Blockchain technology excels in handling event-driven transactions due to its decentralized and tamper-proof architecture. It is particularly effective for deterministic interactions triggered by on-chain events such as transfers, contract executions, or other state changes. However, blockchain has historically struggled with time-sensitive, event-ambiguous interactions that require deterministic outcomes based on arbitrary time delays rather than immediate state changes. 

In the context of decentralized governance and voting systems, such as the ones implemented in Tgether's Governance as a Service (GaaS) applications, there is often a need to process time-delayed transactions that trigger actions only when certain conditions are met or at specific points in time. Historically, handling this kind of transaction has been a challenge, particularly as the number of actions scales into the hundreds or thousands.

## The Challenge: Scaling Timed Interactions

When dealing with hundreds or thousands of proposals, each requiring processing at different intervals, the problem becomes even more complex. Each proposal may have a unique time horizon before it needs to be acted upon. Looping through a large array of proposals to check whether each one should be processed becomes inefficient and costly, especially when operating in a gas-constrained environments.

On Web2, solving this issue is relatively simple with priority queues or other similar data structures that allow fast lookup and processing. However, in a Web3 environment, this can quickly become impractical due to high gas fees and the computational complexity of looping through large arrays in a smart contract.

## Tgether's Approach with Chainlink Automation

To tackle this, Tgether's voting and post consensus system uses Chainlink Automation to create a multi-lane delayed priority queue. Chainlink Automation enables us to offload the task of monitoring and triggering proposals based on time constraints or external conditions to a decentralized network of nodes. These nodes can be configured to monitor large numbers of proposals and trigger contract executions when conditions are met.

In Tgether's GaaS system, the Chainlink Automation network is responsible for periodically checking whether a proposal has met the conditions required for further processing (e.g., consensus reached, voting period ended). This approach provides a significant improvement over relying solely on smart contracts to manage time-sensitive events.

## Multi-Lane Architecture

To address the issue of scaling with large numbers of proposals, we introduce a **multi-lane** architecture. The traditional approach of looping through an array of all proposals and checking each one for conditions creates a bottleneck as the array grows larger. This bottleneck limits how many proposals can be processed within a single block due to gas constraints, and it also impacts off-chain providers like Chainlink Automation, which must query all active proposals.

By splitting the proposals into multiple **lanes**, we distribute the workload across different arrays. Each lane is essentially its own prioritized queue of proposals, and these lanes are managed independently. This unlocks several important benefits:

1. **Parallel Processing**: Each lane can be processed independently by different transactions or Chainlink Automation jobs. This allows multiple proposals to be processed within a single block, overcoming the limitation of one transaction per block.
2. **Scalability**: As the number of proposals grows, more lanes can be added. This enables the system to scale to thousands of proposals while maintaining performance.
3. **Load Balancing**: Lanes can be dynamically assigned proposals based on priority, type, or other metrics, reducing congestion in any single lane and balancing the load across the system.


### How It Works

- **Lane Registration**: When a proposal is created, it is assigned to a lane. The lane assignment can be based on a variety of factors, such as the proposal type, time horizon, or expected computational cost.
- **Proposal Processing**: Each lane has its own queue of proposals. Chainlink Automation nodes are tasked with monitoring each lane for proposals that meet the conditions for processing. This is done off-chain by Automation who then trigger the on-chain function to process the proposal when appropriate.
- **Expanding Lanes**: When the number of proposals exceeds the capacity of the current lanes (i.e., the number of proposals that can be efficiently processed), new lanes can be dynamically added. These new lanes allow the system to scale without impacting the performance of the existing lanes.


## Conclusion

By leveraging Chainlink Automation and implementing a multi-lane architecture, Tgether’s governance system can efficiently handle large-scale proposal processing in a decentralized environment. This approach mitigates the inherent limitations of blockchain for handling time-sensitive, event-ambiguous interactions, offering a scalable, cost-effective solution for decentralized governance and post consensus. As the number of proposals grows, the ability to scale by simply adding lanes ensures that the system can meet the demands of the community while maintaining optimal performance.

