import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@shared/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useGame } from '@/context/GameContext';
import { useSocket } from '@/context/SocketContext';
import { ActionType } from '@shared/types';
import { cn } from '@/lib/utils';

interface ChatBoxProps {
  messages: ChatMessage[];
  className?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, className }) => {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'team'>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { gameState } = useGame();
  const { socket } = useSocket();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Send chat message
  const sendMessage = () => {
    if (!message.trim() || !socket || !gameState) return;
    
    socket.emit(ActionType.SEND_CHAT, {
      gameId: gameState.id,
      content: message,
      isTeamOnly: activeTab === 'team'
    });
    
    setMessage('');
    
    // Focus input again
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Filter messages by tab
  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'all') return !msg.isTeamOnly;
    
    // For team tab, only show team messages if player is in a team
    const player = gameState?.players.find(p => p.id === msg.sender);
    const currentPlayer = gameState?.players.find(p => p.id === socket?.id);
    
    return msg.isTeamOnly && player && currentPlayer && player.team === currentPlayer.team;
  });

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn("flex flex-col h-64 bg-white bg-opacity-90 rounded-lg shadow-md", className)}>
      <Tabs defaultValue="all" className="w-full h-full flex flex-col">
        <div className="flex justify-between items-center p-2 border-b">
          <h3 className="font-medium">Chat</h3>
          <TabsList>
            <TabsTrigger 
              value="all" 
              onClick={() => setActiveTab('all')}
              className="px-2 py-1 text-xs"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              onClick={() => setActiveTab('team')}
              className="px-2 py-1 text-xs"
            >
              Time
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-3" ref={scrollAreaRef}>
            {filteredMessages.length === 0 ? (
              <div className="text-gray-400 text-center py-4">Nenhuma mensagem ainda</div>
            ) : (
              filteredMessages.map((msg) => {
                const player = gameState?.players.find(p => p.id === msg.sender);
                const isCurrentPlayer = socket?.id === msg.sender;
                
                // Determine team color
                const teamColor = player?.team === 'A' ? 'blue' : player?.team === 'B' ? 'red' : 'gray';
                
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "mb-2 p-2 rounded-lg max-w-[85%]",
                      isCurrentPlayer ? "ml-auto bg-blue-100" : "bg-gray-100"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold text-${teamColor}-600`}>
                        {player?.username || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="team" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-3" ref={scrollAreaRef}>
            {filteredMessages.length === 0 ? (
              <div className="text-gray-400 text-center py-4">Nenhuma mensagem de time ainda</div>
            ) : (
              filteredMessages.map((msg) => {
                const player = gameState?.players.find(p => p.id === msg.sender);
                const isCurrentPlayer = socket?.id === msg.sender;
                
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "mb-2 p-2 rounded-lg max-w-[85%]",
                      isCurrentPlayer ? "ml-auto bg-blue-100" : "bg-gray-100"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">
                        {player?.username || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      <div className="flex items-center p-2 border-t">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={activeTab === 'team' ? "Mensagem para o time..." : "Mensagem para todos..."}
          className="mr-2"
        />
        <Button onClick={sendMessage} size="sm">Enviar</Button>
      </div>
    </div>
  );
};

export default ChatBox;
