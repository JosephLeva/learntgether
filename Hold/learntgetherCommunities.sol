// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";


interface learntgetherMembersInterface{
    function getIsMember( address _memberAddress, string memory _communitiesName) external view returns (bool);
    function getMemberCreds(address _memberAddress, string memory _communitiesName) external view returns (uint256 creds);
    
    }


contract learntgetherCommunities{

    struct Community  {
        address creator;
        uint256 numReviewsForAcceptance;
        uint256 credsNeededForReview;
        uint256 percentAcceptsNeeded;
        uint256 consenousTime;
        string[] consenousTypes;
        bool isInviteOnly; // if true only users with invites can join. Must be invited by the creator
    }

    struct CommunityProposalParam{
        uint256 minCredsToProposeVote;        // Minimum creds needed to propose a vote
        uint256 minCredsToVote;               // Minimum creds required to vote
        uint256 maxCredsCountedForVote;       // Maximum creds that can be counted for a vote
        uint256 minProposalVotes;
        uint256 proposalTime;
        uint256 proposalDelay;
    }
    mapping(string => Community) public communities;
    mapping(string => CommunityProposalParam) public communityProposalParams;

    string[] public CommunityNames;


    struct communityProp{
        uint256 numReviewsForAcceptance;
        uint256 credsNeededForReview;
        uint256 percentAcceptsNeeded;
        uint256 consenousTime;
        string[] consenousTypes;
        bool isInviteOnly;
    }

    struct ProposalProp{
        uint256 minCredsToProposeVote;        // Minimum creds needed to propose a vote
        uint256 minCredsToVote;               // Minimum creds required to vote
        uint256 maxCredsCountedForVote;       // Maximum creds that can be counted for a vote
        uint256 minProposalVotes;
        uint256 proposalTime;
        uint256 proposalDelay;
    }
    mapping(uint256=> communityProp) public communityParamProposals;
    mapping(uint256=> ProposalProp) public propParamProposals;



    struct Proposal {
        address proposer;
        string communityName;
        uint256 timestamp;
        uint256 propType; // 1 for community 2 for proposal 3 for other (not used yet)
        uint256 activeProposalsIndex;
        uint256 approveVotes;
        uint256 denyVotes;
        uint256 approveCreds;
        uint256 denyCreds;
        mapping(address => bool) votes; // to track which members have voted true for approve false for deny
        bool isActive;
        bool passed;
    }
    
    mapping(uint256 => address) public CustomProposals; // For Custom Proposals. Use Event Logs index to upkeep on target contract
        // Custom proposalId => address of contract to upkeep

    uint256 proposalCounter;
    mapping(uint256=> Proposal) public proposals;

    mapping(string=> uint256[]) public CommunityProposals;

    uint256[] ActiveProposals;
    uint256 maxProposalTime;
    uint256 maxConsenousTime;

    mapping(address=>bool)hasOpenProposal;



    address private owner;
    uint256 public fee;

    learntgetherMembersInterface public MemberContract;

    // Mumbai 0x57A4a13b35d25EE78e084168aBaC5ad360252467

    uint256 public upkeepId;
    constructor(uint256 _feePrice) {
        owner = msg.sender;


        fee = _feePrice;

        // Array Time Dependent variables set to 3 months by default can be changed by setters
        maxProposalTime = 7890000;
        maxConsenousTime = 7890000;

        proposalCounter = 1;
        // ensure Nothing can get in the 0 array spot
        ActiveProposals.push(0);
    }


    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier proposalRequirements(string memory _communityName){

     
        // Ensure the community exists
        require(communities[_communityName].creator != address(0), "Community doesn't exist");
        // Ensure the proposer does not have an open proposal
        require(!hasOpenProposal[msg.sender], "User has Open Review, Please wait untill it is processed.");
        // Ensure the proposer is a member of the communities and has enough creds

        require(MemberContract.getIsMember(msg.sender, _communityName) == true, "You are not a member for this community.");
        //Make sure creds are enough to propose
        
        require(MemberContract.getMemberCreds(msg.sender, _communityName) >= communityProposalParams[_communityName].minCredsToProposeVote, "Insufficient creds to propose.");
        // Ensure the proposer has paid the fee to cover upkeep 

        require(msg.value == fee, "Must send proposal fee");
        _;
    }

    // Events 
    
    event CommunityCreated(string indexed communityName, address creator, uint256 consenousTime, bool isInviteOnly);
    event CommunityInfo(string indexed communityName, uint256 numReviewsForAcceptance, uint256 credsNeededForReview, uint256 percentAcceptsNeeded);
    event CommunityConesousTypes(string indexed communityName, string[]consenousTypes);
    event CommunityProposalParams(string indexed communityName, uint256 minCredsToProposeVote, uint256 minCredsToVote, uint256 maxCredsCountedForVote, uint256 minProposalVotes, uint256 proposalTime, uint256 proposalDelay);  

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string indexed communityName, uint256 timestamp, uint256 propType);
    event CommunityProposalCreated(uint256 indexed proposalId, uint256 numReviewsForAcceptance, uint256 credsNeededForReview, uint256 percentAcceptsNeeded, uint256 consenousTime, string[] consenousTypes, bool isInviteOnly);
    event PropParamProposalCreated(uint256 indexed proposalId, uint256 minCredsToProposeVote, uint256 minCredsToVote, uint256 maxCredsCountedForVote, uint256 minProposalVotes, uint256 proposalTime, uint256 proposalDelay);
    event CustomProposalCreated(address indexed contractAddress, uint256 indexed proposalId, address indexed proposer);
    event Voted(uint256 indexed proposalId, address indexed voter, bool indexed voteChoice, uint256 credsToCount);
    event IndexChange(uint256 proposalId, uint256 activeProposalsIndex);
        
    event ProposalResult(uint256 indexed proposalId, bool indexed passed);
    event CustomProposalResult(address indexed contractAddress, uint256 indexed proposalId, bool indexed passed);

    /*
        * @notice Creates a new community object in the system.
        * @dev Ensures the communities does not already exist.
        * @param _communityName Name of the communities to be created.
        * @param _numReviewsForAcceptance Number of reviews required for acceptance.
        * @param _credsNeededForReview Creds required for a review.
        * @param _percentAcceptsNeeded Percentage of accepts needed.
        * @param _minCredsToProposeVote Minimum creds required to propose a vote.
        * @param _minCredsToVote Minimum creds required to vote.
        * @param _maxCredsCountedForVote Maximum creds that can be counted for a vote.
        * @param _minProposalVotes Minimum proposal votes required.
    */
    function createCommunity(
        string memory _communityName,
        uint256 _numReviewsForAcceptance,
        uint256 _credsNeededForReview,
        uint256 _percentAcceptsNeeded,
        uint256 _consenousTime,
        string[] memory _consenousTypes,
        bool _isInviteOnly,
        uint256 _minCredsToProposeVote,
        uint256 _minCredsToVote,
        uint256 _maxCredsCountedForVote,
        uint256 _minProposalVotes,
        uint256 _proposalTime,
        uint256 _proposalDelay
    ) public  {

        // Ensure Community Does not exsist

        require(communities[_communityName].creator == address(0), "Community already exists.");


        // Adjust our array time dependent variables to avoid clog 
        if (_consenousTime > maxConsenousTime){
            _consenousTime = maxConsenousTime;
        }

        if (_proposalTime > maxProposalTime){
            _proposalTime = maxProposalTime;
        }


        // Add communities community params


        communities[_communityName].creator = msg.sender;
        communities[_communityName].numReviewsForAcceptance = _numReviewsForAcceptance;
        communities[_communityName].credsNeededForReview = _credsNeededForReview;
        communities[_communityName].percentAcceptsNeeded = _percentAcceptsNeeded;
        communities[_communityName].consenousTime= _consenousTime;
        communities[_communityName].consenousTypes = _consenousTypes;
        communities[_communityName].isInviteOnly = _isInviteOnly;



        // Add commumnuity proposal params
        communityProposalParams[_communityName].minCredsToProposeVote = _minCredsToProposeVote;
        communityProposalParams[_communityName].minCredsToVote = _minCredsToVote;
        communityProposalParams[_communityName].maxCredsCountedForVote = _maxCredsCountedForVote;
        communityProposalParams[_communityName].minProposalVotes = _minProposalVotes;
        communityProposalParams[_communityName].proposalTime = _proposalTime;
        communityProposalParams[_communityName].proposalDelay = _proposalDelay;


        CommunityNames.push(_communityName);
        
        emit CommunityCreated(_communityName, msg.sender, _consenousTime, _isInviteOnly);
        emit CommunityInfo(_communityName, _numReviewsForAcceptance, _credsNeededForReview, _percentAcceptsNeeded);
        emit CommunityConesousTypes(_communityName, _consenousTypes);
        emit CommunityProposalParams(_communityName, _minCredsToProposeVote, _minCredsToVote, _maxCredsCountedForVote, _minProposalVotes, _proposalTime, _proposalDelay);


    }


    /*
        * @notice Creates a new proposal object in the system.
        * @dev Ensures the proposal does not already exist.
        * @param _communityName Name of the communities to be updated.
        * @param _propType Type of proposal to be created.
        * @return proposalCounter ID of the proposal.
    */
    function createProposal(string memory _communityName, uint256 _propType) internal returns(uint256){
        // Create a new proposal using the proposalCounter as an ID

        Proposal storage prop = proposals[proposalCounter];
        prop.proposer = msg.sender;
        prop.communityName= _communityName;
        prop.timestamp= block.timestamp;
        prop.activeProposalsIndex= ActiveProposals.length; //do not need a -1 because we have not added to array yet
        prop.propType= _propType;
        prop.isActive= true;

        emit ProposalCreated(proposalCounter, msg.sender, _communityName, block.timestamp, _propType);


        return proposalCounter;

    }

  
    /* 
    * @notice Proposes changes to a communities's parameters. (Type 1)
    * @dev Ensures the communities exists and the proposer meets the requirements. Must Approve LinkFee to Contract before calling.
    * @param _communityName Name of the communities to be updated.
    * @param _numReviewsForAcceptance Number of reviews required for acceptance.
    * @param _credsNeededForReview Creds required for a review.
    * @param _percentAcceptsNeeded Percentage of accepts needed.
    * @param _consenousTime Amount of time for consensus to be reached.
    * @param _consenousTypes Types of consensus to be used.
    * @param _isInviteOnly Boolean indicating if the communities is invite only.
    * @return proposalId ID of the proposal.
    */

    function communityProposal(     
        string memory _communityName,   
        uint256 _numReviewsForAcceptance,
        uint256 _credsNeededForReview,
        uint256 _percentAcceptsNeeded,
        uint256 _consenousTime,
        string[] memory _consenousTypes,
        bool _isInviteOnly
        ) external payable proposalRequirements(_communityName) returns(uint256){


        // Create a new proposal using the proposalCounter as an ID
        communityProp storage comProp = communityParamProposals[proposalCounter];

        // Adjust our array time dependent variables to avoid clog 
        if (_consenousTime > maxConsenousTime){
            _consenousTime = maxConsenousTime;
        }

        // create our generic proposal
        createProposal(_communityName, 1);

        comProp.numReviewsForAcceptance = _numReviewsForAcceptance;
        comProp.credsNeededForReview = _credsNeededForReview;
        comProp.percentAcceptsNeeded = _percentAcceptsNeeded;
        comProp.consenousTime= _consenousTime;
        comProp.consenousTypes = _consenousTypes;
        comProp.isInviteOnly = _isInviteOnly;

        hasOpenProposal[msg.sender]= true;
        ActiveProposals.push(proposalCounter);
        CommunityProposals[_communityName].push(proposalCounter);

        emit CommunityProposalCreated(proposalCounter, _numReviewsForAcceptance, _credsNeededForReview, _percentAcceptsNeeded, _consenousTime, _consenousTypes, _isInviteOnly);
        
        // Increment the proposalCounter
        proposalCounter++;  
        return proposalCounter-1;
    }

    /*
    * @notice Proposes changes to a communities's parameters. (Type 2)
    * @dev Ensures the communities exists and the proposer meets the requirements. Must Approve LinkFee to Contract before calling.
    * @param _communityName Name of the communities to be updated.
    * @param _minCredsToProposeVote Minimum creds required to propose a vote.
    * @param _minCredsToVote Minimum creds required to vote.
    * @param _maxCredsCountedForVote Maximum creds that can be counted for a vote.
    * @param _minProposalVotes Minimum proposal votes required.
    * @param _proposalTime Amount of time for proposal to be active.
    * @param _proposalDelay Amount of time for delay before proposal can be processed.
    * @return proposalId ID of the proposal.
    */

    function PropParamProposal(
        string memory _communityName,
        uint256 _minCredsToProposeVote,
        uint256 _minCredsToVote,
        uint256 _maxCredsCountedForVote,
        uint256 _minProposalVotes,
        uint256 _proposalTime,
        uint256 _proposalDelay
     ) external payable proposalRequirements(_communityName) returns(uint256){
        // Create a new proposal using the proposalCounter as an ID
        ProposalProp storage ppProp = propParamProposals[proposalCounter];

        // Adjust our array time dependent variables to avoid clog 
        if (_proposalTime > maxProposalTime){
            _proposalTime = maxProposalTime;
        }
        // create our generic proposal
        createProposal(_communityName, 2);

        ppProp.minCredsToProposeVote = _minCredsToProposeVote;
        ppProp.minCredsToVote = _minCredsToVote;
        ppProp.maxCredsCountedForVote = _maxCredsCountedForVote;
        ppProp.minProposalVotes = _minProposalVotes;
        ppProp.proposalTime = _proposalTime;
        ppProp.proposalDelay = _proposalDelay;

        emit PropParamProposalCreated(proposalCounter, _minCredsToProposeVote, _minCredsToVote, _maxCredsCountedForVote, _minProposalVotes, _proposalTime, _proposalDelay);
        
        hasOpenProposal[msg.sender]= true;
        ActiveProposals.push(proposalCounter);
        CommunityProposals[_communityName].push(proposalCounter);
        
        // Increment the proposalCounter
        proposalCounter++;  
        return proposalCounter-1;
    }


    /*
    * @notice Proposes changes to a communities's parameters. (Type 3)
    * @dev Ensures the communities exists and the proposer meets the requirements. Must Approve LinkFee to Contract before calling.
    * @param _communityName Name of the communities to be updated.
    * @param _contractAddress Address of the contract to upkeep.
    * @return proposalId ID of the proposal.
    */

    function CustomProposal(
        string memory _communityName,
        address _contractAddress
    )external payable proposalRequirements(_communityName) returns(uint256){
        // create our generic proposal
        createProposal(_communityName, 3);

        // Set the external contract address so 3rd party upkeeps can keep track of it
        CustomProposals[proposalCounter] = _contractAddress;

        emit CustomProposalCreated(_contractAddress, proposalCounter, msg.sender);
        
        hasOpenProposal[msg.sender]= true;
        ActiveProposals.push(proposalCounter);
        
        // Increment the proposalCounter
        proposalCounter++;  
        return proposalCounter-1;

    }




    /*

        * @notice Allows a member to vote on a proposal.
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
        require (block.timestamp >= proposal.timestamp + communityProposalParams[proposal.communityName].proposalDelay && block.timestamp <= proposal.timestamp+ communityProposalParams[proposal.communityName].proposalDelay + communityProposalParams[proposal.communityName].proposalTime, "Not Active Voting Time");

        // Ensure the voter is a member for the communities
        require(MemberContract.getIsMember(msg.sender, proposal.communityName) == true, "You are not a member of this community.");

        // Ensure the voter has not voted before
        require(!proposal.votes[msg.sender], "You have already voted.");


        // Ensure the voter has more creds than the minCredsToVote
        uint256 voterCreds = MemberContract.getMemberCreds(msg.sender, proposal.communityName);

        require(voterCreds >= communityProposalParams[proposal.communityName].minCredsToVote, "Insufficient creds to vote.");


        // Determine the amount of creds to count for the vote
        uint256 credsToCount = (voterCreds > communityProposalParams[proposal.communityName].maxCredsCountedForVote) ? communityProposalParams[proposal.communityName].maxCredsCountedForVote : voterCreds;
        

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

    function checkUpKeep()  external view  returns( bool upkeepNeeded, bytes memory performData ){

        upkeepNeeded = false;
        uint256 lowestId= 0;

        if(ActiveProposals.length > 0){

        uint256 lowestVoteEnd= 0;

        for (uint256 i=1; i < ActiveProposals.length; i++){
             
            // Time of proposal + Amount of time for delay + amoubnt of time proposal active
            uint256 voteEnd= proposals[ActiveProposals[i]].timestamp + communityProposalParams[proposals[ActiveProposals[i]].communityName].proposalDelay + communityProposalParams[proposals[ActiveProposals[i]].communityName].proposalTime;

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
   * @dev Validates that a proposal vote period has ended. If it is we check if the passed. If it does we set our communities values to the proposed ones. Then we set the proposal to inactive and swap-pop the ActiveProposals array
   * @param performData Data from the checkUpKeep function Proposal Id where vote period has ending
    */

    function performUpkeep(bytes calldata _performData) external {
        uint256 proposalId= abi.decode(_performData, (uint256));

        uint256 voteEnd= proposals[proposalId].timestamp + communityProposalParams[proposals[proposalId].communityName].proposalDelay + communityProposalParams[proposals[proposalId].communityName].proposalTime;

        // Proposal Id should never be 0 because we start the counter at 1, it should be after the vote end, and vote end shouldnt be 0 (someone  put in an id that isnt used yet)
        if ( proposalId != 0 && voteEnd <= block.timestamp  && voteEnd != 0){

            Proposal storage proposalToCheck = proposals[proposalId];
            
            // Check if the proposal has more approve votes than deny votes and more approve creds than deny creds or both cred amounts are 0 (when maxCredsCountedForVote is set to 0)
            if ( (proposalToCheck.approveVotes > proposalToCheck.denyVotes) && (proposalToCheck.approveCreds > proposalToCheck.denyCreds || communityProposalParams[proposalToCheck.communityName].maxCredsCountedForVote == 0 ) && (proposalToCheck.approveVotes + proposalToCheck.denyVotes >= communityProposalParams[proposalToCheck.communityName].minProposalVotes) ){
                // Update the communities's variables with the proposal's values
                if (proposalToCheck.propType ==3) {
                    emit CustomProposalResult(CustomProposals[proposalId], proposalId, true);
                }
                else if(proposalToCheck.propType ==1){

                    Community storage communityToUpdate = communities[proposalToCheck.communityName];

                    communityToUpdate.numReviewsForAcceptance = communityParamProposals[proposalId].numReviewsForAcceptance;
                    communityToUpdate.credsNeededForReview = communityParamProposals[proposalId].credsNeededForReview;
                    communityToUpdate.percentAcceptsNeeded = communityParamProposals[proposalId].percentAcceptsNeeded;
                    communityToUpdate.consenousTime = communityParamProposals[proposalId].consenousTime;
                    communityToUpdate.consenousTypes = communityParamProposals[proposalId].consenousTypes;
                    communityToUpdate.isInviteOnly = communityParamProposals[proposalId].isInviteOnly;
                }
                else if(proposalToCheck.propType ==2){
                        
                    CommunityProposalParam storage communityProposalToUpdate = communityProposalParams[proposalToCheck.communityName];

                    communityProposalToUpdate.minCredsToProposeVote = propParamProposals[proposalId].minCredsToProposeVote;
                    communityProposalToUpdate.minCredsToVote = propParamProposals[proposalId].minCredsToVote;
                    communityProposalToUpdate.maxCredsCountedForVote = propParamProposals[proposalId].maxCredsCountedForVote;
                    communityProposalToUpdate.minProposalVotes = propParamProposals[proposalId].minProposalVotes;
                    communityProposalToUpdate.proposalTime = propParamProposals[proposalId].proposalTime;
                    communityProposalToUpdate.proposalDelay = propParamProposals[proposalId].proposalDelay;
                    

                }


                emit ProposalResult(proposalId, true);
                proposals[proposalId].passed = true;

            }
            else{
                 proposals[proposalId].passed = false;
                emit ProposalResult(proposalId, false);

                if (proposalToCheck.propType ==3) {
                    emit CustomProposalResult(CustomProposals[proposalId], proposalId, false);
                }

            }
            //Allow user to propose again
            hasOpenProposal[proposalToCheck.proposer]= true;

            // Set proposal to inactive
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

    /*
        * @notice Allows a member to cancel a proposal. 
        * @dev Ensures the proposal exists and the member is the proposer.
        * @param _propId ID of the proposal to cancel.
    */

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


    /*
        * @notice Allows a member to join a communities.
        * @dev Ensures the communities exists and the member meets the requirements.
        * @param _communityName Name of the communities to join.
    */
    function changeCommunityOwner(string memory _communityName, address _newOwner) external {
        require(communities[_communityName].creator == msg.sender, "User is not the owner of this community");
        communities[_communityName].creator = _newOwner;
    }






    // Only Owner Funcitons

    function setlearntgetherMembersContract(address _contractAddress) external onlyOwner {
        MemberContract= learntgetherMembersInterface(_contractAddress);

    }

    function setFee(uint256 _feePrice) external onlyOwner {
        fee= _feePrice;
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
    function setMaxConsenousTime(uint256 _mrt) external onlyOwner {
       maxConsenousTime= _mrt;

    }



    // Getters
    function getCommunityExists(string memory _communityName) external view returns (bool){
        return communities[_communityName].creator != address(0);

    }
    function getCommunityConsensousTime(string memory _communityName) external view returns (uint256 consenousTime){
        require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
        return communities[_communityName].consenousTime;

    }
    function getCommunityConsensousTypes (string memory _communityName) external view returns (string[]memory consenousTypes){
        require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
        return communities[_communityName].consenousTypes;

    }
    function getCommunityReviewParams (string memory _communityName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded){
            require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
            return(communities[_communityName].numReviewsForAcceptance, communities[_communityName].credsNeededForReview, communities[_communityName].percentAcceptsNeeded);
    }
    function getCommunityInfo(string memory _communityName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded, uint256 consenousTime, string[] memory consenousTypes){
        require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
        return(communities[_communityName].numReviewsForAcceptance, communities[_communityName].credsNeededForReview, communities[_communityName].percentAcceptsNeeded, communities[_communityName].consenousTime, communities[_communityName].consenousTypes);
    
    }
    function getCommunityProposalInfo(string memory _communityName) external view returns (uint256 minCredsToProposeVote,uint256 minCredsToVote,uint256 maxCredsCountedForVote, uint256 minProposalVotes, uint256 proposalTime, uint256 proposalDelay){
        require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
        return(communityProposalParams[_communityName].minCredsToProposeVote, communityProposalParams[_communityName].minCredsToVote, communityProposalParams[_communityName].maxCredsCountedForVote, communityProposalParams[_communityName].minProposalVotes, communityProposalParams[_communityName].proposalTime, communityProposalParams[_communityName].proposalDelay);
    }
    function getPoroposalConesnous(uint256 _proposalId) external view returns (string[]memory consenousTypes){
            require(proposals[_proposalId].propType!= 1, "Proposal Does Not Exsist or is not the Right Type");
            return communityParamProposals[_proposalId].consenousTypes;

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
    function getNumberReviewsForAcceptance( string memory _communityName) external view returns(uint256){
        return communities[_communityName].numReviewsForAcceptance ;
    }
    function getCommunityOwner(string memory _communityName) external view returns (address){
        require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
        return communities[_communityName].creator;
    }
    function getCommunityIsOwner(string memory _communityName) external view returns (bool){
        require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
        return communities[_communityName].isInviteOnly;
    }
    function getCommunityIsInviteOnly(string memory _communityName) external view returns(bool){
        require(communities[_communityName].creator!= address(0), "Community Does Not Exsist");
        return communities[_communityName].isInviteOnly;
    }

    function getProposalType(uint256 _proposalId) external view returns(uint256){
        return proposals[_proposalId].propType;
    }
    function getCommunityProposal(uint256 _proposalId) external view returns(uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded, uint256 consenousTime, string[] memory consenousTypes, bool isInviteOnly){
        require(this.getProposalType(_proposalId) == 1, "Proposal is not a community proposal");
        return (communityParamProposals[_proposalId].numReviewsForAcceptance, communityParamProposals[_proposalId].credsNeededForReview, communityParamProposals[_proposalId].percentAcceptsNeeded, communityParamProposals[_proposalId].consenousTime, communityParamProposals[_proposalId].consenousTypes, communityParamProposals[_proposalId].isInviteOnly);
    }


    function getPropParamProposal(uint256 _proposalId) external view returns(uint256 minCredsToProposeVote,uint256 minCredsToVote,uint256 maxCredsCountedForVote, uint256 minProposalVotes, uint256 proposalTime, uint256 proposalDelay){
        require(this.getProposalType(_proposalId) == 2, "Proposal is not a Prop Param proposal");
        return (propParamProposals[_proposalId].minCredsToProposeVote, propParamProposals[_proposalId].minCredsToVote, propParamProposals[_proposalId].maxCredsCountedForVote, propParamProposals[_proposalId].minProposalVotes, propParamProposals[_proposalId].proposalTime, propParamProposals[_proposalId].proposalDelay);
    }

    function getCustomProposal(uint256 _proposalId) external view returns(address){
        require(this.getProposalType(_proposalId) == 3, "Proposal is not a Custom proposal");
        return (CustomProposals[_proposalId]);
    }



    // DEVONLY DO Not Use These Functions in Produciton Ensure they are Removed or Commented Out 

    // function setCommunityProposalTime(string memory _communityName,uint256 _pt) external onlyOwner {
    //    communityProposalParams[_communityName].proposalTime = _pt;

    // }
    // function setCommunityConsenousTime(string memory _communityName,uint256 _rt) external onlyOwner {
    //    communities[_communityName].consemnousTime = _rt;

    // }






}