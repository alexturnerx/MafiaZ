# MafiaZ

A fully decentralized Mafia game powered by **Fully Homomorphic Encryption (FHE)** using Zama's FHEVM protocol. Experience the classic social deduction game on the blockchain with cryptographically secure role assignments that remain private until you choose to decrypt them.

## Overview

MafiaZ brings the popular party game "Mafia" (also known as "Werewolf") to the blockchain while solving a fundamental challenge: **how do you keep player roles secret in a transparent, public ledger?** By leveraging Zama's FHEVM technology, roles are encrypted on-chain and can only be decrypted by the assigned player, ensuring true privacy without requiring a trusted third party.

## Key Features

### Privacy-Preserving Gameplay
- **Encrypted Role Assignment**: All player roles (Villager, Werewolf, Seer) are encrypted using Fully Homomorphic Encryption
- **Client-Side Decryption**: Only the assigned player can decrypt and view their role
- **Zero Trust Architecture**: No central server or game master required
- **On-Chain Verification**: All game state is stored and verified on the Ethereum blockchain

### Game Mechanics
- **4-Player Games**: Each game supports exactly 4 players
- **3 Unique Roles**:
  - **Villager** (×2): Common villagers trying to survive
  - **Werewolf** (×1): Can attack and eliminate other players
  - **Seer** (×1): Special villager with prophetic abilities (future expansion)
- **Random Role Distribution**: Cryptographically secure role shuffling on-chain
- **Attack System**: Werewolves can target and eliminate other players
- **Real-Time Game State**: Live updates on player status and game progression

### User Experience
- **Wallet Integration**: Seamless connection via RainbowKit (supports MetaMask, WalletConnect, and more)
- **Intuitive Interface**: Clean, modern UI built with React
- **Game Management**: Create, join, start, and monitor multiple game sessions
- **Transparent Status**: View all players, alive/dead status, and game phase
- **Role Decryption Flow**: Simple one-click decryption with wallet signature

## Problems Solved

### 1. Privacy in Public Blockchains
Traditional blockchain applications struggle with privacy - all data is transparent by default. MafiaZ solves this using FHEVM, allowing computations on encrypted data without revealing the underlying information. Players' roles remain secret even though they're stored on a public ledger.

### 2. Trusted Third-Party Elimination
Classic online implementations of Mafia require a game master or central server to manage roles and verify actions. This creates a single point of failure and requires players to trust the server operator. MafiaZ eliminates this need entirely - the smart contract is the impartial game master.

### 3. Provable Fairness
With traditional digital games, players must trust that role assignment is truly random. MafiaZ uses on-chain randomness (`block.prevrandao`) combined with smart contract logic, making the randomness verifiable and tamper-proof.

### 4. Censorship Resistance
By deploying on Ethereum, MafiaZ cannot be shut down by any single entity. As long as the blockchain exists, the game remains playable.

### 5. Composability
Built as a smart contract, MafiaZ can be integrated into other dApps, DAOs, or gaming platforms. Developers can build upon or fork the contract to create variations.

## Technology Stack

### Smart Contracts
- **Solidity** `^0.8.27`: Primary smart contract language
- **FHEVM** `@fhevm/solidity ^0.8.0`: Zama's Fully Homomorphic Encryption library for Solidity
- **Hardhat** `^2.26.0`: Development environment for compilation, testing, and deployment
- **Hardhat Deploy** `^0.11.45`: Deployment management and versioning
- **TypeChain** `^8.3.2`: TypeScript bindings for smart contracts
- **Zama Oracle** `@zama-fhe/oracle-solidity ^0.1.0`: FHE oracle integration

