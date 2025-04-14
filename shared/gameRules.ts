import { Card, CardValue, Suit, PlayedCard } from './types';

// Paulista Truco rules

// Card ranks in order of strength (before manilha determination)
// 3 2 A K J Q 7 6 5 4
export const CARD_STRENGTHS: Record<CardValue, number> = {
  [CardValue.THREE]: 10,
  [CardValue.TWO]: 9,
  [CardValue.ACE]: 8,
  [CardValue.KING]: 7,
  [CardValue.JACK]: 6,
  [CardValue.QUEEN]: 5,
  [CardValue.SEVEN]: 4,
  [CardValue.SIX]: 3,
  [CardValue.FIVE]: 2,
  [CardValue.FOUR]: 1
};

// Manilha order by suit (clubs > hearts > spades > diamonds)
export const MANILHA_SUIT_STRENGTH: Record<Suit, number> = {
  [Suit.CLUBS]: 4,
  [Suit.HEARTS]: 3,
  [Suit.SPADES]: 2,
  [Suit.DIAMONDS]: 1
};

// Get the manilha value based on the turned card (vira)
export function getManilhaValue(vira: Card | null): CardValue | null {
  if (!vira) return null;
  
  // In Paulista rules, the manilha is the card value that follows the vira
  switch (vira.value) {
    case CardValue.ACE:
      return CardValue.TWO;
    case CardValue.TWO:
      return CardValue.THREE;
    case CardValue.THREE:
      return CardValue.FOUR;
    case CardValue.FOUR:
      return CardValue.FIVE;
    case CardValue.FIVE:
      return CardValue.SIX;
    case CardValue.SIX:
      return CardValue.SEVEN;
    case CardValue.SEVEN:
      return CardValue.QUEEN;
    case CardValue.QUEEN:
      return CardValue.JACK;
    case CardValue.JACK:
      return CardValue.KING;
    case CardValue.KING:
      return CardValue.ACE;
    default:
      return null;
  }
}

// Determine if a card is a manilha
export function isManilha(card: Card, vira: Card | null): boolean {
  if (!vira) return false;
  const manilhaValue = getManilhaValue(vira);
  return card.value === manilhaValue;
}

// Compare two cards to determine which one is stronger
export function compareCards(card1: Card, card2: Card, vira: Card | null): number {
  // Check if either card is a manilha
  const card1IsManilha = isManilha(card1, vira);
  const card2IsManilha = isManilha(card2, vira);
  
  // If both are manilhas, compare by suit strength
  if (card1IsManilha && card2IsManilha) {
    return MANILHA_SUIT_STRENGTH[card1.suit] - MANILHA_SUIT_STRENGTH[card2.suit];
  }
  
  // If only one is a manilha, it wins
  if (card1IsManilha) return 1;
  if (card2IsManilha) return -1;
  
  // If neither is a manilha, compare by card strength
  return CARD_STRENGTHS[card1.value] - CARD_STRENGTHS[card2.value];
}

// Determine the winner of a trick
export function determineTrickWinner(playedCards: PlayedCard[], vira: Card | null): string | null {
  if (playedCards.length === 0) return null;
  
  let winningPlayerId = playedCards[0].playerId;
  let winningCard = playedCards[0].card;
  
  for (let i = 1; i < playedCards.length; i++) {
    const currentCard = playedCards[i].card;
    
    if (compareCards(currentCard, winningCard, vira) > 0) {
      winningCard = currentCard;
      winningPlayerId = playedCards[i].playerId;
    }
  }
  
  return winningPlayerId;
}

// Calculate points based on the round value
export function getRoundPoints(roundValue: number): number {
  switch (roundValue) {
    case 1:
      return 1;
    case 3:
      return 3;
    case 6:
      return 6;
    case 9:
      return 9;
    case 12:
      return 12;
    default:
      return 1;
  }
}

// Check if a team has reached 12 points (win condition in Paulista rules)
export function hasWinningScore(score: number): boolean {
  return score >= 12;
}

// Get the next round value after a truco request
export function getNextRoundValue(currentValue: number): number {
  switch (currentValue) {
    case 1:
      return 3; // Truco
    case 3:
      return 6; // Seis
    case 6:
      return 9; // Nove
    case 9:
      return 12; // Doze
    default:
      return 3;
  }
}
