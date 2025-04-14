import { GameState, Player, Card, RoundState, GameMode, PlayedCard } from '@shared/types';
import { createDeck, shuffleDeck, dealCards, updateManilhas } from './cardUtils';
import { determineTrickWinner, getRoundPoints, hasWinningScore } from '@shared/gameRules';

/**
 * Initialize a new game state
 */
export function initializeGameState(gameId: string, mode: GameMode, players: Player[]): GameState {
  // Initial game state
  return {
    id: gameId,
    mode,
    roundState: RoundState.WAITING_FOR_PLAYERS,
    players,
    currentTrick: [],
    tricks: [],
    vira: null,
    teamAScore: 0,
    teamBScore: 0,
    roundValue: 1,
    dealer: players[0]?.id || '',
    currentPlayer: '',
    winner: null,
    trucoRequested: false,
    trucoRequestedBy: null,
    roundWinner: null
  };
}

/**
 * Assign players to teams
 */
export function assignTeams(players: Player[], mode: GameMode): Player[] {
  const updatedPlayers = [...players];
  
  if (mode === GameMode.ONE_VS_ONE) {
    // In 1v1 mode, first player is team A, second is team B
    if (updatedPlayers[0]) updatedPlayers[0].team = 'A';
    if (updatedPlayers[1]) updatedPlayers[1].team = 'B';
  } else {
    // In 2v2 mode, players 0,2 are team A, players 1,3 are team B
    for (let i = 0; i < updatedPlayers.length; i++) {
      updatedPlayers[i].team = i % 2 === 0 ? 'A' : 'B';
    }
  }
  
  return updatedPlayers;
}

/**
 * Deal cards to all players
 */
export function dealCardsToPlayers(gameState: GameState): GameState {
  // Create and shuffle a deck
  let deck = createDeck();
  deck = shuffleDeck(deck);
  
  // Select a card for "vira" (determines manilhas)
  const vira = deck.pop() || null;
  
  // Deal 3 cards to each player
  const updatedPlayers = gameState.players.map(player => {
    const hand = dealCards(deck, 3);
    const updatedHand = updateManilhas(hand, vira);
    
    return {
      ...player,
      hand: updatedHand
    };
  });
  
  // Determine first player (next to dealer)
  const dealerIndex = gameState.players.findIndex(p => p.id === gameState.dealer);
  const firstPlayerIndex = (dealerIndex + 1) % gameState.players.length;
  const firstPlayerId = gameState.players[firstPlayerIndex]?.id || '';
  
  // Mark current player's turn
  const playersWithTurn = updatedPlayers.map(player => ({
    ...player,
    isYourTurn: player.id === firstPlayerId
  }));
  
  return {
    ...gameState,
    players: playersWithTurn,
    vira,
    roundState: RoundState.PLAYING,
    currentPlayer: firstPlayerId,
    currentTrick: []
  };
}

/**
 * Process a played card
 */
export function processPlayedCard(
  gameState: GameState, 
  playerId: string, 
  cardId: string
): GameState {
  // Find the player who played the card
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return gameState;
  
  // Find the card
  const cardIndex = gameState.players[playerIndex].hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return gameState;
  
  // Remove the card from the player's hand
  const player = gameState.players[playerIndex];
  const card = player.hand[cardIndex];
  const updatedHand = [...player.hand];
  updatedHand.splice(cardIndex, 1);
  
  // Create an updated player with the new hand
  const updatedPlayer = {
    ...player,
    hand: updatedHand,
    isYourTurn: false
  };
  
  // Create updated players array
  const updatedPlayers = [...gameState.players];
  updatedPlayers[playerIndex] = updatedPlayer;
  
  // Add the card to the current trick
  const playedCard: PlayedCard = {
    playerId,
    card,
    timestamp: Date.now()
  };
  
  const updatedTrick = [...gameState.currentTrick, playedCard];
  
  // Check if this completes the trick
  let nextState = {
    ...gameState,
    players: updatedPlayers,
    currentTrick: updatedTrick,
  };
  
  // If all players have played a card, evaluate the trick
  if (updatedTrick.length === gameState.players.length) {
    return evaluateTrick(nextState);
  }
  
  // Otherwise, move to the next player
  const nextPlayerIndex = (playerIndex + 1) % gameState.players.length;
  const nextPlayerId = gameState.players[nextPlayerIndex].id;
  
  // Mark the next player's turn
  const playersWithNextTurn = nextState.players.map(p => ({
    ...p,
    isYourTurn: p.id === nextPlayerId
  }));
  
  return {
    ...nextState,
    players: playersWithNextTurn,
    currentPlayer: nextPlayerId
  };
}

