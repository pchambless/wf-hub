import React, { useState, useEffect } from 'react';  // Add React import
import { 
  Typography, 
  Box, 
  Chip, 
  Divider, 
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import { 
  Comment as CommentIcon, 
  Add as AddIcon,
  BugReport as BugIcon 
} from '@mui/icons-material';
import { usePollVar, useActionTrigger, triggerAction, setVar } from '../../utils/externalStore';
import { fetchIssueDetails, fetchComments as fetchIssueComments } from '../../services/github';
import createLogger from '../../utils/logger';
import ReactMarkdown from 'react-markdown';

const log = createLogger('IssueDetail');

function IssueDetail() {
  const [issueDetails, setIssueDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get selected issues from external store
  const selectedIssues = usePollVar('selectedIssues', {});
  const currentRepo = usePollVar('currentRepo');
  const issueSelected = useActionTrigger('ISSUE_SELECTED');
  
  // Get the first selected issue (if any)
  const selectedIssueNumbers = Object.keys(selectedIssues);
  const selectedIssueNumber = selectedIssueNumbers.length > 0 ? selectedIssueNumbers[0] : null;
  const selectedIssue = selectedIssueNumber ? selectedIssues[selectedIssueNumber] : null;
  
  useEffect(() => {
    async function loadIssueDetails() {
      if (!currentRepo || !selectedIssueNumber) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const details = await fetchIssueDetails(currentRepo.owner, currentRepo.name, selectedIssueNumber);
        setIssueDetails(details);
        
        const issueComments = await fetchIssueComments(currentRepo.owner, currentRepo.name, selectedIssueNumber);
        setComments(issueComments);
        
        log.info('Issue details loaded', { 
          issueNumber: selectedIssueNumber, 
          commentsCount: issueComments.length 
        });
      } catch (err) {
        setError('Failed to load issue details');
        log.error('Error loading issue details', err);
      }
      
      setLoading(false);
    }
    
    if (selectedIssueNumber) {
      loadIssueDetails();
    } else {
      setIssueDetails(null);
      setComments([]);
    }
  }, [currentRepo, selectedIssueNumber, issueSelected]);

  const handleAddComment = () => {
    if (currentRepo && selectedIssueNumber) {
      setVar('commentIssue', selectedIssue);
      triggerAction('OPEN_COMMENT_MODAL');
      log.info('Opening comment modal', { issueNumber: selectedIssueNumber });
    }
  };

  if (!selectedIssue) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ p: 4, height: 300 }}>
        <BugIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Select an issue to view details
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  const statusColor = selectedIssue.state === 'open' ? 'success' : 'default';
  const formattedDate = new Date(selectedIssue.created_at).toLocaleString();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
          #{selectedIssue.number}: {selectedIssue.title}
        </Typography>
        <Chip 
          label={selectedIssue.state} 
          color={statusColor} 
          size="medium" 
          sx={{ ml: 2 }}
        />
      </Box>
      
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader
          avatar={
            <Avatar 
              alt={selectedIssue.user?.login || 'User'} 
              src={selectedIssue.user?.avatar_url} 
            />
          }
          title={selectedIssue.user?.login || 'Unknown User'}
          subheader={`Created on ${formattedDate}`}
        />
        <CardContent>
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'background.default',
            borderRadius: 1,
            '& p': { mt: 0 }
          }}>
            {issueDetails?.body ? (
              <ReactMarkdown>{issueDetails.body}</ReactMarkdown>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No description provided
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
      
      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleAddComment}
        >
          Add Comment
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box>
        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
          Comments ({comments.length})
        </Typography>
        {comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No comments yet
          </Typography>
        ) : (
          <List>
            {comments.map(comment => (
              <ListItem key={comment.id} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar alt={comment.user.login} src={comment.user.avatar_url} />
                </ListItemAvatar>
                <ListItemText
                  primary={comment.user.login}
                  secondary={
                    <React.Fragment>
                      <Typography
                        sx={{ display: 'inline' }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {new Date(comment.created_at).toLocaleString()}
                      </Typography>
                      {" — "}
                      {comment.body}
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}

export default IssueDetail;