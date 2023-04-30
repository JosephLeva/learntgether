// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArticleNFT is ERC721URIStorage, Ownable {
    struct Article {
        string title;
        string author;
        address originatingAddress;
        bool peerReviewed;
        string ipfsHash;
    }

    Article[] private articles;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

    function mint(
        string memory _title,
        string memory _author,
        bool _peerReviewed,
        string memory _ipfsHash
    ) public returns (uint256) {
        uint256 articleId = articles.length;
        articles.push(
            Article({
                title: _title,
                author: _author,
                originatingAddress: msg.sender,
                peerReviewed: _peerReviewed,
                ipfsHash: _ipfsHash
            })
        );
        _safeMint(msg.sender, articleId);
        _setTokenURI(articleId, _ipfsHash);
        return articleId;
    }

    function getArticle(uint256 _articleId)
        public
        view
        returns (
            string memory,
            string memory,
            address,
            bool,
            string memory
        )
    {
        Article storage article = articles[_articleId];
        return (
            article.title,
            article.author,
            article.originatingAddress,
            article.peerReviewed,
            article.ipfsHash
        );
    }
}