/**
 * Evaluate the winner of a trick
 */
export function evaluateTrick(gameState: GameState): GameState {
  const trickWinnerId = determineTrickWinner(gameState.currentTrick, gameState.vira);
  
  if (!trickWinnerId) {
    // No winner (shouldn't happen in a complete trick)
    return gameState;
  }
  
  // Find the winner's team
  const winnerPlayer = gameState.players.find(p => p.id === trickWinnerId);
  if (!winnerPlayer) return gameState;
  
  // Add the trick to history
  const updatedTricks = [...gameState.tricks, gameState.currentTrick];
  
  // Check if round is over (all players have played all their cards or a team won 2 tricks)
  const teamATricks = updatedTricks.filter(trick => {
    const winnerId = determineTrickWinner(trick, gameState.vira);
    const winner = gameState.players.find(p => p.id === winnerId);
    return winner?.team === 'A';
  }).length;
  
  const teamBTricks = updatedTricks.filter(trick => {
    const winnerId = determineTrickWinner(trick, gameState.vira);
    const winner = gameState.players.find(p => p.id === winnerId);
    return winner?.team === 'B';
  }).length;
  
  // Check if the round is over
  const isRoundOver = 
    updatedTricks.length === 3 || // All tricks played
    teamATricks >= 2 || // Team A won 2 tricks
    teamBTricks >= 2; // Team B won 2 tricks
  
  if (isRoundOver) {
    return finishRound(gameState, updatedTricks);
  }
  
  // Set the trick winner as the next player
  const updatedPlayers = gameState.players.map(p => ({
    ...p,
    isYourTurn: p.id === trickWinnerId
  }));
  
  // Start a new trick
  return {
    ...gameState,
    players: updatedPlayers,
    currentPlayer: trickWinnerId,
    currentTrick: [],
    tricks: updatedTricks
  };
}

/**
 * Finish a round and update scores
 */
export function finishRound(gameState: GameState, tricks: PlayedCard[][]): GameState {
  // Count tricks won by each team
  const teamATricks = tricks.filter(trick => {
    const winnerId = determineTrickWinner(trick, gameState.vira);
    const winner = gameState.players.find(p => p.id === winnerId);
    return winner?.team === 'A';
  }).length;
  
  const teamBTricks = tricks.filter(trick => {
    const winnerId = determineTrickWinner(trick, gameState.vira);
    const winner = gameState.players.find(p => p.id === winnerId);
    return winner?.team === 'B';
  }).length;
  
  // Determine round winner
  let roundWinner: 'A' | 'B' | null = null;
  if (teamATricks > teamBTricks) {
    roundWinner = 'A';
  } else if (teamBTricks > teamATricks) {
    roundWinner = 'B';
  } else {
    // If round is tied, the dealer's team wins
    const dealer = gameState.players.find(p => p.id === gameState.dealer);
    roundWinner = dealer?.team || null;
  }
  
  // Update scores
  let teamAScore = gameState.teamAScore;
  let teamBScore = gameState.teamBScore;
  
  if (roundWinner === 'A') {
    teamAScore += getRoundPoints(gameState.roundValue);
  } else if (roundWinner === 'B') {
    teamBScore += getRoundPoints(gameState.roundValue);
  }
  
  // Check if we have a winner for the game
  let winner: 'A' | 'B' | null = null;
  if (hasWinningScore(teamAScore)) {
    winner = 'A';
  } else if (hasWinningScore(teamBScore)) {
    winner = 'B';
  }
  
  // Advance the dealer to the next player
  const dealerIndex = gameState.players.findIndex(p => p.id === gameState.dealer);
  const nextDealerIndex = (dealerIndex + 1) % gameState.players.length;
  const nextDealerId = gameState.players[nextDealerIndex].id;
  
  // Update dealer flag
  const updatedPlayers = gameState.players.map(p => ({
    ...p,
    isDealer: p.id === nextDealerId,
    isYourTurn: false,
    hand: [] // Clear hands at the end of the round
  }));
  
  return {
    ...gameState,
    players: updatedPlayers,
    teamAScore,
    teamBScore,
    roundState: winner ? RoundState.GAME_OVER : RoundState.ROUND_OVER,
    winner,
    roundWinner,
    currentTrick: [],
    tricks: [],
    roundValue: 1, // Reset round value for next round
    dealer: nextDealerId,
    trucoRequested: false,
    trucoRequestedBy: null
  };
}

