import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  ListItemIcon,
  Collapse,
  Paper,
  Divider
} from '@mui/material';
import { 
  ExpandLess, 
  ExpandMore, 
  Navigation, 
  Code, 
  Api, 
  Storage, 
  Article 
} from '@mui/icons-material';

function WorkflowExplorer({ workflows = [], onSelectItem }) {
  const [expandedWorkflows, setExpandedWorkflows] = useState({});
  
  const handleToggleWorkflow = (id) => {
    setExpandedWorkflows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const getIconForStepType = (type) => {
    switch (type) {
      case 'navigation':
        return <Navigation color="primary" />;
      case 'component':
        return <Code color="secondary" />;
      case 'server':
        return <Api color="success" />;
      case 'db':
        return <Storage color="warning" />;
      default:
        return <Article />;
    }
  };

  if (!workflows || workflows.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">No workflows found</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%' }}>
      <List sx={{ width: '100%' }}>
        {workflows.map((workflow) => (
          <React.Fragment key={workflow.id}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleToggleWorkflow(workflow.id)}>
                <ListItemIcon>
                  <Navigation />
                </ListItemIcon>
                <ListItemText 
                  primary={workflow.title} 
                  secondary={`${workflow.steps?.length || 0} steps`} 
                />
                {expandedWorkflows[workflow.id] ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
            </ListItem>
            <Collapse in={expandedWorkflows[workflow.id]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {workflow.steps.map((step) => (
                  <ListItem key={step.id} disablePadding>
                    <ListItemButton 
                      sx={{ pl: 4 }} 
                      onClick={() => onSelectItem && onSelectItem(workflow, step)}
                    >
                      <ListItemIcon>
                        {getIconForStepType(step.type)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={step.name} 
                        secondary={step.description} 
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}

export default WorkflowExplorer;