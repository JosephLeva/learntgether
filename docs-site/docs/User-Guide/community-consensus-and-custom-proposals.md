---
sidebar_position: 3
---



# Community Consensus and Custom Proposals

tgether gives communities the flexibility to define how they reach consensus on different topics. The **Community Consensus** feature allows a community to set parameters for how posts or proposals are reviewed and accepted. These settings can be initially configured by the community owner and, if voting is allowed, can be adjusted through member proposals.

## Community Consensus Parameters

Here are the key parameters that can be set for community consensus:

**Reminder** These settings are meant to be as custom, you can always set values to 0 if they're not your steeze :)

- **`numReviewsForAcceptance`:** The number of reviews required for a post or proposal to be considered for acceptance. This sets a minimum threshold for how many members need to weigh in before a decision is made.

- **`credsNeededForReview`:** The number of creds a member needs for their review to count toward the final consensus. This parameter ensures that only trusted members with enough reputation have influence over the decision.

- **`percentAcceptsNeeded`:** The percentage of positive (accept) reviews needed for a post or proposal to be accepted. This defines the level of agreement required among reviewers.

- **`consensusTime`:** The time (in seconds) that a consensus remains active. After this time expires, the consensus process is closed, and the final decision is made based on the reviews submitted. If set to 0 no consensus will ever be processed of posts. Members will still be able to review

- **`consensusTypes`:** An optional array of reasons for why a post or proposal might not be accepted. Communities can define custom reasons (e.g., "Inaccurate Information," "Off-Topic") to give more context when rejecting a submission. This array can be left empty if not needed.

These parameters allow each community to tailor its consensus process, whether the goal is to review posts for quality, filter out misinformation, or any other purpose that aligns with the community’s objectives.

## How Community Consensus Works Behind the Scenes

Community Consensus is powered by the same proposal and voting system used to manage general community settings. When a member submits a proposal to change the Community Consensus parameters, it is processed through the same mechanisms as any other proposal. This consistency keeps the platform unified and highlights how tgether’s proposal system can be applied to a wide range of community-driven decisions.

## Custom Use Cases

The flexibility of the proposal and consensus system serves as a foundation for communities to achieve any goal they see fit. Whether you’re building a fact-checking network, running peer reviews, or organizing a community around a specific interest, tgether’s consensus parameters give you the tools to reach agreements in a decentralized way.

Ready to explore how membership and creds work within a community? Learn more here: [Membership and Creds](./membership-and-creds.md).

---

With these tools, you can fully customize how your community evaluates content, reaches consensus, and evolves over time. The flexibility of tgether’s system means that whatever your end goal, you have the freedom to design the processes that best suit your needs.
