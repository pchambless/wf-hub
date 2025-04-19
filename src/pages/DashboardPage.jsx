import { Typography, Grid, Paper, Box } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import RepoStats from '../components/Dashboard/RepoStats';

function DashboardPage() {
  return (
    <MainLayout>
      <Typography variant="h4" component="h1" gutterBottom>
        Project Dashboard
      </Typography>
      <Box sx={{ mb: 4 }}>
        <RepoStats />
      </Box>
      {/* Add more dashboard components here */}
    </MainLayout>
  );
}

export default DashboardPage;