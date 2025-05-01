import { 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip, 
  IconButton, 
  Tooltip, 
  CircularProgress, 
  Box, 
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

function RequirementsList({ 
  issues = [], 
  loading = false,
  onEdit
}) {
  // Display empty state when no issues are available
  if (!issues.length && !loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No issues found in this repository</Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '80px' }}>#</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Labels</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Loading requirements...
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            issues.map(issue => (
              <TableRow 
                key={issue.number} 
                hover
              >
                <TableCell>{issue.number}</TableCell>
                <TableCell>{issue.title}</TableCell>
                <TableCell>
                  <Chip 
                    label={issue.state} 
                    color={issue.state === 'open' ? 'success' : 'default'}
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {issue.labels && issue.labels.map(label => (
                    <Chip 
                      key={label.id || label.name}
                      label={label.name}
                      size="small"
                      sx={{ 
                        mr: 0.5, 
                        backgroundColor: `#${label.color || '888888'}`,
                        color: label.color && parseInt(label.color, 16) > 0x7FFFFF ? '#000' : '#fff'
                      }} 
                    />
                  ))}
                </TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>
                  <Tooltip title="Edit Requirement">
                    <IconButton onClick={() => onEdit && onEdit(issue)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default RequirementsList;