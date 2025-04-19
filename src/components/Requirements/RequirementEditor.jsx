import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Typography,
  Box, Tabs, Tab, Paper, Alert, List, ListItem, 
  ListItemIcon, ListItemText, Checkbox, Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CommentIcon from '@mui/icons-material/Comment';
import MDEditor from '@uiw/react-md-editor';
import { 
  createIssue, 
  updateIssue, 
  fetchIssueComments, 
  createIssueComment 
} from '../../services/githubService';
import { downloadSelectedIssues } from '../../services/downloadService';
import { formatRequirementMarkdown } from '../../utils/requirementUtils';
import { useStore } from '../../store/store';
import createLogger from '../../utils/logger';

const log = createLogger('RequirementEditor');

// Template for new requirements
const REQUIREMENT_TEMPLATE = `## Description
Provide a general overview of this requirement

## Behavior / Flow
Describe the expected behavior or user flow

## Acceptance Criteria
- Criteria 1
- Criteria 2
- Criteria 3

## Related Components
- Component 1
- Component 2

## Additional Comments
Any other notes or comments
`;

function RequirementEditor({ open, initialData, onClose, onSuccess }) {
  const { currentRepo } = useStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(REQUIREMENT_TEMPLATE);
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    includeComments: true,
    destination: 'docs/requirements',
    loading: false,
    result: null
  });
  
  // Comment form state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(null);
  const [commentError, setCommentError] = useState(null);
  
  const isNew = !initialData;
  
  // Initialize with data if in edit mode
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || '');
        setContent(initialData.body || REQUIREMENT_TEMPLATE);
        // Fetch comments for existing issue
        if (currentRepo && initialData.number) {
          fetchCommentsData(currentRepo.owner, currentRepo.name, initialData.number);
        }
      } else {
        setTitle('');
        setContent(REQUIREMENT_TEMPLATE);
        setComments([]);
      }
      setError(null);
      setSuccess(null);
      setActiveTab(0);
      setCommentText('');
      setCommentSuccess(null);
      setCommentError(null);
      setDownloadOptions({
        includeComments: true,
        destination: 'docs/requirements',
        loading: false,
        result: null
      });
    }
  }, [initialData, open, currentRepo]);
  
  // Update this function to sort comments after fetching

