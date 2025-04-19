import './App.css';
import { Container, Typography, Grid, Paper } from '@mui/material';
import RepoSelector from './components/Repos/RepoSelector';
import IssueList from './components/Issues/IssueList';
import IssueDetail from './components/Issues/IssueDetail';
import CommentModal from './components/Comments/CommentModal';
import DebugPanel from './components/Debug/DebugPanel';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RequirementsPage from './pages/Requirements';
import DashboardPage from './pages/DashboardPage';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RequirementsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
        <CommentModal />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
