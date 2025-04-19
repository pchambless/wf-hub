import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Custom path name formatting
  const formatPathname = (path) => {
    if (path === 'repos') return 'Repository';
    if (path === 'issues') return 'Issue';
    return path;
  };

  return (
    <MuiBreadcrumbs aria-label="breadcrumb" sx={{ mb: 3, mt: 2 }}>
      <Link
        component={RouterLink}
        to="/"
        color="inherit"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Home
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        return last ? (
          <Typography color="textPrimary" key={to}>
            {formatPathname(value)}
          </Typography>
        ) : (
          <Link component={RouterLink} to={to} key={to} color="inherit">
            {formatPathname(value)}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}

export default Breadcrumbs;