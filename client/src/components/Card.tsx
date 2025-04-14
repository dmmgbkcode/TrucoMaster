import { useState, useEffect } from 'react';
import { Card as CardType, Suit } from '@shared/types';
import { cn } from '@/lib/utils';
import { useAudio } from '@/lib/stores/useAudio';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  isPlayable?: boolean;
  className?: string;
}

// SVG icons for card suits
const SuitIcons = {
  [Suit.HEARTS]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-red-600">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  [Suit.DIAMONDS]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-red-600">
      <path d="M12 2L7 12l5 10 5-10z" />
    </svg>
  ),
  [Suit.CLUBS]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-black">
      <path d="M12 2C9.85 2 8.1 3.75 8.1 5.9c0 1.75 1.05 3.25 2.55 3.9-.3.5-.7.85-1.2 1.05-.5.2-1.1.3-1.65.3-.4 0-.8-.05-1.2-.15l-.85-.3-.4.8c-.15.35-.2.7-.2 1.05 0 1.35 1.1 2.45 2.45 2.45.35 0 .7-.05 1-.15-.05.2-.05.4-.05.6 0 1.35 1.1 2.45 2.45 2.45s2.45-1.1 2.45-2.45c0-.2 0-.4-.05-.6.3.1.65.15 1 .15 1.35 0 2.45-1.1 2.45-2.45 0-.35-.05-.7-.2-1.05l-.4-.8-.85.3c-.4.1-.8.15-1.2.15-.55 0-1.15-.1-1.65-.3-.5-.2-.9-.55-1.2-1.05 1.5-.65 2.55-2.15 2.55-3.9C15.9 3.75 14.15 2 12 2z" />
    </svg>
  ),
  [Suit.SPADES]: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 fill-black">
      <path d="M12 2L8 8c-2.2 0-4 1.8-4 4 0 1.8 1.2 3.4 3 3.8.6 1 1.4 1.9 2.2 2.7-.3.4-.6.8-1 1.2-.4.3-.7.6-1.1.8-.5.2-1 .4-1.6.4-.4 0-.8-.1-1.1-.2l-.9-.3-.4.9c-.2.4-.3.8-.3 1.2 0 1.5 1.3 2.8 2.9 2.8.4 0 .7-.1 1.1-.2-.1.2-.1.4-.1.6 0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2 0-.2 0-.4-.1-.6.4.1.7.2 1.1.2 1.6 0 2.9-1.3 2.9-2.8 0-.4-.1-.8-.3-1.2l-.4-.9-.9.3c-.3.1-.7.2-1.1.2-.6 0-1.1-.1-1.6-.4-.4-.2-.8-.5-1.1-.8-.4-.4-.7-.8-1-1.2.8-.8 1.6-1.7 2.2-2.7 1.8-.4 3-2 3-3.8 0-2.2-1.8-4-4-4L12 2z" />
    </svg>
  )
};

const Card: React.FC<CardProps> = ({
  card,
  size = 'md',
  onClick,
  disabled = false,
  isPlayable = false,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const { playHit } = useAudio();
  
  // Determine card colors
  const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;
  const textColor = isRed ? 'text-red-600' : 'text-black';

  // Card size classes
  const sizeClasses = {
    sm: 'w-16 h-24',
    md: 'w-24 h-36',
    lg: 'w-32 h-48'
  };

  // Handle click with animation
  const handleClick = () => {
    if (disabled || !onClick) return;
    
    setIsFlipping(true);
    playHit();
    
    // Small delay for animation
    setTimeout(() => {
      onClick();
      setIsFlipping(false);
    }, 150);
  };

  // Determine if card is a manilha
  const isManilha = card.isManilha || false;

  return (
    <div
      className={cn(
        sizeClasses[size],
        'relative bg-white rounded-lg shadow-md cursor-pointer transition-transform duration-200 transform-gpu',
        isPlayable && !disabled ? 'hover:shadow-xl' : '',
        isHovered && isPlayable && !disabled ? 'scale-110' : '',
        isFlipping ? 'scale-0 rotate-y-180' : '',
        disabled ? 'opacity-70 cursor-not-allowed' : '',
        isManilha ? 'ring-2 ring-yellow-400' : '',
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card content */}
      <div className="absolute inset-0 flex flex-col p-2 overflow-hidden">
        {/* Top-left value and suit */}
        <div className={`text-left ${textColor}`}>
          <div className="text-xl font-bold">{card.value}</div>
          <div className="w-4 h-4">
            {SuitIcons[card.suit]}
          </div>
        </div>

        {/* Center suit */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12">
            {SuitIcons[card.suit]}
          </div>
          
          {/* DM Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="font-bold text-gray-500 text-2xl">DM</span>
          </div>
        </div>

        {/* Bottom-right value and suit (upside down) */}
        <div className={`text-right ${textColor} transform rotate-180`}>
          <div className="text-xl font-bold">{card.value}</div>
          <div className="w-4 h-4 ml-auto">
            {SuitIcons[card.suit]}
          </div>
        </div>
      </div>
      
      {/* Manilha indicator */}
      {isManilha && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-1 rounded-bl">
          M
        </div>
      )}
    </div>
  );
};

export default Card;
