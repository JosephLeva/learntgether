
# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
 

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
 