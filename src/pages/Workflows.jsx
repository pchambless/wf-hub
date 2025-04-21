import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  TextField,
  Paper,
  Alert,
  Tab,
  Tabs,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Close as CloseIcon, Settings as SettingsIcon } from '@mui/icons-material';
import WorkflowVisualizer from '../components/Workflow/WorkflowVisualizer';
import WorkflowExplorer from '../components/Workflow/WorkflowExplorer';
import {
  analyzeWorkflows,
  generateWorkflowDiagram,
  getProjectPaths,
  updateProjectPaths
} from '../services/workflowService';
import createLogger from '../utils/logger';

const log = createLogger('WorkflowsPage');

function Workflows() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [diagramCode, setDiagramCode] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [pathFields, setPathFields] = useState({
    client: '',
    server: '',
    apiSQL: ''
  });

  // Define loadProjectPaths with useCallback so it can be used in dependency array
  const loadProjectPaths = useCallback(async () => {
    try {
      const paths = await getProjectPaths();
      setPathFields(paths);
    } catch (error) {
      showError('Failed to load paths', error);
    }
  }, []);
  
  // Load paths on mount
  useEffect(() => {
    loadProjectPaths();
  }, [loadProjectPaths]);
  
  const showError = (message, error) => {
    log.error(message, error);
    setError(`${message}: ${error.message}`);
  };
  
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeWorkflows();
      setWorkflows(result);
      showSnackbar(`Analysis complete - found ${result.length} workflows`);
    } catch (error) {
      showError('Analysis failed', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateDiagram = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const code = await generateWorkflowDiagram();
      setDiagramCode(code);
      showSnackbar('Diagram generated successfully');
    } catch (error) {
      showError('Diagram generation failed', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectItem = (workflow, step) => {
    setSelectedWorkflow(workflow);
    setSelectedStep(step);
  };
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handlePathFieldChange = (key, value) => {
    setPathFields(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleSavePaths = async () => {
    try {
      await updateProjectPaths(pathFields);
      showSnackbar('Project paths updated');
      setSettingsOpen(false);
    } catch (error) {
      showError('Failed to update paths', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4">Workflow Analysis</Typography>
        
        <Box>
          <Button 
            variant="contained" 
            onClick={handleAnalyze} 
            disabled={loading}
            sx={{ mr: 1 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze Workflows'}
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleGenerateDiagram}
            disabled={loading || workflows.length === 0}
          >
            Generate Diagram
          </Button>
          
          <IconButton onClick={() => setSettingsOpen(true)} sx={{ ml: 1 }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Workflows Explorer" />
          <Tab label="Workflow Diagram" />
          <Tab label="Step Details" />
        </Tabs>
      </Paper>
      
      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && (
          <Grid container spacing={2}>
            <Grid item style={{ width: '100%' }}>
              <WorkflowExplorer 
                workflows={workflows} 
                onSelectItem={handleSelectItem}
              />
            </Grid>
          </Grid>
        )}
        
        {activeTab === 1 && (
          <WorkflowVisualizer 
            diagramCode={diagramCode} 
            title="Workflow Diagram"
            isLoading={loading}
          />
        )}
        
        {activeTab === 2 && (
          <Box>
            {selectedStep ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedWorkflow?.title} - {selectedStep.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedStep.description}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Step Details
                  </Typography>
                  
                  <Box sx={{ mt: 1 }}>
                    <Typography><strong>Type:</strong> {selectedStep.type}</Typography>
                    {selectedStep.path && <Typography><strong>Path:</strong> {selectedStep.path}</Typography>}
                    
                    {selectedStep.apiCalls && selectedStep.apiCalls.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2 }}>API Calls:</Typography>
                        <List dense>
                          {selectedStep.apiCalls.map((call, i) => (
                            <ListItem key={i}>
                              <ListItemText 
                                primary={`${call.method.toUpperCase()} ${call.endpoint}`} 
                                secondary={`In component: ${call.component}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                    
                    {selectedStep.dbQueries && selectedStep.dbQueries.length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ mt: 2 }}>Database Queries:</Typography>
                        <List dense>
                          {selectedStep.dbQueries.map((query, i) => (
                            <ListItem key={i}>
                              <ListItemText 
                                primary={`${query.queryType}`}
                                secondary={`${query.queryText?.substring(0, 100)}...`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">
                  Select a workflow step to view its details
                </Typography>
              </Paper>
            )}
          </Box>
        )}
      </Box>
      
      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      >
        <Box sx={{ width: 450, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Project Paths
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure the paths to your project directories
          </Typography>
          
          <TextField
            fullWidth
            margin="normal"
            label="Client Path"
            value={pathFields.client}
            onChange={(e) => handlePathFieldChange('client', e.target.value)}
            helperText="Path to wf-client directory"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="Server Path"
            value={pathFields.server}
            onChange={(e) => handlePathFieldChange('server', e.target.value)}
            helperText="Path to wf-server directory"
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="API SQL Path"
            value={pathFields.apiSQL}
            onChange={(e) => handlePathFieldChange('apiSQL', e.target.value)}
            helperText="Path to wf-apiSQL directory"
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              onClick={() => setSettingsOpen(false)} 
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSavePaths}
            >
              Save Paths
            </Button>
          </Box>
        </Box>
      </Drawer>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
}

export default Workflows;