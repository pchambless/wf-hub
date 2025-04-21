import { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, Paper, Box, Alert, Grid } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import { RequirementsList, RequirementsHeader } from '../components/Requirements';
import RequirementEditor from '../components/Requirements/RequirementEditor';
import IssuePreview from '../components/Modals/IssuePreview';
import Comment from '../components/Modals/Comment';
import { fetchIssues } from '../services/githubService';
import { downloadSelectedIssues } from '../services/downloadService';
import { useStore } from '../store/store';
import createLogger from '../utils/logger';
// Import necessary functions from externalStore
import { usePollVar, getVar } from '../utils/externalStore';

const log = createLogger('RequirementsPage');

function Requirements() {
  const [issues, setIssues] = useState([]);
  const [selected, setSelected] = useState({});
  
  // Use both store mechanisms to ensure we catch the change
  const { currentRepo } = useStore();
  const externalRepo = usePollVar(':currentRepo', null, 200); // Poll frequently
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Rest of your state...

  // Track the active repo to avoid duplicate fetches
  const activeRepoRef = useRef(null);
  
  const fetchRequirements = useCallback(async (owner, name) => {
    if (!owner || !name) return;
    
    // Skip if we're already using this repo
    const repoKey = `${owner}/${name}`;
    if (activeRepoRef.current === repoKey) {
      log.info(`Already showing ${repoKey}, skipping fetch`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      log.info(`Fetching issues for ${owner}/${name}`);
      const fetchedIssues = await fetchIssues(owner, name);
      
      // Update our active repo reference
      activeRepoRef.current = repoKey;
      
      console.log('Fetched issues:', fetchedIssues);
      
      setIssues(fetchedIssues);
      log.info(`Loaded ${fetchedIssues.length} issues for ${owner}/${name}`);
      
      // Clear selections when repo changes
      setSelected({});
    } catch (err) {
      setError(`Failed to load requirements: ${err.message}`);
      log.error('Failed to load requirements', err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Monitor the external store for repo changes
  useEffect(() => {
    if (externalRepo?.owner && externalRepo?.name) {
      log.info(`External repo changed to: ${externalRepo.owner}/${externalRepo.name}`);
      fetchRequirements(externalRepo.owner, externalRepo.name);
    }
  }, [externalRepo, fetchRequirements]);

  // Also monitor the Redux store for repo changes
  useEffect(() => {
    if (currentRepo?.owner && currentRepo?.name) {
      log.info(`Store repo changed to: ${currentRepo.owner}/${currentRepo.name}`);
      fetchRequirements(currentRepo.owner, currentRepo.name);
    }
  }, [currentRepo, fetchRequirements]);

  // Also directly subscribe to REPO_SELECTED actions
  useEffect(() => {
    const handleRepoSelectedAction = () => {
      // Get the latest repo directly from external store
      const latestRepo = getVar(':currentRepo');
      if (latestRepo?.owner && latestRepo?.name) {
        log.info(`Action triggered repo change: ${latestRepo.owner}/${latestRepo.name}`);
        fetchRequirements(latestRepo.owner, latestRepo.name);
      }
    };
    
    // Set up subscription to REPO_SELECTED action
    document.addEventListener('REPO_SELECTED', handleRepoSelectedAction);
    
    // Clean up
    return () => {
      document.removeEventListener('REPO_SELECTED', handleRepoSelectedAction);
    };
  }, [fetchRequirements]);
  
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
    <MainLayout pageName="Requirements">
      {/* Make debug output visible for troubleshooting */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f0f0f0', display: loading ? 'block' : 'none' }}>
        Debug: {loading ? 'Loading...' : `Showing ${issues.length} issues for ${activeRepoRef.current || 'unknown repo'}`}
      </Box>
      
      {currentRepo || externalRepo ? (
        <Grid container spacing={2}>
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

export default Requirements;