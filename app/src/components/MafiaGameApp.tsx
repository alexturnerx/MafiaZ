import { useCallback, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, usePublicClient } from 'wagmi';
import { Contract } from 'ethers';
import { MAFIA_GAME_ABI, MAFIA_GAME_ADDRESS, ROLE_LABELS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/MafiaGameApp.css';

type GameDetails = {
  creator: string;
  players: string[];
  started: boolean;
  alive: boolean[];
  playerCount: number;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const formatAddress = (value: string) => {
  if (!value || value === ZERO_ADDRESS) {
    return '---';
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const roleLabel = (role: number | undefined | null) => {
  if (!role) {
    return 'Unknown';
  }
  return ROLE_LABELS[role] ?? 'Unknown';
};

export function MafiaGameApp() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const publicClient = usePublicClient();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null);
  const [aliveCount, setAliveCount] = useState<number | null>(null);
  const [encryptedRole, setEncryptedRole] = useState<string | null>(null);
  const [decryptedRole, setDecryptedRole] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const parseGameId = (value: string) => {
    if (!value) return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return null;
    }
    return BigInt(parsed);
  };

  const loadGame = useCallback(
    async (gameIdValue: string) => {
      if (!publicClient) {
        setError('Public client unavailable');
        return;
      }
      const parsedId = parseGameId(gameIdValue);
      if (parsedId === null) {
        setError('Invalid game id');
        return;
      }

      try {
        setIsBusy(true);
        setError('');
        const result = (await publicClient.readContract({
          address: MAFIA_GAME_ADDRESS as `0x${string}`,
          abi: MAFIA_GAME_ABI,
          functionName: 'getGameDetails',
          args: [parsedId],
        })) as unknown as [string, readonly string[], boolean, readonly boolean[], bigint];

        const [creator, playersRaw, started, aliveRaw, playerCountRaw] = result;
        const players = playersRaw.map(player => player);
        const alive = aliveRaw.map(flag => flag);

        setGameDetails({
          creator,
          players,
          started,
          alive,
          playerCount: Number(playerCountRaw),
        });

        const aliveValue = await publicClient.readContract({
          address: MAFIA_GAME_ADDRESS as `0x${string}`,
          abi: MAFIA_GAME_ABI,
          functionName: 'getAlivePlayerCount',
          args: [parsedId],
        });
        setAliveCount(Number(aliveValue));
      } catch (err) {
        console.error('Failed to load game', err);
        setGameDetails(null);
        setAliveCount(null);
        setError('Unable to load game data');
      } finally {
        setIsBusy(false);
      }
    },
    [publicClient],
  );

  const getContractWithSigner = useCallback(async () => {
    const signer = await signerPromise;
    if (!signer) {
      throw new Error('Wallet signer unavailable');
    }
    return new Contract(MAFIA_GAME_ADDRESS, MAFIA_GAME_ABI, signer);
  }, [signerPromise]);

  const refreshAfterAction = useCallback(
    async (gameIdValue: string) => {
      await loadGame(gameIdValue);
      setEncryptedRole(null);
      setDecryptedRole(null);
    },
    [loadGame],
  );

  const handleCreateGame = async () => {
    if (!publicClient) {
      setError('Public client unavailable');
      return;
    }

    setStatusMessage('Creating game...');
    setIsBusy(true);
    setError('');
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.createGame();
      await tx.wait();

      const nextId = (await publicClient.readContract({
        address: MAFIA_GAME_ADDRESS as `0x${string}`,
        abi: MAFIA_GAME_ABI,
        functionName: 'getNextGameId',
      })) as bigint;

      const newGameId = Number(nextId) - 1;
      const newGameIdString = String(newGameId);
      setSelectedGameId(newGameIdString);
      setStatusMessage(`Game created: #${newGameIdString}`);
      await refreshAfterAction(newGameIdString);
    } catch (err) {
      console.error('Create game failed', err);
      setError('Failed to create game');
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinGame = async () => {
    const parsedId = parseGameId(selectedGameId);
    if (parsedId === null) {
      setError('Enter a valid game id before joining');
      return;
    }
    setStatusMessage('Joining game...');
    setError('');
    setIsBusy(true);
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.joinGame(parsedId);
      await tx.wait();
      setStatusMessage(`Joined game #${selectedGameId}`);
      await refreshAfterAction(selectedGameId);
    } catch (err) {
      console.error('Join game failed', err);
      setError('Unable to join the selected game');
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartGame = async () => {
    const parsedId = parseGameId(selectedGameId);
    if (parsedId === null) {
      setError('Enter a valid game id before starting');
      return;
    }
    setStatusMessage('Starting game...');
    setIsBusy(true);
    setError('');
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.startGame(parsedId);
      await tx.wait();
      setStatusMessage('Roles assigned with Zama encryption');
      await refreshAfterAction(selectedGameId);
    } catch (err) {
      console.error('Start game failed', err);
      setError('Game start failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedGameId) {
      setError('Enter a game id to inspect');
      return;
    }
    await loadGame(selectedGameId);
  };

  const handleDecryptRole = async () => {
    if (!address) {
      setError('Connect your wallet to decrypt your role');
      return;
    }
    if (!instance) {
      setError('Encryption service unavailable');
      return;
    }
    if (zamaError) {
      setError(zamaError);
      return;
    }

    const parsedId = parseGameId(selectedGameId);
    if (parsedId === null) {
      setError('Enter a valid game id before decrypting');
      return;
    }
    if (!publicClient) {
      setError('Public client unavailable');
      return;
    }

    setIsBusy(true);
    setStatusMessage('Decrypting your role...');
    setError('');

    try {
      const ciphertext = (await publicClient.readContract({
        address: MAFIA_GAME_ADDRESS as `0x${string}`,
        abi: MAFIA_GAME_ABI,
        functionName: 'getPlayerEncryptedRole',
        args: [parsedId, address as `0x${string}`],
      })) as string;

      setEncryptedRole(ciphertext);

      const keypair = instance.generateKeypair();
      const contractAddresses = [MAFIA_GAME_ADDRESS];
      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimestamp,
        durationDays,
      );

      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Wallet signer unavailable');
      }

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const decrypted = await instance.userDecrypt(
        [
          {
            handle: ciphertext,
            contractAddress: MAFIA_GAME_ADDRESS,
          },
        ],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays,
      );

      const rawRole = decrypted[ciphertext];
      const numericRole = Number(rawRole);
      setDecryptedRole(roleLabel(numericRole));
      setStatusMessage('Role decrypted successfully');
    } catch (err) {
      console.error('Decrypt role failed', err);
      setError('Unable to decrypt your role');
    } finally {
      setIsBusy(false);
    }
  };

  const handleAttack = async (target: string) => {
    const parsedId = parseGameId(selectedGameId);
    if (parsedId === null) {
      setError('Enter a valid game id before attacking');
      return;
    }
    setStatusMessage(`Attacking ${formatAddress(target)}...`);
    setIsBusy(true);
    setError('');
    try {
      const contract = await getContractWithSigner();
      const tx = await contract.attack(parsedId, target);
      await tx.wait();
      setStatusMessage('Attack processed');
      await refreshAfterAction(selectedGameId);
    } catch (err) {
      console.error('Attack failed', err);
      setError('Attack failed');
    } finally {
      setIsBusy(false);
    }
  };

  const isWerewolf = decryptedRole === ROLE_LABELS[2];

  return (
    <div className="mafia-container">
      <header className="mafia-header">
        <div>
          <h1 className="mafia-title">Zama Mafia Game</h1>
          <p className="mafia-subtitle">4 players · encrypted roles · live attacks</p>
        </div>
        <ConnectButton label="Connect"/>
      </header>

      {!!error && <div className="mafia-alert mafia-alert-error">{error}</div>}
      {!!statusMessage && <div className="mafia-alert mafia-alert-info">{statusMessage}</div>}
      {zamaError && <div className="mafia-alert mafia-alert-error">{zamaError}</div>}
      {zamaLoading && <div className="mafia-alert mafia-alert-info">Preparing encryption service...</div>}

      <section className="mafia-card">
        <h2 className="section-title">Game Controls</h2>
        <div className="control-row">
          <button onClick={handleCreateGame} disabled={isBusy || !address}>
            Create New Game
          </button>
          <div className="game-id-input-group">
            <label htmlFor="game-id">Game ID</label>
            <input
              id="game-id"
              type="number"
              min="0"
              value={selectedGameId}
              onChange={(event) => setSelectedGameId(event.target.value)}
              placeholder="Enter game id"
            />
          </div>
          <button onClick={handleJoinGame} disabled={isBusy || !address}>
            Join Game
          </button>
          <button onClick={handleStartGame} disabled={isBusy || !address}>
            Start Game
          </button>
          <button onClick={handleRefresh} disabled={isBusy}>
            Refresh
          </button>
        </div>
      </section>

      <section className="mafia-card">
        <h2 className="section-title">Game Overview</h2>
        {gameDetails ? (
          <div className="game-grid">
            <div className="game-info">
              <p><strong>Creator:</strong> {formatAddress(gameDetails.creator)}</p>
              <p><strong>Players Joined:</strong> {gameDetails.playerCount} / 4</p>
              <p><strong>Alive Players:</strong> {aliveCount ?? '--'}</p>
              <p><strong>Status:</strong> {gameDetails.started ? 'In progress' : 'Waiting for players'}</p>
            </div>
            <div className="player-list">
              <h3 className="player-list-title">Players</h3>
              <ul>
                {gameDetails.players.map((player, index) => (
                  <li key={`${player}-${index}`} className="player-row">
                    <div>
                      <span className="player-slot">#{index + 1}</span>
                      <span className="player-address">{formatAddress(player)}</span>
                      {player === address && <span className="badge">You</span>}
                    </div>
                    <div className={`player-status ${gameDetails.alive[index] ? 'alive' : 'dead'}`}>
                      {gameDetails.alive[index] ? 'Alive' : 'Dead'}
                    </div>
                    {isWerewolf &&
                      address &&
                      player !== address &&
                      gameDetails.alive[index] && (
                        <button
                          className="attack-button"
                          onClick={() => handleAttack(player)}
                          disabled={isBusy}
                        >
                          Attack
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="placeholder-text">Load a game to see players and status.</p>
        )}
      </section>

      <section className="mafia-card">
        <h2 className="section-title">My Encrypted Role</h2>
        <div className="role-grid">
          <div>
            <p className="label">Encrypted Handle</p>
            <p className="value value-mono">{encryptedRole ?? 'Not fetched yet'}</p>
          </div>
          <div>
            <p className="label">Decrypted Role</p>
            <p className="value">{decryptedRole ?? 'Unknown'}</p>
          </div>
        </div>
        <button onClick={handleDecryptRole} disabled={isBusy || !address || !gameDetails || !gameDetails.started}>
          Decrypt My Role
        </button>
      </section>
    </div>
  );
}
