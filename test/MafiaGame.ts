import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { MafiaGame, MafiaGame__factory } from "../types";

describe("MafiaGame", function () {
  let contract: MafiaGame;
  let contractAddress: string;
  let players: HardhatEthersSigner[];

  before(async function () {
    players = await ethers.getSigners();
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    const factory = (await ethers.getContractFactory("MafiaGame")) as MafiaGame__factory;
    contract = (await factory.deploy()) as MafiaGame;
    contractAddress = await contract.getAddress();
  });

  it("creates a game, assigns roles, and handles attacks", async function () {
    const createTx = await contract.connect(players[0]).createGame();
    await createTx.wait();

    const createdGameId = Number(await contract.getNextGameId()) - 1;

    await expect(contract.getPlayerEncryptedRole(createdGameId, players[0].address)).to.be.revertedWithCustomError(
      contract,
      "GameNotStarted",
    );

    await contract.connect(players[1]).joinGame(createdGameId);
    await contract.connect(players[2]).joinGame(createdGameId);
    await contract.connect(players[3]).joinGame(createdGameId);

    await expect(contract.connect(players[4]).joinGame(createdGameId)).to.be.revertedWithCustomError(
      contract,
      "GameFull",
    );

    const gameDetails = await contract.getGameDetails(createdGameId);
    expect(Number(gameDetails.playerCount)).to.equal(4);
    expect(gameDetails.started).to.equal(false);

    await contract.connect(players[1]).startGame(createdGameId);

    const updatedDetails = await contract.getGameDetails(createdGameId);
    expect(updatedDetails.started).to.equal(true);

    const roleCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    let werewolfIndex = -1;

    for (let i = 0; i < 4; i++) {
      const cipher = await contract.getPlayerEncryptedRole(createdGameId, players[i].address);
      const clearRole = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        cipher,
        contractAddress,
        players[i],
      );

      const roleAsNumber = Number(clearRole);
      roleCounts[roleAsNumber] = (roleCounts[roleAsNumber] ?? 0) + 1;
      if (roleAsNumber === 2) {
        werewolfIndex = i;
      }

      const alive = await contract.getPlayerStatus(createdGameId, players[i].address);
      expect(alive).to.equal(true);
    }

    expect(roleCounts[1]).to.equal(2);
    expect(roleCounts[2]).to.equal(1);
    expect(roleCounts[3]).to.equal(1);
    expect(werewolfIndex).to.not.equal(-1);

    let targetIndex = 0;
    while (targetIndex === werewolfIndex) {
      targetIndex += 1;
    }

    await expect(
      contract.connect(players[targetIndex]).attack(createdGameId, players[werewolfIndex].address),
    ).to.be.revertedWithCustomError(contract, "NotWerewolf");

    await expect(
      contract.connect(players[werewolfIndex]).attack(createdGameId, players[werewolfIndex].address),
    ).to.be.revertedWithCustomError(contract, "CannotAttackSelf");

    const attackTx = await contract
      .connect(players[werewolfIndex])
      .attack(createdGameId, players[targetIndex].address);
    await attackTx.wait();

    const targetAlive = await contract.getPlayerStatus(createdGameId, players[targetIndex].address);
    expect(targetAlive).to.equal(false);

    await expect(
      contract.connect(players[werewolfIndex]).attack(createdGameId, players[targetIndex].address),
    ).to.be.revertedWithCustomError(contract, "PlayerAlreadyDead");

    const aliveCount = await contract.getAlivePlayerCount(createdGameId);
    expect(Number(aliveCount)).to.equal(3);
  });
});
