import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Paper, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import MermaidChart from './MermaidChart';
import { useNavigate } from 'react-router-dom';
import createLogger from '../../utils/logger';

const log = createLogger('WorkflowNavigator');

function WorkflowNavigator({ navigationData, workflows }) {
  const [currentSlug, setCurrentSlug] = useState('home');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const navigate = useNavigate();
  
  // Find a page in navigation data by slug
  const findPageBySlug = (slug) => {
    return navigationData.find(page => page.childSlug === slug);
  };
  
  // Find current step in workflow
  const findCurrentStepIndex = () => {
    if (!selectedWorkflow) return -1;
    
    return selectedWorkflow.steps.findIndex(step => {
      const page = findPageBySlug(step.slug);
      return page && page.childSlug === currentSlug;
    });
  };
  
  // Handle node click in the chart
  const handleNodeClick = (slug) => {
    log.info('Node clicked:', slug);
    setCurrentSlug(slug);
    
    // If we're in a workflow, check if this advances us
    if (selectedWorkflow) {
      const stepIndex = selectedWorkflow.steps.findIndex(step => step.slug === slug);
      if (stepIndex >= 0) {
        // Mark previous steps as completed
        const newCompleted = { ...completedSteps };
        for (let i = 0; i < stepIndex; i++) {
          newCompleted[selectedWorkflow.steps[i].slug] = true;
        }
        setCompletedSteps(newCompleted);
      }
    }
    
    // Navigate to the page
    navigate(`/${slug}`);
  };
  
  // Start a workflow
  const startWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    if (workflow.steps.length > 0) {
      const firstSlug = workflow.steps[0].slug;
      setCurrentSlug(firstSlug);
      navigate(`/${firstSlug}`);
    }
  };
  
  // Mark step as completed
  const markStepCompleted = (stepSlug) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepSlug]: true
    }));
  };
  
  // Navigate to next step in workflow
  const goToNextStep = () => {
    if (!selectedWorkflow) return;
    
    const currentIndex = findCurrentStepIndex();
    if (currentIndex >= 0 && currentIndex < selectedWorkflow.steps.length - 1) {
      const nextStep = selectedWorkflow.steps[currentIndex + 1];
      setCurrentSlug(nextStep.slug);
      navigate(`/${nextStep.slug}`);
    }
  };
  
  // Determine if we can proceed to next step
  const canProceedToNext = () => {
    if (!selectedWorkflow) return false;
    
    const currentIndex = findCurrentStepIndex();
    return currentIndex >= 0 && currentIndex < selectedWorkflow.steps.length - 1;
  };
  
  // Get current page info
  const currentPage = findPageBySlug(currentSlug);

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Interactive Workflow Navigator
        </Typography>
        
        <Typography variant="body1" paragraph>
          {selectedWorkflow 
            ? `Current workflow: ${selectedWorkflow.title}`
            : 'Select a workflow to get started or explore the application using the interactive chart below.'}
        </Typography>
        
        {selectedWorkflow && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Workflow Progress</Typography>
            <List>
              {selectedWorkflow.steps.map((step, index) => {
                const isCurrentStep = step.slug === currentSlug;
                const isCompleted = completedSteps[step.slug];
                
                return (
                  <ListItem 
                    key={index}
                    sx={{ 
                      backgroundColor: isCurrentStep ? '#dcfce7' : 'transparent',
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      {isCompleted ? (
                        <CheckCircleIcon color="success" />
                      ) : isCurrentStep ? (
                        <PlayCircleOutlineIcon color="primary" />
                      ) : (
                        <ArrowForwardIcon color="action" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={step.title} 
                      secondary={step.description} 
                    />
                    {isCurrentStep && (
                      <Button 
                        variant="outlined" 
                        color="success" 
                        size="small"
                        onClick={() => markStepCompleted(step.slug)}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </ListItem>
                );
              })}
            </List>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setSelectedWorkflow(null)}
              >
                Exit Workflow
              </Button>
              
              <Button 
                variant="contained" 
                disabled={!canProceedToNext()}
                onClick={goToNextStep}
              >
                Next Step
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
      
      {!selectedWorkflow && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Workflows
          </Typography>
          
          <Grid container spacing={2}>
            {workflows.map((workflow, index) => (
              <Grid xs={12} sm={6} lg={4} key={index}>
                <Card 
                  sx={{ 
                    p: 2, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    '&:hover': { backgroundColor: '#f0fff4' },
                    cursor: 'pointer'
                  }}
                  onClick={() => startWorkflow(workflow)}
                >
                  <Typography variant="h6" gutterBottom>{workflow.title}</Typography>
                  <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }}>
                    {workflow.description}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    {workflow.steps.length} steps
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small" 
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    Start
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Interactive System Map
          </Typography>
          
          {currentPage && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Current Page: {currentPage.pageName}
              </Typography>
              {currentPage.method && (
                <Chip 
                  label={currentPage.method} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                  sx={{ mr: 1 }}
                />
              )}
              {currentPage.inSQL && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 1, 
                    p: 1, 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: 1,
                    fontFamily: 'monospace'
                  }}
                >
                  {currentPage.inSQL}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        
        <Box sx={{ height: '400px', border: '1px solid #eee', borderRadius: 1, overflow: 'auto' }}>
          <MermaidChart 
            data={navigationData} 
            currentSlug={currentSlug} 
            onNodeClick={handleNodeClick}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default WorkflowNavigator;