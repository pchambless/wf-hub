import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Box, Typography, CircularProgress } from '@mui/material';
import createLogger from '../../utils/logger';

const log = createLogger('MermaidChart');

const MermaidChart = ({ data, currentSlug, onNodeClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  
  // Generate HTML for Mermaid
  const generateMermaidDef = () => {
    if (!data || data.length === 0) {
      return 'flowchart LR\n  A[No Data Available]';
    }
    
    // Filter data to focus on relevant nodes
    const filteredData = data.filter(item => 
      item.parentSlug === currentSlug || 
      item.childSlug === currentSlug || 
      item.grandpSlug === currentSlug
    );
    
    if (filteredData.length === 0) {
      return `flowchart LR\n  ${currentSlug}[Current Page]`;
    }
    
    // Generate unique combinations like your Appsmith code
    const uniqueCombinations = getUniqueCombinations(filteredData);
    return generateFlowchartFromCombinations(uniqueCombinations);
  };
  
  const getUniqueCombinations = (filteredData) => {
    const uniqueCombinations = [];
    
    // Get parent combinations
    filteredData.forEach(item => {
      if (item.grandpSlug && item.parentSlug) {
        const sourceSlug = `${item.grandpSlug}`;
        const targetSlug = `${item.parentSlug}`;
        const sourceName = `${item.gparentName}`;
        const targetName = `${item.parentName}`;
        const method = '';
        
        const combination = { sourceSlug, targetSlug, sourceName, targetName, method };
        
        const existingCombination = uniqueCombinations.find(
          existing =>
            existing.sourceSlug === sourceSlug &&
            existing.targetSlug === targetSlug
        );
        
        if (!existingCombination) {
          uniqueCombinations.push(combination);
        }
      }
    });
    
    // Get child combinations
    filteredData.forEach(item => {
      if (item.parentSlug && item.childSlug) {
        const sourceSlug = `${item.parentSlug}`;
        const targetSlug = `${item.childSlug}`;
        const sourceName = `${item.parentName}`;
        const targetName = `${item.pageName}`;
        const method = `${item.method}`;
        
        const combination = { sourceSlug, targetSlug, sourceName, targetName, method };
        
        const existingCombination = uniqueCombinations.find(
          existing =>
            existing.sourceSlug === sourceSlug &&
            existing.targetSlug === targetSlug
        );
        
        if (!existingCombination) {
          uniqueCombinations.push(combination);
        }
      }
    });
    
    return uniqueCombinations;
  };
  
  const generateFlowchartFromCombinations = (combinations) => {
    const lines = [];
    
    combinations.forEach(line => {
      // Ensure we have valid slugs to avoid rendering errors
      if (!line.sourceSlug || !line.targetSlug) return;
      
      // Sanitize names to avoid Mermaid syntax errors
      const sourceName = line.sourceName.replace(/[^a-zA-Z0-9 ]/g, '');
      const targetName = line.targetName.replace(/[^a-zA-Z0-9 ]/g, '');
      
      // Add method info if available
      const methodInfo = line.method ? ` (${line.method})` : '';
      
      // Highlight current node
      const sourceStyle = line.sourceSlug === currentSlug 
        ? `style ${line.sourceSlug} fill:#dcfce7,stroke:#4CAF50,stroke-width:2px` 
        : '';
      const targetStyle = line.targetSlug === currentSlug 
        ? `style ${line.targetSlug} fill:#dcfce7,stroke:#4CAF50,stroke-width:2px` 
        : '';
      
      lines.push(`${line.sourceSlug}["${sourceName}"]-->${line.targetSlug}["${targetName}${methodInfo}"]`);
      
      if (sourceStyle) lines.push(sourceStyle);
      if (targetStyle) lines.push(targetStyle);
      
      // Make nodes clickable
      lines.push(`click ${line.sourceSlug} nodeClicked`);
      lines.push(`click ${line.targetSlug} nodeClicked`);
    });
    
    // Remove duplicates
    const uniqueLines = [...new Set(lines)];
    
    // Create flowchart definition
    return `flowchart LR\n${uniqueLines.join('\n')}`;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const renderChart = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Configure mermaid
        mermaid.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          }
        });
        
        // Clear previous chart
        containerRef.current.innerHTML = '';
        
        // Generate chart definition
        const definition = generateMermaidDef();
        
        // For debugging
        log.info('Mermaid definition:', definition);
        
        // Render the chart
        const { svg } = await mermaid.render('mermaid-chart', definition);
        containerRef.current.innerHTML = svg;
        
        // Add click handlers to nodes after rendering
        setTimeout(() => {
          const nodes = containerRef.current.querySelectorAll('[id^="nodeClicked"]');
          nodes.forEach(node => {
            node.addEventListener('click', (e) => {
              // Extract node id from the click event
              const clickedId = e.target.closest('.node').id;
              const nodeId = clickedId.replace('flowchart-', '');
              
              log.info('Node clicked:', nodeId);
              if (onNodeClick) onNodeClick(nodeId);
            });
          });
        }, 100);
      } catch (err) {
        log.error('Error rendering Mermaid chart:', err);
        setError(`Failed to render chart: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    renderChart();
  }, [currentSlug, data, onNodeClick]);

  return (
    <Box sx={{ position: 'relative', width: '100%', minHeight: '300px' }}>
      {isLoading && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)'
        }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Typography color="error" align="center">{error}</Typography>
      )}
      
      <div ref={containerRef} className="mermaid-container" />
    </Box>
  );
};

export default MermaidChart;