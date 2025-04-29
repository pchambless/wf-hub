import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import createLogger from '../utils/logger.js';

const router = express.Router();
const log = createLogger('DocumentationRoutes');

// Base docs directory
const DOCS_BASE_DIR = path.resolve('C:/Users/pc790/whatsfresh/Projects/docs');

/**
 * Get list of available documentation
 */
router.get('/list', async (req, res) => {
  try {
    // Structure for available documentation
    const docCategories = [];
    
    // Read directories under the docs folder
    const directories = await fs.readdir(DOCS_BASE_DIR, { withFileTypes: true });
    
    for (const dir of directories.filter(dirent => dirent.isDirectory())) {
      const category = {
        name: formatCategoryName(dir.name),
        path: dir.name,
        documents: []
      };
      
      // Get documents in this category
      const files = await fs.readdir(path.join(DOCS_BASE_DIR, dir.name));
      const markdownFiles = files.filter(file => file.endsWith('.md'));
      
      for (const file of markdownFiles) {
        try {
          const filePath = path.join(dir.name, file);
          const fileContent = await fs.readFile(path.join(DOCS_BASE_DIR, filePath), 'utf-8');
          
          // Extract title from the markdown content (first heading)
          const titleMatch = fileContent.match(/^#\s+(.*?)$/m);
          const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
          
          category.documents.push({
            title,
            path: filePath,
            updated: (await fs.stat(path.join(DOCS_BASE_DIR, filePath))).mtime
          });
        } catch (err) {
          log.error(`Error processing ${file}:`, err);
        }
      }
      
      if (category.documents.length > 0) {
        // Sort documents by title
        category.documents.sort((a, b) => a.title.localeCompare(b.title));
        docCategories.push(category);
      }
    }
    
    // Sort categories by name
    docCategories.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({
      categories: docCategories
    });
  } catch (error) {
    log.error('Error getting documentation list:', error);
    res.status(500).json({
      error: 'Failed to load documentation index',
      message: error.message
    });
  }
});

/**
 * Get content of a documentation file
 */
router.get('/content', async (req, res) => {
  try {
    const { path: docPath } = req.query;
    
    if (!docPath) {
      return res.status(400).json({
        error: 'Document path is required'
      });
    }
    
    // Validate path to prevent directory traversal
    const normalizedPath = path.normalize(docPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(DOCS_BASE_DIR, normalizedPath);
    
    if (!fullPath.startsWith(DOCS_BASE_DIR)) {
      return res.status(403).json({
        error: 'Invalid document path'
      });
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    
    res.json({
      content
    });
  } catch (error) {
    log.error('Error getting document content:', error);
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        error: 'Document not found',
        message: 'The requested document does not exist'
      });
    }
    res.status(500).json({
      error: 'Failed to load document content',
      message: error.message
    });
  }
});

/**
 * Get onboarding help for a specific area
 */
router.get('/onboarding/:area', async (req, res) => {
  try {
    const { area } = req.params;
    
    // Map area to appropriate documentation file
    const helpMap = {
      'dashboard': 'user/dashboard.md',
      'ingredients': 'user/ingredients.md',
      'products': 'user/products.md',
      'recipes': 'user/recipes.md',
      'default': 'user/getting-started.md'
    };
    
    const docPath = helpMap[area] || helpMap.default;
    const fullPath = path.join(DOCS_BASE_DIR, docPath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      res.json({
        content,
        title: area.charAt(0).toUpperCase() + area.slice(1) + ' Help'
      });
    } catch {
      // If the specific help file doesn't exist, return a default message
      res.json({
        content: `# ${area.charAt(0).toUpperCase() + area.slice(1)} Help\n\nDetailed help content for this area is coming soon.`,
        title: area.charAt(0).toUpperCase() + area.slice(1) + ' Help'
      });
    }
  } catch (error) {
    log.error('Error getting onboarding help:', error);
    res.status(500).json({
      error: 'Failed to load help content',
      message: error.message
    });
  }
});

/**
 * Format category name to be more readable
 */
function formatCategoryName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default router;