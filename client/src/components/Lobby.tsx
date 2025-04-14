import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useSocket } from '@/context/SocketContext';
import { ActionType, GameMode, GameRoom } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LobbyProps {
  rooms: GameRoom[];
  className?: string;
}

const Lobby: React.FC<LobbyProps> = ({ rooms, className }) => {
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.ONE_VS_ONE);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  // On mount, check for and load username from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('trucoUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);
  
  // Save username to localStorage when it changes
  useEffect(() => {
    if (username) {
      localStorage.setItem('trucoUsername', username);
    }
  }, [username]);
  
  // Create new game room
  const handleCreateRoom = () => {
    if (!socket) {
      toast.error('Não foi possível conectar ao servidor');
      return;
    }
    
    if (!username.trim()) {
      toast.error('Digite seu nome de usuário');
      return;
    }
    
    if (!roomName.trim()) {
      toast.error('Digite um nome para a sala');
      return;
    }
    
    socket.emit(ActionType.CREATE_GAME, {
      username,
      roomName,
      mode: gameMode
    });
    
    // Wait for server response
    socket.once('game_created', (data: { gameId: string }) => {
      navigate(`/game/${data.gameId}`);
    });
  };
  
  // Join existing game room
  const handleJoinRoom = (roomId: string) => {
    if (!socket) {
      toast.error('Não foi possível conectar ao servidor');
      return;
    }
    
    if (!username.trim()) {
      toast.error('Digite seu nome de usuário');
      return;
    }
    
    socket.emit(ActionType.JOIN_GAME, {
      username,
      gameId: roomId
    });
    
    // Navigate to game page
    navigate(`/game/${roomId}`);
  };
  
  // Get game mode display text
  const getGameModeText = (mode: GameMode) => {
    return mode === GameMode.ONE_VS_ONE ? '1v1 (2 jogadores)' : '2v2 (4 jogadores)';
  };
  
  // Calculate and display remaining slots for each room
  const getRemainingSlots = (room: GameRoom) => {
    return room.maxPlayers - room.players.length;
  };
  
  return (
    <div className={cn("w-full max-w-4xl mx-auto p-4", className)}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Truco Online - DM</span>
            <div className="text-2xl font-bold text-green-700">DM</div>
          </CardTitle>
          <CardDescription>Truco Paulista - 1v1 ou 2v2</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Seu nome de usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
            
            {!showCreateForm ? (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="w-full"
              >
                Criar Nova Sala
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Nome da Sala</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Digite o nome da sala"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Modo de Jogo</Label>
                  <RadioGroup 
                    value={gameMode} 
                    onValueChange={(value) => setGameMode(value as GameMode)}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={GameMode.ONE_VS_ONE} id="mode1v1" />
                      <Label htmlFor="mode1v1">1v1 (2 jogadores)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={GameMode.TWO_VS_TWO} id="mode2v2" />
                      <Label htmlFor="mode2v2">2v2 (4 jogadores)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateRoom} className="flex-1">
                    Criar Sala
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Salas Disponíveis</CardTitle>
          <CardDescription>Escolha uma sala para jogar</CardDescription>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma sala disponível. Crie uma nova sala para começar!
            </div>
          ) : (
            <div className="space-y-4">
              {rooms.map((room) => (
                <Card key={room.id} className="overflow-hidden">
                  <div className={room.status === 'waiting' ? 'bg-green-500 h-1' : 'bg-amber-500 h-1'} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{room.name}</h3>
                        <div className="text-sm text-gray-500">
                          {getGameModeText(room.mode)} • {room.players.length}/{room.maxPlayers} jogadores
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={room.status !== 'waiting' || getRemainingSlots(room) <= 0}
                        size="sm"
                      >
                        {room.status === 'waiting' ? 'Entrar' : 'Em jogo'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t">
          <div className="text-xs text-gray-500">
            Todas as cartas têm a marca d'água DM
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Lobby;
