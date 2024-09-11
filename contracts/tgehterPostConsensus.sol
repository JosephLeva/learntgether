// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";




interface tgetherCommunityConsensusInterface{
    function getCCParamsExist(string memory _communityName) external view returns (bool);
    function getCommunityConsensousTime(string memory _communityName) external view returns (uint256);
    function getCommunityConsensousTypes (string memory _communityName) external view returns (string[] memory consensusTypes);
    function getCommunityReviewParams (string memory _communityName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded);
}

interface tgetherMembersInterface{
    function getMemberCreds(address _memberAddress, string memory _communityName) external view returns (uint256 creds); 
}

interface tgetherPostsInterface{
    function getPostExists(uint256 _postId) external view returns(bool);
}

interface tgetherFundInterface{
        function fundUpkeep(address _contractAddress) external payable returns (bool);
    }

contract tgetherPostConsensus is AutomationCompatibleInterface{

    struct CommunitySubmission{
        string communityName;
        string consensusType; 
        uint256 timestamp;
        uint256 consensusTime;
    }
    mapping(uint256=> CommunitySubmission) public CommunitySubmissions; //csCounter=> SubjectSubmission
    mapping (uint256=>uint256) public CommunitySubmissionToPost; // communitySubmissionId => postID
    uint256 public csCounter;

    // mapping allows us to retrieve the community submissions for a specifc post
    mapping( uint256  => uint256[] ) public PostSubmissionList; // postId => communitySubmissionId

    // mapping allows us to retrieve the post submissions for a specific community
    mapping(uint256=> mapping(string => uint256)) public postCommunities; // postId => communityName => communitySubmissionId



    struct Review{
        address member;
        string content;
        uint256 consensus;
        string consensusType;
        uint256 creds;
        bool afterConsensus;
    }


    mapping(uint256=> Review) public reviews; //reviewId => Review
    uint256 public reviewCounter;

    mapping(uint256=> uint256[]) public submmisionReviews; //communitySubmissionId => reviewId[]



    string[] defaultConsenousTypes = [ "Consensous Pending", "Accepted", "Rejected"];

    // array of active reviews ordered off chain by timestamp
    uint256[] public ActiveSubmissions;

    // holds index information outside of asset
    mapping(uint256=> uint256) public ActiveSubmissionsIndexes; //SubjectSubmissionsId => index in ActiveSubmissions array


    // mapping allows us to track if someone has already reviewed a post (avoid spam)
    mapping(uint256 => mapping(address => bool)) public hasReviewed; //communitySubmissionId => memberAddress => bool



    address AutomationContractAddress; 

    tgetherCommunityConsensusInterface public CommunityConsensusContract; 
    tgetherMembersInterface public MembersContract; 
    tgetherPostsInterface public PostsContract;

    uint256 public consensusFee;

    uint256 public maxReviews;  //We have a max reviews value to ensure to avoid spam reviews clogging active proposals
    address owner;
    tgetherFundInterface public FundContract;


        // Modifiers

    modifier ownerOrAutomation() {
        require(msg.sender == owner || msg.sender == AutomationContractAddress, "Not the contract owner or Automation Forwarder Contract");
        _;
    }   

    modifier ownerOnly() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }   

    constructor(address _CommunityConsensusAddress, address _MembersContract, address _PostContract, uint256 _fee, address  _fundAddress ) {
        owner= msg.sender;

        CommunityConsensusContract= tgetherCommunityConsensusInterface(_CommunityConsensusAddress);
        MembersContract= tgetherMembersInterface(_MembersContract);
        PostsContract= tgetherPostsInterface(_PostContract);

        consensusFee = _fee;
        FundContract = tgetherFundInterface(_fundAddress);

        reviewCounter= 1;
        csCounter = 1;
        // so no indexes can be 0
        ActiveSubmissions.push(0);
        maxReviews = 100;



    }



    

    // Events
    event PostSubmission(uint256 indexed postId, uint256 indexed communitySubmissionId);
    event CommunitySubmitted(uint256 indexed communtiySubmissionId, string indexed communityName, uint256 timestamp, uint256 consensusTime);
    event ReviewCreated(uint256 indexed reviewId, uint256 indexed communitySubmissionId, address indexed member);
    event ReviewSubmitted(uint256 indexed reviewId, string consensus, uint256 creds, string content, bool afterConsensus);
    event ConsensusUpdated(uint256 indexed communitySubmissionId, uint256 postId, string newConsensus);
    event ActiveSubmissionsIndexUpdated(uint256 communitySubmissionId, uint256 index);
    event Keywords(uint256 postId, string keyword);

    


    /*
    @notice Submits a post to a community for review
    @dev Checks if the post exists, if the post has already been submitted to the community, and if the community exists
    @param _postId uint256 post id to be submitted
    @param _communityName string name of the community to be updated.
    */

    /**
    * DISCLAIMER:
    * By signing and submitting this transaction, you acknowledge that you are contributing funds to a shared pool 
    * rather than directly funding your individual upkeep execution. This pooling mechanism is designed to optimize 
    * resource allocation and minimize transaction costs.
    *
    * Please be aware that price volatility may affect the availability of funds required to process your upkeep. 
    * In such cases, your upkeep may not be automatically executed. However, you retain the option to manually 
    * execute your upkeep at any time by calling the manualUpkeepPost function.
    *
    * Ensure you understand the risks associated with price fluctuations and the potential impact on the automatic 
    * processing of your upkeep.
    */

   function submitToCommunity(uint256 _postId, string memory _communityName) external payable returns (uint256 )  {
        // Check if the post exists
        require(PostsContract.getPostExists(_postId), "Post does not exist");
        require(CommunityConsensusContract.getCCParamsExist(_communityName), "Community Consensus Params don't exist");
        uint256 consensusTime = CommunityConsensusContract.getCommunityConsensousTime(_communityName);

        CommunitySubmission memory newCommunitySubmission = CommunitySubmission({
            communityName: _communityName,
            timestamp: block.timestamp,
            consensusTime: consensusTime,
            consensusType: ""
        });

        if (consensusTime == 0 ){
            // create a new community submission where no active conesouse is needed default consesous type is "No Review"
            newCommunitySubmission.consensusType= "No Consensous";
        } else{
            //  we only charge a fee if a consensus is Needed
            require(msg.value == consensusFee, "Must send proposal fee");

        bool _isFunded = FundContract.fundUpkeep{value: msg.value}(address(this));
        if (_isFunded) {
            newCommunitySubmission.consensusType= defaultConsenousTypes[0];
            // Add the post to the active reviews array
            ActiveSubmissions.push(csCounter);
            ActiveSubmissionsIndexes[csCounter] = ActiveSubmissions.length - 1;
            emit ActiveSubmissionsIndexUpdated(csCounter, ActiveSubmissions.length - 1);
        }
        }

        // Set Various Search Mappings
        CommunitySubmissions[csCounter] = newCommunitySubmission;
        PostSubmissionList[_postId].push(csCounter);
        CommunitySubmissionToPost[csCounter] = _postId;
        postCommunities[_postId][_communityName] = csCounter;

        emit PostSubmission(_postId, csCounter);

        emit CommunitySubmitted(csCounter, _communityName, block.timestamp, consensusTime);

        csCounter++;

        return csCounter-1;


    }


    /*
    * @notice Adds a review to the reviews array for a specific post
    * @notice Consous value 2 will accept a post anything else will reject it
    * @dev Review must be submitted by an active member. ConsenouType List is a mock concatonation of the default array with the community owned array
    * @param _postId uint256 post id review is attached to 
    * @param _content string content of the review content
    * @param _consensus uint256 the index of the consensus type of the mock concatonation of the default array with the community owned array 
    */


    function submitReview(uint256 _communitySubmissionId, string memory _content, uint256 _consensus) public returns(uint256){
        // Check if the submission exists
        require(CommunitySubmissions[_communitySubmissionId].timestamp != 0, "Submission does not exist");

                
        // Requirement must be in bounds of default array +custom community array 
        string[] memory  consensusTypes= CommunityConsensusContract.getCommunityConsensousTypes( CommunitySubmissions[_communitySubmissionId].communityName );
        require(_consensus > 1, "Consensous mus be greater than 1");
        require(_consensus <= defaultConsenousTypes.length + consensusTypes.length , "Consensous Not In Bounds");
        

        // Avoid Spam
        require(!hasReviewed[_communitySubmissionId][msg.sender], "You've already reviewed this post");
        hasReviewed[_communitySubmissionId][msg.sender] = true;


        // Check if the member has the necessary credentials
        uint256 creds = MembersContract.getMemberCreds(msg.sender, CommunitySubmissions[_communitySubmissionId].communityName);
        
        string memory consensusType;

        if (_consensus <= defaultConsenousTypes.length) {
            consensusType = defaultConsenousTypes[_consensus - 1]; // Adjust index by 1 
        } else {
            consensusType = consensusTypes[_consensus - defaultConsenousTypes.length - 1]; // Adjust index by 1
        }

        bool _afterConsensus = false;
        
        if (block.timestamp >= CommunitySubmissions[_communitySubmissionId].timestamp + CommunitySubmissions[_communitySubmissionId].consensusTime) {
            _afterConsensus = true;
        }

        // Create a new review
        Review memory newReview = Review({
            member: msg.sender,
            content: _content,
            consensus: _consensus,
            consensusType: consensusType,
            creds: creds,
            afterConsensus: _afterConsensus
        });


        reviews[reviewCounter] = newReview;
        submmisionReviews[_communitySubmissionId].push(reviewCounter);

        emit ReviewCreated(reviewCounter,_communitySubmissionId, msg.sender);


        // Add the review to the post's reviews
        emit ReviewSubmitted(reviewCounter, consensusType, creds, _content, _afterConsensus);

        reviewCounter++;

        return reviewCounter-1;


    }

    // Internal function to determine if a submission needs upkeep
    /**
     * @notice Checks if a specific submission requires upkeep based on its review period expiration and review consensus.
     * @param submissionId The ID of the submission to check for upkeep.
     * @return upkeepNeeded A boolean indicating whether the upkeep is needed for the given submission.
     * @return resultId An integer indicating the result of the review process: positive for acceptance, negative for rejection.
     */
    function _checkSubmissionForUpkeep(uint256 submissionId) internal view returns (bool upkeepNeeded, int256 resultId) {
        upkeepNeeded = false;
        resultId = 0;

        // Check if the review period has expired for the submission
        uint256 reviewPeriodExpired = CommunitySubmissions[submissionId].timestamp + CommunitySubmissions[submissionId].consensusTime;

        if (reviewPeriodExpired <= block.timestamp) {
            upkeepNeeded = true;
            resultId = _processReviews(submissionId);
        }
    }

    // Internal function to process reviews and determine consensus
    /**
     * @notice Processes the reviews for a given submission to determine whether it is accepted or rejected.
     * @param submissionId The ID of the submission being reviewed.
     * @return resultId An integer representing the outcome of the review process: positive for accepted, negative for rejected.
     */
    function _processReviews(uint256 submissionId) internal view returns (int256 resultId) {
        (uint256 numReviewsForAcceptance, uint256 credsNeededForReview, uint256 percentAcceptsNeeded) =
            CommunityConsensusContract.getCommunityReviewParams(CommunitySubmissions[submissionId].communityName);

        uint256[] memory reviewList = submmisionReviews[submissionId];

        // Check if there are enough reviews
        if (reviewList.length < numReviewsForAcceptance) {
            return int256(submissionId) * -1; // Rejected due to insufficient reviews
        }

        uint256 acceptedReviewsCount = 0;
        uint256 totalCount = 0;
        uint256 upperbound = reviewList.length > maxReviews ? maxReviews : reviewList.length;

        // Loop through the reviews to count the number of accepted and total reviews
        for (uint256 i = 0; i < upperbound; i++) {
            (uint256 reviewConsensus, uint256 reviewCreds) = this.getReviewConsenous(reviewList[i]);
            if (reviewCreds >= credsNeededForReview) {
                totalCount++;
                if (reviewConsensus == 2) { // Assuming 2 indicates "Accepted"
                    acceptedReviewsCount++;
                }
            }
        }

        // Determine the acceptance status based on review counts
        if (totalCount == 0 || totalCount < numReviewsForAcceptance) {
            return int256(submissionId) * -1; // Rejected due to insufficient valid reviews
        }

        uint256 percentAcceptedByCount = (acceptedReviewsCount * 100) / totalCount;
        return percentAcceptedByCount >= percentAcceptsNeeded ? int256(submissionId) : int256(submissionId) * -1;
    }

    // Internal function to perform upkeep on a submission
    /**
     * @notice Updates the consensus status of a submission and manages the active submissions list.
     * @param resultId An integer indicating the result of the review process: positive for acceptance, negative for rejection.
     */
    function _performSubmissionUpkeep(int256 resultId) internal {
        bool isAccepted = resultId > 0;
        uint256 submissionId = isAccepted ? uint256(resultId) : uint256(-resultId);

        // Update the consensus status and manage the active submissions list
        if (
            submissionId != 0 &&
            block.timestamp >= CommunitySubmissions[submissionId].timestamp + CommunitySubmissions[submissionId].consensusTime &&
            CommunitySubmissions[submissionId].timestamp != 0 &&
            ActiveSubmissionsIndexes[submissionId] != 0
        ) {
            CommunitySubmissions[submissionId].consensusType = isAccepted ? defaultConsenousTypes[1] : defaultConsenousTypes[2];
            emit ConsensusUpdated(submissionId, CommunitySubmissionToPost[submissionId], CommunitySubmissions[submissionId].consensusType);

            // Swap and pop logic for removing the submission from active submissions
            uint256 index = ActiveSubmissionsIndexes[submissionId];
            if (index != ActiveSubmissions.length - 1) {
                ActiveSubmissions[index] = ActiveSubmissions[ActiveSubmissions.length - 1];
                ActiveSubmissionsIndexes[ActiveSubmissions[ActiveSubmissions.length - 1]] = index;
                emit ActiveSubmissionsIndexUpdated(ActiveSubmissions[index], index);
            }
            ActiveSubmissionsIndexes[submissionId] = 0;
            ActiveSubmissions.pop();
        }
    }

    // Automated checkUpkeep function
    /*
     * @notice Checks if there are any submissions that need upkeep based on their review periods.
     * @param checkData Additional data passed to the function (not used in this implementation).
     * @return upkeepNeeded A boolean indicating if upkeep is needed.
     * @return performData Encoded data indicating the submission ID to be processed during performUpkeep.
     */

    function checkUpkeep(bytes calldata /* checkData */)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded = false;
        uint256 lowestId = 0;

        if (ActiveSubmissions.length > 0) {
            uint256 lowestTimestamp = 0;

            // Find the lowest expired submission
            for (uint256 i = 1; i < ActiveSubmissions.length; i++) {
                uint256 submissionId = ActiveSubmissions[i];
                uint256 reviewPeriodExpired = CommunitySubmissions[submissionId].timestamp + CommunitySubmissions[submissionId].consensusTime;

                // Ensure review period is expired and is the lowest in the list
                if (reviewPeriodExpired <= block.timestamp && (reviewPeriodExpired <= lowestTimestamp || lowestTimestamp == 0)) {
                    upkeepNeeded = true;
                    lowestId = submissionId;
                    lowestTimestamp = reviewPeriodExpired;
                }
            }

            int256 resultId;

            if (lowestId != 0) {
                (upkeepNeeded,resultId) = _checkSubmissionForUpkeep(lowestId);
                performData = abi.encode(resultId);
            }
        }
    }

    // Automated performUpkeep function
    /**
     * @notice Performs the upkeep on a specific submission based on the result data from checkUpkeep.
     * @param performData Encoded data containing the submission result ID (positive for accepted, negative for rejected).
     */
    function performUpkeep(bytes calldata performData) external ownerOrAutomation {
        require(performData.length == 32, "Invalid performData length");
        int256 resultId = abi.decode(performData, (int256));
        _performSubmissionUpkeep(resultId);
    }

    // Manual upkeep function for processing a specific submission manually
    /**
     * @notice Manually processes upkeep for a specific submission to update its consensus status.
     * @param submissionId The ID of the submission to manually process for upkeep.
     */
    function manualUpkeepPost(uint256 submissionId) external ownerOrAutomation {
        require(submissionId != 0, "Invalid submission ID");
        require(
            CommunitySubmissions[submissionId].timestamp != 0 && 
            ActiveSubmissionsIndexes[submissionId] != 0, 
            "Submission does not exist or is not active"
        );

        // Use the same logic to check if the specific submission needs upkeep
        (bool upkeepNeeded, int256 resultId) = _checkSubmissionForUpkeep(submissionId);

        require(upkeepNeeded, "Upkeep not needed for this submission");

        // Perform upkeep manually
        _performSubmissionUpkeep(resultId);
    }





            
    // Getters



    function getCommunitySubmission(uint256 _communitySubmissionId) external view returns(CommunitySubmission memory){
        return CommunitySubmissions[_communitySubmissionId];
    }
    function getReviewsForSubmission(uint256 _submissionId) public view returns (uint256[] memory) {
        return submmisionReviews[_submissionId];
    }
    function getPostSubmissionList(uint256 _postId) public view returns (uint256[] memory) {
        return PostSubmissionList[_postId];
    }
    function getPostConsesous(uint256 _submissionId) public view returns (string memory consensus) {
        require(CommunitySubmissions[_submissionId].timestamp != 0, "Submission does not exist");
        return CommunitySubmissions[_submissionId].consensusType;
    }
    function getActiveSubmissions() external view returns(uint256[] memory){
        return ActiveSubmissions;
    }

    function getActiveSubmissionsLength() external view returns(uint256){
        return ActiveSubmissions.length;
    }
    function getReview(uint256 _reviewId) external view returns(Review memory){
        return reviews[_reviewId];
    }


    function getActiveSubmissionsIndex(uint256 _postId) external view returns(uint256){
        return ActiveSubmissionsIndexes[_postId];
    }
    function getReviewConsenous(uint256 _reviewid) external view returns(uint256 consensus, uint256 creds){
        return(reviews[_reviewid].consensus, reviews[_reviewid].creds);
    }


    // Only Owner Funcitons
    function setAutomationRegistry(address _contractAddress) external ownerOnly {
        AutomationContractAddress= _contractAddress;

    }

    function setCommunitiesContract(address _contractAddress) external ownerOnly {
        CommunityConsensusContract= tgetherCommunityConsensusInterface(_contractAddress);
    }

    function setMembersContract(address _contractAddress) external ownerOnly {
        MembersContract= tgetherMembersInterface(_contractAddress);

    }



    function setFee(uint256 _feePrice) external ownerOnly {
        consensusFee= _feePrice;

    }


    function setdefaultConsenousTypes(string[] memory _deafultArray) external ownerOnly{
        defaultConsenousTypes= _deafultArray;
    }

    function setMaxReviews(uint256 _maxreviews) external ownerOnly {
        maxReviews= _maxreviews;

    }

    function setPostsContract(address _contractAddress) external ownerOnly {
        PostsContract= tgetherPostsInterface(_contractAddress);

    }


    function setFundContract(address _contract) external ownerOnly {
       FundContract= tgetherFundInterface(_contract);

    }








}
