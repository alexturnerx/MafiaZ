import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedMafiaGame = await deploy("MafiaGame", {
    from: deployer,
    log: true,
  });

  console.log(`MafiaGame contract: `, deployedMafiaGame.address);
};
export default func;
func.id = "deploy_mafia_game"; // id required to prevent reexecution
func.tags = ["MafiaGame"];
