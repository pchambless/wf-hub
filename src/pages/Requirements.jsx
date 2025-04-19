import { useState, useEffect, useRef } from 'react';
import { Typography, Paper, Grid, Box, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import MainLayout from '../layouts/MainLayout';
import { RequirementsList, RequirementsHeader } from '../components/Requirements';
import RequirementEditor from '../components/Requirements/RequirementEditor';
import IssuePreview from '../components/Modals/IssuePreview';
import Comment from '../components/Modals/Comment';
import { fetchIssues } from '../services/githubService';
import { downloadSelectedIssues } from '../services/downloadService';
import { useStore } from '../store/store';
import createLogger from '../utils/logger';

const log = createLogger('RequirementsPage');

function RequirementsPage() {
  const [issues, setIssues] = useState([]);
  const [selected, setSelected] = useState({});
  const { currentRepo } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Download status
  const [downloadStatus, setDownloadStatus] = useState({ 
    loading: false, 
    message: '', 
    type: '',
    onClose: () => setDownloadStatus(prev => ({ ...prev, message: '' }))
  });
  
  // Reference to the issue preview component for refreshing
  const issuePreviewRef = useRef(null);

  // State for editor modal
  const [editorModal, setEditorModal] = useState({
    open: false,
    data: null,
  });
  
  // State for other modals
  const [previewModal, setPreviewModal] = useState({ open: false, issueNumber: null });
  const [commentModal, setCommentModal] = useState({ open: false, issueNumber: null });

  // Fetch issues when repo changes
  useEffect(() => {
    if (currentRepo) {
      fetchRequirements(currentRepo.owner, currentRepo.name);
    }
  }, [currentRepo]);

  // Fetch requirements
  const fetchRequirements = async (owner, name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchIssues(owner, name);
      setIssues(data);
      log.info(`Loaded ${data.length} issues for ${owner}/${name}`);
    } catch (err) {
      setError(`Failed to load requirements: ${err.message}`);
      log.error('Failed to load requirements', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle selection of items
  const handleSelect = (id, checked) => {
    setSelected(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  // Handle select all
  const handleSelectAll = (checked) => {
    const newSelected = {};
    if (checked) {
      issues.forEach(issue => {
        newSelected[issue.number] = true;
      });
    }
    setSelected(newSelected);
  };

  // Handle requirement modal actions
  const handleCreateRequirement = () => {
    setEditorModal({ open: true, data: null });
  };

  const handleEditRequirement = (issue) => {
    setEditorModal({ open: true, data: issue });
  };

  const handleCloseEditorModal = () => {
    setEditorModal({ open: false, data: null });
  };

  // Handle preview and comment modals
  const handlePreview = (issueNumber) => {
    setPreviewModal({ open: true, issueNumber });
  };

  const handleComment = (issueNumber) => {
    setCommentModal({ open: true, issueNumber });
  };

  // Handle download
  const handleDownload = async () => {
    const selectedIssueNumbers = Object.keys(selected)
      .filter(key => selected[key])
      .map(Number);
      
    if (selectedIssueNumbers.length === 0) {
      setDownloadStatus({ 
        loading: false, 
        message: 'No issues selected for download',
        type: 'error',
        onClose: () => setDownloadStatus(prev => ({ ...prev, message: '' }))
      });
      return;
    }
    
    setDownloadStatus({ 
      loading: true, 
      message: 'Downloading...', 
      type: 'info',
      onClose: () => setDownloadStatus(prev => ({ ...prev, message: '' }))
    });
    
    try {
      const result = await downloadSelectedIssues(
        currentRepo,
        selectedIssueNumbers,
        localStorage.getItem('githubToken')
      );
      
      setDownloadStatus({ 
        loading: false, 
        message: `Successfully downloaded ${result.files.length} issues to ${result.path}`,
        type: 'success',
        onClose: () => setDownloadStatus(prev => ({ ...prev, message: '' }))
      });
    } catch (error) {
      setDownloadStatus({ 
        loading: false, 
        message: `Error: ${error.message}`,
        type: 'error',
        onClose: () => setDownloadStatus(prev => ({ ...prev, message: '' }))
      });
    }
  };

  // UI helpers
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <MainLayout>
      <Box sx={{ mb: 3 }}>
        <h1>Requirements</h1>
      </Box>

      {currentRepo ? (
        <Grid container spacing={2}>
          {/* Left column - Requirements List */}
          <Grid item xs={12}>
            <RequirementsHeader 
              onCreateNew={handleCreateRequirement}
              onDownload={handleDownload}
              selectedCount={selectedCount}
              downloadStatus={downloadStatus}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Paper sx={{ width: '100%', mb: 2 }}>
              <RequirementsList
                issues={issues}
                loading={loading}
                selected={selected}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onEdit={handleEditRequirement}
                onPreview={handlePreview}
                onComment={handleComment}
              />
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">
          Please select a repository from the dropdown above to view requirements.
        </Alert>
      )}

      {/* Modals for editor, preview, and comments */}
      <RequirementEditor
        open={editorModal.open}
        initialData={editorModal.data}
        onClose={handleCloseEditorModal}
        onSuccess={() => {
          // Refresh the issues list
          if (currentRepo) {
            fetchRequirements(currentRepo.owner, currentRepo.name);
          }
          handleCloseEditorModal();
        }}
      />

      <IssuePreview 
        ref={issuePreviewRef}
        open={previewModal.open}
        onClose={() => setPreviewModal({ open: false, issueNumber: null })}
        issueNumber={previewModal.issueNumber}
      />
      
      <Comment 
        open={commentModal.open}
        onClose={() => setCommentModal({ open: false, issueNumber: null })}
        issueNumber={commentModal.issueNumber}
        repoOwner={currentRepo?.owner}
        repoName={currentRepo?.name}
        onSuccess={() => {
          if (previewModal.open && previewModal.issueNumber === commentModal.issueNumber) {
            issuePreviewRef.current?.refresh();
          }
        }}
      />
    </MainLayout>
  );
}

export default RequirementsPage;