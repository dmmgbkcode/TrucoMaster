import { useState } from 'react';
import { Button } from './ui/button';
import { useGame } from '@/context/GameContext';
import { useSocket } from '@/context/SocketContext';
import { ActionType, RoundState } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAudio } from '@/lib/stores/useAudio';

interface GameControlsProps {
  className?: string;
}

const GameControls: React.FC<GameControlsProps> = ({ className }) => {
  const { gameState } = useGame();
  const { socket } = useSocket();
  const { playSuccess, playHit } = useAudio();
  const [trucoRequested, setTrucoRequested] = useState(false);
  
  // Check if player is ready
  const isPlayerReady = () => {
    if (!gameState || !socket) return false;
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    return currentPlayer?.isReady || false;
  };
  
  // Check if all players are ready
  const areAllPlayersReady = () => {
    if (!gameState) return false;
    return gameState.players.every(p => p.isReady);
  };
  
  // Check if player can request truco
  const canRequestTruco = () => {
    if (!gameState || !socket) return false;
    
    // Must be in playing state
    if (gameState.roundState !== RoundState.PLAYING) return false;
    
    // Can't request truco if it's already been requested
    if (gameState.trucoRequested) return false;
    
    // Player must have cards
    const currentPlayer = gameState.players.find(p => p.id === socket.id);
    return currentPlayer && currentPlayer.hand.length > 0;
  };
  
  // Get next truco value 
  const getNextTrucoValue = () => {
    if (!gameState) return 'Truco';
    
    switch (gameState.roundValue) {
      case 1: return 'Truco (3)';
      case 3: return 'Seis (6)';
      case 6: return 'Nove (9)';
      case 9: return 'Doze (12)';
      default: return 'Truco';
    }
  };
  
  // Get current truco value for display
  const getCurrentTrucoValue = () => {
    if (!gameState) return 1;
    return gameState.roundValue;
  };
  
  // Handle ready button click
  const handleReady = () => {
    if (!socket || !gameState) return;
    
    socket.emit(ActionType.READY, {
      gameId: gameState.id
    });
    
    playHit();
  };
  
  // Handle start game button click
  const handleStartGame = () => {
    if (!socket || !gameState) return;
    
    socket.emit(ActionType.START_GAME, {
      gameId: gameState.id
    });
    
    playSuccess();
  };
  
  // Handle truco request
  const handleTrucoRequest = () => {
    if (!socket || !gameState || !canRequestTruco()) return;
    
    socket.emit(ActionType.REQUEST_TRUCO, {
      gameId: gameState.id
    });
    
    setTrucoRequested(true);
    playSuccess();
    
    toast.info(`Você pediu ${getNextTrucoValue()}!`);
  };
  
  // Handle truco response (accept/decline)
  const handleTrucoResponse = (accept: boolean) => {
    if (!socket || !gameState) return;
    
    if (accept) {
      socket.emit(ActionType.ACCEPT_TRUCO, {
        gameId: gameState.id
      });
      playSuccess();
      // Reset truco request state
      setTrucoRequested(false);
    } else {
      socket.emit(ActionType.DECLINE_TRUCO, {
        gameId: gameState.id
      });
      playHit();
      // Reset truco request state
      setTrucoRequested(false);
    }
  };
  
  // Render truco request controls if applicable
  const renderTrucoRequest = () => {
    if (!gameState || !socket) return null;
    
    // If this player has requested truco
    if (trucoRequested) {
      return (
        <div className="text-center text-sm animate-pulse text-yellow-500 font-bold">
          Aguardando resposta do truco...
        </div>
      );
    }
    
    // If another player has requested truco
    if (gameState.trucoRequested && gameState.trucoRequestedBy) {
      // Only show response options for players on the opposite team
      const requestingPlayer = gameState.players.find(p => p.id === gameState.trucoRequestedBy);
      const currentPlayer = gameState.players.find(p => p.id === socket.id);
      
      if (requestingPlayer && currentPlayer && requestingPlayer.team !== currentPlayer.team) {
        return (
          <div className="flex flex-col items-center">
            <div className="text-center text-sm mb-2 animate-pulse text-yellow-500 font-bold">
              {`${requestingPlayer.username} pediu ${getNextTrucoValue()}!`}
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => handleTrucoResponse(false)}
              >
                Correr
              </Button>
              <Button 
                size="sm" 
                variant="default" 
                onClick={() => handleTrucoResponse(true)}
              >
                Aceitar
              </Button>
            </div>
          </div>
        );
      }
    }
    
    // Otherwise show the truco request button if applicable
    return (
      <Button
        size="sm"
        disabled={!canRequestTruco()}
        onClick={handleTrucoRequest}
        variant="outline"
        className="bg-yellow-400 hover:bg-yellow-500 text-black"
      >
        {getNextTrucoValue()}
      </Button>
    );
  };
  
  // Render waiting state
  if (gameState?.roundState === RoundState.WAITING_FOR_PLAYERS) {
    return (
      <div className={cn("flex flex-col gap-2 items-center", className)}>
        <Button 
          onClick={handleReady} 
          disabled={isPlayerReady()}
          className={isPlayerReady() ? "bg-green-500" : ""}
        >
          {isPlayerReady() ? "Pronto" : "Estou Pronto"}
        </Button>
        
        {areAllPlayersReady() && (
          <Button 
            onClick={handleStartGame}
            variant="default"
          >
            Iniciar Partida
          </Button>
        )}
      </div>
    );
  }
  
  // Render game over state
  if (gameState?.roundState === RoundState.GAME_OVER) {
    const winnerTeam = gameState.winner === 'A' ? 'Time A' : 'Time B';
    
    return (
      <div className={cn("flex flex-col gap-2 items-center", className)}>
        <div className="text-xl font-bold text-center">
          Fim de Jogo! {winnerTeam} venceu!
        </div>
        <Button onClick={handleReady}>
          Jogar Novamente
        </Button>
      </div>
    );
  }
  
  // Render round over state (including when someone runs from truco)
  if (gameState?.roundState === RoundState.ROUND_OVER) {
    const winnerTeam = gameState.roundWinner === 'A' ? 'Time A' : 'Time B';
    
    return (
      <div className={cn("flex flex-col gap-2 items-center", className)}>
        <div className="text-lg font-bold text-center">
          {winnerTeam} venceu a rodada!
        </div>
        <Button 
          onClick={() => {
            if (!socket || !gameState) return;
            socket.emit('start_new_round', { gameId: gameState.id });
          }}
          variant="default"
        >
          Próxima Rodada
        </Button>
      </div>
    );
  }
  
  // Render normal controls during play
  return (
    <div className={cn("flex flex-col gap-2 items-center", className)}>
      <div className="text-sm text-yellow-400 mb-1">
        Valor da rodada: {getCurrentTrucoValue()}
      </div>
      <div className="flex gap-2 justify-center">
        {renderTrucoRequest()}
      </div>
    </div>
  );
};

export default GameControls;
