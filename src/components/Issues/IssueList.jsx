import { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Chip, 
  CircularProgress, 
  Alert, 
  Box, 
  Divider, 
  ListItemButton,
  ListItemSecondaryAction
} from '@mui/material';
import { setVar, triggerAction, useActionTrigger, usePollVar } from '../../utils/externalStore';
import { fetchIssues } from '../../services/githubService';
import createLogger from '../../utils/logger';

const log = createLogger('IssueList');

function IssueList() {
  const [issues, setIssues] = useState([]);
  const [selectedIssues, setSelectedIssues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get repository from external store when changed
  const repoSelected = useActionTrigger('REPO_SELECTED');
  const currentRepo = usePollVar('currentRepo');

  useEffect(() => {
    async function loadIssues() {
      if (!currentRepo) return;
      
      setLoading(true);
      setError(null);
      try {
        const issueData = await fetchIssues(currentRepo.owner, currentRepo.name);
        setIssues(issueData);
        log.info('Issues loaded', { count: issueData.length, repo: currentRepo.name });
      } catch (err) {
        setError('Failed to load issues');
        log.error('Error loading issues', err);
      }
      setLoading(false);
    }
    
    if (repoSelected) {
      loadIssues();
    }
  }, [repoSelected, currentRepo]);

  const toggleIssueSelection = (issue) => {
    const newSelectedIssues = { ...selectedIssues };
    
    if (newSelectedIssues[issue.number]) {
      delete newSelectedIssues[issue.number];
    } else {
      newSelectedIssues[issue.number] = issue;
    }
    
    setSelectedIssues(newSelectedIssues);
    setVar('selectedIssues', newSelectedIssues);
    triggerAction('ISSUE_SELECTED');
    
    log.info('Issue selection changed', { 
      issueNumber: issue.number, 
      selected: !selectedIssues[issue.number],
      totalSelected: Object.keys(newSelectedIssues).length
    });
  };

  // Helper function to get issue state styling
  const getStateChip = (state) => {
    const color = state === 'open' ? 'success' : 'default';
    return <Chip label={state} color={color} size="small" />;
  };

  if (!currentRepo) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">Select a repo first</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Issues for {currentRepo.name}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {issues.length === 0 ? (
        <Typography color="text.secondary">No issues found</Typography>
      ) : (
        <List>
          {issues.map(issue => (
            <ListItemButton 
              key={issue.number} 
              selected={!!selectedIssues[issue.number]}
              onClick={() => toggleIssueSelection(issue)}
            >
              <ListItemText 
                primary={`#${issue.number} ${issue.title}`}
                secondary={
                  <Typography component="div">
                    {getStateChip(issue.state)}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                {getStateChip(issue.state)}
              </ListItemSecondaryAction>
            </ListItemButton>
          ))}
        </List>
      )}
    </Box>
  );
}

export default IssueList;