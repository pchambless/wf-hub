import { useState } from 'react';
import { Box, Typography, Paper, IconButton, Collapse, List, ListItem, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Global array to store API requests (shared across the application)
export const apiRequests = [];

// Helper function to log API requests
export function logApiRequest(url, method = 'GET', status = null, response = null) {
  const request = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    url,
    method,
    status,
    response,
  };
  apiRequests.unshift(request); // Add to beginning of array
  if (apiRequests.length > 10) apiRequests.pop(); // Keep only recent 10 requests
  return request;
}

export default function DebugPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        right: 0, 
        width: expanded ? 500 : 150, 
        m: 2,
        zIndex: 1000,
        opacity: 0.9
      }}
    >
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        sx={{ p: 1, bgcolor: 'primary.main', color: 'white' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="subtitle2">API Requests Debug</Typography>
        <IconButton size="small" sx={{ color: 'white' }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {apiRequests.length === 0 ? (
            <ListItem>
              <ListItemText primary="No API requests logged yet" />
            </ListItem>
          ) : (
            apiRequests.map((req) => (
              <ListItem key={req.id} sx={{ 
                borderBottom: '1px solid #eee',
                bgcolor: req.status >= 400 ? '#fff8f8' : 'transparent'
              }}>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      color: req.status >= 400 ? 'error.main' : 'inherit'
                    }}>
                      <Typography variant="body2" component="span">{req.method}</Typography>
                      <Typography variant="body2" component="span">
                        Status: {req.status || 'pending'}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
                        {req.url}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(req.timestamp).toLocaleTimeString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Collapse>
    </Paper>
  );
}