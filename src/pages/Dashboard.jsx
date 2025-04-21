import { Typography, Grid, Box } from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import RepoStats from '../components/Dashboard/RepoStats';
import DebugPanel from '../components/Debug/DebugPanel';

function Dashboard() {
  return (
    <MainLayout pageName="Dashboard">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Project Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <RepoStats />
      </Box>
      
      {/* Add more dashboard components here */}
      
      {/* Debug panel moved from MainLayout */}
      <DebugPanel />
    </MainLayout>
  );
}

export default Dashboard;