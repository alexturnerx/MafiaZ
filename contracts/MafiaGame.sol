// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract MafiaGame is SepoliaConfig {
    struct Game {
        address creator;
        address[4] players;
        euint8[4] encryptedRoles;
        uint8[4] roles;
        bool[4] alive;
        uint8 playerCount;
        bool started;
    }

    uint256 private _nextGameId;
    mapping(uint256 => Game) private _games;
    mapping(uint256 => mapping(address => uint8)) private _playerIndex; // index + 1

    event GameCreated(uint256 indexed gameId, address indexed creator);
    event PlayerJoined(uint256 indexed gameId, address indexed player);
    event GameStarted(uint256 indexed gameId);
    event PlayerAttacked(uint256 indexed gameId, address indexed attacker, address indexed target);

    error GameNotFound();
    error GameFull();
    error PlayerAlreadyJoined();
    error PlayerNotInGame();
    error GameAlreadyStarted();
    error GameNotReady();
    error GameNotStarted();
    error PlayerAlreadyDead();
    error NotWerewolf();
    error CannotAttackSelf();

    function createGame() external returns (uint256) {
        uint256 gameId = _nextGameId;
        _nextGameId += 1;

        Game storage game = _games[gameId];
        game.creator = msg.sender;

        _addPlayer(gameId, msg.sender);

        emit GameCreated(gameId, msg.sender);
        return gameId;
    }

    function joinGame(uint256 gameId) external {
        Game storage game = _games[gameId];
        if (game.creator == address(0)) {
            revert GameNotFound();
        }
        if (game.started) {
            revert GameAlreadyStarted();
        }
        if (game.playerCount >= 4) {
            revert GameFull();
        }
        if (_playerIndex[gameId][msg.sender] != 0) {
            revert PlayerAlreadyJoined();
        }

        _addPlayer(gameId, msg.sender);

        emit PlayerJoined(gameId, msg.sender);
    }

    function startGame(uint256 gameId) external {
        Game storage game = _games[gameId];
        if (game.creator == address(0)) {
            revert GameNotFound();
        }
        if (game.started) {
            revert GameAlreadyStarted();
        }
        if (_playerIndex[gameId][msg.sender] == 0) {
            revert PlayerNotInGame();
        }
        if (game.playerCount != 4) {
            revert GameNotReady();
        }

        uint8[4] memory roles = [uint8(1), uint8(1), uint8(2), uint8(3)];
        uint256 randomSeed = uint256(
            keccak256(
                abi.encode(block.prevrandao, block.timestamp, msg.sender, gameId)
            )
        );

        for (uint256 i = 3; i > 0; i--) {
            uint256 swapIndex = randomSeed % (i + 1);
            randomSeed = uint256(keccak256(abi.encode(randomSeed, i)));

            uint8 temp = roles[i];
            roles[i] = roles[swapIndex];
            roles[swapIndex] = temp;
        }

        for (uint256 i = 0; i < 4; i++) {
            uint8 assignedRole = roles[i];
            game.roles[i] = assignedRole;
            game.encryptedRoles[i] = FHE.asEuint8(assignedRole);
            FHE.allowThis(game.encryptedRoles[i]);
            FHE.allow(game.encryptedRoles[i], game.players[i]);
            game.alive[i] = true;
        }

        game.started = true;

        emit GameStarted(gameId);
    }

    function attack(uint256 gameId, address target) external {
        Game storage game = _games[gameId];
        if (game.creator == address(0)) {
            revert GameNotFound();
        }
        if (!game.started) {
            revert GameNotStarted();
        }

        uint8 attackerIndex = _playerIndex[gameId][msg.sender];
        if (attackerIndex == 0) {
            revert PlayerNotInGame();
        }
        uint8 attackerPosition = attackerIndex - 1;
        if (!game.alive[attackerPosition]) {
            revert PlayerAlreadyDead();
        }
        if (game.roles[attackerPosition] != 2) {
            revert NotWerewolf();
        }

        uint8 targetIndex = _playerIndex[gameId][target];
        if (targetIndex == 0) {
            revert PlayerNotInGame();
        }
        uint8 targetPosition = targetIndex - 1;
        if (!game.alive[targetPosition]) {
            revert PlayerAlreadyDead();
        }
        if (targetPosition == attackerPosition) {
            revert CannotAttackSelf();
        }

        game.alive[targetPosition] = false;

        emit PlayerAttacked(gameId, msg.sender, target);
    }

    function getGameDetails(uint256 gameId)
        external
        view
        returns (address creator, address[4] memory players, bool started, bool[4] memory alive, uint8 playerCount)
    {
        Game storage game = _games[gameId];
        if (game.creator == address(0)) {
            revert GameNotFound();
        }
        return (game.creator, game.players, game.started, game.alive, game.playerCount);
    }

    function getPlayerEncryptedRole(uint256 gameId, address player) external view returns (euint8) {
        Game storage game = _games[gameId];
        if (game.creator == address(0)) {
            revert GameNotFound();
        }
        if (!game.started) {
            revert GameNotStarted();
        }
        uint8 indexPlusOne = _playerIndex[gameId][player];
        if (indexPlusOne == 0) {
            revert PlayerNotInGame();
        }

        return game.encryptedRoles[indexPlusOne - 1];
    }

    function getNextGameId() external view returns (uint256) {
        return _nextGameId;
    }

    function getAlivePlayerCount(uint256 gameId) external view returns (uint8) {
        Game storage game = _games[gameId];
        if (game.creator == address(0)) {
            revert GameNotFound();
        }
        uint8 aliveCount = 0;
        for (uint256 i = 0; i < 4; i++) {
            if (game.players[i] != address(0) && game.alive[i]) {
                aliveCount += 1;
            }
        }
        return aliveCount;
    }

    function getPlayerStatus(uint256 gameId, address player) external view returns (bool) {
        Game storage game = _games[gameId];
        if (game.creator == address(0)) {
            revert GameNotFound();
        }
        uint8 indexPlusOne = _playerIndex[gameId][player];
        if (indexPlusOne == 0) {
            revert PlayerNotInGame();
        }
        return game.alive[indexPlusOne - 1];
    }

    function _addPlayer(uint256 gameId, address player) private {
        Game storage game = _games[gameId];
        uint8 newIndex = game.playerCount;
        game.players[newIndex] = player;
        game.playerCount += 1;
        _playerIndex[gameId][player] = newIndex + 1;
        game.alive[newIndex] = true;
    }
}
