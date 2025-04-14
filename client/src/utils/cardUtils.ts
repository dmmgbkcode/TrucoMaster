import { Card, Suit, CardValue } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import { getManilhaValue, isManilha } from '@shared/gameRules';

/**
 * Create a full deck of cards for the truco game
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits = Object.values(Suit);
  const values = Object.values(CardValue);
  
  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value,
        id: uuidv4()
      });
    }
  }
  
  return deck;
}

/**
 * Shuffle an array of cards using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Deal a specific number of cards from a deck
 */
export function dealCards(deck: Card[], count: number): Card[] {
  return deck.splice(0, count);
}

/**
 * Update cards in a deck with manilha information
 */
export function updateManilhas(cards: Card[], vira: Card | null): Card[] {
  if (!vira) return cards;
  
  const manilhaValue = getManilhaValue(vira);
  
  return cards.map(card => {
    const isCardManilha = card.value === manilhaValue;
    let rank = 0;
    
    if (isCardManilha) {
      // Ranking manilhas by suit (clubs, hearts, spades, diamonds)
      switch (card.suit) {
        case Suit.CLUBS:
          rank = 4;
          break;
        case Suit.HEARTS:
          rank = 3;
          break;
        case Suit.SPADES:
          rank = 2;
          break;
        case Suit.DIAMONDS:
          rank = 1;
          break;
      }
    }
    
    return {
      ...card,
      isManilha: isCardManilha,
      rank: isCardManilha ? rank : 0
    };
  });
}

/**
 * Get a card's display name for logging and display
 */
export function getCardDisplayName(card: Card): string {
  let suitSymbol = '';
  
  switch (card.suit) {
    case Suit.HEARTS:
      suitSymbol = '♥';
      break;
    case Suit.DIAMONDS:
      suitSymbol = '♦';
      break;
    case Suit.CLUBS:
      suitSymbol = '♣';
      break;
    case Suit.SPADES:
      suitSymbol = '♠';
      break;
  }
  
  return `${card.value}${suitSymbol}`;
}

/**
 * Get the SVG path for a suit icon
 */
export function getSuitPath(suit: Suit): string {
  switch (suit) {
    case Suit.HEARTS:
      return "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
    case Suit.DIAMONDS:
      return "M12 2L7 12l5 10 5-10z";
    case Suit.CLUBS:
      return "M12 2C9.85 2 8.1 3.75 8.1 5.9c0 1.75 1.05 3.25 2.55 3.9-.3.5-.7.85-1.2 1.05-.5.2-1.1.3-1.65.3-.4 0-.8-.05-1.2-.15l-.85-.3-.4.8c-.15.35-.2.7-.2 1.05 0 1.35 1.1 2.45 2.45 2.45.35 0 .7-.05 1-.15-.05.2-.05.4-.05.6 0 1.35 1.1 2.45 2.45 2.45s2.45-1.1 2.45-2.45c0-.2 0-.4-.05-.6.3.1.65.15 1 .15 1.35 0 2.45-1.1 2.45-2.45 0-.35-.05-.7-.2-1.05l-.4-.8-.85.3c-.4.1-.8.15-1.2.15-.55 0-1.15-.1-1.65-.3-.5-.2-.9-.55-1.2-1.05 1.5-.65 2.55-2.15 2.55-3.9C15.9 3.75 14.15 2 12 2z";
    case Suit.SPADES:
      return "M12 2L8 8c-2.2 0-4 1.8-4 4 0 1.8 1.2 3.4 3 3.8.6 1 1.4 1.9 2.2 2.7-.3.4-.6.8-1 1.2-.4.3-.7.6-1.1.8-.5.2-1 .4-1.6.4-.4 0-.8-.1-1.1-.2l-.9-.3-.4.9c-.2.4-.3.8-.3 1.2 0 1.5 1.3 2.8 2.9 2.8.4 0 .7-.1 1.1-.2-.1.2-.1.4-.1.6 0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-.2 0-.4-.1-.6.4.1.7.2 1.1.2 1.6 0 2.9-1.3 2.9-2.8 0-.4-.1-.8-.3-1.2l-.4-.9-.9.3c-.3.1-.7.2-1.1.2-.6 0-1.1-.1-1.6-.4-.4-.2-.8-.5-1.1-.8-.4-.4-.7-.8-1-1.2.8-.8 1.6-1.7 2.2-2.7 1.8-.4 3-2 3-3.8 0-2.2-1.8-4-4-4L12 2z";
  }
}
