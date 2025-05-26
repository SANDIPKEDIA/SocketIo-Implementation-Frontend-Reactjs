import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Avatar,
  CircularProgress,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { format } from 'date-fns';

const API_URL = 'https://staging-api.pipaan.com/api/group_chat/add-group_chat';
const SOCKET_URL = 'https://staging-api.pipaan.com/';

const USER = {
  id: 17,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE3LCJpYXQiOjE3NDgyMzk2NzksImV4cCI6MTc1MzQyMzY3OSwidHlwZSI6InJlZnJlc2gifQ.9Lvk8wQTmL-Ms1lPro1UIio7RC-Fr8iBtOSW5dGLlWY',
  name: 'User 17'
};

function App() {
  const theme = useTheme();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sentMessages]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: USER.token
      }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to WebSocket with ID:', newSocket.id);
      newSocket.emit('join', USER.id);
    });

    newSocket.on('joined', (message) => {
      console.log('Room join confirmation:', message);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from WebSocket');
    });

    newSocket.on('receive-message', (msg) => {
      console.log('Received message:', msg);
      setMessages(prev => [...prev, {
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
      }]);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('receive-message');
      newSocket.close();
    };
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const payload = {
      message: message,
      reciever_id: 14,
      media_url: [],
      is_group_chat: false,
    };

    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Token': USER.token,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        setSentMessages(prev => [...prev, {
          message: message,
          sender_id: USER.id,
          timestamp: new Date().toISOString()
        }]);
        setMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return format(date, 'MMM d, h:mm a');
  };

  const allMessages = [...messages, ...sentMessages].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <Container maxWidth="md" sx={{ py: 4, height: '100vh' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
              {USER.name[0]}
            </Avatar>
            <Typography variant="h6">{USER.name}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress 
              size={12} 
              sx={{ 
                color: connected ? 'success.main' : 'error.main',
                mr: 1
              }} 
            />
            <Typography variant="body2" style={{fontWeight: 'bold'}} color={connected ? "#00FF00" : "#FF0000"}>
              {connected ? 'Online' : 'Offline'}
            </Typography>
        
          </Box>
        </Box>

        <Box 
          sx={{ 
            flex: 1,
            p: 2,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            backgroundColor: '#f8f9fa'
          }}
        >
          {allMessages.map((msg, index) => (
            <Box
              key={`msg-${index}`}
              sx={{
                display: 'flex',
                justifyContent: msg.sender_id === USER.id ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}
              >
                <Box
                  sx={{
                    backgroundColor: msg.sender_id === USER.id 
                      ? theme.palette.primary.main 
                      : 'white',
                    color: msg.sender_id === USER.id ? 'white' : 'text.primary',
                    p: 2,
                    borderRadius: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      [msg.sender_id === USER.id ? 'right' : 'left']: -8,
                      width: 16,
                      height: 16,
                      backgroundColor: msg.sender_id === USER.id 
                        ? theme.palette.primary.main 
                        : 'white',
                      transform: 'rotate(45deg)',
                      zIndex: 0
                    }
                  }}
                >
                  <Typography variant="body1">{msg.message}</Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    alignSelf: msg.sender_id === USER.id ? 'flex-end' : 'flex-start',
                    px: 1
                  }}
                >
                  {formatMessageTime(msg.timestamp)}
                </Typography>
              </Box>
            </Box>
          ))}
          {isTyping && (
            <Box sx={{ display: 'flex', gap: 0.5, p: 1 }}>
              <CircularProgress size={12} />
              <Typography variant="caption" color="text.secondary">
                Someone is typing...
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box 
          sx={{ 
            p: 2,
            backgroundColor: 'white',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  backgroundColor: '#f8f9fa'
                }
              }}
            />
            <Button 
              variant="contained" 
              onClick={sendMessage}
              disabled={!connected || !message.trim()}
              sx={{
                borderRadius: '50%',
                minWidth: '48px',
                width: '48px',
                height: '48px'
              }}
            >
              <SendIcon />
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default App; 