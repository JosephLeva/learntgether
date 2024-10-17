const { expect } = require("chai");

describe("LaneRegistry", function () {
  let laneRegistry, mockLaneContract, owner, intakeContract, addr1;

  beforeEach(async function () {
    [owner, intakeContract, addr1] = await ethers.getSigners();

    // Deploy a mock Lane contract for testing purposes
    const MockLaneContract = await ethers.getContractFactory("MockLaneContract");
    mockLaneContract = await MockLaneContract.deploy();
    await mockLaneContract.deployed();

    // Deploy the LaneRegistry contract
    const LaneRegistry = await ethers.getContractFactory("LaneRegistry");
    laneRegistry = await LaneRegistry.deploy(intakeContract.address);
    await laneRegistry.deployed();
  });

  it("should register lanes correctly", async function () {
    // Register a new lane
    await laneRegistry.addLane(mockLaneContract.address);

    const lane = await laneRegistry.laneMap(1);
    expect(lane.contractAddress).to.equal(mockLaneContract.address);
    expect(lane.laneLength).to.equal(0); // New lanes should have length 0 initially
  });

  it("should add lane to zeroLengthArray on registration", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    const zeroLengthArray = await laneRegistry.zeroLengthArray(0);
    expect(zeroLengthArray).to.equal(1); // Lane ID 1 should be in zeroLengthArray
  });

  it("should append a proposal and forward the fee to the lane", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    // Simulate the intake contract appending a proposal with ETH sent as upkeep fee
    const fee = ethers.utils.parseEther("0.1");  // Example fee amount
    await laneRegistry.connect(intakeContract).appendToLane(1, { value: fee });

    // Check if the mockLaneContract received the correct fee and the length was updated
    const lane = await laneRegistry.laneMap(1);
    expect(lane.laneLength).to.equal(1); // Length should be updated
    const balance = await ethers.provider.getBalance(mockLaneContract.address);
    expect(balance).to.equal(fee);  // The lane contract should have received the fee
});


  it("should remove lane from zeroLengthArray after appending", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    await laneRegistry.connect(intakeContract).appendToLane(1);

    const zeroLengthArrayLength = await laneRegistry.zeroLengthArray.length;
    expect(zeroLengthArrayLength).to.equal(0); // Zero length array should be empty
  });

  it("should update lowestLaneLengthId after appending to a lane", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    await laneRegistry.connect(intakeContract).appendToLane(1);

    const lowestLaneLengthId = await laneRegistry.lowestLaneLengthId();
    expect(lowestLaneLengthId).to.equal(1); // Lane ID 1 should be the lowest after appending
  });

  it("should add lane back to zeroLengthArray when length becomes zero", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    // Append and then simulate the lane's length becoming zero again via the mock contract
    await laneRegistry.connect(intakeContract).appendToLane(1);

    // Call the reportLaneLength function from the mock contract
    await mockLaneContract.reportLaneLengthToRegistry(laneRegistry.address, 1, 0);  // MockLaneContract should call report

    const zeroLengthArray = await laneRegistry.zeroLengthArray(0);
    expect(zeroLengthArray).to.equal(1); // Lane ID 1 should be back in zeroLengthArray
});


it("should allow lanes to report their length", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    // Call the reportLaneLength function from the mock contract
    await mockLaneContract.reportLaneLengthToRegistry(laneRegistry.address, 1, 5);

    const lane = await laneRegistry.laneMap(1);
    expect(lane.laneLength).to.equal(5); // The lane's length should be updated to 5
});


  it("should only allow owner to add lanes", async function () {
    await expect(
      laneRegistry.connect(addr1).addLane(mockLaneContract.address)
    ).to.be.revertedWith("Not the contract owner");
  });

  it("should only allow intake contract to append to lanes", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    await expect(
      laneRegistry.connect(addr1).appendToLane(1)
    ).to.be.revertedWith("Not the intake contract");
  });

  it("should only allow authorized lanes to report length", async function () {
    await laneRegistry.addLane(mockLaneContract.address);

    await expect(
      laneRegistry.reportLaneLength(2, 1) // Invalid lane ID
    ).to.be.revertedWith("Not authorized to report");
  });
});
