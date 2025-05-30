import { 
  GameState, 
  Player, 
  GameMode, 
  RoundState, 
  Card, 
  PlayedCard, 
  ChatMessage 
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { 
  initializeGameState, 
  assignTeams, 
  dealCardsToPlayers, 
  processPlayedCard, 
  startNewRound,
  processTrucoRequest,
  acceptTrucoRequest,
  declineTrucoRequest
} from '@/utils/gameUtils';

export class TrucoGame extends EventEmitter {
  public gameState: GameState;
  private chatMessages: ChatMessage[] = [];
  private playerNames: Map<string, string> = new Map();
  private disconnectedPlayers: Map<string, string> = new Map(); // Map of disconnected player IDs to usernames
  
  constructor(id: string, mode: GameMode) {
    super();
    this.gameState = initializeGameState(id, mode, []);
  }
  
  // Player management
  public addPlayer(playerId: string, username: string): Player | null {
    // Check if game is full
    const maxPlayers = this.gameState.mode === GameMode.ONE_VS_ONE ? 2 : 4;
    if (this.gameState.players.length >= maxPlayers) {
      return null;
    }
    
    // Check if player is already in the game
    if (this.gameState.players.some(p => p.id === playerId)) {
      return this.gameState.players.find(p => p.id === playerId) || null;
    }
    
    // Store player name
    this.playerNames.set(playerId, username);
    
    // Create new player
    const newPlayer: Player = {
      id: playerId,
      username,
      hand: [],
      isDealer: this.gameState.players.length === 0, // First player is dealer
      team: 'A', // Will be properly assigned later
      isReady: false,
      isYourTurn: false
    };
    
    // Add player and reassign teams
    const updatedPlayers = [...this.gameState.players, newPlayer];
    const playersWithTeams = assignTeams(updatedPlayers, this.gameState.mode);
    
    // Update game state
    this.gameState = {
      ...this.gameState,
      players: playersWithTeams
    };
    
    // If this is the first player, make them the dealer
    if (this.gameState.players.length === 1) {
      this.gameState.dealer = playerId;
    }
    
    // Notify game update
    this.emitGameUpdate();
    
    return newPlayer;
  }
  
  public removePlayer(playerId: string): void {
    // Remove player
    const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    // Reset game if in progress
    if (this.gameState.roundState !== RoundState.WAITING_FOR_PLAYERS) {
      this.resetGame();
      return;
    }
    
    // Update players
    const updatedPlayers = this.gameState.players.filter(p => p.id !== playerId);
    
    // Reset dealer if necessary
    let dealer = this.gameState.dealer;
    if (dealer === playerId && updatedPlayers.length > 0) {
      dealer = updatedPlayers[0].id;
    }
    
    // Reassign teams
    const playersWithTeams = assignTeams(updatedPlayers, this.gameState.mode);
    
    // Update game state
    this.gameState = {
      ...this.gameState,
      players: playersWithTeams,
      dealer
    };
    
    this.emitGameUpdate();
  }
  
  public setPlayerReady(playerId: string): void {
    // Find player
    const playerIndex = this.gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    // Update player ready status
    const updatedPlayers = [...this.gameState.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      isReady: true
    };
    
    // Update game state
    this.gameState = {
      ...this.gameState,
      players: updatedPlayers
    };
    
    this.emitGameUpdate();
    
    // Check if all players are ready and we have enough players
    const allReady = updatedPlayers.every(p => p.isReady);
    const minPlayers = this.gameState.mode === GameMode.ONE_VS_ONE ? 2 : 4;
    
    if (allReady && updatedPlayers.length === minPlayers) {
      this.startGame();
    }
  }
  
  // Game control methods
  public startGame(): void {
    // Ensure we have enough players
    const minPlayers = this.gameState.mode === GameMode.ONE_VS_ONE ? 2 : 4;
    if (this.gameState.players.length < minPlayers) {
      return;
    }
    
    // Deal cards and start the game
    this.gameState = dealCardsToPlayers(this.gameState);
    this.emitGameUpdate();
  }
  
  public playCard(playerId: string, cardId: string): void {
    // Ensure it's the player's turn
    if (this.gameState.currentPlayer !== playerId) {
      return;
    }
    
    // Process the card play
    this.gameState = processPlayedCard(this.gameState, playerId, cardId);
    this.emitGameUpdate();
  }
  
  public requestTruco(playerId: string): void {
    this.gameState = processTrucoRequest(this.gameState, playerId);
    this.emitGameUpdate();
  }
  
  public acceptTruco(): void {
    this.gameState = acceptTrucoRequest(this.gameState);
    this.emitGameUpdate();
  }
  
  public declineTruco(): void {
    this.gameState = declineTrucoRequest(this.gameState);
    this.emitGameUpdate();
  }
  
  public startNewRound(): void {
    this.gameState = startNewRound(this.gameState);
    this.emitGameUpdate();
  }
  
  public resetGame(): void {
    // Reset game state, keeping players but clearing hands and scores
    const updatedPlayers = this.gameState.players.map(p => ({
      ...p,
      hand: [],
      isReady: false,
      isYourTurn: false,
      isDealer: p.id === this.gameState.players[0]?.id
    }));
    
    this.gameState = {
      ...this.gameState,
      players: updatedPlayers,
      roundState: RoundState.WAITING_FOR_PLAYERS,
      currentTrick: [],
      tricks: [],
      vira: null,
      teamAScore: 0,
      teamBScore: 0,
      roundValue: 1,
      dealer: this.gameState.players[0]?.id || '',
      currentPlayer: '',
      winner: null,
      trucoRequested: false,
      trucoRequestedBy: null,
      roundWinner: null
    };
    
    this.emitGameUpdate();
  }
  
  // Chat methods
  public addChatMessage(playerId: string, content: string, isTeamOnly: boolean): ChatMessage {
    const player = this.gameState.players.find(p => p.id === playerId);
    
    // Create message
    const message: ChatMessage = {
      id: uuidv4(),
      sender: playerId,
      content,
      timestamp: Date.now(),
      isTeamOnly
    };
    
    // Add to messages
    this.chatMessages.push(message);
    
    // Emit to clients
    this.emit('chat_message', message);
    
    return message;
  }
  
  public getChatMessages(): ChatMessage[] {
    return this.chatMessages;
  }
  
  // Utility methods
  private emitGameUpdate(): void {
    this.emit('game_update', this.gameState);
  }
  
  public getPlayerUsername(playerId: string): string {
    return this.playerNames.get(playerId) || 'Unknown';
  }
  
  public isGameFull(): boolean {
    const maxPlayers = this.gameState.mode === GameMode.ONE_VS_ONE ? 2 : 4;
    return this.gameState.players.length >= maxPlayers;
  }
  
  public getPlayerCount(): number {
    return this.gameState.players.length;
  }
  
  // Disconnection and Reconnection handling
  
  public markPlayerDisconnected(playerId: string): void {
    // Store player's username before they're removed
    const player = this.gameState.players.find(p => p.id === playerId);
    if (player) {
      // Use Map.set to store the player's username
      this.disconnectedPlayers.set(playerId, player.username);
    }
    
    // If game is in progress, don't remove immediately, just mark as disconnected
    if (this.gameState.roundState === RoundState.PLAYING) {
      // Don't remove - just update the game state to reflect disconnection
      const updatedPlayers = this.gameState.players.map(p => 
        p.id === playerId ? { ...p, isDisconnected: true } : p
      );
      
      this.gameState = {
        ...this.gameState,
        players: updatedPlayers
      };
      
      this.emitGameUpdate();
    } else {
      // If game isn't in active play, it's safe to remove
      this.removePlayer(playerId);
    }
  }
  
  public reconnectPlayer(socketId: string, username: string): boolean {
    // Check if there's a disconnected player with this username
    let foundPlayerId: string | null = null;
    
    // Iterate over Map entries with downlevelIteration enabled in tsconfig
    for (const [playerId, playerName] of this.disconnectedPlayers.entries()) {
      if (playerName === username) {
        foundPlayerId = playerId;
        break;
      }
    }
    
    if (foundPlayerId) {
      // Update the player's socket ID and mark as reconnected
      const updatedPlayers = this.gameState.players.map(p => {
        if (p.username === username) {
          return { 
            ...p, 
            id: socketId,
            isDisconnected: false
          };
        }
        return p;
      });
      
      // Replace old player ID with new socket ID in all necessary places
      let currentPlayer = this.gameState.currentPlayer;
      if (currentPlayer === foundPlayerId) {
        currentPlayer = socketId;
      }
      
      let dealer = this.gameState.dealer;
      if (dealer === foundPlayerId) {
        dealer = socketId;
      }
      
      let trucoRequestedBy = this.gameState.trucoRequestedBy;
      if (trucoRequestedBy === foundPlayerId) {
        trucoRequestedBy = socketId;
      }
      
      // Update game state with new socket ID
      this.gameState = {
        ...this.gameState,
        players: updatedPlayers,
        currentPlayer,
        dealer,
        trucoRequestedBy
      };
      
      // Remove from disconnected players map
      this.disconnectedPlayers.delete(foundPlayerId);
      
      // Update player name map with new socket ID
      this.playerNames.delete(foundPlayerId);
      this.playerNames.set(socketId, username);
      
      this.emitGameUpdate();
      return true;
    }
    
    return false;
  }
  
  public getConnectedPlayerCount(): number {
    // Use optional chaining to safely handle the case where isDisconnected might be undefined
    return this.gameState.players.filter(p => !p?.isDisconnected).length;
  }
}
