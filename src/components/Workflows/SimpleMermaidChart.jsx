import { useEffect, useRef, useState } from 'react';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import createLogger from '../../utils/logger';

const log = createLogger('SimpleMermaidChart');

// Simple placeholder component until mermaid is fully working
const SimpleMermaidChart = ({ data, currentSlug, onNodeClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  
  // Group data by parent relationship
  const groupedData = data.reduce((acc, item) => {
    // Group by grandparent -> parent
    if (item.grandpSlug && item.parentSlug && item.grandpSlug !== item.parentSlug) {
      const key = `${item.grandpSlug}-${item.parentSlug}`;
      if (!acc.parents[key]) {
        acc.parents[key] = {
          source: item.grandpSlug,
          sourceName: item.gparentName,
          target: item.parentSlug,
          targetName: item.parentName
        };
      }
    }
    
    // Group by parent -> child
    if (item.parentSlug && item.childSlug && item.parentSlug !== item.childSlug) {
      const key = `${item.parentSlug}-${item.childSlug}`;
      if (!acc.children[key]) {
        acc.children[key] = {
          source: item.parentSlug,
          sourceName: item.parentName,
          target: item.childSlug,
          targetName: item.pageName,
          method: item.method
        };
      }
    }
    return acc;
  }, { parents: {}, children: {} });
  
  // Get connections relevant to current slug
  const getRelevantConnections = () => {
    const connections = [];
    
    // Add parent connections where current slug is involved
    Object.values(groupedData.parents).forEach(conn => {
      if (conn.source === currentSlug || conn.target === currentSlug) {
        connections.push(conn);
      }
    });
    
    // Add child connections where current slug is involved
    Object.values(groupedData.children).forEach(conn => {
      if (conn.source === currentSlug || conn.target === currentSlug) {
        connections.push(conn);
      }
    });
    
    return connections;
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Connections for: {currentSlug}
      </Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {getRelevantConnections().map((conn, index) => {
            const isCurrent = conn.source === currentSlug || conn.target === currentSlug;
            const sourceHighlight = conn.source === currentSlug;
            const targetHighlight = conn.target === currentSlug;
            
            return (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  border: '1px solid #eee',
                  borderRadius: 1,
                  p: 1,
                  backgroundColor: isCurrent ? '#f0f8ff' : 'transparent'
                }}
              >
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    backgroundColor: sourceHighlight ? '#dcfce7' : '#f5f5f5',
                    cursor: 'pointer',
                    fontWeight: sourceHighlight ? 'bold' : 'normal'
                  }}
                  onClick={() => onNodeClick(conn.source)}
                >
                  {conn.sourceName}
                </Box>
                
                <Box sx={{ mx: 2, color: '#666' }}>→</Box>
                
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    backgroundColor: targetHighlight ? '#dcfce7' : '#f5f5f5',
                    cursor: 'pointer',
                    fontWeight: targetHighlight ? 'bold' : 'normal'
                  }}
                  onClick={() => onNodeClick(conn.target)}
                >
                  {conn.targetName}
                  {conn.method && ` (${conn.method})`}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

function BasicMermaidChart({ data, title }) {
  const containerRef = useRef(null);
  
  // Generate Mermaid diagram definition from flow data
  const generateMermaidDefinition = () => {
    // Start with flowchart definition
    let definition = 'flowchart TD\n';
    
    // Add nodes and connections
    data.forEach(item => {
      // Skip root items
      if (item.parentId === 0) return;
      
      // Find parent item
      const parent = data.find(p => p.id === item.parentId);
      if (!parent) return;
      
      // Create node IDs
      const parentNodeId = `node${parent.id}`;
      const childNodeId = `node${item.id}`;
      
      // Add the connection
      definition += `  ${parentNodeId}["${parent.title}"] --> |${item.action}| ${childNodeId}["${item.title}"]\n`;
    });
    
    return definition;
  };
  
  useEffect(() => {
    // Skip if no container
    if (!containerRef.current) return;
    
    // Try to load Mermaid dynamically
    import('mermaid').then(mermaid => {
      // Initialize mermaid
      mermaid.default.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        }
      });
      
      // Generate the definition
      const definition = generateMermaidDefinition();
      
      // Clear previous chart
      containerRef.current.innerHTML = '';
      
      // Render the diagram
      try {
        console.log("Rendering mermaid chart with definition:", definition);
        mermaid.default.render('mermaid-diagram', definition)
          .then(result => {
            containerRef.current.innerHTML = result.svg;
          })
          .catch(err => {
            console.error("Mermaid rendering error:", err);
            containerRef.current.innerHTML = `<div style="color: red; padding: 20px;">Error rendering chart: ${err.message}</div>`;
          });
      } catch (err) {
        console.error("Mermaid error:", err);
        containerRef.current.innerHTML = `<div style="color: red; padding: 20px;">Error: ${err.message}</div>`;
      }
    }).catch(err => {
      console.error("Failed to load mermaid:", err);
      containerRef.current.innerHTML = `<div style="color: red; padding: 20px;">Failed to load chart library: ${err.message}</div>`;
    });
  }, [data]);
  
  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title || 'Ingredient Workflow'}
      </Typography>
      
      <Box
        ref={containerRef}
        sx={{ 
          height: '400px', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '1px solid #eee',
          borderRadius: 1
        }}
      >
        <CircularProgress />
      </Box>
    </Paper>
  );
}

export { SimpleMermaidChart, BasicMermaidChart };