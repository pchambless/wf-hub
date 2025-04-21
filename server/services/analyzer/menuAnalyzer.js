import { promises as fs } from 'fs';
import path from 'path';
import createLogger from '../../utils/logger';
import { PROJECT_PATHS } from '../pathHelper';

const log = createLogger('MenuAnalyzer');

/**
 * Find menu items in the MenuStrip component
 */
async function findMenuItems() {
  try {
    const menuStripPath = path.join(PROJECT_PATHS.client, 'src/components/page/MenuStrip.js');
    
    // Check if file exists
    try {
      await fs.access(menuStripPath);
      log.info('MenuStrip.js found at:', menuStripPath);
    } catch {
      log.info('MenuStrip.js not found, using demo data');
      return getDemoMenuItems();
    }
    
    const content = await fs.readFile(menuStripPath, 'utf8');
    
    // Extract navigation actions from the code
    const menuItems = [];
    const buttonRegex = new RegExp(
      'onClick=\\s*\\(\\)\\s*=>\\s*handleMenuItemClick\\s*\\(\\s*' +
      '[\'"]([^\'"]+)[\'"]\\s*,\\s*[\'"]([^\'"]+)[\'"]\\s*\\)', 'g'
    );
    
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
      const path = match[1];
      const label = match[2];
      
      menuItems.push({
        id: `menu-${label.toLowerCase()}`,
        path,
        label,
        type: 'navigation'
      });
      
      log.info(`Found menu item: ${label} -> ${path}`);
    }
    
    return menuItems.length ? menuItems : getDemoMenuItems();
  } catch (error) {
    log.error('Error finding menu items:', error);
    return getDemoMenuItems();
  }
}

/**
 * Provides demo menu items if actual items can't be found
 */
function getDemoMenuItems() {
  return [
    { id: 'menu-welcome', path: '/welcome', label: 'Welcome', type: 'navigation' },
    { id: 'menu-ingredients', path: '/ingredients/types', label: 'Ingredients', type: 'navigation' },
    { id: 'menu-products', path: '/products', label: 'Products', type: 'navigation' },
    { id: 'menu-account', path: '/account', label: 'Account', type: 'navigation' }
  ];
}

export {
  findMenuItems,
  getDemoMenuItems
};