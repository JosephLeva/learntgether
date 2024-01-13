// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";



interface learntgetherCommunityConsensusInterface{
    function getCCParamsExist(string memory _communityName) external view returns (bool);
    function getCommunityConsensousTime(string memory _communityName) external view returns (uint256);
    function getCommunityConsensousTypes (string memory _communityName) external view returns (string[] memory consensusTypes);
    function getCommunityReviewParams (string memory _communityName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded);
}

interface learntgetherMembersInterface{
    function getMemberCreds(address _memberAddress, string memory _communityName) external view returns (uint256 creds); 
}

interface learntgetherPostsInterface{
    function getPostExists(uint256 _postId) external view returns(bool);
}

contract learntgetherPostConsensus {

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

    learntgetherCommunityConsensusInterface public CommunityConsensusContract; 
    learntgetherMembersInterface public MembersContract; 
    learntgetherPostsInterface public PostsContract;

    uint256 public consensusFee;

    uint256 public maxReviews;  //We have a max reviews value to ensure to avoid spam reviews clogging active proposals
    address owner;
    address payable feeAddress;


        // Modifiers

    modifier ownerOrAutomation() {
        require(msg.sender == owner || msg.sender == AutomationContractAddress, "Not the contract owner or Automation Registry Contract");
        _;
    }   

    modifier ownerOnly() {
        require(msg.sender == owner || msg.sender == AutomationContractAddress, "Not the contract owner or Automation Registry Contract");
        _;
    }   

    constructor(address _CommunityConsensusAddress, address _MembersContract, address _PostContract, uint256 _fee, address payable _feeAddress ) {
        owner= msg.sender;

        CommunityConsensusContract= learntgetherCommunityConsensusInterface(_CommunityConsensusAddress);
        MembersContract= learntgetherMembersInterface(_MembersContract);
        PostsContract= learntgetherPostsInterface(_PostContract);

        consensusFee = _fee;
        feeAddress = _feeAddress;

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
    event ReviewSubmitted(uint256 indexed reviewId, string consensus, uint256 creds, string content);
    event ConsensusUpdated(uint256 indexed communitySubmissionId, uint256 postId, string newConsensus);
    event ActiveSubmissionsIndexUpdated(uint256 communitySubmissionId, uint256 index);
    event Keywords(uint256 postId, string keyword);

    


    /*
    @notice Submits a post to a community for review
    @dev Checks if the post exists, if the post has already been submitted to the community, and if the community exists
    @param _postId uint256 post id to be submitted
    @param _communityName string name of the community to be updated.
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

            (bool _sent, ) = feeAddress.call{value: msg.value}("");
            require(_sent, "Failed to send Ether");

            
            newCommunitySubmission.consensusType= defaultConsenousTypes[0];
            // Add the post to the active reviews array
            ActiveSubmissions.push(csCounter);
            ActiveSubmissionsIndexes[csCounter] = ActiveSubmissions.length - 1;
            emit ActiveSubmissionsIndexUpdated(csCounter, ActiveSubmissions.length - 1);

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

        // Create a new review
        Review memory newReview = Review({
            member: msg.sender,
            content: _content,
            consensus: _consensus,
            consensusType: consensusType,
            creds: creds
        });


        reviews[reviewCounter] = newReview;
        submmisionReviews[_communitySubmissionId].push(reviewCounter);

        emit ReviewCreated(reviewCounter,_communitySubmissionId, msg.sender);


        // Add the review to the post's reviews
        emit ReviewSubmitted(reviewCounter, consensusType, creds, _content);

        reviewCounter++;

        return reviewCounter-1;


    }

    /*
        * @notice Checks if upkeep is needed for active Reviews.
        * @dev Loops thorugh the active Reviews array to find Reveiws where period has Reviewtime has ceased. Aims to grab the lowest timestamp as the next to be processed.
        * @param check data (unused in this function but might be needed for interface compatibility).
        * @return upkeepNeeded Boolean indicating if upkeep is needed.
        * @return performData bytes object cast from uint256 id for the lowest timestamp post where review periord has ended
    */
    function checkUpKeep()  external view  returns( bool upkeepNeeded, bytes memory  performData  ){
        upkeepNeeded = false;
        uint256 lowestId= 0;
        int256 sendId = 0;

        if(ActiveSubmissions.length > 0){

        uint256 lowestTimestamp= 0;
        
        for (uint256 i=1; i < ActiveSubmissions.length; i++){

            uint256 reviewPeriodExpired = CommunitySubmissions[ActiveSubmissions[i]].timestamp + CommunitySubmissions[ActiveSubmissions[i]].consensusTime;
            
            // Ensure review period is expired and is the lowestin the list
            if( reviewPeriodExpired <= block.timestamp && (reviewPeriodExpired<= lowestTimestamp || lowestTimestamp == 0)){
                upkeepNeeded = true;
                lowestId= ActiveSubmissions[i];
                lowestTimestamp= reviewPeriodExpired;
                
            }

        }

        if(lowestId !=0) {
            (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded) = CommunityConsensusContract.getCommunityReviewParams(CommunitySubmissions[lowestId].communityName);

            uint256[] memory reviewList= submmisionReviews[lowestId];

            // Check if there are enough reviews
            if(reviewList.length < numReviewsForAcceptance) {

                sendId= int256(lowestId) * -1;
 
            } else {

                uint256 acceptedReviewsCount = 0;
                uint256 totalCount=0;

                // we set an upper bound as a blocker for spam reviews to clog the active review list with gas throttling
                uint256 upperbound;
                if (reviewList.length > maxReviews){
                    upperbound = maxReviews;
                }else{
                    upperbound = reviewList.length;
                }


                for (uint256 i = 0; i < upperbound; i++) {

                    (uint256 reviewConsesous, uint256 reviewCreds) = this.getReviewConsenous(reviewList[i]);
                    // Only consider reviews from members with enough credentials
                    if (reviewCreds >= credsNeededForReview) {
                        totalCount++ ;
                        if (reviewConsesous == 2) { // Assuming 2 is the code for "Accepted"
                            acceptedReviewsCount++;
                    }
                }
                }

                // covering our divide by 0 (numReviewsForAcceptance=0 and no reviews) but also want to make sure we have more than enough substantive reviews
                // use < instead of <= because if = and not 0  we should process it
                if(totalCount == 0 || totalCount < numReviewsForAcceptance ){
                    sendId = int256(lowestId) * -1;
                } else{

                uint256 percentAcceptedByCount = (acceptedReviewsCount * 100) / totalCount;
                if (percentAcceptedByCount >= percentAcceptsNeeded) {
                   sendId= int256(lowestId); // Accepted
                } else {
                
                   sendId= int256(lowestId) * -1; // Rejected

                }
                }

            }
        }

        }
        return(upkeepNeeded, abi.encode(sendId));

    }



    /*
   * @notice Performs the upkeep of proposals.
   * @dev Validates that  post review period has ended. If so loops through array of reviews (maxed to upper bound) to come up with a consensus of the articles status for the community
   * @dev Consensous for articles can only be accepted or rejected. Acceptance requires the number of creds for aceptance > all others combined. as well the nuber of accepted reviews as subejct specifed percent of acceptance
   * @param performData Data from the checkUpKeep function Post Id as a signed integer (postive = accepted, negative = failed) trnasfromed as bytes
    */

    // This function must be controlled by a modifier that only allows the chainlink oracle network or the owner to call this function
    // We do our computaion off chain as it could be very expensive to loop through all reveiws 
    //With that comes some level of trust the caller of this function to provide truthful consensus for a post id that is active 

    function performUpkeep(bytes calldata _performData ) external ownerOrAutomation {

    // we want to make sure we are getting something that can be an int256
    if (_performData.length == 32) {
        
        int256 ssvalue = abi.decode(_performData, (int256));
        bool Accepted;
        uint256 ssid;


        if(ssvalue > 0){
            Accepted = true;
            ssid= uint256(ssvalue);

        }else {
            Accepted = false;
            ssid= uint256(-ssvalue);
        }
        

        // ensure post Id is not 0, review time for that post has passed, and an extra check to make sure the submission id  is in use and is actively being reviewed
        if (ssid != 0 && block.timestamp >= CommunitySubmissions[ssid].timestamp +  CommunitySubmissions[ssid].consensusTime && CommunitySubmissions[ssid].timestamp != 0 && ActiveSubmissionsIndexes[ssid] != 0 ) {
            
            if (Accepted == true) {
                    CommunitySubmissions[ssid].consensusType = defaultConsenousTypes[1]; // Accepted
                } else {
                    CommunitySubmissions[ssid].consensusType = defaultConsenousTypes[2]; // Rejected
                }

            emit ConsensusUpdated(ssid, CommunitySubmissionToPost[ssid], CommunitySubmissions[ssid].consensusType);



            // Swap and pop

            // set our target index to the users current cred for swap
            uint256 index = ActiveSubmissionsIndexes[ssid];
            // check if index is last in array
            if (index != ActiveSubmissions.length -1) {
                // if it is not we let the last item take its spot
                ActiveSubmissions[index] = ActiveSubmissions[ActiveSubmissions.length - 1];
            
                // update the index in our mapping 
                ActiveSubmissionsIndexes[ActiveSubmissions[ActiveSubmissions.length - 1]]= index;
                emit ActiveSubmissionsIndexUpdated(ActiveSubmissions[index], index);
            }
            
            ActiveSubmissionsIndexes[ssid] = 0;
            ActiveSubmissions.pop();

        }
    }

    }


            
    // Getters



    function getCommunitySubmission(uint256 _communitySubmissionId) external view returns(CommunitySubmission memory){
        return CommunitySubmissions[_communitySubmissionId];
    }
    function getReviewsForSubmission(uint256 _submissionId) public view returns (uint256[] memory) {
        return submmisionReviews[_submissionId];
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
        CommunityConsensusContract= learntgetherCommunityConsensusInterface(_contractAddress);
    }

    function setMembersContract(address _contractAddress) external ownerOnly {
        MembersContract= learntgetherMembersInterface(_contractAddress);

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
        PostsContract= learntgetherPostsInterface(_contractAddress);

    }

    function setFeeAddress(address payable _feeAddress) external ownerOnly {
        feeAddress= _feeAddress;

    }







}
