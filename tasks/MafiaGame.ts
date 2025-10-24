import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:mafia-address", "Prints the MafiaGame address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const deployment = await deployments.get("MafiaGame");

  console.log("MafiaGame address is " + deployment.address);
});

task("task:mafia-create", "Creates a new Mafia game")
  .addOptionalParam("address", "Override MafiaGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MafiaGame");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("MafiaGame", deployment.address);

    const tx = await contract.connect(signer).createGame();
    console.log(`Creating game (tx: ${tx.hash})`);
    const receipt = await tx.wait();

    const gameId = await contract.getNextGameId();
    console.log(`Game created with id ${Number(gameId) - 1}, status: ${receipt?.status}`);
  });

task("task:mafia-join", "Joins an existing Mafia game")
  .addParam("gameId", "Game identifier")
  .addOptionalParam("address", "Override MafiaGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MafiaGame");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("MafiaGame", deployment.address);

    const tx = await contract.connect(signer).joinGame(Number(taskArguments.gameId));
    console.log(`Joining game ${taskArguments.gameId} (tx: ${tx.hash})`);
    await tx.wait();
    console.log("Joined game successfully");
  });

task("task:mafia-start", "Starts a Mafia game and assigns roles")
  .addParam("gameId", "Game identifier")
  .addOptionalParam("address", "Override MafiaGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MafiaGame");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("MafiaGame", deployment.address);

    const tx = await contract.connect(signer).startGame(Number(taskArguments.gameId));
    console.log(`Starting game ${taskArguments.gameId} (tx: ${tx.hash})`);
    await tx.wait();
    console.log("Game started with encrypted roles");
  });

task("task:mafia-attack", "Werewolf attacks a target player")
  .addParam("gameId", "Game identifier")
  .addParam("target", "Target player address")
  .addOptionalParam("address", "Override MafiaGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers } = hre;

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MafiaGame");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("MafiaGame", deployment.address);

    const tx = await contract
      .connect(signer)
      .attack(Number(taskArguments.gameId), taskArguments.target);
    console.log(`Attacking player ${taskArguments.target} in game ${taskArguments.gameId} (tx: ${tx.hash})`);
    await tx.wait();
    console.log("Attack processed");
  });

task("task:mafia-role", "Decrypts the caller role for a game")
  .addParam("gameId", "Game identifier")
  .addOptionalParam("player", "Player address, defaults to signer")
  .addOptionalParam("address", "Override MafiaGame contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MafiaGame");

    const [signer] = await ethers.getSigners();
    const playerAddress = taskArguments.player ?? signer.address;
    const contract = await ethers.getContractAt("MafiaGame", deployment.address);

    const ciphertext = await contract.getPlayerEncryptedRole(Number(taskArguments.gameId), playerAddress);
    const clearRole = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      ciphertext,
      deployment.address,
      signer,
    );

    console.log(`Encrypted role: ${ciphertext}`);
    console.log(`Decrypted role for ${playerAddress}: ${clearRole}`);
  });
