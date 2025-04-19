import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Chip, Button, CircularProgress, Divider,
  List, ListItem, Avatar, Paper, Tabs, Tab
} from '@mui/material';
import { fetchIssueDetails, fetchIssueComments } from '../../services/githubService';
import { formatRequirementMarkdown } from '../../utils/requirementUtils';
import { downloadSelectedIssues } from '../../services/downloadService'; // Add this import
import { useStore } from '../../store/store';
import ReactMarkdown from 'react-markdown';
import createLogger from '../../utils/logger';

const log = createLogger('IssuePreview');

const IssuePreview = forwardRef(({ open, onClose, issueNumber }, ref) => {
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { currentRepo } = useStore();
  
  const loadIssueDetails = useCallback(async () => {
    if (!currentRepo?.owner || !currentRepo?.name || !issueNumber) return;
    
    setLoading(true);
    try {
      // Load both issue and comments in parallel
      const [details, commentsList] = await Promise.all([
        fetchIssueDetails(currentRepo.owner, currentRepo.name, issueNumber),
        fetchIssueComments(currentRepo.owner, currentRepo.name, issueNumber)
      ]);
      
      setIssue(details);
      setComments(commentsList || []);
      log.debug('Loaded issue and comments', { 
        issueId: details.id, 
        commentsCount: commentsList?.length || 0
      });
    } catch (error) {
      log.error('Failed to load issue details', error);
    } finally {
      setLoading(false);
    }
  }, [currentRepo, issueNumber]);
  
  // Expose refresh method through ref
  useImperativeHandle(ref, () => ({
    refresh: loadIssueDetails
  }));
  
  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadIssueDetails();
    }
  }, [open, loadIssueDetails]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {loading ? 'Loading Issue...' : issue ? `#${issue.number}: ${issue.title}` : 'Issue Preview'}
      </DialogTitle>
      
      {issue && !loading && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Issue View" />
          <Tab label="Markdown Export" />
        </Tabs>
      )}
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : issue ? (
          activeTab === 0 ? (
            <Box>
              {/* Normal View - Same as before */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Chip 
                    label={issue.state} 
                    color={issue.state === 'open' ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }} 
                  />
                  {issue.labels && issue.labels.map(label => (
                    <Chip 
                      key={label.id}
                      label={label.name}
                      size="small"
                      sx={{ 
                        mr: 1, 
                        backgroundColor: `#${label.color}`,
                        color: parseInt(label.color, 16) > 0x7FFFFF ? '#000' : '#fff'
                      }} 
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Opened by {issue.user.login} on {new Date(issue.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="body1" component="div">
                  <ReactMarkdown>{issue.body || 'No description provided.'}</ReactMarkdown>
                </Typography>
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Comments ({comments.length})
                </Typography>
                
                {comments.length === 0 ? (
                  <Typography color="text.secondary">No comments yet.</Typography>
                ) : (
                  <List>
                    {comments
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .map(comment => (
                        <ListItem 
                          key={comment.id} 
                          alignItems="flex-start"
                          component={Paper}
                          sx={{ mb: 2, p: 2 }}
                        >
                          <Box sx={{ display: 'flex', width: '100%' }}>
                            <Avatar 
                              alt={comment.user.login}
                              src={comment.user.avatar_url}
                              sx={{ mr: 2, width: 40, height: 40 }}
                            />
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2">
                                  {comment.user.login}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(comment.created_at).toLocaleString()}
                                </Typography>
                              </Box>
                              <Typography variant="body2" component="div">
                                <ReactMarkdown>{comment.body}</ReactMarkdown>
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                      ))}
                  </List>
                )}
              </Box>
            </Box>
          ) : (
            // Markdown Export Preview
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                This is how your issue will appear in the downloaded markdown file:
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  bgcolor: '#f5f5f5',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}
              >
                <pre style={{ margin: 0, fontFamily: 'inherit' }}>
                  {formatRequirementMarkdown(issue, comments)}
                </pre>
              </Paper>
            </Box>
          )
        ) : (
          <Typography>No issue selected</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {activeTab === 1 && issue && (
          <Button 
            variant="contained"
            color="primary"
            onClick={() => {
              // Download single issue functionality
              downloadSelectedIssues(currentRepo, [issue.number], localStorage.getItem('githubToken'));
            }}
          >
            Download This Issue
          </Button>
        )}
        <Button 
          color="primary" 
          onClick={loadIssueDetails}
          disabled={loading}
        >
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default IssuePreview;