import { Player } from '@shared/types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface PlayerInfoProps {
  player: Player;
  isCurrentPlayer: boolean;
  className?: string;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  isCurrentPlayer,
  className
}) => {
  // Team color
  const teamColor = player.team === 'A' ? 'bg-blue-500' : 'bg-red-500';
  
  return (
    <Card 
      className={cn(
        "w-full overflow-hidden",
        isCurrentPlayer ? "ring-2 ring-yellow-400" : "",
        className
      )}
    >
      <div className={`h-2 ${teamColor}`} />
      <CardContent className="pt-4">
        <div className="flex items-center gap-2">
          {/* Avatar/Icon */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white",
            teamColor
          )}>
            {player.username.charAt(0).toUpperCase()}
          </div>
          
          {/* Player details */}
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <div className="font-medium">
                {player.username}
                {isCurrentPlayer && (
                  <span className="ml-2 text-xs text-gray-500">(Você)</span>
                )}
              </div>
              {player.isYourTurn && (
                <Badge variant="outline" className="bg-yellow-100 animate-pulse">
                  Jogando
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Time {player.team}</span>
              {player.isDealer && (
                <Badge variant="outline" className="text-xs py-0 h-5">
                  Dealer
                </Badge>
              )}
              {player.isReady && (
                <Badge variant="outline" className="bg-green-100 text-xs py-0 h-5">
                  Pronto
                </Badge>
              )}
            </div>
          </div>
          
          {/* Cards count */}
          <div className="flex items-center justify-center bg-gray-100 rounded-md px-2 py-1 text-xs font-medium">
            {player.hand.length} cartas
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerInfo;
