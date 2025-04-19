import { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography, 
  CircularProgress, 
  Alert, 
  Box 
} from '@mui/material';
import { setVar, triggerAction } from '../../utils/externalStore';
import { getAvailableRepos, initGitHubService } from '../../services/githubService';
import createLogger from '../../utils/logger';

const log = createLogger('RepoSelector');

function RepoSelector() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        await initGitHubService();
        const availableRepos = getAvailableRepos();
        setRepos(availableRepos);
      } catch (err) {
        setError('Failed to load repos');
        log.error('Error initializing repo list', err);
      }
      setLoading(false);
    }
    
    initialize();
  }, []);

  const handleSelectRepo = (event) => {
    const repoName = event.target.value;
    const repo = repos.find(r => r.name === repoName);
    
    if (repo) {
      setSelectedRepo(repoName);
      setVar('currentRepo', repo);
      triggerAction('REPO_SELECTED');
      log.info('Repo selected', { repo: repo.name });
    }
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        GitHub Repo
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : (
        <FormControl fullWidth>
          <InputLabel id="repo-select-label">Repo</InputLabel>
          <Select
            labelId="repo-select-label"
            id="repo-select"
            value={selectedRepo}
            label="Repo"
            onChange={handleSelectRepo}
            size="small"
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
    </>
  );
}

export default RepoSelector;