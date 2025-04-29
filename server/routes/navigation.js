import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import createLogger from '../utils/logger.js';
import { 
  analyzeNavigation,
  generateCurrentNavigationDoc
} from 'wf-analyzer';

const router = express.Router();
const log = createLogger('NavigationRoutes');

/**
 * Generate the current navigation flow documentation
 */
router.post('/generate-current-navigation', async (req, res) => {
  try {
    // Generate current navigation using columns.js analysis
    const currentNavigation = await analyzeNavigation();
    log.info(`Navigation analysis found ${currentNavigation.pages?.length || 0} pages`);
    
    // Generate the documentation content
    const { markdownContent } = generateCurrentNavigationDoc(currentNavigation);
    
    // Save to file
    const docsDir = path.resolve('C:/Users/pc790/whatsfresh/Projects/docs');
    const architectureDir = path.join(docsDir, 'architecture');
    await fs.mkdir(architectureDir, { recursive: true });
    
    const filePath = path.join(architectureDir, 'current-navigation-flow.md');
    await fs.writeFile(filePath, markdownContent);
    
    res.json({
      success: true,
      message: 'Current navigation flow documentation generated',
      file: filePath
    });
  } catch (error) {
    log.error('Error generating navigation documentation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error in navigation generation'
    });
  }
});

export default router;