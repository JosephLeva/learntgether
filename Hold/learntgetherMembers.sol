// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";


interface learntgetherCommuityInterface{
    function getCommunityExists(string memory _communityName) external view returns (bool);
    function getCommunityOwner(string memory _communityName) external view returns (address);
    function getCommunityIsInviteOnly(string memory _communityName) external view returns (bool);
}

contract learntgetherMembers{

    struct Member {
        string name;
        string description;
        string[] degrees; 
        string[] awards;
        mapping(string => communityInfo) communityInfo;
    }

    struct communityInfo{
        int256 creds;
        mapping(address => int256) hasGivenCred;
        address[] postiveCredAddresses;
        address[] negativeCredAddresses;
        bool isMember;
    } 

    mapping(address => Member) membersMap; // Use a mapping for easy access to members by address

    address private owner;

    learntgetherCommuityInterface public communityContract;  // To be used when we need to port to v2
    constructor() {
        owner = msg.sender;
    }


    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    mapping(string=> mapping(address => bool)) public isInvited; // Mapping to see if a user is invited to a community (only used for invitation based communities)



    modifier credRules(string memory _communityName, address _member){

        require(communityContract.getCommunityExists(_communityName), "Community Does Not Exist");
        
        // Ensure the community exsits 

        // Ensure the sender is a member for the community
        require(membersMap[msg.sender].communityInfo[_communityName].isMember == true, "You are not a member of this community.");
        
        // Ensure the target member exists of this community
        require(membersMap[_member].communityInfo[_communityName].isMember == true, "Target member doesn't exist of this community.");

        // Ensure a member is not editing creds to themselves
        require(msg.sender != _member, "You cannot edit your own creds.");
        _;

    }

    // Events 
    
    event MemberInvited(string indexed communityName, address indexed memberAddress);
    event MemberUninvited(string indexed communityName, address indexed memberAddress);
    event MemberAdded(string indexed communityName, address indexed memberAddress);
    event MemberRemoved(string indexed communityName, address indexed memberAddress);
    event MemberInfo(address indexed memberAddress ,string indexed name, string description, string[] degrees, string[] awards );
    event AddedPosCred(string indexed communityName, address indexed memberAddress, address indexed actor ,int256 creds);
    event RemovedPosCred(string indexed communityName, address indexed memberAddress, address indexed actor ,int256 creds);
    event AddedNegCred(string indexed communityName, address indexed memberAddress, address indexed actor ,int256 creds);
    event RemovedNegCred(string indexed communityName, address indexed memberAddress, address indexed actor ,int256 creds);
    event IndexUpdated(string indexed communityName, address indexed memberAddress, address indexed actor, int256 index);
    event Creds(address indexed memberAddress, string indexed communityName, int256 creds, uint256 indexed timestamp);


    // Functions

    /*
        * @notice Invites a member to a given community.
        * @dev Ensures the community exists and the sender is the owner of the community.
        * @param _communityName Name of the community.
        * @param _memberAddress Address of the member.
    */
    function inviteMember(string memory _communityName, address _memberAddress) public returns (address){
        require(membersMap[_memberAddress].communityInfo[_communityName].isMember != true, "Member already exists of this community.");
        require(isInvited[_communityName][_memberAddress] == false, "User Already Invited");
        require(msg.sender == communityContract.getCommunityOwner(_communityName), "You are not the owner of this community.");
        require(communityContract.getCommunityIsInviteOnly(_communityName)== true, "This community is not invite only.");

        // Adding them as invited but addresses(users) still have the option to accept in this.addselfasmember
        isInvited[_communityName][_memberAddress] = true;
        
        
        emit MemberInvited(_communityName, _memberAddress);

        return(_memberAddress);

    }
    /*
        * @notice Uninvites a member from a given community.
        * @dev Ensures the community exists and the sender is the owner of the community.
        * @param _communityName Name of the community.
        * @param _memberAddress Address of the member.
    */
    function uninviteMember(string memory _communityName, address _memberAddress) public returns (address){
        require(membersMap[_memberAddress].communityInfo[_communityName].isMember != true, "Member already exists of this community.");
        require(msg.sender == communityContract.getCommunityOwner(_communityName), "You are not the owner of this community.");
        require(communityContract.getCommunityIsInviteOnly(_communityName)== true, "This community is not invite only.");
        require(isInvited[_communityName][_memberAddress] != false, "Member Not Invited");
        require(msg.sender != _memberAddress, "You cannot uninvite yourself.");

        isInvited[_communityName][_memberAddress] = false;

        // remove them as member if they already are one
        if (this.getIsMember(_memberAddress, _communityName) == true){
            membersMap[_memberAddress].communityInfo[_communityName].isMember= false;
        }

        emit MemberUninvited(_communityName, _memberAddress);
        return(_memberAddress);

    }

        /*
            * @notice Adds the sender as a member for a given community.
            * @dev Ensures the community exists and the sender is not already a member.
            * @param _communityName Name of the community.
        */

    function addSelfAsMember(string memory _communityName) public  {

        require(communityContract.getCommunityExists(_communityName), "Community Does not Exist");
        require(membersMap[msg.sender].communityInfo[_communityName].isMember != true, "You are already a member of this community.");

        // Ensure the user is invited if the community is invite only

        if (communityContract.getCommunityIsInviteOnly(_communityName)== true){

            require(isInvited[_communityName][msg.sender] == true, "You are not invited to this community.");
        }


        membersMap[msg.sender].communityInfo[_communityName].isMember= true;
        // Set first item to 0 to help mapping

        membersMap[msg.sender].communityInfo[_communityName].postiveCredAddresses.push(address(0));
        membersMap[msg.sender].communityInfo[_communityName].negativeCredAddresses.push(address(0));

        emit MemberAdded(_communityName, msg.sender);
    }

        /*

            * @notice Removes the sender as a member for a given community.
            * @dev Ensures the community exists and the sender is currently a member.
            * @param _communityName Name of the community.

        */
    function removeSelfAsMember(string memory _communityName) public  {

        require(communityContract.getCommunityExists(_communityName), "Community Does Not Exist");
        require(membersMap[msg.sender].communityInfo[_communityName].isMember != false, "You are not a member of this community.");

        membersMap[msg.sender].communityInfo[_communityName].isMember= false;
        emit MemberRemoved(_communityName, msg.sender);
    }

    /*

       * @notice Updates the information of a member.
       * @param _name Name of the member.
       * @param _description Description about the member.
       * @param _degrees List of degrees the member holds.
       * @param _awards List of awards the member has received.
        

    */

    function updateMemberInfo(string memory _name, string memory _description, string[] memory _degrees, string[] memory _awards ) public {
        membersMap[msg.sender].name = _name;
        membersMap[msg.sender].description = _description;
        membersMap[msg.sender].degrees = _degrees;
        membersMap[msg.sender].awards = _awards;
        emit MemberInfo(msg.sender, _name, _description, _degrees, _awards);

    }

    /*
        * @notice Adds creds to a member for a given commuinity.
        * @dev Ensures the community exists and the sender has the authority to add creds.
        * @param _communityName Name of the community.
        * @param _member Address of the member.
    */
    function addPosCredsToMember(string memory _communityName, address _member) external  credRules(_communityName, _member) {
        require(membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] == 0, "You've already given a cred to this member.");

        membersMap[_member].communityInfo[_communityName].creds += 1;
        emit Creds(_member, _communityName, membersMap[_member].communityInfo[_communityName].creds, block.timestamp);
        
        membersMap[_member].communityInfo[_communityName].postiveCredAddresses.push(msg.sender);
        membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] = int256(membersMap[_member].communityInfo[_communityName].postiveCredAddresses.length  -1);

        emit AddedPosCred(_communityName, _member, msg.sender, membersMap[_member].communityInfo[_communityName].creds);
    }


    function addNegCredsToMember(string memory _communityName, address _member) external  credRules(_communityName, _member) {
        require(membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] == 0, "You've already given a cred to this member.");

        membersMap[_member].communityInfo[_communityName].creds -= 1;
        emit Creds(_member, _communityName, membersMap[_member].communityInfo[_communityName].creds, block.timestamp);

        membersMap[_member].communityInfo[_communityName].negativeCredAddresses.push(msg.sender);
        membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] = int256(membersMap[_member].communityInfo[_communityName].negativeCredAddresses.length  -1) *-1;
        emit AddedNegCred(_communityName, _member, msg.sender, membersMap[_member].communityInfo[_communityName].creds);

    }


    /*
        * @notice Removes Positive creds from a member for a given community.
        * @dev Ensures the community exists and the sender has the authority to remove creds. When we remove creds we swap pop our credAddresses array
        * @param _communityName Name of the community.
        * @param _member Address of the member.
    */
    function removePosCredsFromMember(string memory _communityName, address _member) external credRules(_communityName, _member){
        require(membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] > 0, "You have not given a positive cred to this member yet.");

        membersMap[_member].communityInfo[_communityName].creds -= 1;
        emit Creds(_member, _communityName, membersMap[_member].communityInfo[_communityName].creds, block.timestamp);


        // set our target index to the users current cred for swap
        uint256 index = uint256(membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender]);

        // Avoid the for loop if somehow the list is empty (we dont want to do anything anyway)
        require(membersMap[_member].communityInfo[_communityName].postiveCredAddresses.length > 1, "This user has no Creds");


        // check if index is last in array
        if (index != membersMap[_member].communityInfo[_communityName].postiveCredAddresses.length -1) {
            // if it is not we let the last item take its spot
            membersMap[_member].communityInfo[_communityName].postiveCredAddresses[index]= membersMap[_member].communityInfo[_communityName].postiveCredAddresses[membersMap[_member].communityInfo[_communityName].postiveCredAddresses.length -1] ;

        
            // update the index in our mapping 
            membersMap[_member].communityInfo[_communityName].hasGivenCred[membersMap[_member].communityInfo[_communityName].postiveCredAddresses[index]] = int256(index);
            emit IndexUpdated(_communityName, _member, msg.sender, int256(index));
        }

        // update our mapping for cred holder to 0 
        membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] = 0;
        // no matter what we pop the last one in the list (avoid duplicates)
        membersMap[_member].communityInfo[_communityName].postiveCredAddresses.pop();
        emit RemovedPosCred(_communityName, _member, msg.sender, membersMap[_member].communityInfo[_communityName].creds);

    }

    /*
        * @notice Removes Negative creds from a member for a given community.
        * @dev Ensures the community exists and the sender has the authority to remove creds. When we remove creds we swap pop our credAddresses array
        * @param _communityName Name of the community.
        * @param _member Address of the member.
    */

    function removeNegCredsFromMember(string memory _communityName, address _member) external credRules(_communityName, _member){
        require(membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] < 0, "You have not given a negative cred to this member yet.");

        membersMap[_member].communityInfo[_communityName].creds += 1;
        emit Creds(_member, _communityName, membersMap[_member].communityInfo[_communityName].creds, block.timestamp);


        // set our target index to the users current cred for swap (HAS to be negative because of our require statement) 
        // index will allways be the positive value of the negative number
        uint256 index = uint256(membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] * -1);

        // Avoid the for loop if somehow the list is empty (we dont want to do anything anyway)
        require(membersMap[_member].communityInfo[_communityName].negativeCredAddresses.length > 1, "This user has no Creds");


        // check if index is last in array
        if (index != membersMap[_member].communityInfo[_communityName].negativeCredAddresses.length -1) {
            // if it is not we let the last item take its spot
            membersMap[_member].communityInfo[_communityName].negativeCredAddresses[index]= membersMap[_member].communityInfo[_communityName].negativeCredAddresses[membersMap[_member].communityInfo[_communityName].negativeCredAddresses.length -1] ;

        
            // update the index in our mapping 
            membersMap[_member].communityInfo[_communityName].hasGivenCred[membersMap[_member].communityInfo[_communityName].negativeCredAddresses[index]] = int256(index)* -1;
            emit IndexUpdated(_communityName, _member, msg.sender, int256(index)*-1);
        }

        // update our mapping for cred holder to 0 
        membersMap[_member].communityInfo[_communityName].hasGivenCred[msg.sender] = 0;
        // no matter what we pop the last one in the list (avoid duplicates)
        membersMap[_member].communityInfo[_communityName].negativeCredAddresses.pop();

        emit RemovedNegCred(_communityName, _member, msg.sender, membersMap[_member].communityInfo[_communityName].creds);
    }







    // Getters

    function getIsInvited(address _memberAddress, string memory _communityName) external view returns (bool) {
        return isInvited[_communityName][_memberAddress];    }


    function getIsMember(address _memberAddress, string memory _communityName) external view returns (bool) {
        return membersMap[_memberAddress].communityInfo[_communityName].isMember;
    }

    function getMemberCreds(address _memberAddress, string memory _communityName) external view returns (int256 creds) {
        require(membersMap[_memberAddress].communityInfo[_communityName].isMember == true, "Member Does Not Exist For this community");
        return membersMap[_memberAddress].communityInfo[_communityName].creds;
    }
    function getMemberPosCredsList(address _memberAddress, string memory _communityName)external view returns (address[] memory addressList){
        require(membersMap[_memberAddress].communityInfo[_communityName].isMember == true, "Member Does Not Exist For this community");
        return membersMap[_memberAddress].communityInfo[_communityName].postiveCredAddresses;        
    }
    function getMemberNegCredsList(address _memberAddress, string memory _communityName)external view returns (address[] memory addressList){
        require(membersMap[_memberAddress].communityInfo[_communityName].isMember == true, "Member Does Not Exist For this community");
        return membersMap[_memberAddress].communityInfo[_communityName].negativeCredAddresses;        
    }

    // Postive return results in user giving a positive cred to the member. Negative return results in user giving a negative cred to the member
    function getMemberCredIndex(address _memberAddress, address _credGiverAddress, string memory _communityName)external view returns (int256 index){
        require(membersMap[_memberAddress].communityInfo[_communityName].isMember == true, "Member Does Not Exist For this community");
        return membersMap[_memberAddress].communityInfo[_communityName].hasGivenCred[_credGiverAddress];        
    }
   


    function hasMemberGivenCred(address _memberAddress, string memory _communityName, address givenBy) external view returns (bool) {
        if (membersMap[_memberAddress].communityInfo[_communityName].hasGivenCred[givenBy]== 0){
            return true;
        } else{
            return false;
        }
    }

    function getMemberInfo(address _memberAddress) external view returns (string memory name, string memory descripion, string[] memory degrees, string[] memory awards) {
        return (membersMap[_memberAddress].name, membersMap[_memberAddress].description, membersMap[_memberAddress].degrees, membersMap[_memberAddress].awards);
    }
    function getReiewerCommunityInfo(address _memberAddress, string memory _communityName) external view returns (int256 _creds, address[] memory _posCreds, address[] memory _negCreds ){
        require(membersMap[_memberAddress].communityInfo[_communityName].isMember == true, "Member Does Not Exist For this community");
        return (membersMap[_memberAddress].communityInfo[_communityName].creds, membersMap[_memberAddress].communityInfo[_communityName].postiveCredAddresses, membersMap[_memberAddress].communityInfo[_communityName].negativeCredAddresses);

    }

    // Only Owner functions 

    function setlearntgetherCommunities(address _contractAddress) external onlyOwner {
        communityContract= learntgetherCommuityInterface(_contractAddress);

    
    }


}