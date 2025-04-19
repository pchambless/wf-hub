import { Box, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CommentIcon from '@mui/icons-material/Comment';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';

function RequirementActions({ issue, onEdit, onPreview, onComment, onDownload }) {
  return (
    <Box>
      <Tooltip title="Edit">
        <IconButton 
          size="small" 
          onClick={() => onEdit(issue)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Preview">
        <IconButton 
          size="small" 
          onClick={() => onPreview(issue.number)}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Add Comment">
        <IconButton 
          size="small" 
          onClick={() => onComment(issue.number)}
        >
          <CommentIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Download">
        <IconButton 
          size="small" 
          onClick={() => onDownload(issue)}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default RequirementActions;