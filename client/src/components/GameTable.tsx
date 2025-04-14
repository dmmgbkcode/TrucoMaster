import { useEffect, useState } from 'react';
import { PlayedCard } from '@shared/types';
import Card from './Card';
import { cn } from '@/lib/utils';
import { useGame } from '@/context/GameContext';

interface GameTableProps {
  className?: string;
}

const GameTable: React.FC<GameTableProps> = ({ className }) => {
  const { gameState } = useGame();
  const [tableAnimation, setTableAnimation] = useState(false);

  // Animate the table when a new card is played
  useEffect(() => {
    if (gameState?.currentTrick && gameState.currentTrick.length > 0) {
      setTableAnimation(true);
      const timer = setTimeout(() => setTableAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [gameState?.currentTrick?.length]);

  if (!gameState) {
    return (
      <div className={cn("relative w-full h-96 rounded-full bg-green-800 border-8 border-amber-900 shadow-xl flex items-center justify-center", className)}>
        <div className="text-white text-xl">Waiting for game to start...</div>
      </div>
    );
  }

  // Calculate positions for cards based on the number of players
  const getCardPosition = (index: number, total: number) => {
    // For 2 players, place cards side by side
    if (total <= 2) {
      return index === 0 
        ? "top-1/2 left-[calc(50%-60px)] -translate-y-1/2"
        : "top-1/2 left-[calc(50%+60px)] -translate-y-1/2";
    }
    
    // For 4 players, place cards in a cross pattern
    switch (index % 4) {
      case 0: return "top-1/4 left-1/2 -translate-x-1/2";
      case 1: return "top-1/2 left-3/4 -translate-y-1/2";
      case 2: return "top-3/4 left-1/2 -translate-x-1/2";
      case 3: return "top-1/2 left-1/4 -translate-y-1/2";
      default: return "";
    }
  };

  // Show the turned card (vira) that determines manilhas
  const renderVira = () => {
    if (!gameState.vira) return null;
    
    return (
      <div className="absolute top-1/2 right-8 -translate-y-1/2 transform rotate-90">
        <Card card={gameState.vira} size="sm" />
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white text-sm font-bold">
          VIRA
        </div>
      </div>
    );
  };

  // Render played cards on the table
  const renderPlayedCards = () => {
    if (!gameState.currentTrick || gameState.currentTrick.length === 0) {
      return null;
    }

    return gameState.currentTrick.map((playedCard: PlayedCard, index: number) => {
      const total = gameState.currentTrick.length;
      const position = getCardPosition(index, total);
      
      // Find the player who played this card
      const player = gameState.players.find(p => p.id === playedCard.playerId);
      const teamClass = player?.team === 'A' ? 'border-blue-500' : 'border-red-500';
      
      return (
        <div 
          key={playedCard.card.id}
          className={cn(
            "absolute transform transition-all border-2 rounded", 
            teamClass,
            position
          )}
        >
          <Card card={playedCard.card} />
          <div className="absolute -bottom-5 left-0 w-full text-center text-xs text-white bg-black bg-opacity-50 rounded px-1">
            {player?.username}
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      className={cn(
        "relative w-full h-96 rounded-full bg-green-800 border-8 border-amber-900 shadow-xl overflow-hidden",
        tableAnimation ? "animate-pulse" : "",
        className
      )}
      style={{
        backgroundImage: `url('/src/assets/table-background.svg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* DM Watermark in the center of the table */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <span className="text-white text-[150px] font-bold select-none">DM</span>
      </div>
      
      {/* Round value indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-900 text-white px-4 py-1 rounded-full font-bold z-10">
        {gameState.roundValue === 1 ? 'Truco' : 
         gameState.roundValue === 3 ? 'Vale 3' : 
         gameState.roundValue === 6 ? 'Vale 6' : 
         gameState.roundValue === 9 ? 'Vale 9' : 'Vale 12'}
      </div>
      
      {/* Score display */}
      <div className="absolute top-4 left-4 bg-blue-900 text-white px-3 py-1 rounded-lg">
        Time A: {gameState.teamAScore}
      </div>
      <div className="absolute top-4 right-4 bg-red-900 text-white px-3 py-1 rounded-lg">
        Time B: {gameState.teamBScore}
      </div>
      
      {renderVira()}
      {renderPlayedCards()}
    </div>
  );
};

export default GameTable;
