import { useState, useEffect } from 'react';
import { 
  FormControl, 
  Select, 
  MenuItem, 
  Typography, 
  CircularProgress, 
  Alert, 
  Box 
} from '@mui/material';
import { setVar, triggerAction } from '../../utils/externalStore';
import { getAvailableRepos } from '../../services/github';
import createLogger from '../../utils/logger';

const log = createLogger('RepoSelector');

function RepoSelector() {
  const [repos, setRepos] = useState([]);  // Initialize as empty array
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRepos() {
      try {
        const data = await getAvailableRepos();
        // Ensure we always set an array, even if the API returns something else
        setRepos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load repositories', error);
        setRepos([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    }
    
    loadRepos();
  }, []);

  const handleSelectRepo = (event) => {
    const repoName = event.target.value;
    const repo = repos.find(r => r.name === repoName);
    
    if (repo) {
      setSelectedRepo(repoName);
      
      // Fix: Use colon prefix to match usePollVar(':currentRepo') in Requirements.jsx
      setVar(':currentRepo', repo);
      
      // Keep the action name as is - only the variable name needs the colon prefix
      triggerAction('REPO_SELECTED');
      
      log.info('Repo selected', { repo: repo.name });
      
      // Optional: Add console log to verify the correct variable is set
      console.log(`Set :currentRepo variable to:`, repo);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: 'medium', 
          whiteSpace: 'nowrap',
          color: '#03061c'
        }}
      >
        GitHub Repo:
      </Typography>
      
      {loading ? (
        <CircularProgress size={20} sx={{ ml: 2 }} />
      ) : (
        <FormControl fullWidth size="small" sx={{ backgroundColor: '#dcfce7', borderRadius: 1 }}>
          <Select
            value={selectedRepo}
            onChange={handleSelectRepo}
            displayEmpty
            sx={{ 
              '& .MuiSelect-select': { 
                py: 1,
                backgroundColor: '#dcfce7' 
              }
            }}
          >
            <MenuItem value=""><em>-- Select Repo --</em></MenuItem>
            {repos.map(repo => (
              <MenuItem key={repo.name} value={repo.name}>
                {repo.description || repo.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}

export default RepoSelector;