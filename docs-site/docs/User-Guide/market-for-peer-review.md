# Decentralized Peer Review Incentives and Bounties System

## Introduction

Tgether has pioneered the first-ever **free-market-driven decentralized peer review** system, allowing communities to incentivize high-quality content reviews and active participation. This groundbreaking model enables the creation of dynamic bounties and incentive structures for reviewing posts, ensuring a fair and transparent review process, while also allowing participants to be compensated for their efforts in accordance with community-defined rules.

## How it Works

### Incentive Structures

The **Tgether Incentives Contract** offers two primary incentive structures for peer reviews, allowing communities to choose how rewards are distributed among their members:

1. **Equal Incentives**: Every reviewer, regardless of their consensus position (whether they agreed with the majority or not), receives an equal reward.
   
2. **Consensus-Aligned Incentives**: Only those reviewers whose opinions align with the majority consensus receive the reward.

Communities can choose between these structures when setting up their peer review parameters.

**Note only reviews that contribute to final consensus will recieve payouts. It is up to a communites to set their consensus parameters for their members to avoid spam or missuse** 

### Community Customization

Each community can define its own incentive structure through the contract, by setting parameters such as:

- **Community Fee**: The portion of the total bounty to be allocated to the community.
- **Contract Receive Address**: The address where community fees will be sent.

These parameters are set during the initial setup by the community owner or through a proposal.

## The Incentive Proposal Process

## Bounties

Once Incentive Parameters are set Anyone can create a bounty on post submission to a community. When a post is process and a consensus has been found we can then use Chainlink Log Automation to become notified, total all bounties and split them amongst deserving parties. If not enough reviews were submitted to a post submission bounties are refunded to their creators.
