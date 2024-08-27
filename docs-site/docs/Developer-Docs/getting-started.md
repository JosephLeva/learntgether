---
sidebar_position: 1
---

# Developer Guide

Welcome to the tgether Developer Guide! This guide will help you dive into the technical details of how tgether works, how to extend its functionality, and how to integrate with its decentralized consensus platform. But first, we highly recommend reading the [User Guide](../User-Guide/getting-started) to get familiar with the basic concepts and terminology. Once you’ve got that covered, let’s get technical!

## Core Topics Covered

In this guide, we’ll explore:

- **Hardhat Setup and Deployment**: Learn how to compile, test, and deploy the tgether smart contracts using Hardhat, our development framework of choice.

- **Chainlink Automation**: Understand how we leverage Chainlink Automation to keep processes decentralized and trustless, from executing proposals to managing post consensus.

- **Custom Proposals**: Extend tgether’s capabilities by integrating custom proposals tailored to your community’s specific goals, allowing you to automate complex workflows and reach consensus on unique use cases.

- **Custom Cred Access Contracts**: Discover how you can create your own custom contracts to define membership access and reputation systems, giving communities full control over how they manage their members.

## Getting Started with Development

To set up your development environment, clone the repository and install dependencies:

```bash
git clone https://github.com/JosephLeva/learntgether.git
cd learntgether
npm install
```

Once you’ve set up your environment, here’s how you can get started with compiling contracts and running tests:

- **Compile Contracts**:  
  Run the following command to compile the smart contracts:

  ```bash
  npx hardhat compile
  ```

- **Run Tests**:  
  Use this command to run the test suite and ensure everything is functioning as expected:

  ```bash
  npx hardhat test
  ```

For more detailed information and advanced Hardhat usage, refer to the [official Hardhat documentation](https://hardhat.org/docs).

## Explore Each Topic in Depth

Ready to dive into the details? Check out the following sections to get started:

- [Deployment and Data Model](./deployment-and-data-model)
- [Chainlink Automation and delayed Cosnensus](./chainlink-automation)
- [Custom Proposals And Log Automation](./Custom-Proposals-and-Log-Automation)
- [Membership and Creds](./membership-and-creds.md)

## Contributing

Interested in contributing to tgether? Check out our [Github Discussions](https://github.com/JosephLeva/learntgether/discussions/) to learn how you can get involved.

---

Next up: [Deployment and Data Model](./deployment-and-data-model)