### Frontend
- **React** `^19.1.1`: UI framework
- **Vite** `^7.1.6`: Fast build tool and development server
- **TypeScript** `~5.8.3`: Type-safe JavaScript
- **Wagmi** `^2.17.0`: React hooks for Ethereum
- **Viem** `^2.37.6`: TypeScript interface for Ethereum (read operations)
- **Ethers.js** `^6.15.0`: Ethereum library (write operations)
- **RainbowKit** `^2.2.8`: Wallet connection UI and management
- **TanStack Query** `^5.89.0`: Async state management
- **Zama Relayer SDK** `@zama-fhe/relayer-sdk ^0.2.0`: Client-side FHE operations and decryption

### Blockchain Infrastructure
- **Ethereum Sepolia Testnet**: Primary deployment network
- **Infura**: RPC node provider
- **Hardhat Network**: Local development and testing

### Development Tools
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Solhint**: Solidity-specific linting
- **Mocha & Chai**: Testing framework
- **Hardhat Gas Reporter**: Gas usage analysis
- **Solidity Coverage**: Test coverage reporting

## Architecture

### Smart Contract Architecture

```
MafiaGame.sol
├── Game Management
│   ├── createGame(): Initialize new 4-player game
│   ├── joinGame(): Add player to existing game
│   └── startGame(): Assign encrypted roles randomly
├── Role System
│   ├── Encrypted role storage (euint8)
│   ├── Role assignment with Fisher-Yates shuffle
│   └── getPlayerEncryptedRole(): Retrieve encrypted role
├── Gameplay
│   ├── attack(): Werewolf eliminates target player
│   └── Player alive/dead state management
└── View Functions
    ├── getGameDetails(): Fetch game state
    ├── getAlivePlayerCount(): Count surviving players
    └── getPlayerStatus(): Check if player is alive
```

### Frontend Architecture

```
app/
├── src/
│   ├── components/
│   │   └── MafiaGameApp.tsx        # Main game UI component
│   ├── hooks/
│   │   ├── useEthersSigner.ts      # Convert Wagmi client to ethers signer
│   │   └── useZamaInstance.ts      # Initialize Zama FHE instance
│   ├── config/
│   │   ├── wagmi.ts                # Wagmi/RainbowKit configuration
│   │   └── contracts.ts            # Contract address & ABI
│   └── styles/
│       └── MafiaGameApp.css        # Custom styling
```

### Encryption Flow

1. **Role Assignment** (On-Chain):
   ```
   Role Generation → Fisher-Yates Shuffle → FHE.asEuint8() → Store encrypted role
   ```

2. **Role Decryption** (Client-Side):
   ```
   Fetch encrypted role → Generate keypair → Create EIP712 signature →
   Request decryption → Decrypt with private key → Display role
   ```

