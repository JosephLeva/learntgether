pragma solidity ^0.8.0;
import {LinkTokenInterface} from "../node_modules/@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";


// The Purpose of this contract is for local testing of contract functions.
// Not for use in production!
contract MockAutomationContract {

    

    LinkTokenInterface private linkToken;

    constructor(address _linkTokenAddress) {

    linkToken = LinkTokenInterface(_linkTokenAddress);
    }

    event FundsAdded(uint256 upkeepId, uint256 amount);

    function addFunds(uint256 upkeepId, uint256 amount) external {
        require(linkToken.transferFrom( msg.sender, address(this), amount), "Fee transfer failed");
        emit FundsAdded(upkeepId, amount);
    }
}