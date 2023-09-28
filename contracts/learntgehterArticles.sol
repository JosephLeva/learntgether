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

interface learntgetherSubjectsInterface{
    function getSubjectExists(string memory _subjectName) external view returns (bool);
    function getSubjectReviewTime(string memory _subjectName) external view returns (uint256);
    function getSubjectConsensousTypes (string memory _subjectName) external view returns (string[] memory consenousTypes);
    function getSubjectReviewParams (string memory _subjectName) external view returns (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded);
    function getNumberReviewsForAcceptance( string memory _subjectName) external view returns(uint256);
}

interface learntgetherReviewersInterface{
    function getReviewerCreds(address _reviewerAddress, string memory _subjectName) external view returns (uint256 creds); 
}

interface V2ContractInterface{
    function addArticleData(uint256 _tokenId, address authorAddress, string memory authorName, string memory title, string memory subjectName, string memory consensousType, string memory ipfsHash, string memory description ) external returns (bool);
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
        string subjectName;
        string consensousType; 
        uint256 timestamp;
        uint256 reviewTime;
    }

    struct Review{
        address reviewer;
        string ipfsHash;
        uint256 consensous;
        string consensousType;
        uint256 creds;
    }

    mapping(uint256 => uint256[]) public articleReviews;

    mapping(uint256=> Review) public reviews;
    uint256 public reviewCounter;




    string[] defaultConsenousTypes = [ "Review Pending", "Accepted", "Rejected"];

    mapping(uint256 => Article) public articles;
    // reverse search also good to ensure not duplicate article submissions
    mapping(string=>mapping(string => uint256)) public ipfsHashToTokenId;


    // holds index information outside of asset
    mapping(uint256=> uint256) public ActiveReviewsIndexes;





    uint256[] public ActiveReviews;
    // mapping allows us to track if someone has already reviewed an article (avoid spam)
    mapping(uint256 => mapping(address => bool)) public hasReviewed;



    LinkTokenInterface private linkToken;
    ChainlinkAutomationInterface public AutomationContract; 
    address AutomationContractAddress; 

    learntgetherSubjectsInterface public SubjectsContract; 
    learntgetherReviewersInterface public ReviewersContract; 
    address v2ContractAddress; //Assuming we will need a v2 in the future

    uint256 public proposalFeeInLink;
    uint256 public openVoteTime;
    uint256 public maxReviews;  //We have a max reviews value to ensure to avoid spam reviews clogging active proposals
    uint256 public upkeepId;
    address theOwner;


        // Modifiers

    modifier ownerOrAutomation() {
        require(msg.sender == theOwner || msg.sender == AutomationContractAddress, "Not the contract owner or Automation Registry Contract");
        _;
    }   



    constructor(address _SubjectsContract, address _ReviewersContract, address _automationContract, address _linkTokenAddress, uint256 _fee ) ERC721("LearntgetherArticles", "LTG") {
        theOwner= msg.sender;
        
        AutomationContract = ChainlinkAutomationInterface(_automationContract);
        AutomationContractAddress= _automationContract;

        SubjectsContract= learntgetherSubjectsInterface(_SubjectsContract);
        ReviewersContract= learntgetherReviewersInterface(_ReviewersContract);

        linkToken = LinkTokenInterface(_linkTokenAddress);

        proposalFeeInLink = _fee;

        // start at 1 rather than 0 so our ipfsHashToTokenId search works
        _tokenIdCounter.increment();
        reviewCounter= 1;
        // so no indexes can be 0
        ActiveReviews.push(0);



    }



    

    // Events
    event ArticleMinted(uint256 indexed articleId, address indexed authorAddress, string authorName, string title, string subjectName, string consensousType, string ipfsHash, string description);
    event ReviewSubmitted(uint256 reviewId, uint256 indexed articleId, address indexed reviewer, uint256 consensus, string consensousType, uint256 creds, string ipfsHash);
    event ConsensusUpdated(uint256 indexed articleId, string newConsensus);
    event ActiveReviewIndex(uint256 articleId, uint256 index);
    event Keywords(uint256 articleId, string keyword);

    


    /*
    * @notice Mints NFT and associated Article. If review is needed transfers link (requires prior approval to this contract) to upkeep and adds to ActiveReviews Array
    * @dev If review is necessary (reviewTime !=0) requires a user has previously approved a link transfer of fee amount to this contract
    * @param _ipfsHash string of ipfshash linking to article.
    * @param _title  string Title of article
    * @param _authorName string name of Author
    * @param _subjectName Name of the subject to be updated.
    */


    function mintArticle(
        string memory _ipfsHash,
        string memory _title,
        string memory _authorName,
        string memory _description,
        string memory _subjectName
    ) public returns (uint256) {

        require(ipfsHashToTokenId[_subjectName][_ipfsHash] == 0, "IPFS hash already used with this Subject");

        
        require(SubjectsContract.getSubjectExists(_subjectName) == true,"Subject Does Not Exist");

        uint256 newTokenId = _tokenIdCounter.current();

        uint256 reviewTime= SubjectsContract.getSubjectReviewTime(_subjectName);

        // When reviewTime is 0 review process is not needed.
        string memory consensousType;
        if(reviewTime ==0){
            consensousType = "No Review";
        }else{
            consensousType= defaultConsenousTypes[0];
        }


        Article memory newArticle = Article({
            ipfsHash: _ipfsHash,
            title: _title,
            authorAddress: msg.sender,
            authorName: _authorName,
            description: _description,
            subjectName: _subjectName,
            consensousType: consensousType,
            timestamp: block.timestamp,
            reviewTime: reviewTime
        });
        

        // If review is needed then we transfer fee to upkeep, add to Active List and record index 
        // we do this before miting because we want to revert before  the article is minted if it supposed to be reviewed by can't due ot the transfer

        if(reviewTime !=0) {
            require(linkToken.transferFrom( msg.sender, address(this), proposalFeeInLink), "Fee transfer failed");
            linkToken.approve(AutomationContractAddress, proposalFeeInLink);
            AutomationContract.addFunds(upkeepId, proposalFeeInLink);


            ActiveReviews.push(newTokenId);
            ActiveReviewsIndexes[newTokenId]= ActiveReviews.length -1;
            emit ActiveReviewIndex ( newTokenId, ActiveReviews.length -1);
        }

        _safeMint(msg.sender, newTokenId);
        _tokenIdCounter.increment();

        // save our Article to mapping and reverse search
        articles[newTokenId] = newArticle;
        ipfsHashToTokenId[_subjectName][_ipfsHash] = newTokenId;


        
        emit ArticleMinted(newTokenId, msg.sender, _authorName, _title, _subjectName,consensousType,  _ipfsHash, _description);
        return newTokenId;
    }


    /*
    * @notice Adds a review to the reviews array for a specific article
    * @dev Review must be submitted by an active reviewer. ConsenouType List is a mock concatonation of the default array with the subject owned array
    * @param _articleId uint256 article id review is attached to 
    * @param _ipfsHash string ipfs hash of the review content
    * @param _consensous uint256 the index of the consensous type of the mock concatonation of the default array with the subject owned array 
    */

    function submitReview(uint256 _articleId, string memory _ipfsHash, uint256 _consensous) public {
        // Check if the article exists
        require(_exists(_articleId), "Article does not exist");

                
        // Requirement must be in bounds of default array +custom subject array 
        string[] memory  consensousTypes= SubjectsContract.getSubjectConsensousTypes( articles[_articleId].subjectName );
        require(_consensous > 0, "Consensous mus be greater than 0");
        require(_consensous <= defaultConsenousTypes.length + consensousTypes.length , "Consensous not In Bounds");
        

        // Avoid Spam
        require(!hasReviewed[_articleId][msg.sender], "You've already reviewed this article");
        hasReviewed[_articleId][msg.sender] = true;


        // Check if the reviewer has the necessary credentials
        uint256 creds = ReviewersContract.getReviewerCreds(msg.sender, articles[_articleId].subjectName);
        
        string memory consensousType;

        if (_consensous <= defaultConsenousTypes.length) {
            consensousType = defaultConsenousTypes[_consensous - 1]; // Adjust index by 1
        } else {
            consensousType = consensousTypes[_consensous - defaultConsenousTypes.length - 1]; // Adjust index by 1
        }

        // Create a new review
        Review memory newReview = Review({
            reviewer: msg.sender,
            ipfsHash: _ipfsHash,
            consensous: _consensous,
            consensousType: consensousType,
            creds: creds
        });


        reviews[reviewCounter] = newReview;
        articleReviews[_articleId].push(reviewCounter);


        // Add the review to the article's reviews
        emit ReviewSubmitted(reviewCounter, _articleId, msg.sender, _consensous, consensousType, creds, _ipfsHash);

        reviewCounter++;


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

        if(ActiveReviews.length > 0){

        uint256 lowestTimestamp= 0;
        
        for (uint256 i=1; i < ActiveReviews.length; i++){

            uint256 reviewPeriodExpired = articles[ActiveReviews[i]].timestamp + articles[ActiveReviews[i]].reviewTime;
            
            // Ensure review period is expired and is the lowestin the list
            if( reviewPeriodExpired <= block.timestamp && (reviewPeriodExpired<= lowestTimestamp || lowestTimestamp == 0)){
                upkeepNeeded = true;
                lowestId= ActiveReviews[i];
                lowestTimestamp= reviewPeriodExpired;
                
            }

        }

        if(lowestId !=0) {
            (uint256 numReviewsForAcceptance,uint256 credsNeededForReview,uint256 percentAcceptsNeeded) = SubjectsContract.getSubjectReviewParams(articles[lowestId].subjectName);

            uint256[] memory reviewList= articleReviews[lowestId];


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
                    // Only consider reviews from reviewers with enough credentials
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
   * @dev Validates that  article review period has ended. If so loops through array of reviews (maxed to upper bound) to come up with a consensous of the articles status for the subject
   * @dev Consensous for articles can only be accepted or rejected. Acceptance requires the number of creds for aceptance > all others combined. as well the nuber of accepted reviews as subejct specifed percent of acceptance
   * @param performData Data from the checkUpKeep function Article Id as a signed integer (postive = accepted, negative = failed) trnasfromed as bytes
    */

        // This function must be controlled by a modifier that only allows the chainlink oracle network or the owner to call this function
        // We do our computaion off chain as it could be very expensive to loop through all reveiws 
        //With that comes some level of trust the caller of this function to provide truthful consensous for an article id that is active 

    function performUpkeep(bytes calldata _performData ) external ownerOrAutomation {

        // we want to make sure we are getting something that can be an int256
    if (_performData.length == 32) {
        
        int256 articleValue = abi.decode(_performData, (int256));
        bool Accepted;
        uint256 articleId;




        if(articleValue > 0){
            Accepted = true;
            articleId= uint256(articleValue);

        }else {
            Accepted = false;
            articleId= uint256(-articleValue);
        }
        

        // ensure article Id is not 0, review time for that article has passed, and an extra check to make sure the articleId is in use and is actively being reviewed
        if (articleId != 0 && block.timestamp >= articles[articleId].timestamp +  articles[articleId].reviewTime && articles[articleId].timestamp != 0 && ActiveReviewsIndexes[articleId] != 0 ) {
            
            if (Accepted == true) {
                    articles[articleId].consensousType = defaultConsenousTypes[1]; // Accepted
                } else {
                    articles[articleId].consensousType = defaultConsenousTypes[2]; // Rejected
                }

            emit ConsensusUpdated(articleId, articles[articleId].consensousType);



            // Swap and pop

            // set our target index to the users current cred for swap
            uint256 index = ActiveReviewsIndexes[articleId];
            // check if index is last in array
            if (index != ActiveReviews.length -1) {
                // if it is not we let the last item take its spot
                ActiveReviews[index] = ActiveReviews[ActiveReviews.length - 1];
            
                // update the index in our mapping 
                ActiveReviewsIndexes[ActiveReviews[ActiveReviews.length - 1]]= index;
                emit ActiveReviewIndex(ActiveReviews[index], index);
            }
            
            ActiveReviewsIndexes[articleId] = 0;
            ActiveReviews.pop();

        }
    }

    }


    function addKeyword(uint256 _articleId, string memory _keyword) external {
        require(ownerOf(_articleId) == msg.sender, "Not the owner of the token");
        emit Keywords(_articleId, _keyword);

    }

            
    // Getters
    
    function getArticleByHash(string memory _subjectName, string memory _ipfsHash) public view returns (Article memory){
        require(ipfsHashToTokenId[_subjectName][_ipfsHash] != 0, "IPFS hash not attached to Article");
        return(articles[ipfsHashToTokenId[_subjectName][_subjectName]]);
    }

    function getArticleIdByHash(string memory _subjectName, string memory _ipfsHash) public view returns (uint256){
        require(ipfsHashToTokenId[_subjectName][_ipfsHash] != 0, "IPFS hash not attached to Article");
        return(ipfsHashToTokenId[_subjectName][_subjectName]);
    }

    function getReviewsForArticle(uint256 _articleId) public view returns (uint256[] memory) {
        return articleReviews[_articleId];
    }
    function getArticleConsesous(uint256 _tokenId) public view returns (string memory consensus) {
        require(_exists(_tokenId), "Article does not exist");
        return articles[_tokenId].consensousType;
    }
    function getActiveReviews() external view returns(uint256[] memory){
        return ActiveReviews;
    }

    function getActiveReviewsLength() external view returns(uint256){
        return ActiveReviews.length;
    }
    function getReview(uint256 _reviewId) external view returns(Review memory){
        return reviews[_reviewId];
    }
    function getArticleReviews(uint256 _articleId) external view returns( uint256[] memory){
        return articleReviews[_articleId];
    }


    function getActiveReviewsIndex(uint256 _articleId) external view returns(uint256){
        return ActiveReviewsIndexes[_articleId];
    }
    function getReviewConsenous(uint256 _reviewid) external view returns(uint256 consensous, uint256 creds){
        return(reviews[_reviewid].consensous, reviews[_reviewid].creds);
    }


    // Only Owner Funcitons
    function setAutomationRegistry(address _contractAddress) external onlyOwner {
        AutomationContract= ChainlinkAutomationInterface(_contractAddress);
        AutomationContractAddress= _contractAddress;

    }

    function setSubjectsContract(address _contractAddress) external onlyOwner {
        SubjectsContract= learntgetherSubjectsInterface(_contractAddress);
    }

    function setReviewersContract(address _contractAddress) external onlyOwner {
        ReviewersContract= learntgetherReviewersInterface(_contractAddress);

    }

    function setV2Contract(address _contractAddress) external onlyOwner {
        v2ContractAddress= _contractAddress;

    }


    function setFee(uint256 _feePrice) external onlyOwner {
        proposalFeeInLink= _feePrice;

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
        V2ContractInterface(v2ContractAddress).addArticleData(_tokenId, article.authorAddress, article.authorName, article.title, article.subjectName, article.consensousType, article.ipfsHash, article.description );

    }

    function transferToken(address to, uint256 tokenId) external {
    require(ownerOf(tokenId) == msg.sender, "Only the owner can transfer the token");
    _transfer(msg.sender, to, tokenId);
    } 




}
