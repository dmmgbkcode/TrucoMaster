// Types shared between client and server

// Card suits
export enum Suit {
  HEARTS = 'hearts',
  SPADES = 'spades',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs'
}

// Card values
export enum CardValue {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  QUEEN = 'Q',
  JACK = 'J',
  KING = 'K'
}

// Card interface
export interface Card {
  suit: Suit;
  value: CardValue;
  id: string; // Unique identifier for the card
  rank?: number; // Dynamic rank based on the turned card (manilha)
  isManilha?: boolean;
}

// Player interface
export interface Player {
  id: string;
  username: string;
  hand: Card[];
  isDealer: boolean;
  team: 'A' | 'B';
  isReady: boolean;
  isYourTurn: boolean;
}

// Round state
export enum RoundState {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  DEALING = 'dealing',
  PLAYING = 'playing',
  ROUND_OVER = 'round_over',
  GAME_OVER = 'game_over'
}

// Game mode
export enum GameMode {
  ONE_VS_ONE = '1v1',
  TWO_VS_TWO = '2v2'
}

// Card played in a trick
export interface PlayedCard {
  playerId: string;
  card: Card;
  timestamp: number;
}

// Game state interface
export interface GameState {
  id: string;
  mode: GameMode;
  roundState: RoundState;
  players: Player[];
  currentTrick: PlayedCard[];
  tricks: PlayedCard[][];
  vira: Card | null; // The turned card that defines manilhas
  teamAScore: number;
  teamBScore: number;
  roundValue: number; // The current round value (1, 3, 6, 9, 12)
  dealer: string; // Player ID of the dealer
  currentPlayer: string; // Player ID whose turn it is
  winner: 'A' | 'B' | null;
  trucoRequested: boolean;
  trucoRequestedBy: string | null;
  roundWinner: 'A' | 'B' | null;
}

// Action types for socket communications
export enum ActionType {
  JOIN_GAME = 'join_game',
  CREATE_GAME = 'create_game',
  LEAVE_GAME = 'leave_game',
  PLAY_CARD = 'play_card',
  REQUEST_TRUCO = 'request_truco',
  ACCEPT_TRUCO = 'accept_truco',
  DECLINE_TRUCO = 'decline_truco',
  SEND_CHAT = 'send_chat',
  READY = 'ready',
  START_GAME = 'start_game',
  GAME_UPDATE = 'game_update',
  ERROR = 'error'
}

// Chat message
export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  isTeamOnly: boolean;
}

// Game room (game lobby)
export interface GameRoom {
  id: string;
  name: string;
  mode: GameMode;
  players: string[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}
