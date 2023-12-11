// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {LinkTokenInterface} from "../node_modules/@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "hardhat/console.sol";

interface ChainlinkAutomationInterface{
    function addFunds(uint256 upkeepId, uint256 amount) external;
}

interface learntgetherCommunitiesInterface{
    function getCommunityExists(string memory _communityName) external view returns (bool);
    function getCommunityConsensousTime(string memory _communityName) external view returns (uint256);
    function getCommunityConsensousTypes (string memory _communityName) external view returns (string[] memory consenousTypes);
    function getCommunityReviewParams (string memory _communityName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded);
    function getNumberReviewsForAcceptance( string memory _communityName) external view returns(uint256);
}

interface learntgetherMembersInterface{
    function getMemberCreds(address _memberAddress, string memory _communityName) external view returns (uint256 creds); 
}

interface V2ContractInterface{
    function addArticleData(uint256 _tokenId, address authorAddress, string memory authorName, string memory title, string memory ipfsHash, string memory description ) external returns (bool);
}

contract learntgetherArticles is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Article {
        string ipfsHash;
        string title;
        address authorAddress;
        string authorName;
        string description;
    }
    mapping(uint256 => Article) public articles;


    struct CommunitySubmission{
        string communityName;
        string consensousType; 
        uint256 timestamp;
        uint256 consensousTime;
    }
    mapping(uint256=> CommunitySubmission) public CommunitySubmissions; //csCounter=> SubjectSubmission
    mapping (uint256=>uint256) public CommunitySubmissionToArticle; // communitySubmissionId => articleId
    uint256 public csCounter;

    // mapping allows us to retrieve the community submissions for a specifc article
    mapping( uint256  => uint256[] ) public articleSubmissionList; // articleId => communitySubmissionId

    // mapping allows us to retrieve the article submissions for a specific community
    mapping(uint256=> mapping(string => uint256)) public articleCommunities; // articleid => communityName => communitySubmissionId






    struct Review{
        address member;
        string ipfsHash;
        uint256 consensous;
        string consensousType;
        uint256 creds;
    }


    mapping(uint256=> Review) public reviews; //reviewId => Review
    uint256 public reviewCounter;

    mapping(uint256=> uint256[]) public submmisionReviews; //communitySubmissionId => reviewId[]



    string[] defaultConsenousTypes = [ "Consensous Pending", "Accepted", "Rejected"];

    // reverse search also good to ensure not duplicate article submissions
    mapping(string => uint256) public ipfsHashToTokenId;


    // array of active reviews ordered off chain by timestamp
    uint256[] public ActiveSubmissions;

    // holds index information outside of asset
    mapping(uint256=> uint256) public ActiveSubmissionsIndexes; //SubjectSubmissionsId => index in ActiveSubmissions array


    // mapping allows us to track if someone has already reviewed an article (avoid spam)
    mapping(uint256 => mapping(address => bool)) public hasReviewed; //communitySubmissionId => memberAddress => bool



    ChainlinkAutomationInterface public AutomationContract; 
    address AutomationContractAddress; 

    learntgetherCommunitiesInterface public CommunitiesContract; 
    learntgetherMembersInterface public MembersContract; 
    address v2ContractAddress; //Assuming we will need a v2 in the future

    uint256 public consensousFee;

    uint256 public openVoteTime;
    uint256 public maxReviews;  //We have a max reviews value to ensure to avoid spam reviews clogging active proposals
    uint256 public upkeepId;
    address theOwner;


        // Modifiers

    modifier ownerOrAutomation() {
        require(msg.sender == theOwner || msg.sender == AutomationContractAddress, "Not the contract owner or Automation Registry Contract");
        _;
    }   



    constructor(address _CommunitiesAddress, address _MembersContract, uint256 _fee ) ERC721("LearntgetherArticles", "LTG") {
        theOwner= msg.sender;

        CommunitiesContract= learntgetherCommunitiesInterface(_CommunitiesAddress);
        MembersContract= learntgetherMembersInterface(_MembersContract);

        consensousFee = _fee;

        // start at 1 rather than 0 so our ipfsHashToTokenId search works
        _tokenIdCounter.increment();
        reviewCounter= 1;
        csCounter = 1;
        // so no indexes can be 0
        ActiveSubmissions.push(0);



    }



    

    // Events
    event ArticleMintedTo(uint256 indexed articleId, address indexed authorAddress, string authorName);
    event ArticleInfo(uint256 indexed articleId, string ipfsHash, string title, string description);
    event articleSubmission(uint256 indexed articleId, uint256 indexed communitySubmissionId);
    event CommunitySubmitted(uint256 indexed communtiySubmissionId, string indexed communityName, uint256 timestamp, uint256 consensousTime);
    event ReviewCreated(uint256 indexed reviewId, uint256 indexed communitySubmissionId, address indexed member);
    event ReviewSubmitted(uint256 indexed reviewId, string consensus, uint256 creds, string ipfsHash);
    event ConsensusUpdated(uint256 indexed communitySubmissionId, uint256 articleId, string newConsensus);
    event ActiveSubmissionsIndexUpdated(uint256 communitySubmissionId, uint256 index);
    event Keywords(uint256 articleId, string keyword);

    


    /*
    * @notice Mints NFT and associated Article. If review is needed transfers link (requires prior approval to this contract) to upkeep and adds to ActiveSubmissions Array
    * @dev If review is necessary (reviewTime !=0) requires a user has previously approved a link transfer of fee amount to this contract
    * @param _ipfsHash string of ipfshash linking to article.
    * @param _title  string Title of article
    * @param _authorName string name of Author
    * @param _communityName Name of the community to be updated.
    */


    function mintArticle(
        string memory _ipfsHash,
        string memory _title,
        string memory _authorName,
        string memory _description
    ) public returns (uint256) {

        require(ipfsHashToTokenId[_ipfsHash] == 0, "IPFS hash already been minted");

        uint256 newTokenId = _tokenIdCounter.current();


        Article memory newArticle = Article({
            ipfsHash: _ipfsHash,
            title: _title,
            authorAddress: msg.sender,
            authorName: _authorName,
            description: _description
        });
        
        _safeMint(msg.sender, newTokenId);
        _tokenIdCounter.increment();

        // save our Article to mapping and reverse search
        articles[newTokenId] = newArticle;
        ipfsHashToTokenId[_ipfsHash] = newTokenId;        

        emit ArticleMintedTo(newTokenId, msg.sender, _authorName);
        emit ArticleInfo(newTokenId, _ipfsHash, _title, _description);
        return newTokenId;
    }


    /*
    @notice Submits an article to a community for review
    @dev Checks if the article exists, if the article has already been submitted to the community, and if the community exists
    @param _articleId uint256 article id to be submitted
    @param _communityName string name of the community to be updated.
    */
   function submitToCommunity(uint256 _articleId, string memory _communityName) external payable returns (uint256 )  {
        // Check if the article exists
        require(_exists(_articleId), "Article does not exist");
        // Check if the article has already been submitted to the community
        require(articleCommunities[_articleId][_communityName] != 0, "Article already submitted to community"); 

        require(CommunitiesContract.getCommunityExists(_communityName), "Subject does not exist");

        uint256 consensousTime = CommunitiesContract.getCommunityConsensousTime(_communityName);

        CommunitySubmission memory newCommunitySubmission = CommunitySubmission({
            communityName: _communityName,
            timestamp: block.timestamp,
            consensousTime: consensousTime,
            consensousType: ""
        });

        if (consensousTime == 0 ){
            // create a new community submission where no active conesouse is needed default consesous type is "No Review"
            newCommunitySubmission.consensousType= "No Consensous";
        } else{
            //  we only charge a fee if a consensous is Needed
            require(msg.value == consensousFee, "Must send proposal fee");
            newCommunitySubmission.consensousType= defaultConsenousTypes[0];
            // Add the article to the active reviews array
            ActiveSubmissions.push(csCounter);
            ActiveSubmissionsIndexes[csCounter] = ActiveSubmissions.length - 1;
            emit ActiveSubmissionsIndexUpdated(csCounter, ActiveSubmissions.length - 1);

        }

        // Set Various Search Mappings
        CommunitySubmissions[csCounter] = newCommunitySubmission;
        articleSubmissionList[_articleId].push(csCounter);
        CommunitySubmissionToArticle[csCounter] = _articleId;
        articleCommunities[_articleId][_communityName] = csCounter;

        emit articleSubmission(_articleId, csCounter);


        emit CommunitySubmitted(csCounter, _communityName, block.timestamp, consensousTime);

        csCounter++;

        return csCounter-1;


    }


    /*
    * @notice Adds a review to the reviews array for a specific article
    * @dev Review must be submitted by an active member. ConsenouType List is a mock concatonation of the default array with the community owned array
    * @param _articleId uint256 article id review is attached to 
    * @param _ipfsHash string ipfs hash of the review content
    * @param _consensous uint256 the index of the consensous type of the mock concatonation of the default array with the community owned array 
    */


    function submitReview(uint256 _communitySubmissionId, string memory _ipfsHash, uint256 _consensous) public returns(uint256){
        // Check if the article exists
        require(CommunitySubmissions[_communitySubmissionId].timestamp != 0, "Submission does not exist");

                
        // Requirement must be in bounds of default array +custom community array 
        string[] memory  consensousTypes= CommunitiesContract.getCommunityConsensousTypes( CommunitySubmissions[_communitySubmissionId].communityName );
        require(_consensous > 0, "Consensous mus be greater than 0");
        require(_consensous <= defaultConsenousTypes.length + consensousTypes.length , "Consensous Not In Bounds");
        

        // Avoid Spam
        require(!hasReviewed[_communitySubmissionId][msg.sender], "You've already reviewed this article");
        hasReviewed[_communitySubmissionId][msg.sender] = true;


        // Check if the member has the necessary credentials
        uint256 creds = MembersContract.getMemberCreds(msg.sender, CommunitySubmissions[_communitySubmissionId].communityName);
        
        string memory consensousType;

        if (_consensous <= defaultConsenousTypes.length) {
            consensousType = defaultConsenousTypes[_consensous - 1]; // Adjust index by 1
        } else {
            consensousType = consensousTypes[_consensous - defaultConsenousTypes.length - 1]; // Adjust index by 1
        }

        // Create a new review
        Review memory newReview = Review({
            member: msg.sender,
            ipfsHash: _ipfsHash,
            consensous: _consensous,
            consensousType: consensousType,
            creds: creds
        });


        reviews[reviewCounter] = newReview;
        submmisionReviews[_communitySubmissionId].push(reviewCounter);

        emit ReviewCreated(reviewCounter,_communitySubmissionId, msg.sender);


        // Add the review to the article's reviews
        emit ReviewSubmitted(reviewCounter, consensousType, creds, _ipfsHash);

        reviewCounter++;

        return reviewCounter-1;


    }

    /*
        * @notice Checks if upkeep is needed for active Reviews.
        * @dev Loops thorugh the active Reviews array to find Reveiws where period has Reviewtime has ceased. Aims to grab the lowest timestamp as the next to be processed.
        * @param check data (unused in this function but might be needed for interface compatibility).
        * @return upkeepNeeded Boolean indicating if upkeep is needed.
        * @return performData bytes object cast from uint256 id for the lowest timestamp article where review periord has ended
    */
    function checkUpKeep(bytes calldata /* check data*/)  external view  returns( bool upkeepNeeded, bytes memory  performData  ){
        upkeepNeeded = false;
        uint256 lowestId= 0;
        int256 sendId = 0;

        if(ActiveSubmissions.length > 0){

        uint256 lowestTimestamp= 0;
        
        for (uint256 i=1; i < ActiveSubmissions.length; i++){

            uint256 reviewPeriodExpired = CommunitySubmissions[ActiveSubmissions[i]].timestamp + CommunitySubmissions[ActiveSubmissions[i]].consensousTime;
            
            // Ensure review period is expired and is the lowestin the list
            if( reviewPeriodExpired <= block.timestamp && (reviewPeriodExpired<= lowestTimestamp || lowestTimestamp == 0)){
                upkeepNeeded = true;
                lowestId= ActiveSubmissions[i];
                lowestTimestamp= reviewPeriodExpired;
                
            }

        }

        if(lowestId !=0) {
            (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded) = CommunitiesContract.getCommunityReviewParams(CommunitySubmissions[lowestId].communityName);

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
                        if (reviewConsesous == 1) { // Assuming 1 is the code for "Accepted"
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
   * @dev Validates that  article review period has ended. If so loops through array of reviews (maxed to upper bound) to come up with a consensous of the articles status for the community
   * @dev Consensous for articles can only be accepted or rejected. Acceptance requires the number of creds for aceptance > all others combined. as well the nuber of accepted reviews as subejct specifed percent of acceptance
   * @param performData Data from the checkUpKeep function Article Id as a signed integer (postive = accepted, negative = failed) trnasfromed as bytes
    */

    // This function must be controlled by a modifier that only allows the chainlink oracle network or the owner to call this function
    // We do our computaion off chain as it could be very expensive to loop through all reveiws 
    //With that comes some level of trust the caller of this function to provide truthful consensous for an article id that is active 

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
        

        // ensure article Id is not 0, review time for that article has passed, and an extra check to make sure the submission id  is in use and is actively being reviewed
        if (ssid != 0 && block.timestamp >= CommunitySubmissions[ssid].timestamp +  CommunitySubmissions[ssid].consensousTime && CommunitySubmissions[ssid].timestamp != 0 && ActiveSubmissionsIndexes[ssid] != 0 ) {
            
            if (Accepted == true) {
                    CommunitySubmissions[ssid].consensousType = defaultConsenousTypes[1]; // Accepted
                } else {
                    CommunitySubmissions[ssid].consensousType = defaultConsenousTypes[2]; // Rejected
                }

            emit ConsensusUpdated(ssid, CommunitySubmissionToArticle[ssid], CommunitySubmissions[ssid].consensousType);



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


    function addKeyword(uint256 _articleId, string memory _keyword) external {
        require(ownerOf(_articleId) == msg.sender, "Not the owner of the token");
        emit Keywords(_articleId, _keyword);

    }

            
    // Getters
    
    function getArticleByHash( string memory _ipfsHash) public view returns (Article memory){
        require(ipfsHashToTokenId[_ipfsHash] != 0, "IPFS hash not attached to Article");
        return(articles[ipfsHashToTokenId[_ipfsHash]]);
    }

    function getArticleIdByHash( string memory _ipfsHash) public view returns (uint256){
        require(ipfsHashToTokenId[_ipfsHash] != 0, "IPFS hash not attached to Article");
        return(ipfsHashToTokenId[_ipfsHash]);
    }

    function getReviewsForSubmission(uint256 _submissionId) public view returns (uint256[] memory) {
        return submmisionReviews[_submissionId];
    }
    function getArticleConsesous(uint256 _submissionId) public view returns (string memory consensus) {
        require(CommunitySubmissions[_submissionId].timestamp != 0, "Submission does not exist");
        return CommunitySubmissions[_submissionId].consensousType;
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


    function getActiveSubmissionsIndex(uint256 _articleId) external view returns(uint256){
        return ActiveSubmissionsIndexes[_articleId];
    }
    function getReviewConsenous(uint256 _reviewid) external view returns(uint256 consensous, uint256 creds){
        return(reviews[_reviewid].consensous, reviews[_reviewid].creds);
    }


    // Only Owner Funcitons
    function setAutomationRegistry(address _contractAddress) external onlyOwner {
        AutomationContract= ChainlinkAutomationInterface(_contractAddress);
        AutomationContractAddress= _contractAddress;

    }

    function setCommunitiesContract(address _contractAddress) external onlyOwner {
        CommunitiesContract= learntgetherCommunitiesInterface(_contractAddress);
    }

    function setMembersContract(address _contractAddress) external onlyOwner {
        MembersContract= learntgetherMembersInterface(_contractAddress);

    }

    function setV2Contract(address _contractAddress) external onlyOwner {
        v2ContractAddress= _contractAddress;

    }


    function setFee(uint256 _feePrice) external onlyOwner {
        consensousFee= _feePrice;

    }

    function setUpkkepId(uint256 _upkeepId) external onlyOwner {
        upkeepId= _upkeepId;

    }
    function incrementToken() external onlyOwner {
        _tokenIdCounter.increment();

    }

    function setdefaultConsenousTypes(string[] memory _deafultArray) external onlyOwner{
        defaultConsenousTypes= _deafultArray;
    }

    function setMaxReviews(uint256 _maxreviews) external onlyOwner {
        maxReviews= _maxreviews;

    }



    // Transfer functions

    function transferNFTsToV2(uint256 _tokenId) external {
        require(v2ContractAddress != address(0), "V2 contract address not set");
        
        // Transfer each token and associated article data to the v2 contract
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of the token");
        
        // Get the article data associated with the token ID
        Article memory article = articles[_tokenId];
        
        // Transfer the NFT to the v2 contract
        safeTransferFrom(msg.sender, v2ContractAddress, _tokenId);
        
        // Add the article data to the v2 contract's storage
        V2ContractInterface(v2ContractAddress).addArticleData(_tokenId, article.authorAddress, article.authorName, article.title, article.ipfsHash, article.description );

    }

    function transferToken(address to, uint256 tokenId) external {
    require(ownerOf(tokenId) == msg.sender, "Only the owner can transfer the token");
    _transfer(msg.sender, to, tokenId);
    } 




}
