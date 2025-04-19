import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Checkbox, Chip, CircularProgress
} from '@mui/material';
import RequirementActions from './RequirementActions';

function RequirementsList({ 
  issues, 
  loading, 
  selected, 
  onSelect, 
  onSelectAll, 
  onEdit, 
  onPreview, 
  onComment,
  onDownload
}) {
  // Calculate if all items are selected
  const allSelected = issues.length > 0 && 
    issues.every(issue => selected[issue.number] === true);
  
  // Calculate if some items are selected
  const someSelected = issues.some(issue => selected[issue.number] === true) && !allSelected;

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox 
                indeterminate={someSelected}
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </TableCell>
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
              <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          ) : issues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                No requirements found
              </TableCell>
            </TableRow>
          ) : (
            issues.map(issue => {
              const isItemSelected = !!selected[issue.number];
              
              return (
                <TableRow 
                  key={issue.number}
                  hover
                  selected={isItemSelected}
                >
                  <TableCell padding="checkbox">
                    <Checkbox 
                      checked={isItemSelected}
                      onChange={(e) => onSelect(issue.number, e.target.checked)}
                    />
                  </TableCell>
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
                    {issue.labels.map(label => (
                      <Chip 
                        key={label.id}
                        label={label.name}
                        size="small"
                        sx={{ 
                          mr: 0.5, 
                          backgroundColor: `#${label.color}`,
                          color: parseInt(label.color, 16) > 0x7FFFFF ? '#000' : '#fff'
                        }} 
                      />
                    ))}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <RequirementActions 
                      issue={issue}
                      onEdit={onEdit}
                      onPreview={onPreview}
                      onComment={onComment}
                      onDownload={onDownload}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default RequirementsList;