const fetchCommentsData = async (owner, repo, issueNumber) => {
  setLoadingComments(true);
  try {
    const commentsData = await fetchIssueComments(owner, repo, issueNumber);
    
    // Sort comments by created_at in descending order (newest first)
    const sortedComments = [...commentsData].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    
    setComments(sortedComments);
  } catch (error) {
    log.error('Failed to fetch comments', error);
    // Don't show error to user, just log it
  } finally {
    setLoadingComments(false);
  }
};
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSubmit = async () => {
    if (!title.trim() || !currentRepo?.owner || !currentRepo?.name) return;
    
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      let result;
      
      if (!isNew) {
        result = await updateIssue(
          currentRepo.owner, 
          currentRepo.name, 
          initialData.number, 
          { title, body: content }
        );
        setSuccess(`Requirement #${initialData.number} updated successfully`);
      } else {
        result = await createIssue(
          currentRepo.owner,
          currentRepo.name,
          { title, body: content }
        );
        setSuccess(`Requirement #${result.number} created successfully`);
      }
      
      log.info(`Requirement ${isNew ? 'created' : 'updated'}`, { 
        id: result.id,
        number: result.number
      });
      
      // Wait a moment to show success message
      setTimeout(() => {
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
      }, 1500);
      
    } catch (error) {
      log.error('Failed to save requirement', error);
      setError(`Failed to ${isNew ? 'create' : 'update'} requirement: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDownload = async () => {
    if (!currentRepo || isNew) return;
    
    setDownloadOptions(prev => ({ ...prev, loading: true, result: null }));
    
    try {
      const result = await downloadSelectedIssues(
        currentRepo,
        [initialData.number],
        localStorage.getItem('githubToken')
      );
      
      setDownloadOptions(prev => ({ 
        ...prev, 
        loading: false, 
        result: {
          success: true,
          message: `Successfully downloaded to ${result.path}`,
          files: result.files
        }
      }));
    } catch (error) {
      setDownloadOptions(prev => ({ 
        ...prev, 
        loading: false, 
        result: {
          success: false,
          message: `Error: ${error.message}`
        }
      }));
    }
  };
  
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !currentRepo?.owner || !currentRepo?.name || !initialData?.number) {
      return;
    }
    
    setSubmittingComment(true);
    setCommentError(null);
    setCommentSuccess(null);
    
    try {
      await createIssueComment(
        currentRepo.owner, 
        currentRepo.name, 
        initialData.number, 
        commentText
      );
      
      setCommentSuccess('Comment added successfully');
      
      // Refresh comments
      await fetchCommentsData(currentRepo.owner, currentRepo.name, initialData.number);
      
      // Clear input
      setCommentText('');
      
    } catch (error) {
      log.error('Failed to add comment', error);
      setCommentError(`Failed to add comment: ${error.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={submitting || downloadOptions.loading || submittingComment ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {isNew ? 'Create New Requirement' : `Edit Requirement #${initialData?.number}`}
      </DialogTitle>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
      >
        <Tab label="Edit" />
        <Tab label="Preview" />
        {!isNew && <Tab label="Download" />}
        {!isNew && <Tab label="Add Comment" icon={<CommentIcon />} iconPosition="start" />}
      </Tabs>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {/* Edit Tab */}
        {activeTab === 0 && (
          <>
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
              placeholder="Brief descriptive title"
              disabled={submitting}
              InputProps={{
                style: {
                  backgroundColor: 'white',
                  color: '#000'
                }
              }}
            />
            
            <Box sx={{ mt: 2, mb: 2, height: '450px' }}>
              <MDEditor
                value={content}
                onChange={setContent}
                preview="edit"
                data-color-mode="light"
                height="100%"
              />
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              Use markdown formatting: **bold**, *italic*, `code`, etc.
            </Typography>
          </>
        )}
        
        {/* Preview Tab - With Comments */}
        {activeTab === 1 && (
          <Box sx={{ mt: 1 }}>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                minHeight: '450px',
                maxHeight: '500px',
                overflowY: 'auto',
                backgroundColor: '#f8f9fa'
              }}
            >
              <MDEditor.Markdown source={formatRequirementMarkdown({ 
                title, 
                body: content, 
                number: initialData?.number || 'NEW',
                user: { login: 'you' },
                created_at: new Date().toISOString(),
                state: 'open'
              }, comments)} />
            </Paper>
            
            {!isNew && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, alignItems: 'center' }}>
                {loadingComments ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 'auto' }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" sx={{ ml: 1 }}>Loading comments...</Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ mr: 'auto' }}>
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </Typography>
                )}
                
                <Button 
                  size="small" 
                  startIcon={<CommentIcon />}
                  onClick={() => setActiveTab(3)}
                >
                  Add Comment
                </Button>
              </Box>
            )}
          </Box>
        )}
        
        {/* Download Tab */}
        {activeTab === 2 && !isNew && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Download this requirement to your local repository
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    checked={downloadOptions.includeComments}
                    onChange={(e) => setDownloadOptions(prev => ({ ...prev, includeComments: e.target.checked }))}
                    disabled={downloadOptions.loading}
                  />
                </ListItemIcon>
                <ListItemText primary="Include comments" />
              </ListItem>
              
              <ListItem sx={{ pl: 4 }}>
                <TextField
                  label="Destination path"
                  fullWidth
                  size="small"
                  value={downloadOptions.destination}
                  onChange={(e) => setDownloadOptions(prev => ({ ...prev, destination: e.target.value }))}
                  helperText="Relative to repository root"
                  disabled={downloadOptions.loading}
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                disabled={downloadOptions.loading}
              >
                {downloadOptions.loading ? 'Downloading...' : 'Download Now'}
              </Button>
            </Box>
            
            {downloadOptions.result && (
              <Alert 
                severity={downloadOptions.result.success ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                {downloadOptions.result.message}
              </Alert>
            )}
            
            {downloadOptions.result?.files && (
              <List dense>
                {downloadOptions.result.files.map((file) => (
                  <ListItem key={file.path}>
                    <ListItemText 
                      primary={file.filename} 
                      secondary={file.path} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
        
        {/* Add Comment Tab */}
        {activeTab === 3 && !isNew && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add a comment to requirement #{initialData?.number}
            </Typography>
            
            {commentSuccess && (
              <Alert 
                severity="success" 
                sx={{ mb: 2 }}
                onClose={() => setCommentSuccess(null)}
              >
                {commentSuccess}
              </Alert>
            )}
            
            {commentError && (
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setCommentError(null)}
              >
                {commentError}
              </Alert>
            )}
            
            <Box sx={{ mt: 2, mb: 2 }}>
              <MDEditor
                value={commentText}
                onChange={setCommentText}
                preview="edit"
                data-color-mode="light"
                height="300px"
              />
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              Use markdown formatting for your comment.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || submittingComment}
                startIcon={submittingComment ? <CircularProgress size={20} /> : null}
              >
                {submittingComment ? 'Submitting...' : 'Add Comment'}
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Existing Comments ({comments.length})
            </Typography>
            
            {loadingComments ? (
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2, justifyContent: 'center' }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>Loading comments...</Typography>
              </Box>
            ) : comments.length > 0 ? (
              <List>
                {comments.map(comment => (
                  <ListItem key={comment.id} sx={{ display: 'block', mb: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {comment.user.login}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      <Box sx={{ mt: 1 }}>
                        <MDEditor.Markdown source={comment.body} />
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No comments yet.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={submitting || downloadOptions.loading || submittingComment}
        >
          Close
        </Button>
        
        {activeTab === 0 && (
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            color="primary"
            disabled={!title.trim() || submitting}
          >
            {submitting ? <CircularProgress size={24} /> : isNew ? 'Create' : 'Update'}
          </Button>
        )}
        
        {activeTab === 3 && !isNew && (
          <Button 
            onClick={handleSubmitComment}
            variant="contained" 
            color="primary"
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? <CircularProgress size={24} /> : 'Add Comment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default RequirementEditor;