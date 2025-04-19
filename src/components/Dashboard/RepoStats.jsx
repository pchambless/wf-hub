import { useState, useEffect } from 'react';
import { Typography, Box, Paper, Grid, CircularProgress } from '@mui/material';
import { useStore } from '../../store/store';
import { fetchIssues } from '../../services/githubService';

function RepoStats() {
  const [stats, setStats] = useState({
    open: 0,
    closed: 0,
    total: 0,
    loading: true
  });
  
  const { currentRepo } = useStore();
  
  useEffect(() => {
    const loadStats = async () => {
      if (!currentRepo?.owner || !currentRepo?.name) return;
      
      setStats(prev => ({ ...prev, loading: true }));
      
      try {
        const issues = await fetchIssues(currentRepo.owner, currentRepo.name);
        
        const openIssues = issues.filter(issue => issue.state === 'open').length;
        const closedIssues = issues.filter(issue => issue.state === 'closed').length;
        
        setStats({
          open: openIssues,
          closed: closedIssues,
          total: issues.length,
          loading: false
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        setStats({
          open: 0,
          closed: 0,
          total: 0,
          loading: false
        });
      }
    };
    
    loadStats();
  }, [currentRepo]);
  
  if (!currentRepo) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Please select a repository to view stats</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Repository Statistics
      </Typography>
      
      {stats.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography>Total Issues</Typography>
            </Paper>
          </Grid>
          <Grid xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
              <Typography variant="h4">{stats.open}</Typography>
              <Typography>Open Issues</Typography>
            </Paper>
          </Grid>
          <Grid xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.500', color: 'white' }}>
              <Typography variant="h4">{stats.closed}</Typography>
              <Typography>Closed Issues</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}

export default RepoStats;