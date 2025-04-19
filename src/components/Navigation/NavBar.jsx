import { Box, Tabs, Tab, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path.startsWith('/dashboard')) return 1;
    return false; // No tab active for other routes
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
      <Tabs 
        value={getActiveTab()} 
        onChange={(_, value) => {
          if (value === 0) navigate('/');
          if (value === 1) navigate('/dashboard');
        }}
        textColor="inherit"
        indicatorColor="secondary"
      >
        <Tab icon={<HomeIcon />} label="Requirements" />
        <Tab icon={<DashboardIcon />} label="Dashboard" />
      </Tabs>
      
      <Box sx={{ ml: 'auto' }}>
        <Button 
          color="inherit" 
          onClick={() => navigate('/')}
        >
          Home
        </Button>
      </Box>
    </Box>
  );
}

export default NavBar;