/**
 * Start a new round
 */
export function startNewRound(gameState: GameState): GameState {
  // Only start a new round if the current round is over
  if (gameState.roundState !== RoundState.ROUND_OVER) {
    return gameState;
  }
  
  // Deal new cards
  return dealCardsToPlayers({
    ...gameState,
    roundState: RoundState.PLAYING,
    currentTrick: [],
    tricks: [],
    roundValue: 1,
    trucoRequested: false,
    trucoRequestedBy: null,
    roundWinner: null
  });
}

/**
 * Process a truco request
 */
export function processTrucoRequest(gameState: GameState, playerId: string): GameState {
  // Check if truco was already requested
  if (gameState.trucoRequested) {
    return gameState;
  }
  
  // Ensure the requesting player exists
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return gameState;
  
  return {
    ...gameState,
    trucoRequested: true,
    trucoRequestedBy: playerId
  };
}

/**
 * Accept a truco request
 */
export function acceptTrucoRequest(gameState: GameState): GameState {
  // Check if truco was requested
  if (!gameState.trucoRequested || !gameState.trucoRequestedBy) {
    return gameState;
  }
  
  // Find the team of the player who requested truco
  const requestingPlayer = gameState.players.find(p => p.id === gameState.trucoRequestedBy);
  if (!requestingPlayer) return gameState;
  
  // Determine the next round value
  let nextRoundValue = 1;
  switch (gameState.roundValue) {
    case 1:
      nextRoundValue = 3; // Truco
      break;
    case 3:
      nextRoundValue = 6; // Seis
      break;
    case 6:
      nextRoundValue = 9; // Nove
      break;
    case 9:
      nextRoundValue = 12; // Doze
      break;
    default:
      nextRoundValue = 3;
  }
  
  return {
    ...gameState,
    trucoRequested: false,
    trucoRequestedBy: null,
    roundValue: nextRoundValue
  };
}

/**
 * Decline a truco request (run away)
 */
export function declineTrucoRequest(gameState: GameState): GameState {
  // Check if truco was requested
  if (!gameState.trucoRequested || !gameState.trucoRequestedBy) {
    return gameState;
  }
  
  // Find the team of the player who requested truco
  const requestingPlayer = gameState.players.find(p => p.id === gameState.trucoRequestedBy);
  if (!requestingPlayer) return gameState;
  
  // The team that requested truco wins when the other team declines
  const winningTeam = requestingPlayer.team === 'A' ? 'A' : 'B';
  
  let teamAScore = gameState.teamAScore;
  let teamBScore = gameState.teamBScore;
  
  // Award 1 point (or current round value if higher) to the winning team
  if (winningTeam === 'A') {
    teamAScore += getRoundPoints(gameState.roundValue);
  } else {
    teamBScore += getRoundPoints(gameState.roundValue);
  }
  
  // Check if we have a winner for the game
  let winner: 'A' | 'B' | null = null;
  if (hasWinningScore(teamAScore)) {
    winner = 'A';
  } else if (hasWinningScore(teamBScore)) {
    winner = 'B';
  }
  
  // Advance the dealer to the next player
  const dealerIndex = gameState.players.findIndex(p => p.id === gameState.dealer);
  const nextDealerIndex = (dealerIndex + 1) % gameState.players.length;
  const nextDealerId = gameState.players[nextDealerIndex].id;
  
  // Update dealer flag
  const updatedPlayers = gameState.players.map(p => ({
    ...p,
    isDealer: p.id === nextDealerId,
    isYourTurn: false,
    hand: [] // Clear hands at the end of the round
  }));
  
  return {
    ...gameState,
    players: updatedPlayers,
    teamAScore,
    teamBScore,
    roundState: winner ? RoundState.GAME_OVER : RoundState.ROUND_OVER,
    winner,
    roundWinner: winningTeam,
    currentTrick: [],
    tricks: [],
    roundValue: 1, // Reset round value for next round
    dealer: nextDealerId,
    trucoRequested: false,
    trucoRequestedBy: null
  };
}
