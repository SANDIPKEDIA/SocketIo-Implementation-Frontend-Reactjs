import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';

const API_URL = 'https://pipaan.com360degree.com/api/group_chat/add-group_chat';
const SOCKET_URL = 'https://pipaan.com360degree.com/';

const USER = {
  id: 199,
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjE5OSwiaWF0IjoxNzQ2MzYyMjI1LCJleHAiOjE3NTE1NDYyMjUsInR5cGUiOiJyZWZyZXNoIn0.Bn9l9PhIqVhxARGEOFKuVWgIi_ieVxIwJu-Pxgn6su4',
  name: 'User 199'
};

function App() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: {
        token: USER.token
      }
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to WebSocket with ID:', newSocket.id);
      
      // Join user's room
      newSocket.emit('join', USER.id);
    });

    newSocket.on('joined', (message) => {
      console.log('Room join confirmation:', message);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from WebSocket');
    });

    // Listen for messages
    newSocket.on('receive-message', (msg) => {
      console.log('Received message:', msg);
      setMessages(prev => [...prev, {
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
      }]);
    });

    // Add error handler
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Add connect_error handler
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
      reciever_id: 197, // Sending to self
      media_url: [],
      is_group_chat: false,
    };

    try {
      // Send message through API
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Token': USER.token,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        // Add message to sent messages
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Chat Test - Single User
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" gutterBottom>
          {USER.name}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color={connected ? 'success.main' : 'error.main'}>
            Status: {connected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>

        <Paper 
          elevation={1} 
          sx={{ 
            flex: 1,
            mb: 2, 
            p: 2, 
            overflow: 'auto',
            backgroundColor: '#f5f5f5'
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={`received-${index}`}
              sx={{
                textAlign: 'left',
                mb: 1
              }}
            >
              <Typography
                sx={{
                  display: 'inline-block',
                  backgroundColor: '#f5f5f5',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  maxWidth: '70%'
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  {`User ${msg.sender_id}`}
                </Typography>
                <Typography>{msg.message}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Typography>
            </Box>
          ))}
          {sentMessages.map((msg, index) => (
            <Box
              key={`sent-${index}`}
              sx={{
                textAlign: 'right',
                mb: 1
              }}
            >
              <Typography
                sx={{
                  display: 'inline-block',
                  backgroundColor: '#e3f2fd',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  maxWidth: '70%'
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  You
                </Typography>
                <Typography>{msg.message}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Typography>
            </Box>
          ))}
        </Paper>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={!connected}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default App; 