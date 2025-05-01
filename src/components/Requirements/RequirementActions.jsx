import EditIcon from '@mui/icons-material/Edit';
import { IconButton, Tooltip } from '@mui/material';

function RequirementActions({ issue, onEdit }) {
  return (
    <Tooltip title="Edit Requirement">
      <IconButton onClick={() => onEdit(issue)}>
        <EditIcon />
      </IconButton>
    </Tooltip>
  );
}

export default RequirementActions;