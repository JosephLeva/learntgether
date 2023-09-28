// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {LinkTokenInterface} from "../node_modules/@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "hardhat/console.sol";

interface ChainlinkAutomationInterface{
    function addFunds(uint256 upkeepId, uint256 amount) external;
}

interface learntgetherReviewerInterface{
    function getIsReviewer(address _reviewerAddress, string memory _subjectName) external view returns (bool);
    function getReviewerCreds(address _reviewerAddress, string memory _subjectName) external view returns (uint256 creds);
    
    }


contract learntgetherSubjects{

    struct Subject  {
        address creator;
        uint256 numReviewsForAcceptance;
        uint256 credsNeededForReview;
        uint256 percentAcceptsNeeded;
        uint256 reviewTime;
        string[] consenousTypes;
        uint256 minCredsToProposeVote;        // Minimum creds needed to propose a vote
        uint256 minCredsToVote;               // Minimum creds required to vote
        uint256 maxCredsCountedForVote;       // Maximum creds that can be counted for a vote
        uint256 minProposalVotes;
        uint256 proposalTime;
        uint256 proposalDelay;
    }
    mapping(string => Subject) public subjects;

    string[] public subjectNames;



    struct Proposal {
        address proposer;
        string subjectName;
        uint256 numReviewsForAcceptance;
        uint256 credsNeededForReview;
        uint256 percentAcceptsNeeded;
        uint256 reviewTime;
        string[] consenousTypes;
        uint256 minCredsToProposeVote;
        uint256 minCredsToVote;
        uint256 maxCredsCountedForVote; 
        uint256 minProposalVotes;
        uint256 proposalTime;
        uint256 proposalDelay;
        uint256 timestamp;
        uint256 activeProposalsIndex;
        uint256 approveVotes;
        uint256 denyVotes;
        uint256 approveCreds;
        uint256 denyCreds;
        mapping(address => bool) votes; // to track which reviewers have voted true for approve false for deny
        bool isActive;
        bool passed;

    }
    uint256 proposalCounter;
    mapping(uint256=> Proposal) public proposals;

    mapping(string=> uint256[]) public SubjectProposals;

    uint256[] ActiveProposals;
    uint256 maxProposalTime;
    uint256 maxReviewTime;

    mapping(address=>bool)hasOpenProposal;



    LinkTokenInterface private linkToken;
    address private owner;
    uint256 public proposalFeeInLink;

    ChainlinkAutomationInterface public AutomationContract; 
    address AutomationContractAddress; 

    learntgetherReviewerInterface public ReviewerContract;

    // Mumbai 0x57A4a13b35d25EE78e084168aBaC5ad360252467

    uint256 public upkeepId;
    constructor(address _linkTokenAddress, address _automationAddress, uint256 _feePrice) {
        owner = msg.sender;

        linkToken = LinkTokenInterface(_linkTokenAddress);
        AutomationContract= ChainlinkAutomationInterface(_automationAddress);

        proposalFeeInLink = _feePrice;
        AutomationContractAddress= _automationAddress;

        // Array Time Dependent variables set to 3 months by default can be changed by setters
        maxProposalTime = 7890000;
        maxReviewTime = 7890000;

        proposalCounter = 1;
        // ensure Nothing can get in the 0 array spot
        ActiveProposals.push(0);
    }


    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    // Events 
    
    
    event SubjectCreated(
        string indexed subjectName, 
        address creator,
        uint256 numReviewsForAcceptance,
        uint256 credsNeededForReview,
        uint256 percentAcceptsNeeded,
        uint256 reviewTime,
        string[] consenousTypes,
        uint256 minCredsToProposeVote,
        uint256 minCredsToVote,
        uint256 maxCredsCountedForVote,
        uint256 minProposalVotes,
        uint256 proposalTime,
        uint256 proposalDelay
        );

    event ProposalCreated(
        address proposer,
        string subjectName,
        uint256 numReviewsForAcceptance,
        uint256 credsNeededForReview,
        uint256 percentAcceptsNeeded,
        uint256 reviewTime,
        string[] consenousTypes,
        uint256 minCredsToProposeVote,
        uint256 minCredsToVote,
        uint256 maxCredsCountedForVote,
        uint256 minProposalVotes,
        uint256 proposalTime,
        uint256 proposalDelay,
        uint256 timestamp,
        uint256 activeProposalsIndex,
        bool isActive

    );

    event Voted(uint256 indexed proposalId, address indexed voter, bool voteChoice, uint256 creds);
    event ProposalResult(uint256 proposalId, bool passed);
    event SubjectUpdated(
        string indexed subjectName, 
        address creator,
        uint256 numReviewsForAcceptance,
        uint256 credsNeededForReview,
        uint256 percentAcceptsNeeded,
        uint256 reviewTime,
        string[] consenousTypes,
        uint256 minCredsToProposeVote,
        uint256 minCredsToVote,
        uint256 maxCredsCountedForVote,
        uint256 minProposalVotes,
        uint256 proposalTime,
        uint256 proposalDelay
        );
    
        event IndexChange(uint256 proposalId, uint256 activeProposalsIndex);
        


    /*
        * @notice Creates a new subject in the system.
        * @dev Ensures the subject does not already exist.
        * @param _subjectName Name of the subject to be created.
        * @param _numReviewsForAcceptance Number of reviews required for acceptance.
        * @param _credsNeededForReview Creds required for a review.
        * @param _percentAcceptsNeeded Percentage of accepts needed.
        * @param _minCredsToProposeVote Minimum creds required to propose a vote.
        * @param _minCredsToVote Minimum creds required to vote.
        * @param _maxCredsCountedForVote Maximum creds that can be counted for a vote.
        * @param _minProposalVotes Minimum proposal votes required.
    */
    function createSubject(
        string memory _subjectName,
        uint256 _numReviewsForAcceptance,
        uint256 _credsNeededForReview,
        uint256 _percentAcceptsNeeded,
        uint256 _reviewTime,
        string[] memory _consenousTypes,
        uint256 _minCredsToProposeVote,
        uint256 _minCredsToVote,
        uint256 _maxCredsCountedForVote,
        uint256 _minProposalVotes,
        uint256 _proposalTime,
        uint256 _proposalDelay
    ) public  {

        // Ensure Subject Does not exsist

        require(subjects[_subjectName].creator == address(0), "Subject already exists.");


        // Adjust our array time dependent variables to avoid clog 
        if (_reviewTime > maxReviewTime){
            _reviewTime = maxReviewTime;
        }

        if (_proposalTime > maxProposalTime){
            _proposalTime = maxProposalTime;
        }


        // Add subject parameters

        subjects[_subjectName].creator = msg.sender;
        subjects[_subjectName].numReviewsForAcceptance = _numReviewsForAcceptance;
        subjects[_subjectName].credsNeededForReview = _credsNeededForReview;
        subjects[_subjectName].percentAcceptsNeeded = _percentAcceptsNeeded;
        subjects[_subjectName].reviewTime= _reviewTime;
        subjects[_subjectName].consenousTypes = _consenousTypes;
        subjects[_subjectName].minCredsToProposeVote = _minCredsToProposeVote;
        subjects[_subjectName].minCredsToVote = _minCredsToVote;
        subjects[_subjectName].maxCredsCountedForVote = _maxCredsCountedForVote;
        subjects[_subjectName].minProposalVotes = _minProposalVotes;
        subjects[_subjectName].proposalTime = _proposalTime;
        subjects[_subjectName].proposalDelay = _proposalDelay;


        subjectNames.push(_subjectName);
        
        emit SubjectCreated(
        _subjectName, 
        msg.sender, 
        _numReviewsForAcceptance, 
        _credsNeededForReview, 
        _percentAcceptsNeeded,
        _reviewTime,
        _consenousTypes,
        _minCredsToProposeVote, 
        _minCredsToVote, 
        _maxCredsCountedForVote, 
        _minProposalVotes,
        _proposalTime, 
        _proposalDelay
        );
    }

  

    /*
    * @notice Proposes changes to a subject's parameters.
    * @dev Ensures the subject exists and the proposer meets the requirements. Must Approve LinkFee to Contract before calling.
    * @param _subjectName Name of the subject to be updated.
    * @param _numReviewsForAcceptance Number of reviews required for acceptance.
    * @param _credsNeededForReview Creds required for a review.
    * @param _percentAcceptsNeeded Percentage of accepts needed.
    * @param _minCredsToProposeVote Minimum creds required to propose a vote.
    * @param _minCredsToVote Minimum creds required to vote.
    * @param _maxCredsCountedForVote Maximum creds that can be counted for a vote.
    * @param _minProposalVotes Minimum proposal votes required.
    
    */
    function propose(
        string memory _subjectName,
        uint256 _numReviewsForAcceptance,
        uint256 _credsNeededForReview,
        uint256 _percentAcceptsNeeded,
        uint256 _reviewTime,
        string[] memory _consenousTypes,
        uint256 _minCredsToProposeVote,
        uint256 _minCredsToVote,
        uint256 _maxCredsCountedForVote,
        uint256 _minProposalVotes,
        uint256 _proposalTime,
        uint256 _proposalDelay
    ) external {
        // Ensure the subject exists
        require(subjects[_subjectName].creator != address(0), "Subject doesn't exist");
        require(!hasOpenProposal[msg.sender], "User has Open Review, Please wait untill it is processed.");

        
        // Ensure the proposer is a reviewer for the subject and has enough creds
        require(ReviewerContract.getIsReviewer(msg.sender, _subjectName) == true, "You are not a reviewer for this subject.");

        require(ReviewerContract.getReviewerCreds(msg.sender, _subjectName) >= subjects[_subjectName].minCredsToProposeVote, "Insufficient creds to propose.");
        // Ensure the proposer has paid the required LINK fee
        require(linkToken.transferFrom( msg.sender, address(this), proposalFeeInLink), "Fee transfer failed");

        // Create a new proposal using the proposalCounter as an ID
        Proposal storage newProposal = proposals[proposalCounter];


        // Adjust our array time dependent variables to avoid clog 
        if (_reviewTime > maxReviewTime){
            _reviewTime = maxReviewTime;
        }
        if (_proposalTime > maxProposalTime){
            _proposalTime = maxProposalTime;
        }


        // Set the properties of the new proposal
        newProposal.proposer = msg.sender;
        newProposal.subjectName = _subjectName;
        newProposal.numReviewsForAcceptance = _numReviewsForAcceptance;
        newProposal.credsNeededForReview = _credsNeededForReview;
        newProposal.percentAcceptsNeeded = _percentAcceptsNeeded;
        newProposal.reviewTime= _reviewTime;
        newProposal.consenousTypes = _consenousTypes;
        newProposal.minCredsToProposeVote = _minCredsToProposeVote;
        newProposal.minCredsToVote = _minCredsToVote;
        newProposal.maxCredsCountedForVote = _maxCredsCountedForVote;
        newProposal.minProposalVotes = _minProposalVotes;
        newProposal.proposalTime = _proposalTime;
        newProposal.proposalDelay = _proposalDelay;
        newProposal.timestamp = block.timestamp;
        newProposal.activeProposalsIndex= ActiveProposals.length;
        newProposal.isActive = true;

        // Approve and send link fee to our upkeep
        linkToken.approve(AutomationContractAddress, proposalFeeInLink);
        AutomationContract.addFunds(upkeepId, proposalFeeInLink);

        
        hasOpenProposal[msg.sender]= true;
        ActiveProposals.push(proposalCounter);
        SubjectProposals[_subjectName].push(proposalCounter);

        
        // Increment the proposalCounter
        proposalCounter++;
        

        emit ProposalCreated(
            msg.sender,
            _subjectName, 
            _numReviewsForAcceptance, 
            _credsNeededForReview, 
            _percentAcceptsNeeded, 
            _reviewTime,
            _consenousTypes,
            _minCredsToProposeVote, 
            _minCredsToVote, 
            _maxCredsCountedForVote, 
            _minProposalVotes,
            _proposalTime,
            _proposalDelay,
            block.timestamp, 
            ActiveProposals.length-1, 
            true
        );
    }
        

    /*

        * @notice Allows a reviewer to vote on a proposal.
        * @dev Ensures the proposal exists and the voter meets the requirements.
        * @param proposalId ID of the proposal to vote on.
        * @param voteChoice Choice of the voter (true for approve, false for deny).
    */
    function vote(uint256 proposalId, bool voteChoice) external {
        // Ensure the proposal exists
        require(proposalId < proposalCounter, "Proposal does not exist.");

        // Ensure The Proposal is Active

        Proposal storage proposal = proposals[proposalId];
        require(proposal.isActive == true, "Proposal is no longer Active");
        
        // Before delay period after experation
        require (block.timestamp >= proposal.timestamp + subjects[proposal.subjectName].proposalDelay && block.timestamp <= proposal.timestamp+ subjects[proposal.subjectName].proposalDelay + subjects[proposal.subjectName].proposalTime, "Not Active Voting Time");

        // Ensure the voter is a reviewer for the subject
        require(ReviewerContract.getIsReviewer(msg.sender, proposal.subjectName) == true, "You are not a reviewer for this subject.");

        // Ensure the voter has not voted before
        require(!proposal.votes[msg.sender], "You have already voted.");


        // Ensure the voter has more creds than the minCredsToVote
        uint256 voterCreds = ReviewerContract.getReviewerCreds(msg.sender, proposal.subjectName);

        require(voterCreds >= subjects[proposal.subjectName].minCredsToVote, "Insufficient creds to vote.");


        // Determine the amount of creds to count for the vote
        uint256 credsToCount = (voterCreds > subjects[proposal.subjectName].maxCredsCountedForVote) ? subjects[proposal.subjectName].maxCredsCountedForVote : voterCreds;
        

        if (voteChoice) {
            // If vote is true, add to approvevotes and approvecreds
            proposal.approveVotes += 1;
            proposal.approveCreds += credsToCount;
        } else {
            // If vote is false, add to denyvotes and deny creds
            proposal.denyVotes += 1;
            proposal.denyCreds += credsToCount;

        }

        // Mark the voter as having voted
        proposal.votes[msg.sender] = true;        

        emit Voted(proposalId, msg.sender, voteChoice, credsToCount);
    }



    /*
        * @notice Checks if upkeep is needed for proposals.
        * @dev Loops thorugh the active proposals array to find Propsals where voting is ceased. Aims to grab the lowest voteEnds timestamp as the next to be processed.
        * @param check data (unused in this function but might be needed for interface compatibility).
        * @return upkeepNeeded Boolean indicating if upkeep is needed.
        * @return performData bytes object cast from uint256 id for the lowest timestamp proposal where vote period has ended
    */

       function checkUpKeep(bytes calldata /* check data*/)  external view  returns( bool upkeepNeeded, bytes memory performData ){

        upkeepNeeded = false;
        uint256 lowestId= 0;

        if(ActiveProposals.length > 0){

        uint256 lowestVoteEnd= 0;
        
        for (uint256 i=1; i < ActiveProposals.length; i++){
            
            // Time of proposal + Amount of time for delay + amoubnt of time proposal active
            uint256 voteEnd= proposals[ActiveProposals[i]].timestamp + subjects[proposals[ActiveProposals[i]].subjectName].proposalDelay + subjects[proposals[ActiveProposals[i]].subjectName].proposalTime;

            if( voteEnd <= block.timestamp && (voteEnd <= lowestVoteEnd || lowestVoteEnd == 0)){
                upkeepNeeded = true;
                lowestId= ActiveProposals[i];
                lowestVoteEnd= voteEnd;

            }
        }

        }
        return(upkeepNeeded, abi.encode(lowestId));


    }

    /*
   * @notice Performs the upkeep of proposals.
   * @dev Validates that a proposal vote period has ended. If it is we check if the passed. If it does we set our subject values to the proposed ones. Then we set the proposal to inactive and swap-pop the ActiveProposals array
   * @param performData Data from the checkUpKeep function Proposal Id where vote period has ending
    */

    function performUpkeep(bytes calldata _performData) external {
        uint256 proposalId= abi.decode(_performData, (uint256));

        uint256 voteEnd= proposals[proposalId].timestamp + subjects[proposals[proposalId].subjectName].proposalDelay + subjects[proposals[proposalId].subjectName].proposalTime;

        // Proposal Id should never be 0 because we start the counter at 1, it should be after the vote end, and vote end shouldnt be 0 (someone  put in an id that isnt used yet)
        if ( proposalId != 0 && voteEnd <= block.timestamp  && voteEnd != 0){

            Proposal storage proposalToCheck = proposals[proposalId];

            
            // Check if the proposal has more approve votes than deny votes and more approve creds than deny creds or both cred amounts are 0 (when maxCredsCountedForVote is set to 0)
            if ( (proposalToCheck.approveVotes > proposalToCheck.denyVotes) && (proposalToCheck.approveCreds > proposalToCheck.denyCreds || subjects[proposalToCheck.subjectName].maxCredsCountedForVote == 0 ) && (proposalToCheck.approveVotes + proposalToCheck.denyVotes >= subjects[proposalToCheck.subjectName].minProposalVotes) ){
                // Update the subject's variables with the proposal's values

                Subject storage subjectToUpdate = subjects[proposalToCheck.subjectName];

                subjectToUpdate.numReviewsForAcceptance = proposalToCheck.numReviewsForAcceptance;
                subjectToUpdate.credsNeededForReview = proposalToCheck.credsNeededForReview;
                subjectToUpdate.percentAcceptsNeeded = proposalToCheck.percentAcceptsNeeded;
                subjectToUpdate.reviewTime= proposalToCheck.reviewTime;
                subjectToUpdate.consenousTypes = proposalToCheck.consenousTypes;
                subjectToUpdate.minCredsToProposeVote = proposalToCheck.minCredsToProposeVote;
                subjectToUpdate.minCredsToVote = proposalToCheck.minCredsToVote;
                subjectToUpdate.maxCredsCountedForVote = proposalToCheck.maxCredsCountedForVote;
                subjectToUpdate.minProposalVotes = proposalToCheck.minProposalVotes;
                subjectToUpdate.proposalTime = proposalToCheck.proposalTime;
                subjectToUpdate.proposalDelay = proposalToCheck.proposalDelay;
                
                proposals[proposalId].passed = true;

                emit ProposalResult(proposalId, true);
                emit SubjectUpdated(proposalToCheck.subjectName,
                subjectToUpdate.creator,
                subjectToUpdate.numReviewsForAcceptance, 
                subjectToUpdate.credsNeededForReview, 
                subjectToUpdate.percentAcceptsNeeded, 
                subjectToUpdate.reviewTime,
                subjectToUpdate.consenousTypes,
                subjectToUpdate.minCredsToProposeVote, 
                subjectToUpdate.minCredsToVote, 
                subjectToUpdate.maxCredsCountedForVote, 
                subjectToUpdate.minProposalVotes,
                subjectToUpdate.proposalTime,
                subjectToUpdate.proposalDelay);
            }
            else{
                 proposals[proposalId].passed = false;
                emit ProposalResult(proposalId, false);

            }
            hasOpenProposal[proposalToCheck.proposer]= true;

            proposals[proposalId].isActive = false;



        // Swap and pop

        // set our target index to the users current cred for swap
        uint256 index = proposals[proposalId].activeProposalsIndex;

        // check if index is last in array
        if (index != ActiveProposals.length -1) {
            // if it is not we let the last item take its spot
            ActiveProposals[index] = ActiveProposals[ActiveProposals.length - 1];
        
            // update the index in our mapping 
            proposals[ActiveProposals[index]].activeProposalsIndex= index;
            emit IndexChange(ActiveProposals[index], index);
        }
        
        proposals[proposalId].activeProposalsIndex = 0;
        ActiveProposals.pop();
        


        }
    }

    function setProposalCanceled(uint256 _propId) external  {
        require(proposals[_propId].proposer == msg.sender, "User did not propose this");
        require(proposals[_propId].isActive == true, "This proposal is not active");

       
        // Swap and pop

        // set our target index to the users current cred for swap
        uint256 index = proposals[_propId].activeProposalsIndex;

        // Avoid the for loop if somehow the list is empty (we dont want to do anything anyway)
        require(ActiveProposals.length > 0, "There are no active Proposals");

        // check if index is last in array
        if (index != ActiveProposals.length -1) {
            // if it is not we let the last item take its spot
            ActiveProposals[index] = ActiveProposals[ActiveProposals.length - 1];
        
            // update the index in our mapping 
            proposals[ActiveProposals[index]].activeProposalsIndex= index;
            emit IndexChange(ActiveProposals[index], index);
        }
        proposals[_propId].isActive= false;
        proposals[_propId].activeProposalsIndex = 0;
        ActiveProposals.pop();
        emit ProposalResult(_propId, false);




    }






    // Only Owner Funcitons
    function setAutomationRegistry(address _contractAddress) external onlyOwner {
        AutomationContract= ChainlinkAutomationInterface(_contractAddress);
        AutomationContractAddress= _contractAddress;

    }

    function setlearntgetherReviewer(address _contractAddress) external onlyOwner {
        ReviewerContract= learntgetherReviewerInterface(_contractAddress);

    }

    function setFee(uint256 _feePrice) external onlyOwner {
        proposalFeeInLink= _feePrice;
    }

    function setUpkkepId(uint256 _upkeepId) external onlyOwner {
        upkeepId= _upkeepId;

    }
    function setProposalCounter(uint256 _count) external onlyOwner {
        proposalCounter= _count;

    }

    // To be used for testing/to unclog active proposal
    function setProposalInactive(uint256 _proposalId) external onlyOwner {
       proposals[_proposalId].isActive= false;

    }

    function setMaxProposalTime(uint256 _mpt) external onlyOwner {
       maxProposalTime= _mpt;

    }
    function setMaxReviewTime(uint256 _mrt) external onlyOwner {
       maxReviewTime= _mrt;

    }




    // Getters
    function getSubjectExists(string memory _subjectName) external view returns (bool){
            return subjects[_subjectName].creator != address(0);

    }
    function getSubjectReviewTime(string memory _subjectName) external view returns (uint256 reviewTime){
            require(subjects[_subjectName].creator!= address(0), "Subject Does Not Exsist");
            return subjects[_subjectName].reviewTime;

    }
    function getSubjectConsensousTypes (string memory _subjectName) external view returns (string[]memory consenousTypes){
            require(subjects[_subjectName].creator!= address(0), "Subject Does Not Exsist");
            return subjects[_subjectName].consenousTypes;

    }
    function getSubjectReviewParams (string memory _subjectName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded){
            require(subjects[_subjectName].creator!= address(0), "Subject Does Not Exsist");
            return(subjects[_subjectName].numReviewsForAcceptance, subjects[_subjectName].credsNeededForReview, subjects[_subjectName].percentAcceptsNeeded);
    }


    function getSubjectInfo(string memory _subjectName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded, uint256 reviewTime, string[] memory consenousTypes){
        require(subjects[_subjectName].creator!= address(0), "Subject Does Not Exsist");
        return(subjects[_subjectName].numReviewsForAcceptance, subjects[_subjectName].credsNeededForReview, subjects[_subjectName].percentAcceptsNeeded, subjects[_subjectName].reviewTime, subjects[_subjectName].consenousTypes);
    
    }
    function getPoroposalConesnous(uint256 _proposalId) external view returns (string[]memory consenousTypes){
            require(proposals[_proposalId].proposer!= address(0), "Proposal Does Not Exsist");
            return proposals[_proposalId].consenousTypes;

    }

    function getProposalVote(address _address, uint256 _proposalId ) external view returns (uint256 approveVotes, uint256 approveCreds, uint256 denyVotes, uint256 denyCreds, bool ) {
        // checks if a person has voted not what they voted for. To check what they coted for will need to use 
        return (proposals[_proposalId].approveVotes, proposals[_proposalId].approveCreds, proposals[_proposalId].denyVotes, proposals[_proposalId].denyCreds, proposals[_proposalId].votes[_address]);
    }
    function getProposalResults( uint256 _proposalId ) external view returns (bool isActive, bool passed ) {

        return ( proposals[_proposalId].isActive, proposals[_proposalId].passed);
    }
    
    function getActiveProposalsLength()external view returns(uint256){
        return(ActiveProposals.length);
    }

    function getActiveProposalIndex(uint256 _propId)external view returns(uint256){
        return(proposals[_propId].activeProposalsIndex);
    }
    function getNumberReviewsForAcceptance( string memory _subjectName) external view returns(uint256){
        return subjects[_subjectName].numReviewsForAcceptance ;
    }








    // DEVONLY DO Not Use These Functions in Produciton Ensure they are Removed or Commented Out 

    function setSubjectProposalTime(string memory _subjectName,uint256 _pt) external onlyOwner {
       subjects[_subjectName].proposalTime = _pt;

    }
    function setSubjectReviewTime(string memory _subjectName,uint256 _rt) external onlyOwner {
       subjects[_subjectName].reviewTime = _rt;

    }






}