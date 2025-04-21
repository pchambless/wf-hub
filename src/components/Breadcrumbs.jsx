import { Breadcrumbs as MUIBreadcrumbs, Link, Typography } from '@mui/material';
import { useLocation, Link as RouterLink, matchPath } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import { useEffect, useState } from 'react';

function Breadcrumbs() {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('Dashboard');
  
  // Define routes map - update with your actual routes
  const routes = [
    { path: '/', name: 'Dashboard' },
    { path: '/requirements', name: 'Requirements' },
    // Add other routes here
  ];
  
  // Update current page based on route matching rather than pathname splitting
  useEffect(() => {
    // Find matching route
    const matchingRoute = routes.find(route => 
      matchPath(route.path, location.pathname) || 
      // Handle exact match
      (location.pathname === route.path)
    );
    
    if (matchingRoute) {
      setCurrentPage(matchingRoute.name);
    } else if (location.pathname === '/') {
      setCurrentPage('Dashboard');
    }
    
    console.log('Current path:', location.pathname);
    console.log('Current page:', matchingRoute?.name || 'No match');
  }, [location]);

  return (
    <MUIBreadcrumbs aria-label="breadcrumb" sx={{ mb: 3, mt: 2 }}>
      {/* Always show Home link */}
      <Link 
        component={RouterLink} 
        to="/"
        underline="hover"
        color="inherit"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Dashboard
      </Link>
      
      {/* Show current page if not on dashboard */}
      {currentPage !== 'Dashboard' && (
        <Typography color="text.primary">
          {currentPage}
        </Typography>
      )}
    </MUIBreadcrumbs>
  );
}

export default Breadcrumbs;