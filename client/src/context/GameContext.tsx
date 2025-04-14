import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState, ActionType, RoundState, Card, ChatMessage } from '@shared/types';
import { useSocket } from './SocketContext';
import { toast } from 'sonner';
import { useAudio } from '@/lib/stores/useAudio';

interface GameContextProps {
  gameState: GameState | null;
  chatMessages: ChatMessage[];
  playCard: (card: Card) => void;
  requestTruco: () => void;
  acceptTruco: () => void;
  declineTruco: () => void;
  leaveGame: () => void;
}

const GameContext = createContext<GameContextProps>({
  gameState: null,
  chatMessages: [],
  playCard: () => {},
  requestTruco: () => {},
  acceptTruco: () => {},
  declineTruco: () => {},
  leaveGame: () => {}
});

export const useGame = () => useContext(GameContext);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { socket, clearGameData } = useSocket();
  const { playHit, playSuccess } = useAudio();
  
  // Listen for game updates
  useEffect(() => {
    if (!socket) return;
    
    // Game state update
    socket.on(ActionType.GAME_UPDATE, (data: GameState) => {
      setGameState(data);
      
      // Play sounds based on game state changes
      if (data.roundState === RoundState.ROUND_OVER) {
        playSuccess();
      }
    });
    
    // Chat message received
    socket.on('chat_message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
      playHit();
    });
    
    // Error handling
    socket.on(ActionType.ERROR, (error: { message: string }) => {
      toast.error(error.message);
    });
    
    return () => {
      socket.off(ActionType.GAME_UPDATE);
      socket.off('chat_message');
      socket.off(ActionType.ERROR);
    };
  }, [socket, playHit, playSuccess]);
  
  // Play a card
  const playCard = (card: Card) => {
    if (!socket || !gameState) return;
    
    socket.emit(ActionType.PLAY_CARD, {
      gameId: gameState.id,
      cardId: card.id
    });
    
    playHit();
  };
  
  // Request truco
  const requestTruco = () => {
    if (!socket || !gameState) return;
    
    socket.emit(ActionType.REQUEST_TRUCO, {
      gameId: gameState.id
    });
    
    playSuccess();
  };
  
  // Accept truco
  const acceptTruco = () => {
    if (!socket || !gameState) return;
    
    socket.emit(ActionType.ACCEPT_TRUCO, {
      gameId: gameState.id
    });
    
    playSuccess();
  };
  
  // Decline truco
  const declineTruco = () => {
    if (!socket || !gameState) return;
    
    socket.emit(ActionType.DECLINE_TRUCO, {
      gameId: gameState.id
    });
    
    playHit();
  };
  
  // Leave game
  const leaveGame = () => {
    if (!socket || !gameState) return;
    
    socket.emit(ActionType.LEAVE_GAME, {
      gameId: gameState.id
    });
    
    // Clear game state
    setGameState(null);
    setChatMessages([]);
    
    // Clear reconnection data
    clearGameData();
    
    toast.success('Você saiu do jogo');
  };
  
  return (
    <GameContext.Provider
      value={{
        gameState,
        chatMessages,
        playCard,
        requestTruco,
        acceptTruco,
        declineTruco,
        leaveGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
