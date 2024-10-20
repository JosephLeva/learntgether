
# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
## [1.1.1] - 2024-10-20
 
### Added
### Changed
### Fixed
- Post Consensus set CommunitySubmissionToPost on creation fix event. 

## [1.1.0] - 2024-08-25
 
### Added
- Inventives and Bounties 
    - Incentives: new set of parameters that defines how bounties are disributed on post consensus
        - Can split bounty equally amongst reviewers or only among consensus aligned and have the option to collect a % fee for community
    - Bounties: anyone can submit a bounty on a post consensus submission - bounties are combined and split amongst community reviewers
- Governance as a Service
    - Introduced Paramter Groups Registry - users can now register their Custom proposal contracts
    - Communities can now clearly see Parameters Groups they are enrolled in. ALlowing them to vote on Anything without worrying about governance
### Changed
- Multi Lane Delayed Priority Queues
    - Replaced Active arrays in Post Consensus and Communites contract with multi Lane queues
    - Lane Registry and Lane Contract allows tgether to scale to 1000's of proposals without effecting app performance just by adding lanes
- Post Consensus Types Switched from string and int to enum
### Fixed 
- Post Consensus counting after consensus reviews


## [1.0.0] - 2024-09-11
 
### Added
- Fund Contract: The Fund Contract has replaced fee addresses
    - Fund contracts use sushi swap to swap eth for link and directly fund upkeeps
### Changed
- Changed Communities, Community Conesnsus, and Post Consensus to use fund contract instead of fee addresses
- Added disclaimers to fee collecting functions explaining that funding goes to a pool subject to price volatillity 
- Added manual way to run post consensus (requires looping though reviews) in case price volatility causes issues with upkeep

## [0.1.1] - 2024-08-25
 
### Added
- Added After consensus flag to reviews
    - After Consensus will be used for eventual incentive payout contracts 
- Added Docusaurus! Better Docs were needed as we prep for audits and mainnet :)
### Changed
- Updated proposals.propser to tx.origin instead of msg.sender to accomodate custom proposals
- Changed the log topic array in Community Consensus to reflect actual logs
- MinorComment changes
### Fixed 
- Log automations were previously not working made changes above to reflect

## [0.1.0] - 2024-08-17
 
### Added
- Added Automation Interfaces
    - Added automation interfaces for easier registration of automation
- Added getPostSubmissionList function to Post Consensus contract for easier front end querying
### Changed
- Rename : changed learntgether to tgether - to go along with more flexible usage of contracts
- Removed isInvited from Members info contract- not used anywhere
### Fixed


## [0.0.3] - 2024-02-07
 
### Added
### Changed
- Updated Members Contract to seperate out remove cred logic
    - Previously remove negative and remove postive cred used similar logic, this was replaced with an internal funciton to handle both
    - This was needed in order to keep contract size below 24576 bytes
### Fixed


## [0.0.3] - 2024-02-07
 
### Added
- Communities can now control Creds and Membership externally via a new parameter called **memberAccessContract**
    - This is an advanced setting but unlocks communities ability to define how they value and accept their members
    - The address specified can update cred amount as well as (un)invitations
    - This disallows peer to peer cred distibution and (un)invitations from owners
    - Some examples of metrics that could be used for cred amount (world is your oyster though!)
        - number of reviews members make
        - number of posts members have had accepted
        - number of submissions members have made
        - time spent in community
        - percent ownership of a particular shared asset
- We can now directly view all communities that members are a part of without using the Graph
    - this is done using a seprate memberCommunities mapping
- We can now directly view all proposals for a community
    - this is done though a seperate porposalsByCommunity mapping
### Changed

### Fixed

## [0.0.2] - 2024-01-12
 
### Added
- Endpoint to Member info -> to add a link to X or other platforms for users
### Changed
- Split Members contract into Members and Member Info contracts to shorten length
- Community Parameters now define proposals params rather than consensus params
- Community Contract Split into Communities and Community Consenous
    - Community Conesnous now uses Custom Proposal Logic
- Changed from 3 to 2 Proposal Types 
    - Community Proposals => Edit Proposal Params
    - Custom Proposal -> Proposals by other contracts
- Post Contract Split into Post and Post Consenous to go below contract size limit
### Fixed
- The Spelling of Consensus


## [0.0.2] - 2023-11-31
 
### Added
- Added invite only communities (not perferred but who are we to force you to allow anyone in)
### Changed
- Subjects are now called Communities 
- Reviewers are now called Members
- Articles are now called Posts
- Posts are now minted seperate from communities to allow for comparison across communities and wider conversation
    - Post Submissions are made to communities and can be done by anyone. 
- reviewTime is now called consenousTime seemed to be a more direct variable name
- We split Community Proposals into three types
    - Commmunity Proposals change Article/Reviewer Parameters
    - ProposalParam Proposals change the parameters for future proposals
    - Custom Proposals include a contract address which will be index logged to be used for custom community votes (Use however you like)
- Automation Fees are now collected in Contract Native Coin, this was decided as easier for User Experience
    - Fees for Posts and Community Proposals Are Meant to Only Cover expense for Automation Executions
- Creds can now be negative! You can "down vote" a member, previously not possible
### Fixed
 