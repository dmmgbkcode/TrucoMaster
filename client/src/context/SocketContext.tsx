import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnectToGame: (username: string, gameId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  reconnectToGame: () => {} // No-op initial implementation
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastGameId, setLastGameId] = useState<string | null>(null);
  const [lastUsername, setLastUsername] = useState<string | null>(null);
  
  // Function to try to reconnect to a game
  const reconnectToGame = (username: string, gameId: string) => {
    if (!socket) return;
    
    // Save these details in case we need to reconnect later
    setLastGameId(gameId);
    setLastUsername(username);
    
    // Try to reconnect to the game
    socket.emit('reconnect_game', { username, gameId });
    
    toast.info('Tentando reconectar ao jogo...');
    console.log(`Trying to reconnect to game ${gameId} as ${username}`);
  };
  
  useEffect(() => {
    // Initialize socket connection
    // Since we're serving both client and server from the same origin,
    // we don't need to specify a host
    const socketInstance = io();
    
    // Connection established
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected with ID:', socketInstance.id);
      
      // If we have saved game info, try to reconnect automatically
      if (lastGameId && lastUsername) {
        socketInstance.emit('reconnect_game', { 
          username: lastUsername, 
          gameId: lastGameId 
        });
        console.log(`Auto-reconnecting to game ${lastGameId} as ${lastUsername}`);
      }
    });
    
    // Connection lost
    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Conexão perdida com o servidor. Tentando reconectar...');
      console.log('Socket disconnected');
    });
    
    // Connection error
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Erro de conexão com o servidor');
    });
    
    // Listen for error messages from server
    socketInstance.on('error', (data: { message: string }) => {
      toast.error(data.message);
      console.error('Server error:', data.message);
    });
    
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [lastGameId, lastUsername]);
  
  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnectToGame }}>
      {children}
    </SocketContext.Provider>
  );
};
