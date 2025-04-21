import './App.css';
import { Container, Typography, Box } from '@mui/material';
import RepoSelector from './components/Repos/RepoSelector';
import IssueDetail from './components/Issues/IssueDetail';
import CommentModal from './components/Comments/CommentModal';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Requirements from './pages/Requirements';
import Dashboard from './pages/Dashboard';
import Workflows from './pages/Workflows';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import { AppBar, Toolbar, Button, Paper } from '@mui/material';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static" 
          sx={{ 
            backgroundColor: '#bae6c3',
            color: '#03061c',
            boxShadow: 1
          }}>
          {/* First row: centered app name */}
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
            <Typography variant="h4" component="div"> 
              WhatsFresh Hub
            </Typography>
          </Box>

          {/* Second row: navigation links */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', padding: '5px 0' }}>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/"
                    sx={{ fontWeight: 500, mx: 2, fontSize: '1rem', color: '#4169E1' }}
                  >
                    Dashboard
                  </Button>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/requirements"
                    sx={{ fontWeight: 500, mx: 2, fontSize: '1rem', color: '#4169E1' }}
                  >
                    Requirements
                  </Button>
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/workflows"
                    sx={{ fontWeight: 500, mx: 2, fontSize: '1rem', color: '#4169E1' }}
                  >
                    Onboarding Guide
                  </Button>
                  </Box>

                  {/* Third row: repo selector - streamlined */}
          <Box 
            sx={{ 
              backgroundColor: '#a5d9af', 
              padding: '8px 16px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box sx={{ width: '400px' }}>
              <RepoSelector key="repo-selector" />
            </Box>
          </Box>
        </AppBar>

        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Force re-render on route change as well as repo change */}
            <Route path="/requirements" element={<Requirements />} />
            <Route path="/workflows" element={<Workflows />} />
          </Routes>
        </Container>
        <CommentModal />
      </Router>
    </ThemeProvider>
  );
}

export default App;
