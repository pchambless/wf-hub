import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Typography,
  Box, Tabs, Tab, Paper
} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import { createIssueComment } from '../../services/githubService';
import createLogger from '../../utils/logger';

const log = createLogger('Comment');

function Comment({ open, onClose, issueNumber, repoOwner, repoName, onSuccess }) {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Debug logging
  useEffect(() => {
    if (open) {
      log.debug('Comment modal opened', { issueNumber, repoOwner, repoName });
    }
  }, [open, issueNumber, repoOwner, repoName]);
  
  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setComment('');
      setError(null);
      setPreviewMode(false);
    }
  }, [open]);
  
  const handleCommentChange = (value) => {
    setComment(value || '');
  };
  
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    log.debug('Comment submission started', { 
      issueNumber, 
      repoOwner, 
      repoName, 
      commentLength: comment.length 
    });
    
    setSubmitting(true);
    setError(null);
    
    try {
      console.log('Submitting comment to:', `${repoOwner}/${repoName}#${issueNumber}`);
      await createIssueComment(repoOwner, repoName, issueNumber, comment);
      log.info('Comment submitted successfully');
      setComment('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      setError(`Failed to submit comment: ${error.message}`);
      log.error('Comment submission failed', { error: error.message });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Add Comment to Issue #{issueNumber}
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Tabs
            value={previewMode ? 1 : 0}
            onChange={(e, val) => setPreviewMode(val === 1)}
            sx={{ mb: 2 }}
          >
            <Tab label="Edit" />
            <Tab label="Preview" />
          </Tabs>
          
          {previewMode ? (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                minHeight: '200px',
                backgroundColor: '#f8f9fa' 
              }}
            >
              <MDEditor.Markdown source={comment || 'Nothing to preview'} />
            </Paper>
          ) : (
            <MDEditor
              value={comment}
              onChange={handleCommentChange}
              height={250}
              preview="edit"
              data-color-mode="light"
            />
          )}
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Supports Markdown formatting: **bold**, *italic*, `code`, etc.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!comment.trim() || submitting}
        >
          {submitting ? <CircularProgress size={24} /> : 'Submit Comment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default Comment;