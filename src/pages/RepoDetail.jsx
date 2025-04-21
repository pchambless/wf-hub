import { useParams } from 'react-router-dom';
import { Grid, Typography, Paper } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import IssueList from '../components/Issues/IssueList';
import IssueDetail from '../components/Issues/IssueDetail';
import { useEffect } from 'react';
import { setCurrentRepo } from '../store/store';

function RepoDetail() {
  const { owner, repo } = useParams();
  
  useEffect(() => {
    // Update the current repo when this page loads
    if (owner && repo) {
      setCurrentRepo({ name: repo, owner });
    }
  }, [owner, repo]);

  return (
    <MainLayout>
      <Typography variant="h4" gutterBottom>
        Repository: {owner}/{repo}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <IssueList />
          </Paper>
        </Grid>
        <Grid xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <IssueDetail />
          </Paper>
        </Grid>
      </Grid>
    </MainLayout>
  );
}

export default RepoDetail;