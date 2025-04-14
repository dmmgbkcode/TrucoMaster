import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Initialize socket connection
    // Since we're serving both client and server from the same origin,
    // we don't need to specify a host
    const socketInstance = io();
    
    // Connection established
    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected with ID:', socketInstance.id);
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
    
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
