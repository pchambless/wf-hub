import { Box, Typography, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function RequirementsHeader({ 
  onCreateNew, 
  downloadStatus 
}) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6">Requirements List</Typography>
        
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
            size="small"
          >
            Add New
          </Button>
        </Box>
      </Box>

      {downloadStatus.message && (
        <Alert 
          severity={downloadStatus.type} 
          onClose={() => downloadStatus.onClose()}
          sx={{ mb: 2 }}
        >
          {downloadStatus.message}
        </Alert>
      )}
    </>
  );
}

export default RequirementsHeader;