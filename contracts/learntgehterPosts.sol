// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";


interface V2ContractInterface{
    function addPostData(uint256 _tokenId, address authorAddress, string memory authorName, string memory title, string memory content, string memory description ) external returns (bool);
}

// The prupose of this contract is to not declare an owner of content shared on the platform. The author of the content is the owner of the NFT. This allows for the author to transfer the NFT to another address if they wish to do so.
contract learntgetherPosts is ERC721Enumerable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Post {
        string content;
        string title;
        address authorAddress;
        string authorName;
        string description;
    }
    mapping(uint256 => Post) public posts;

    address public owner;

    address public v2ContractAddress;
    address public consensusAddress;

     // Modifiers

    modifier ownerOnly() {
        require(msg.sender == owner, "Not the contract owner `");
        _;
    }   



    constructor( ) ERC721("LearntgetherPosts", "LTG") {
        owner= msg.sender;
        _tokenIdCounter.increment();

    }



    

    // Events
    event PostMintedTo(uint256 indexed postId, address indexed authorAddress, string authorName);
    event PostInfo(uint256 indexed postId, string content, string title, string description);
    event Keywords(uint256 postId, string keyword);

    


    /*
    * @notice Mints NFT and associated Post. If review is needed transfers link (requires prior approval to this contract) to upkeep and adds to ActiveSubmissions Array
    * @dev If review is necessary (reviewTime !=0) requires a user has previously approved a link transfer of fee amount to this contract
    * @param _content string of ipfshash linking to post.
    * @param _title  string Title of post
    * @param _authorName string name of Author
    * @param _communityName Name of the community to be updated.
    */

    // By calling this function you, the user, are claiming owenership of the underlying content. If not owned by the signee, the signee of this transaction is liable for any legal action taken by the owner of the content.
    function mintPost(
        string memory _content,
        string memory _title,
        string memory _authorName,
        string memory _description
    ) public returns (uint256) {


        uint256 newTokenId = _tokenIdCounter.current();


        Post memory newPost = Post({
            content: _content,
            title: _title,
            authorAddress: msg.sender,
            authorName: _authorName,
            description: _description
        });
        
        _safeMint(msg.sender, newTokenId);
        _tokenIdCounter.increment();

        // save our Post to mapping and reverse search
        posts[newTokenId] = newPost;

        emit PostMintedTo(newTokenId, msg.sender, _authorName);
        emit PostInfo(newTokenId, _content, _title, _description);
        return newTokenId;
    }


    function addKeyword(uint256 _postId, string memory _keyword) external {
        require(ownerOf(_postId) == msg.sender, "Not the owner of the token");
        emit Keywords(_postId, _keyword);

    }



            
    // Getters


    function getPost(uint256 _postId) external view returns(Post memory){
        return posts[_postId];
    }

    function getPostExists(uint256 _postId) external view returns(bool){
        if(ownerOf(_postId) == address(0)){
            return false;
        }else{
            return true;
        }
    }



    // Only Owner Funcitons

    function incrementToken() external ownerOnly {
        _tokenIdCounter.increment();

    }

    function setV2ContractAddress(address _v2ContractAddress) external ownerOnly {
        v2ContractAddress = _v2ContractAddress;
    }




    // Transfer functions

    function transferNFTsToV2(uint256 _tokenId) external {
        require(v2ContractAddress != address(0), "V2 contract address not set");
        
        // Transfer each token and associated post data to the v2 contract
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of the token");
        
        // Get the post data associated with the token ID
        Post memory post = posts[_tokenId];
        
        // Transfer the NFT to the v2 contract
        safeTransferFrom(msg.sender, v2ContractAddress, _tokenId);
        
        // Add the post data to the v2 contract's storage
        V2ContractInterface(v2ContractAddress).addPostData(_tokenId, post.authorAddress, post.authorName, post.title, post.content, post.description );

    }

    function transferToken(address to, uint256 tokenId) external {
    require(ownerOf(tokenId) == msg.sender, "Only the owner can transfer the token");
    _transfer(msg.sender, to, tokenId);
    } 




}
