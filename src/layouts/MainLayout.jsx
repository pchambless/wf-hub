import { useState, useEffect } from 'react';
import { Container, Box, AppBar, Toolbar, Typography, FormControl, Select, MenuItem } from '@mui/material';
import Breadcrumbs from '../components/Breadcrumbs';
import DebugPanel from '../components/Debug/DebugPanel';
import { getAvailableRepos, initGitHubService } from '../services/githubService';
import { setCurrentRepo } from '../store/store';

function MainLayout({ children }) {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');

  // Initialize repos
  useEffect(() => {
    const loadRepos = async () => {
      await initGitHubService();
      const repoList = await getAvailableRepos();
      setRepos(repoList);
      
      // If there are repos and none selected yet, select the first one
      if (repoList.length > 0 && !selectedRepo) {
        setSelectedRepo(repoList[0].name);
        setCurrentRepo(repoList[0]);
      }
    };
    loadRepos();
  }, [selectedRepo]);

  // Handle repo selection
  const handleRepoChange = (event) => {
    const repoName = event.target.value;
    const repo = repos.find(r => r.name === repoName);
    if (repo) {
      setSelectedRepo(repoName);
      setCurrentRepo(repo);
    }
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ mr: 2 }}>
            WhatsFresh GitHub
          </Typography>
          
          {/* Navigation Links */}
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            <Typography 
              component="a" 
              href="/" 
              sx={{ mr: 2, color: 'white', textDecoration: 'none' }}
            >
              Requirements
            </Typography>
            <Typography 
              component="a" 
              href="/dashboard" 
              sx={{ mr: 2, color: 'white', textDecoration: 'none' }}
            >
              Dashboard
            </Typography>
          </Box>
          
          {/* Add the repo selector here */}
          {repos.length > 0 && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1 }}>
              <Select
                value={selectedRepo}
                onChange={handleRepoChange}
                displayEmpty
                sx={{ color: 'white' }}
              >
                <MenuItem value="" disabled>
                  Select Repository
                </MenuItem>
                {repos.map((repo) => (
                  <MenuItem key={repo.name} value={repo.name}>
                    {repo.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs />
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
      </Container>
      <DebugPanel />
    </>
  );
}

export default MainLayout;