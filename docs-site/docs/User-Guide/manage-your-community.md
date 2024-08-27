---
sidebar_position: 2
---

# Managing Your Community

Once your community is up and running, it’s essential to understand how to manage and evolve it using proposals. Proposals allow community members to make changes to the community’s structure and governance by updating key parameters. Let’s dive into how proposals work and how they are used in tgether.

## Proposals: Updating Your Community

Proposals in tgether are a powerful tool for making decisions and updating your community’s parameters. Members can create proposals to change the following settings:

- `minCredsToProposeVote`: The minimum creds required to propose a vote.
- `minCredsToVote`: The minimum creds required to vote.
- `maxCredsCountedForVote`: The maximum creds that can be counted for a vote.
- `minProposalVotes`: The minimum number of votes needed to pass a proposal.
- `memberAccessContract`: A custom contract controlling member access (advanced use).
- `proposalTime`: The amount of time a proposal is open for voting.
- `proposalDelay`: The delay before voting begins after a proposal is created.
- `isInviteOnly`: Whether the community is invite-only.

These parameters allow your community to be dynamic and adjust to changing needs or goals. For example, as your community grows, you might want to increase the number of votes required to pass proposals or change how creds influence voting.

## How Proposals Store Voting Information

When a proposal is created, it tracks the voting progress through several key fields:

- `approveVotes`: The number of votes in favor of the proposal.
- `denyVotes`: The number of votes against the proposal.
- `approveCreds`: The total creds supporting the proposal.
- `denyCreds`: The total creds opposing the proposal.

This information is crucial for determining whether a proposal passes or fails.

### Voting with Creds and Maximum Creds Counted

If your community uses the **Maximum Creds Counted for a Vote** parameter (`maxCredsCountedForVote`), then each member’s vote is weighted according to their creds, up to the specified threshold. In this system:

- The number of creds a member holds (up to the threshold) is added to the `approveCreds` or `denyCreds` count depending on their vote.
- For a proposal to pass, it must have both more **approve votes** and more **approve creds** than deny votes and deny creds.

This mechanism ensures that both popular support (vote count) and influential support (cred count) are considered when passing proposals. 

*To opt out of this functionality and use pure domoctratic process set maxCredsCountedForVote = 0*

## Proposals for Custom Purposes

These proposals aren’t limited to community settings—they also play a role under the hood for more custom use cases. One prominent example is our **Community Consensus** feature, which allows communities to set custom rules for post reviews and other advanced functions. By leveraging proposals in this way, communities can expand their purpose and automate complex workflows.

Learn more about how Community Consensus works and how you can customize it: [Community Consensus and Custom Proposals](./community-consensus-and-custom-proposals).

---

With this understanding of proposals, you’re ready to manage and evolve your community as it grows. Keep your community flexible and responsive by using proposals to adjust settings and ensure that decisions reflect the will of your members.
