import { useState, useEffect, useRef, useCallback } from 'react';
import { Typography, Paper, Box, Alert } from "@mui/material";
import MainLayout from '../layouts/MainLayout';
import { RequirementsList, RequirementsHeader } from '../components/Requirements';
import RequirementEditor from '../components/Requirements/RequirementEditor';
import { fetchIssues } from '../services/github';
import { useStore } from '../store/store';
import createLogger from '../utils/logger';
import { usePollVar } from '../utils/externalStore';

const log = createLogger('RequirementsPage');

function Requirements() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use Redux store for current repo
  const { currentRepo: reduxRepo } = useStore();
  
  // IMPORTANT: Add back the polling of external store
  const externalRepo = usePollVar(':currentRepo');
  
  // Use whichever repo is available, preferring the external one
  const currentRepo = externalRepo || reduxRepo;
  
  // Track the active repo to avoid duplicate fetches
  const activeRepoRef = useRef(null);
  const fetchInProgressRef = useRef(false);
  
  const fetchRequirements = useCallback(async (owner, name) => {
    // Skip if already fetching or same repo
    if (fetchInProgressRef.current) return;
    if (!owner || !name) return;
    
    const repoKey = `${owner}/${name}`;
    if (activeRepoRef.current === repoKey) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);
      
      // IMPORTANT: Clear issues immediately to avoid displaying stale data
      setIssues([]);
      
      log.info(`Fetching issues for ${owner}/${name}`);
      const fetchedIssues = await fetchIssues(owner, name);
      
      // Only update state if the component is still mounted and repo hasn't changed
      if (activeRepoRef.current !== repoKey) {
        activeRepoRef.current = repoKey;
        setIssues(fetchedIssues);
        log.info(`Loaded ${fetchedIssues.length} issues for ${owner}/${name}`);
      }
      
      // Clear selections when repo changes
    } catch (err) {
      setError(`Failed to load requirements: ${err.message}`);
      log.error('Failed to load requirements', err);
      setIssues([]);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // SINGLE repository change handler
  useEffect(() => {
    if (currentRepo?.owner && currentRepo?.name) {
      // This will now respond to both Redux and external store changes
      fetchRequirements(currentRepo.owner, currentRepo.name);
    }
  }, [currentRepo, fetchRequirements]);

  // Download status
  const [downloadStatus, setDownloadStatus] = useState({ 
    loading: false, 
    message: '', 
    type: '',
    onClose: () => setDownloadStatus(prev => ({ ...prev, message: '' }))
  });
  
   // State for editor modal
  const [editorModal, setEditorModal] = useState({
    open: false,
    data: null,
  });


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

  // UI helpers

  return (
    <MainLayout pageName="Requirements">
      {/* Make debug output visible for troubleshooting */}
      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f0f0f0', display: loading ? 'block' : 'none' }}>
        Debug: {loading ? 'Loading...' : `Showing ${issues.length} issues for ${activeRepoRef.current || 'unknown repo'}`}
      </Box>
      
      {currentRepo ? (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <RequirementsHeader 
            onCreateNew={handleCreateRequirement}
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
              onEdit={handleEditRequirement}
            />
          </Paper>
        </Box>
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
        onSuccess={(updatedData, shouldClose) => {
          // Refresh requirements list in background
          if (currentRepo) {
            fetchRequirements(currentRepo.owner, currentRepo.name);
          } 
          
          // If we received updated data, update the modal
          if (updatedData) {
            setEditorModal(prev => ({
              ...prev,
              data: updatedData
            }));
          }
          
          // Only close if explicitly requested (typically for new requirements)
          if (shouldClose) {
            handleCloseEditorModal();
          }
        }}
      />
    </MainLayout>
  );
}

export default Requirements;