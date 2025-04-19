import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { usePollVar, useActionTrigger, triggerAction } from '../../utils/externalStore';
import { createIssueComment } from '../../services/githubService';
import createLogger from '../../utils/logger';

const log = createLogger('CommentModal');

function CommentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Get data from external store
  const openModal = useActionTrigger('OPEN_COMMENT_MODAL');
  const currentRepo = usePollVar('currentRepo');
  const commentIssue = usePollVar('commentIssue');
  
  useEffect(() => {
    if (openModal) {
      setIsOpen(true);
      setComment('');
      setError(null);
    }
  }, [openModal]);
  
  const handleClose = () => {
    if (!submitting) {
      setIsOpen(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    if (!currentRepo || !commentIssue) {
      setError('Missing repository or issue information');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      await createIssueComment(
        currentRepo.owner, 
        currentRepo.name, 
        commentIssue.number, 
        comment
      );
      
      log.info('Comment added successfully', { 
        repo: currentRepo.name,
        issueNumber: commentIssue.number
      });
      
      setIsOpen(false);
      triggerAction('COMMENT_ADDED');
    } catch (err) {
      setError('Failed to add comment: ' + err.message);
      log.error('Error adding comment', err);
    }
    
    setSubmitting(false);
  };
  
  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Add Comment to Issue #{commentIssue?.number}
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={handleClose} 
          disabled={submitting} 
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <TextField
          autoFocus
          multiline
          rows={6}
          fullWidth
          variant="outlined"
          placeholder="Enter your comment here. GitHub markdown is supported."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={submitting}
          sx={{ mb: 2 }}
          InputProps={{
            sx: {
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }
          }}
        />
        
        <Typography variant="caption" color="text.secondary">
          GitHub markdown formatting is supported.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {submitting && <CircularProgress size={20} sx={{ mr: 2 }} />}
        </Box>
        <Box>
          <Button 
            onClick={handleClose}
            disabled={submitting}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Add Comment'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default CommentModal;