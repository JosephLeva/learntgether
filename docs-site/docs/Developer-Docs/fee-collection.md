---
sidebar_position: 5
---

# Understanding Fee Collection, Swaps, and Upkeep Management

## Overview

This documentation provides an in-depth look into how our system handles fee collection, executes swaps using SushiSwap, and manages the upkeep mapping in our decentralized application. We also cover why fees cannot be directly tied to transactions due to the mechanics of Chainlink Automation and highlight the importance of maintaining adequate LINK balance to ensure reliable upkeep processing.

### Table of Contents

1. [Fee Collection Process](#fee-collection-process)
2. [Swapping Fees with SushiSwap](#swapping-fees-with-sushiswap)
3. [Contract to Upkeep Mapping](#contract-to-upkeep-mapping)
4. [Chainlink Automation Mechanics](#chainlink-automation-mechanics)
5. [Important Note on Upkeep Guarantees](#important-note-on-upkeep-guarantees)

---

### Fee Collection Process

Our platform collects fees from user transactions to fund maintenance and upkeep operations on the blockchain. These fees are pooled collectively due to the way Chainlink Automation works. Chainlink Automation allows us to fund upkeeps (jobs) directly, not individual transactions. Here’s a breakdown of the process:

- **Contributing to a Pool**: Users contribute fees to a shared pool rather than funding individual upkeep executions directly. This approach is necessary because Chainlink Automation does not support directly funding upkeep tasks from individual transactions.
- **Fee Aggregation**: The collected fees are aggregated within a contract to automate funding of upkeeps, ensuring that upkeep tasks are managed automatically and consistently.
- **Transaction Pooling**: By pooling fees, we can automate the upkeep process via Chainlink Automation, which requires a consistent source of LINK to fund upkeep jobs.

### Swapping Fees with SushiSwap

To convert collected fees into LINK for upkeep, our contract performs swaps using SushiSwap. The swap mechanism is a critical part of the funding process, ensuring that the pooled ETH or other tokens are converted into LINK, which is then used to pay for upkeep tasks.

```solidity
        // *NOTE* here minum link is set to 0 because we will only be transfering small amounts eth (<$2) 
        // if transfering large amounts set value higher to account for slippage 
        try sushiSwapRouter.swapExactETHForTokens{ value: msg.value }(
            0, // Set minimum LINK received to 0, adjust if needed. 
            path,
            address(this),
            block.timestamp + 60 // Add buffer time
        ) {}catch Error(string memory reason) {
            // Catch revert reason and re-throw with detailed error message
            revert(string(abi.encodePacked("Swap failed: ", reason)));
        } catch {
            // Fallback for unknown errors
            revert("Swap failed: Unknown error");
        }
        
        // Transfer LINK to upkeep contract
        uint256 linkBalance = LINK.balanceOf(address(this));
        require(linkBalance > 0, "No LINK received from swap");

        // Fund the upkeep job using transferAndCall (ERC677 function)
        LINK.transferAndCall(upkeepRegistrar, linkBalance, abi.encode(upkeeps[_contractAddress]));
        return true;

```

- **Swap Execution**: The swap function uses `swapExactETHForTokens`, passing the `msg.value` received as ETH to execute the swap. This provides the LINK needed for funding the upkeep pool.
- **Handling Volatility**: To minimize the impact of price fluctuations, the function includes parameters like `minLinkOut`, ensuring that swaps only proceed if the resulting LINK amount meets a minimum threshold.

### Contract to Upkeep Mapping

The system employs contract-to-upkeep mapping to manage upkeep tasks efficiently. Each contract that requires upkeep is associated with a specific upkeep task, allowing Chainlink Automation to monitor and execute these tasks automatically:

- **Mapping Management**: Contracts registered for upkeep are mapped to specific upkeep task IDs managed by Chainlink Automation, ensuring that maintenance is correctly allocated and managed.
- **Automated Execution**: Chainlink Automation regularly checks conditions and executes upkeep tasks as needed, provided that sufficient LINK is available in the pool.

### Chainlink Automation Mechanics

Due to the way Chainlink Automation operates, fees cannot be directly tied to individual transactions. Here’s why:

- **Gas Usage**: Chainlink Automation uses LINK to cover gas fees when executing upkeep. This LINK is drawn from the pooled funds, not directly from individual transaction fees.
- **Decoupling Fees and Upkeep**: Since Automation only allows direct funding of upkeep jobs, not transactions, we pool fees into a shared resource. This setup ensures continuous funding without directly linking transaction fees to upkeep actions.
- **Billing and Costs**: For detailed information on how billing works and the associated costs, see the [Chainlink Automation Billing and Cost Page](https://docs.chain.link/chainlink-automation/overview/automation-economics).

### Important Note on Upkeep Guarantees

**IMPORTANT NOTE**: We cannot guarantee that all upkeeps will be processed automatically due to price volatility and the requirement for sufficient LINK balance in the upkeep pool. If the LINK balance is insufficient or market conditions change, some upkeep tasks may fail to execute. Users have the option to manually trigger upkeep by calling the `performUpkeep` function, ensuring that necessary maintenance tasks can still be performed when automation fails.

**Insert code block here showing how users can manually trigger upkeep, highlighting the performUpkeep function and its parameters.**

Ensure that adequate LINK balance is maintained in the upkeep pool to minimize the risk of failed upkeeps and to provide smooth operation.
