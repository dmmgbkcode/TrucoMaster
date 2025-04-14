import { EventEmitter } from 'events';
import { TrucoGame } from './trucoGame';
import { GameState, GameMode, GameRoom } from '@shared/types';

export class GameManager extends EventEmitter {
  private games: Map<string, TrucoGame> = new Map();
  
  constructor() {
    super();
  }
  
  // Create a new game
  public createGame(id: string, mode: GameMode, name: string): TrucoGame {
    const game = new TrucoGame(id, mode);
    
    // Set up event forwarding
    game.on('game_update', (gameState: GameState) => {
      this.emit('game_update', id, gameState);
    });
    
    this.games.set(id, game);
    return game;
  }
  
  // Get a game by ID
  public getGame(id: string): TrucoGame | undefined {
    return this.games.get(id);
  }
  
  // Remove a game
  public removeGame(id: string): boolean {
    return this.games.delete(id);
  }
  
  // Get all games
  public getAllGames(): TrucoGame[] {
    return Array.from(this.games.values());
  }
  
  // Get games for a specific player
  public getGamesByPlayerId(playerId: string): TrucoGame[] {
    return this.getAllGames().filter(game => 
      game.gameState.players.some(player => player.id === playerId)
    );
  }
  
  // Get public room information for the lobby
  public getPublicRooms(): GameRoom[] {
    return this.getAllGames().map(game => {
      const { id, mode, players, roundState } = game.gameState;
      
      return {
        id,
        name: this.getRoomName(id) || `Game ${id.substring(0, 5)}`,
        mode,
        players: players.map(p => p.id),
        maxPlayers: mode === GameMode.ONE_VS_ONE ? 2 : 4,
        status: roundState === 'WAITING_FOR_PLAYERS' ? 'waiting' : 'playing',
        createdAt: Date.now() // Ideally this would be stored when creating the game
      };
    });
  }
  
  // Room name cache
  private roomNames: Map<string, string> = new Map();
  
  public setRoomName(id: string, name: string): void {
    this.roomNames.set(id, name);
  }
  
  public getRoomName(id: string): string | undefined {
    return this.roomNames.get(id);
  }
}
