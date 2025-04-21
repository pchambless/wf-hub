import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import mermaid from 'mermaid';
import createLogger from '../../utils/logger';

const log = createLogger('WorkflowVisualizer');

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

function WorkflowVisualizer({ diagramCode, title, isLoading }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (diagramCode && containerRef.current) {
      try {
        // Clear previous diagram
        containerRef.current.innerHTML = '';
        
        // Generate a unique ID for this render
        const id = `mermaid-diagram-${Date.now()}`;
        
        // Create the mermaid div
        const element = document.createElement('div');
        element.id = id;
        element.style.width = '100%';
        element.textContent = diagramCode;
        containerRef.current.appendChild(element);
        
        // Render the diagram
        mermaid.render(id, diagramCode)
          .then(({ svg }) => {
            containerRef.current.innerHTML = svg;
          })
          .catch(error => {
            log.error('Error rendering diagram', error);
            containerRef.current.innerHTML = `
              <div style="color: red; padding: 10px;">
                Error rendering diagram: ${error.message}
              </div>
            `;
          });
      } catch (error) {
        log.error('Error in mermaid rendering', error);
      }
    }
  }, [diagramCode]);

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box 
          ref={containerRef} 
          sx={{ 
            width: '100%', 
            minHeight: 300,
            overflowX: 'auto',
            '& svg': {
              maxWidth: 'none',
              width: 'auto'
            }
          }} 
        />
      )}
    </Box>
  );
}

export default WorkflowVisualizer;