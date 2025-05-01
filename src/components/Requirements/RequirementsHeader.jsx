import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function RequirementsHeader({ onCreateNew }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
      <Typography variant="h6">Requirements</Typography>
      
      <Box>
        <Button
          variant="contained"
          color="primary"
          onClick={onCreateNew}
          startIcon={<AddIcon />}
        >
          Create New
        </Button>
        
        {/* Remove the Download Selected button since downloads are now managed
            directly from the RequirementEditor */}
      </Box>
    </Box>
  );
}

export default RequirementsHeader;