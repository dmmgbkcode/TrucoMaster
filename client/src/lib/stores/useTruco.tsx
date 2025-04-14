import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameState, Card, PlayedCard, RoundState } from '@shared/types';

interface TrucoState {
  // Game state
  gameState: GameState | null;
  
  // Animation states
  animatingCards: boolean;
  animatingScore: boolean;
  animatingTruco: boolean;
  
  // Actions
  setGameState: (gameState: GameState) => void;
  playCard: (playedCard: PlayedCard) => void;
  startTrick: () => void;
  endTrick: () => void;
  startRound: () => void;
  endRound: () => void;
  startTrucoAnimation: () => void;
  endTrucoAnimation: () => void;
  
  // Game history
  cardsPlayed: Card[];
  addToHistory: (card: Card) => void;
  clearHistory: () => void;
}

export const useTruco = create<TrucoState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    gameState: null,
    animatingCards: false,
    animatingScore: false,
    animatingTruco: false,
    cardsPlayed: [],
    
    // Set game state
    setGameState: (gameState) => set({ gameState }),
    
    // Play a card with animation
    playCard: (playedCard) => {
      set({ animatingCards: true });
      
      // After animation, update game state
      setTimeout(() => {
        set((state) => {
          if (!state.gameState) return state;
          
          return {
            animatingCards: false,
            cardsPlayed: [...state.cardsPlayed, playedCard.card]
          };
        });
      }, 500);
    },
    
    // Start new trick animation
    startTrick: () => set({ animatingCards: true }),
    
    // End trick animation
    endTrick: () => set({ animatingCards: false }),
    
    // Start new round
    startRound: () => {
      set({ animatingCards: true });
      
      // Clear history for new round
      setTimeout(() => {
        set({
          animatingCards: false,
          cardsPlayed: []
        });
      }, 500);
    },
    
    // End round with score animation
    endRound: () => {
      set({ animatingScore: true });
      
      setTimeout(() => {
        set({ animatingScore: false });
      }, 1500);
    },
    
    // Truco animation
    startTrucoAnimation: () => set({ animatingTruco: true }),
    endTrucoAnimation: () => set({ animatingTruco: false }),
    
    // History management
    addToHistory: (card) => set((state) => ({ 
      cardsPlayed: [...state.cardsPlayed, card] 
    })),
    clearHistory: () => set({ cardsPlayed: [] })
  }))
);

// Hook to subscribe to game state changes
export const useGameStateSubscription = (callback: (state: GameState) => void) => {
  useTruco.subscribe(
    (state) => state.gameState,
    (gameState) => {
      if (gameState) {
        callback(gameState);
      }
    }
  );
};

// Hook to trigger animations based on game state changes
export const useGameAnimations = () => {
  useTruco.subscribe(
    (state) => state.gameState?.roundState,
    (roundState, previousRoundState) => {
      const { startRound, endRound } = useTruco.getState();
      
      // Round transitions
      if (previousRoundState === RoundState.WAITING_FOR_PLAYERS && 
          roundState === RoundState.PLAYING) {
        startRound();
      }
      
      if (previousRoundState === RoundState.PLAYING && 
          roundState === RoundState.ROUND_OVER) {
        endRound();
      }
    }
  );
  
  // Subscribe to truco requests
  useTruco.subscribe(
    (state) => state.gameState?.trucoRequested,
    (trucoRequested, previousTrucoRequested) => {
      if (!previousTrucoRequested && trucoRequested) {
        const { startTrucoAnimation, endTrucoAnimation } = useTruco.getState();
        startTrucoAnimation();
        
        // End animation after some time
        setTimeout(endTrucoAnimation, 2000);
      }
    }
  );
};
