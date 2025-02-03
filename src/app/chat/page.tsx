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
import ReactMarkdown from 'react-markdown';

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
        let lastProcessedContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const chunks = text.split('\n\n');

          for (const chunk of chunks) {
            if (chunk.startsWith('data: ')) {
              const content = chunk.replace('data: ', '');
              if (!content) continue;

              try {
                // Check if content is a number
                const parsedContent = Number(content);
                if (Number.isInteger(parsedContent)) {
                  throw new Error("Not JSON");
                }
                  // Try to parse as JSON first
                  const jsonData = JSON.parse(content);
                if (jsonData.type === 'plan_data') {
                  // Add plan data as a new message
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: JSON.stringify(jsonData.data, null, 2)
                  }]);
                  continue;
                }
              } catch {
                // Not JSON, handle as regular streaming text
                const processedContent = String(content); // Ensure content is a string
                if (processedContent !== lastProcessedContent) {
                  lastProcessedContent = processedContent;
                  setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage.content.endsWith(processedContent)) {
                      return prev;
                    }
                    
                    return prev.map((msg, index) => {
                      if (index === prev.length - 1) {
                        const newContent = msg.content + processedContent; // Use processedContent
                        return {
                          ...msg,
                          content: newContent
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
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
                '& p': {
                  m: 0,
                },
                '& ul, & ol': {
                  m: 0,
                  pl: 2,
                },
              }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
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