## Installation & Setup

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH**: For testnet deployment and transactions (get from [Sepolia faucet](https://sepoliafaucet.com/))

### Backend Setup (Smart Contracts)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MafiaZ
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create or edit `.env` file:
   ```bash
   PRIVATE_KEY=your_private_key_here
   INFURA_API_KEY=your_infura_api_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

6. **Deploy to local network**
   ```bash
   # Terminal 1: Start local Hardhat node
   npx hardhat node

   # Terminal 2: Deploy contracts
   npx hardhat deploy --network localhost
   ```

7. **Deploy to Sepolia testnet**
   ```bash
   npx hardhat deploy --network sepolia
   ```

8. **Verify contract on Etherscan**
   ```bash
   npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS>
   ```

### Frontend Setup

1. **Navigate to app directory**
   ```bash
   cd app
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure contract address**

   Edit `app/src/config/contracts.ts`:
   ```typescript
   export const MAFIA_GAME_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## Usage Guide

### Creating a Game

1. **Connect Wallet**: Click "Connect" button and select your Web3 wallet
2. **Create Game**: Click "Create New Game" button
3. **Share Game ID**: Note the game ID displayed after creation
4. **Wait for Players**: Share the game ID with 3 other players

### Joining a Game

1. **Connect Wallet**: Ensure your wallet is connected
2. **Enter Game ID**: Input the game ID shared by the game creator
3. **Join Game**: Click "Join Game" button
4. **Wait for Start**: Game requires exactly 4 players before starting

### Starting a Game

1. **Verify Players**: Ensure all 4 player slots are filled
2. **Start Game**: Any player can click "Start Game"
3. **Role Assignment**: Roles are randomly assigned and encrypted on-chain
4. **Decrypt Role**: Click "Decrypt My Role" to reveal your character

### Playing as Werewolf

1. **Decrypt Your Role**: Confirm you are the Werewolf
2. **Select Target**: Choose a player from the alive players list
3. **Attack**: Click the "Attack" button next to your target
4. **Confirm Transaction**: Sign the transaction in your wallet
5. **Observe Results**: Target player is marked as "Dead"

### Game Monitoring

- **Refresh**: Click "Refresh" button to update game state
- **Player List**: View all players and their alive/dead status
- **Game Overview**: See creator, player count, and game phase
- **Your Role**: View your encrypted handle and decrypted role

## Smart Contract Details

### Contract: MafiaGame.sol

**Deployed Address**: [Check deployments/sepolia/MafiaGame.json]

#### Key Functions

| Function | Visibility | Description |
|----------|-----------|-------------|
| `createGame()` | external | Initialize a new game, creator auto-joins |
| `joinGame(uint256 gameId)` | external | Join an existing game lobby |
| `startGame(uint256 gameId)` | external | Start game and assign encrypted roles |
| `attack(uint256 gameId, address target)` | external | Werewolf eliminates a player |
| `getGameDetails(uint256 gameId)` | external view | Fetch complete game state |
| `getPlayerEncryptedRole(uint256 gameId, address player)` | external view | Get player's encrypted role |
| `getAlivePlayerCount(uint256 gameId)` | external view | Count alive players |
| `getPlayerStatus(uint256 gameId, address player)` | external view | Check if player is alive |

#### Events

```solidity
event GameCreated(uint256 indexed gameId, address indexed creator);
event PlayerJoined(uint256 indexed gameId, address indexed player);
event GameStarted(uint256 indexed gameId);
event PlayerAttacked(uint256 indexed gameId, address indexed attacker, address indexed target);
```

#### Role Encoding

- `1`: Villager
- `2`: Werewolf
- `3`: Seer

#### Game State

```solidity
struct Game {
    address creator;           // Game creator address
    address[4] players;        // Array of player addresses
    euint8[4] encryptedRoles; // FHE-encrypted roles
    uint8[4] roles;           // Plaintext roles (internal)
    bool[4] alive;            // Alive/dead status
    uint8 playerCount;        // Current player count
    bool started;             // Game started flag
}
```

### Security Features

- **Input Validation**: All functions validate game state and player eligibility
- **Custom Errors**: Gas-efficient error handling
- **Access Control**: Role-based function restrictions (e.g., only Werewolf can attack)
- **State Management**: Prevents invalid state transitions
- **Reentrancy Safe**: No external calls during state modifications

## Advantages

### 1. **True Privacy Without Centralization**
Unlike traditional online implementations that require a trusted game master, MafiaZ uses cryptography to guarantee privacy. Even the blockchain validators cannot see player roles.

### 2. **Unstoppable & Permissionless**
No registration, no accounts, no servers. Just connect your wallet and play. The game cannot be censored, shut down, or modified by any authority.

### 3. **Provably Fair**
All game logic is open-source and executed on-chain. Players can verify that role assignment is truly random and rules are enforced correctly.

### 4. **Educational Value**
MafiaZ serves as a practical demonstration of:
- Fully Homomorphic Encryption in real-world applications
- Privacy-preserving smart contracts
- Decentralized game theory
- Web3 UX best practices

### 5. **Composable & Extensible**
Built on open standards (ERC, EIP-712), MafiaZ can be:
- Integrated into metaverse platforms
- Used as a DAO governance game
- Forked and modified for variants
- Combined with NFTs for cosmetics or achievements

### 6. **Gas Efficient**
Optimized smart contract design minimizes transaction costs while maintaining security and functionality.

### 7. **No Backend Required**
Entirely client-side application (except for blockchain interaction). No servers to maintain, no infrastructure costs.

### 8. **Cross-Platform**
Works on any device with a Web3-compatible browser and wallet.

## Roadmap & Future Development

### Phase 1: Core Mechanics (Current)
- [x] 4-player game support
- [x] Encrypted role assignment
- [x] Werewolf attack system
- [x] Role decryption
- [x] Sepolia deployment

### Phase 2: Enhanced Gameplay
- [ ] **Day/Night Cycles**: Structured rounds with voting phases
- [ ] **Seer Investigation**: Allow Seer to investigate other players
- [ ] **Voting System**: Democratic elimination of suspected werewolves
- [ ] **Discussion Timer**: Timed rounds for strategy discussion
- [ ] **Victory Conditions**: Automatic win detection for Villagers or Werewolves

### Phase 3: Scalability & UX
- [ ] **Multiple Game Sizes**: Support for 6, 8, or 10-player games
- [ ] **Game Lobbies**: Browse and discover public games
- [ ] **Spectator Mode**: Watch ongoing games
- [ ] **Game History**: View past games and statistics
- [ ] **Player Profiles**: Track wins, losses, and achievements

### Phase 4: Advanced Features
- [ ] **Additional Roles**:
  - Doctor (can protect players)
  - Detective (investigative abilities)
  - Jester (alternative win condition)
- [ ] **Custom Game Modes**: Host-defined rule variations
- [ ] **NFT Integration**: Collectible role cards or cosmetics
- [ ] **Token Economics**: Staking, rewards, or tournament prizes
- [ ] **Cross-Chain Support**: Deploy to other EVM chains

### Phase 5: Social & Community
- [ ] **Chat Integration**: In-game messaging via decentralized protocols
- [ ] **Reputation System**: Player ratings and trust scores
- [ ] **Tournaments**: Organized competitive play
- [ ] **DAO Governance**: Community-driven development
- [ ] **Mobile App**: Native iOS/Android applications

### Phase 6: Research & Innovation
- [ ] **Zero-Knowledge Proofs**: Alternative privacy approach comparison
- [ ] **Layer 2 Deployment**: Reduce gas costs on Arbitrum/Optimism
- [ ] **AI Game Master**: Optional AI-assisted moderation
- [ ] **Formal Verification**: Mathematical proof of contract correctness

## Project Structure

```
MafiaZ/
├── contracts/                  # Solidity smart contracts
│   ├── FHECounter.sol         # Example FHE contract
│   └── MafiaGame.sol          # Main game contract
├── deploy/                     # Deployment scripts
│   └── deploy.ts              # Hardhat deploy configuration
├── test/                       # Smart contract tests
│   └── MafiaGame.test.ts      # Game logic tests
├── tasks/                      # Custom Hardhat tasks
├── app/                        # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── config/            # Configuration files
│   │   └── styles/            # CSS stylesheets
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
├── docs/                       # Technical documentation
│   ├── zama_llm.md            # Zama contract guide
│   └── zama_doc_relayer.md    # Zama frontend guide
├── types/                      # TypeScript type definitions
├── artifacts/                  # Compiled contract artifacts
├── cache/                      # Build cache
├── hardhat.config.ts          # Hardhat configuration
├── package.json               # Root dependencies
├── tsconfig.json              # TypeScript configuration
├── .env                       # Environment variables (not in git)
└── README.md                  # This file
```

## Testing

### Smart Contract Tests

```bash
# Run all tests
npm run test

# Run tests on Sepolia
npm run test:sepolia

# Generate coverage report
npm run coverage

# Gas usage report
npm run test
```

### Frontend Testing

```bash
cd app

# Lint code
npm run lint

# Type checking
npm run build
```

## Deployment

### Local Development

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost

# Terminal 3: Start frontend
cd app && npm run dev
```

### Sepolia Testnet

```bash
# Deploy contract
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia

# Update frontend config with deployed address
# Edit app/src/config/contracts.ts

# Build and deploy frontend
cd app
npm run build
# Deploy dist/ folder to hosting service (Vercel, Netlify, etc.)
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code style**: Run `npm run lint` and `npm run prettier:write`
4. **Write tests**: Ensure new features have test coverage
5. **Commit your changes**: Use conventional commit messages
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes in detail

### Development Guidelines

- All code must be in English (comments, variables, functions)
- No Tailwind CSS (use vanilla CSS or CSS modules)
- Frontend write operations use Ethers.js
- Frontend read operations use Viem
- No localStorage usage
- No mock data - all features must be fully functional
- Contract view functions must not use `msg.sender` internally

## Security Considerations

### Smart Contract Security

- **Audited Libraries**: Uses battle-tested OpenZeppelin and Zama libraries
- **Custom Errors**: Gas-efficient error handling
- **State Validation**: All functions validate preconditions
- **No Reentrancy**: No external calls during state changes
- **Overflow Protection**: Solidity 0.8+ built-in overflow checks

### Frontend Security

- **EIP-712 Signatures**: Structured data signing for security
- **Client-Side Decryption**: Private keys never leave user's device
- **Wallet Integration**: No private key handling by application
- **HTTPS Required**: Secure communication with RPC nodes

### Known Limitations

- **On-Chain Randomness**: Uses `block.prevrandao` which can be influenced by validators (acceptable for low-stakes gaming)
- **Front-Running**: Attacks are public before mining (future versions may use commit-reveal)
- **Gas Costs**: FHE operations are more expensive than plaintext
- **Sepolia Testnet**: Not suitable for production/real money

## License

This project is licensed under the **BSD-3-Clause-Clear License**. See [LICENSE](LICENSE) file for details.

## Resources & Documentation

### Zama FHEVM
- [Official Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

### Web3 Technologies
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Hardhat Documentation](https://hardhat.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)

### Community
- **Discord**: [Zama Discord](https://discord.gg/zama)
- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Twitter**: Follow [@zama_fhe](https://twitter.com/zama_fhe) for updates

## Acknowledgments

- **Zama Team**: For developing FHEVM and pioneering on-chain FHE
- **Hardhat Team**: For the excellent development framework
- **RainbowKit Team**: For seamless wallet integration
- **Ethereum Foundation**: For the Sepolia testnet infrastructure
- **Mafia Game Community**: For inspiring this blockchain adaptation

## FAQ

**Q: Do I need cryptocurrency to play?**
A: Yes, you need Sepolia ETH for transaction fees. Sepolia ETH is free from faucets.

**Q: Can other players see my role?**
A: No, your role is encrypted on-chain and only you can decrypt it with your wallet signature.

**Q: What happens if a player disconnects?**
A: Game state persists on-chain. Players can reconnect and continue from where they left off.

**Q: Why does decryption require a wallet signature?**
A: This proves you own the address and authorizes the Zama relayer to decrypt your specific role.

**Q: Is this game playable on mainnet?**
A: Currently deployed on Sepolia testnet. Mainnet deployment possible but gas costs would be higher.

**Q: Can I fork this project?**
A: Yes! This is open-source under BSD-3-Clause-Clear license. Please attribute the original project.

**Q: How is randomness ensured?**
A: Role shuffling uses Fisher-Yates algorithm with `block.prevrandao` as entropy source.

**Q: What makes this better than Web2 Mafia games?**
A: Decentralization, verifiable fairness, censorship resistance, and no trusted third parties.

---

**Built with privacy, powered by cryptography, played by the community.**

For questions, issues, or contributions, please visit our [GitHub repository](#) or join the [Zama Discord](https://discord.gg/zama).
