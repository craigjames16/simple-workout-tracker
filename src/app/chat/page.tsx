'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Paper,
  TextField,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMessage }] }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Add an empty assistant message that we'll update
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let lastProcessedContent = ''; // Track the last processed content
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const chunks = text.split('\n\n');

          for (const chunk of chunks) {
            if (chunk.startsWith('data: ')) {
              const content = chunk.replace('data: ', '');
              // Only process if content is new and not empty
              if (content && content !== lastProcessedContent) {
                lastProcessedContent = content;
                setMessages(prev => {
                  const lastMessage = prev[prev.length - 1];
                  // If content is already at the end of the message, skip the update
                  if (lastMessage.content.endsWith(content)) {
                    return prev;
                  }
                  
                  const needsSpace = lastMessage.content.length > 0 && 
                                   !lastMessage.content.endsWith(' ') && 
                                   !content.startsWith(' ');
                  
                  return prev.map((msg, index) => {
                    if (index === prev.length - 1) {
                      return {
                        ...msg,
                        content: msg.content + content
                      };
                    }
                    return msg;
                  });
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error message to user
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer>
      <Paper sx={{ 
        height: 'calc(100vh - 120px)', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Workout Assistant</Typography>
        </Box>

        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                backgroundColor: message.role === 'user' ? 'primary.main' : 'primary.light',
                color: message.role === 'user' ? 'white' : 'primary.contrastText',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Typography>{message.content}</Typography>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{ 
            p: 2, 
            borderTop: 1, 
            borderColor: 'divider',
            display: 'flex',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <IconButton 
            type="submit" 
            color="primary" 
            disabled={!input.trim() || loading}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </ResponsiveContainer>
  );
} 