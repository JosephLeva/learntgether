---
sidebar_position: 5
---
# Posts and Reviews

Posts and reviews are at the heart of how content is evaluated and decisions are made within tgether communities. Whether it’s fact-checking, content curation, or evaluating proposals, the post and review system allows communities to reach consensus in a decentralized and transparent way.

## What is a Post?

A post in tgether is a piece of content that can be submitted by anyone for any purpose. While posts are reviewed by communities, they are not directly linked to one during creation. Posts are designed to serve as pointers to content and include the following fields:

- **`content`:** The main content of the post. This could be a link, text, or other relevant information.
- **`title`:** A brief title summarizing the post.
- **`authorName`:** The display name of the author (optional).
- **`description`:** A brief description or context for the post, helping members understand its purpose.

Once a post is created, it can be submitted to a community, where it undergoes a review process based on the rules defined by that community’s consensus parameters.

## The Review Process

When a post is submitted, members of the community can review it according to the criteria set in the Community Consensus. Each review includes the following fields:

- **`content`:** The review’s content, usually feedback or evaluation of the post.
- **`consensusType`:** The reason behind the consensus, such as "Inaccurate Information" or "Helpful Content."
- **`creds`:** The number of creds the reviewer has, which impacts how much weight their review carries.
- **`afterConsensus`:** Indicates whether this review was submitted after the consensus process ended (for archival purposes).

**NOTE** any consensusTypes not considered "Accepted" will registered as **Rejected**

### How Reviews Are Counted

While anyone can create a review, only those reviews that meet the requirements defined by the community (e.g., the member’s creds or voting eligibility) will be counted in the final decision. Additionally, reviews must be submitted before the consensus time ends, ensuring that decisions are made within a predefined window.

For a post to be accepted, it must receive the required percentage of positive reviews, as defined by the community’s **percentAcceptsNeeded** parameter. This process ensures that content is evaluated fairly while reflecting the community’s specific goals and values.

## Want to Learn More?

Curious about how tgether leverages Web3 and why fees are necessary? Discover how blockchain ensures transparency and why fees help keep the platform decentralized: [Why Web3 and What Are Fees For.](./web3-and-fees).

---

This guide provides a high-level overview of how posts and reviews work within tgether communities. By understanding this process, you can better participate in content evaluations and contribute to the consensus that drives your community forward.
