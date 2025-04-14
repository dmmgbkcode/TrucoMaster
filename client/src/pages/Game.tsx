import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ActionType, GameState, RoundState } from '@shared/types';
import { useSocket } from '@/context/SocketContext';
import { useGame } from '@/context/GameContext';
import GameTable from '@/components/GameTable';
import Hand from '@/components/Hand';
import ChatBox from '@/components/ChatBox';
import PlayerInfo from '@/components/PlayerInfo';
import GameControls from '@/components/GameControls';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';
import { motion } from 'framer-motion';

const Game = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { socket, isConnected } = useSocket();
  const { gameState, chatMessages, playCard, leaveGame } = useGame();
  const navigate = useNavigate();
  const { toggleMute, isMuted } = useAudio();
  const [isLoading, setIsLoading] = useState(true);
  
  // Join game room on component mount
  useEffect(() => {
    if (!socket || !gameId || !isConnected) return;
    
    // Check if we're already in a game
    if (gameState && gameState.id === gameId) {
      setIsLoading(false);
      return;
    }
    
    // Request to join the game
    socket.emit(ActionType.JOIN_GAME, {
      gameId,
      username: localStorage.getItem('trucoUsername') || 'Player'
    });
    
    // Wait for game state
    const handleGameUpdate = (data: GameState) => {
      if (data.id === gameId) {
        setIsLoading(false);
      }
    };
    
    socket.on(ActionType.GAME_UPDATE, handleGameUpdate);
    
    return () => {
      socket.off(ActionType.GAME_UPDATE, handleGameUpdate);
    };
  }, [socket, gameId, isConnected, gameState]);
  
  // Handle game exit
  const handleLeaveGame = () => {
    leaveGame();
    navigate('/');
  };
  
  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-900">
        <div className="text-white text-xl">Conectando ao jogo...</div>
      </div>
    );
  }
  
  // Game not found
  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-900 gap-4">
        <div className="text-white text-xl">Jogo não encontrado</div>
        <Button onClick={() => navigate('/')}>Voltar para o Lobby</Button>
      </div>
    );
  }
  
  // Find current player
  const currentPlayer = socket ? gameState.players.find(p => p.id === socket.id) : null;
  
  // Waiting for players screen
  if (gameState.roundState === RoundState.WAITING_FOR_PLAYERS) {
    return (
      <div className="min-h-screen flex flex-col bg-green-900 p-4">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" className="text-white" onClick={handleLeaveGame}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-white">Truco - DM</h1>
          <Button variant="ghost" className="text-white" onClick={toggleMute}>
            {isMuted ? "Ativar Som" : "Silenciar"}
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Aguardando Jogadores</h2>
            <p className="text-lg">
              {gameState.players.length} / {gameState.mode === '1v1' ? '2' : '4'} jogadores conectados
            </p>
          </div>
          
          <div className="bg-white bg-opacity-90 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Jogadores:</h3>
            <div className="space-y-2">
              {gameState.players.map(player => (
                <PlayerInfo 
                  key={player.id}
                  player={player}
                  isCurrentPlayer={player.id === socket?.id}
                />
              ))}
            </div>
          </div>
          
          <GameControls />
        </div>
      </div>
    );
  }
  
  // Main game view
  return (
    <motion.div 
      className="min-h-screen flex flex-col bg-green-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-2 bg-green-800">
        <Button variant="ghost" className="text-white" onClick={handleLeaveGame}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Sair
        </Button>
        <h1 className="text-xl font-bold text-white">
          Truco Paulista - DM
        </h1>
        <Button variant="ghost" className="text-white" onClick={toggleMute}>
          {isMuted ? "Ativar Som" : "Silenciar"}
        </Button>
      </div>
      
      {/* Game layout */}
      <div className="flex flex-col md:flex-row p-2 h-[calc(100vh-64px)] gap-2">
        {/* Left sidebar - Player info */}
        <div className="md:w-1/4 space-y-2 mb-2 md:mb-0">
          <div className="text-white font-medium mb-1">Jogadores:</div>
          {gameState.players.map(player => (
            <PlayerInfo 
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === socket?.id}
            />
          ))}
          
          {/* Game controls */}
          <GameControls className="mt-4" />
        </div>
        
        {/* Center - Game table and player's hand */}
        <div className="md:w-2/4 flex flex-col flex-1">
          <GameTable className="flex-1 mb-4" />
          
          {/* Round state notification */}
          {gameState.roundState === RoundState.ROUND_OVER && (
            <div className="bg-yellow-400 text-black p-2 rounded-md text-center mb-4 animate-pulse">
              Fim da rodada! 
              {gameState.roundWinner ? ` Time ${gameState.roundWinner} venceu!` : ' Empate!'}
            </div>
          )}
          
          {/* Player's hand */}
          {currentPlayer && (
            <Hand 
              cards={currentPlayer.hand}
              playerId={currentPlayer.id}
              onPlayCard={playCard}
              className="mt-auto"
            />
          )}
        </div>
        
        {/* Right sidebar - Chat */}
        <div className="md:w-1/4">
          <ChatBox messages={chatMessages} className="h-full" />
        </div>
      </div>
    </motion.div>
  );
};

export default Game;
