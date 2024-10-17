# Governance as a Service (GaaS)

## Introduction

Tgether provides a comprehensive **Governance as a Service (GaaS)** platform that enables developers to integrate decentralized governance into their applications. One of the key features of this platform is the ability to create **Custom Proposals** through **Parameter Groups**, which allow communities to vote on and implement new configurations or governance decisions in a flexible and scalable manner.

With Tgether's custom proposals, developers can define and register their own governance parameters, making it easy for communities to vote on dynamic configurations or actions that reflect their specific needs. This document outlines how to leverage Tgether's GaaS infrastructure to register, manage, and process custom proposals, as well as the necessary steps to ensure compliance with Tgether's front-end systems.

## Custom Proposals Overview

Custom proposals enable developers to create **Parameter Groups**—essentially sets of parameters—allowing communities to define their use case. With them an autonmous group of people can come together to agree on collective bargaining agreements, ownership of assets, split payments, or really anything they need to vote on. Below is an overview of how developers can create, register, and work with these parameter groups.

## Registering Parameter Groups

To create a custom proposal, developers must first register their **Parameter Groups** via Tgether's **Parameter Group Registry**. To do this they must create a contract that will be used for Custom Proposals.

## Custom Proposals and Parameter Group Structure

Once the parameter group is registered, developers can create proposals and make use of several required functions to integrate with the Tgether platform. These functions ensure that parameter groups can be queried and voted on within the community.

### Front End Facing Functions

To be Integrated with Tgether's front-end and platform, custom proposal contracts must implement the following functions:

1. **`ContractParameterKeys`**: A public string array that lists the parameter keys used in the group.
    ```solidity
    string[] public ContractParameterKeys;
    ```

2. **`getParams`**: This function must return the current parameters for the given community.
    ```solidity
    function getParams(string memory _communityName) external view returns (/* parameter types */);
    ```

3. **`setParams` (optional)**: This function allows communities to set or update parameters dynamically.
    ```solidity
    function setParams(/* parameter types */) external;
    ```

4. **`createProposal`**: This function allows the creation of a proposal, which must include the community's fee to process the proposal.
    ```solidity
    function createProposal(/* proposal details */) external payable;
    ```

5. **`getProposal`**: This function retrieves the proposal details for a given proposal ID.
    ```solidity
    function getProposal(uint256 _proposalId) external view returns (/* proposal details */);
    ```

These are not necessary if you are planning to use your own front end to vote on your parameters.

For detailed technical guidance on custom proposals, see [Custom Proposals And Log Automation](./Custom-Proposals-and-Log-Automation).

## Registering your Parameter Group

If desired Custom Proposal Contracts can be registered to tgether's Parameter Group Registry, where they will be propagated to all communities for use. When developers register their parameter group, they provide key information such as the name, contract address, owner, and a description of the group. This event makes the parameter group visible to the governance infrastructure, allowing communities to interact with it through Tgether's platform.

```solidity
    struct ParameterGroup {
        string name;
        address contractAddress;
        string encodedABI; // Base64 encoded ABI as a string
        string description;
        address owner;
        uint256 enrollmentCount; // Track the number of enrollments
        uint256 id;
    }
