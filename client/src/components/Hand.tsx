import { useMemo } from 'react';
import { Card as CardType, RoundState } from '@shared/types';
import Card from './Card';
import { cn } from '@/lib/utils';
import { useAudio } from '@/lib/stores/useAudio';
import { useGame } from '@/context/GameContext';
import { motion } from 'framer-motion';

interface HandProps {
  cards: CardType[];
  playerId: string;
  onPlayCard: (card: CardType) => void;
  className?: string;
}

const Hand: React.FC<HandProps> = ({ cards, playerId, onPlayCard, className }) => {
  const { gameState } = useGame();
  const { playHit } = useAudio();

  // Determine if it's this player's turn
  const isPlayerTurn = useMemo(() => {
    if (!gameState) return false;
    return gameState.currentPlayer === playerId;
  }, [gameState, playerId]);

  // Check if card is playable
  const isCardPlayable = (card: CardType) => {
    // Player can play if:
    // 1. It's their turn AND
    // 2. The game is in playing state AND
    // 3. No truco has been requested or the player is the one who requested it
    return isPlayerTurn && 
           gameState?.roundState === RoundState.PLAYING && 
           (!gameState?.trucoRequested || gameState?.trucoRequestedBy === playerId);
  };

  // Handle card play
  const handlePlayCard = (card: CardType) => {
    if (!isCardPlayable(card)) return;
    playHit();
    onPlayCard(card);
  };

  // Animation variants for the cards
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className={cn(
        "flex justify-center items-end p-4 min-h-[150px]",
        isPlayerTurn ? "bg-yellow-200 bg-opacity-20 rounded-lg" : "",
        className
      )}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.length === 0 ? (
        <div className="text-gray-500 italic">No cards</div>
      ) : (
        <div className="flex space-x-2">
          {cards.map((card, index) => (
            <motion.div 
              key={card.id} 
              className="relative"
              variants={item}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              <Card
                card={card}
                onClick={() => handlePlayCard(card)}
                disabled={!isCardPlayable(card)}
                isPlayable={isCardPlayable(card)}
                className={cn(
                  "transition-all duration-300",
                  isCardPlayable(card) ? "hover:-translate-y-4" : ""
                )}
              />
            </motion.div>
          ))}
        </div>
      )}
      
      {isPlayerTurn && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-3 py-1 rounded-full animate-bounce">
          Sua vez!
        </div>
      )}
    </motion.div>
  );
};

export default Hand;
