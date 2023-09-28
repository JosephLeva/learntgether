// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";


interface learntgetherSubjectsInterface{
    function getSubjectExists(string memory _subjectName) external view returns (bool);
}

contract learntgetherReviewers{

    struct Reviewer {
        string name;
        string description;
        string[] degrees; 
        string[] awards;
        mapping(string => subjectInfo) subjectInfo;
    }

    struct subjectInfo{
        uint256 creds;
        mapping(address => uint256) hasGivenCred;
        address[] credAddresses;
        bool isReviewer;
    } 

    mapping(address => Reviewer) reviewersMap; // Use a mapping for easy access to reviewers by address

    address private owner;

    learntgetherSubjectsInterface public subjectsContract;  // To be used when we need to port to v2
    constructor() {
        owner = msg.sender;
    }


    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    modifier credRules(string memory _subjectName, address _reviewer){

        require(subjectsContract.getSubjectExists(_subjectName), "Subject Does Not Exist");
        
        // Ensure the subject exsits 
        
        // Ensure the sender is a reviewer for the subject
        require(reviewersMap[msg.sender].subjectInfo[_subjectName].isReviewer == true, "You are not a reviewer for this subject.");
        
        // Ensure the target reviewer exists for this subject
        require(reviewersMap[_reviewer].subjectInfo[_subjectName].isReviewer == true, "Target reviewer doesn't exist for this subject.");

        // Ensure a reviewer is not editing creds to themselves
        require(msg.sender != _reviewer, "You cannot edit your own creds.");
        _;

    }

    // Events 
    

    event ReviewerAdded(string indexed subjectName, address indexed reviewerAddress);
    event ReviewerRemoved(string indexed subjectName, address indexed reviewerAddress);
    event ReviewerInfo(address reviewerAddress ,string name, string description, string[] degrees, string[] awards );

    event CredsAdded(string indexed subjectName, address indexed reviewer, uint256 creds );
    event CredsRemoved(string indexed subjectName, address indexed reviewer, uint256 creds);



        /*
            * @notice Adds the sender as a reviewer for a given subject.
            * @dev Ensures the subject exists and the sender is not already a reviewer.
            * @param _subjectName Name of the subject.
        */

    function addSelfAsReviewer(string memory _subjectName) public  {

        require(subjectsContract.getSubjectExists(_subjectName), "Subject Does not Exist");
        require(reviewersMap[msg.sender].subjectInfo[_subjectName].isReviewer != true, "You are already a reviewer for this subject.");


        reviewersMap[msg.sender].subjectInfo[_subjectName].isReviewer= true;
        // Set first item to 0 to help mapping

        reviewersMap[msg.sender].subjectInfo[_subjectName].credAddresses.push(address(0));
        emit ReviewerAdded(_subjectName, msg.sender);
    }

        /*

            * @notice Removes the sender as a reviewer for a given subject.
            * @dev Ensures the subject exists and the sender is currently a reviewer.
            * @param _subjectName Name of the subject.

        */
    function removeSelfAsReviewer(string memory _subjectName) public  {

        require(subjectsContract.getSubjectExists(_subjectName), "Subject Does Not Exist");
        require(reviewersMap[msg.sender].subjectInfo[_subjectName].isReviewer != false, "You are not a reviewer for this subject.");

        reviewersMap[msg.sender].subjectInfo[_subjectName].isReviewer= false;
        emit ReviewerRemoved(_subjectName, msg.sender);
    }

    /*

       * @notice Updates the information of a reviewer.
       * @param _name Name of the reviewer.
       * @param _description Description about the reviewer.
       * @param _degrees List of degrees the reviewer holds.
       * @param _awards List of awards the reviewer has received.
        

    */

    function updateReviewerInfo(string memory _name, string memory _description, string[] memory _degrees, string[] memory _awards ) public {
        reviewersMap[msg.sender].name = _name;
        reviewersMap[msg.sender].description = _description;
        reviewersMap[msg.sender].degrees = _degrees;
        reviewersMap[msg.sender].awards = _awards;
        emit ReviewerInfo(msg.sender, _name, _description, _degrees, _awards);

    }

    /*
        * @notice Adds creds to a reviewer for a given subject.
        * @dev Ensures the subject exists and the sender has the authority to add creds.
        * @param _subjectName Name of the subject.
        * @param _reviewer Address of the reviewer.
    */
    function addCredsToReviewer(string memory _subjectName, address _reviewer) external  credRules(_subjectName, _reviewer) {
        require(reviewersMap[_reviewer].subjectInfo[_subjectName].hasGivenCred[msg.sender] == 0, "You've already given a cred to this reviewer.");

        reviewersMap[_reviewer].subjectInfo[_subjectName].creds += 1;
        
        reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses.push(msg.sender);
        reviewersMap[_reviewer].subjectInfo[_subjectName].hasGivenCred[msg.sender] = reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses.length -1;

        emit CredsAdded(_subjectName, _reviewer, reviewersMap[_reviewer].subjectInfo[_subjectName].creds);
    }


    /*
        * @notice Removes creds from a reviewer for a given subject.
        * @dev Ensures the subject exists and the sender has the authority to remove creds. When we remove creds we swap pop our credAddresses array
        * @param _subjectName Name of the subject.
        * @param _reviewer Address of the reviewer.
    */
    function removeCredsFromReviewer(string memory _subjectName, address _reviewer) external credRules(_subjectName, _reviewer){
        require(reviewersMap[_reviewer].subjectInfo[_subjectName].hasGivenCred[msg.sender] != 0, "You have not given a cred to this reviewer yet.");

        reviewersMap[_reviewer].subjectInfo[_subjectName].creds -= 1;
        

        // set our target index to the users current cred for swap
        uint256 index = reviewersMap[_reviewer].subjectInfo[_subjectName].hasGivenCred[msg.sender];

        // Avoid the for loop if somehow the list is empty (we dont want to do anything anyway)
        require(reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses.length > 1, "This user has no Creds");


        // check if index is last in array
        if (index != reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses.length -1) {
            // if it is not we let the last item take its spot
            reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses[index]= reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses[reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses.length -1] ;

        
            // update the index in our mapping 
            reviewersMap[_reviewer].subjectInfo[_subjectName].hasGivenCred[reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses[index]] = index;
        }

        // update our mapping for cred holder to 0 
        reviewersMap[_reviewer].subjectInfo[_subjectName].hasGivenCred[msg.sender] = 0;
        // no matter what we pop the last one in the list (avoid duplicates)
        reviewersMap[_reviewer].subjectInfo[_subjectName].credAddresses.pop();



        emit CredsRemoved(_subjectName, _reviewer, reviewersMap[_reviewer].subjectInfo[_subjectName].creds);
    }


    // Getters


    function getIsReviewer(address _reviewerAddress, string memory _subjectName) external view returns (bool) {
        return reviewersMap[_reviewerAddress].subjectInfo[_subjectName].isReviewer;
    }

    function getReviewerCreds(address _reviewerAddress, string memory _subjectName) external view returns (uint256 creds) {
        require(reviewersMap[_reviewerAddress].subjectInfo[_subjectName].isReviewer == true, "Reviewer Does Not Exist For this subject");
        return reviewersMap[_reviewerAddress].subjectInfo[_subjectName].creds;
    }
    function getReviewerCredsList(address _reviewerAddress, string memory _subjectName)external view returns (address[] memory addressList){
        require(reviewersMap[_reviewerAddress].subjectInfo[_subjectName].isReviewer == true, "Reviewer Does Not Exist For this subject");
        return reviewersMap[_reviewerAddress].subjectInfo[_subjectName].credAddresses;        
    }

    function getReviewerCredIndex(address _reviewerAddress, address _credAddress, string memory _subjectName)external view returns (uint256 index){
        require(reviewersMap[_reviewerAddress].subjectInfo[_subjectName].isReviewer == true, "Reviewer Does Not Exist For this subject");
        return reviewersMap[_reviewerAddress].subjectInfo[_subjectName].hasGivenCred[_credAddress];        
    }
   


    function hasReviewerGivenCred(address _reviewerAddress, string memory _subjectName, address givenBy) external view returns (bool) {
        if (reviewersMap[_reviewerAddress].subjectInfo[_subjectName].hasGivenCred[givenBy]== 0){
            return true;
        } else{
            return false;
        }
    }

    function getReviewerInfo(address _reviewerAddress) external view returns (string memory name, string memory descripion, string[] memory degrees, string[] memory awards) {
        return (reviewersMap[_reviewerAddress].name, reviewersMap[_reviewerAddress].description, reviewersMap[_reviewerAddress].degrees, reviewersMap[_reviewerAddress].awards);
    }
    function getReiewerSubjectInfo(address _reviewerAddress, string memory _subjectName) external view returns (uint256 _creds, address[] memory _credAddresses){
        require(reviewersMap[_reviewerAddress].subjectInfo[_subjectName].isReviewer == true, "Reviewer Does Not Exist For this subject");
        
        return (reviewersMap[_reviewerAddress].subjectInfo[_subjectName].creds, reviewersMap[_reviewerAddress].subjectInfo[_subjectName].credAddresses);


    }

    // Only Owner functions 

    function setlearntgetherSubjects(address _contractAddress) external onlyOwner {
        subjectsContract= learntgetherSubjectsInterface(_contractAddress);

    
    }


}