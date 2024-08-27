---
sidebar_position: 1
---

# What are Communities? 

Thank you for choosing tgether! We're excited to have you on board as we dive into the world of decentralized consensus. Ready to get into the weeds? Let’s explore how you can create and manage your own community.

## Creating a Community

When creating a community in tgether, you’ll define a set of parameters that shape how your community functions. These settings allow you to control everything from membership access to voting mechanisms. Below is a high-level overview of the key parameters you’ll configure when setting up your community.

**Reminder** These settings are meant to be as custom, you can always set values to 0 if there's a piece of the pie you would not want to include for your setup :)
### Community Parameters

1. **Minimum Creds to Propose a Vote (`minCredsToProposeVote`)**  
   The minimum amount of creds a member must have to propose a vote. If set, this ensures that only members who have earned enough reputation can initiate proposals.

2. **Minimum Creds to Vote (`minCredsToVote`)**  
   The minimum amount of creds a member must have to participate in voting. If set, this parameter sets a threshold for who can take part in decision-making.

3. **Maximum Creds Counted for a Vote (`maxCredsCountedForVote`)**  
   The maximum number of creds that can be counted when a member votes. This parameter allows you to consider a users creds as part of their vote.
   > **Note:** If set above 0, a proposal requires both more "yes" votes and "yes" creds to pass. This value places an upper bound on the amount of creds applied to a member's vote. If you prefer no upper limit, you can set this value to an extremely high number.

4. **Minimum Votes to Pass a Proposal (`minProposalVotes`)**  
   The minimum number of votes required for a proposal to pass. This ensures that decisions are supported by a broad base of the community.

5. **Proposal Voting Time (`proposalTime`)**  
   The amount of time members have to vote on a proposal. This defines the window during which votes can be cast. *If set to 0, no proposals can ever be cast to your community*

6. **Proposal Delay (`proposalDelay`)**  
   The delay before voting begins after a proposal is created. If set, this gives members time to review and discuss the proposal before voting starts.

7. **Invite-Only Community (`isInviteOnly`)**  
   A true or false setting to determine whether the community is invite-only. When enabled, only invited members can join.

8. **Member Access Contract (`memberAccessContract`)**  
   **For advanced use,** this allows a custom contract to control membership access. It’s important to audit and thoroughly test any custom contracts before use, as they directly influence who can join and participate in the community. View docs to read more [memberAccess Contracts](/docs/developer-docs/membership-and-creds)

   > **Note:** If a community decides to delegate to a cred access contract, the owner cannot directly manage invitations and the default creds process is voided. To regain control, one would need to propose a new set of parameters to the community. This could be impossible depending on other parameters. If unsure always set this to `0x0000000000000000000000000000000000000000`

---

Once these parameters are configured, your community will be set up and ready to start proposing, voting, and building consensus!

Next steps: [Manage Your Community Settings](./manage-your-community.md)

---

This guide gives a solid overview of the core settings you’ll encounter when creating your community. As you get more familiar with the platform, you can experiment with these settings to customize your community’s experience.

Let’s build something great together!
