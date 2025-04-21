import express from 'express';
import {
  discoverWorkflows,
  discoverWorkflowStep,
  generateMermaidDiagram,
  findEventTypes,
  getProjectPaths,
  updateProjectPaths
} from '../services/analyzer/index.js';
import createLogger from '../utils/logger.js';

const router = express.Router();
const log = createLogger('WorkflowRoutes');

// Get project paths
router.get('/paths', (req, res) => {
  res.json({
    success: true,
    paths: getProjectPaths()
  });
});

// Update project paths with validation
router.post('/paths', (req, res) => {
  try {
    const { paths } = req.body;
    
    // Validate input
    if (!paths || typeof paths !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid paths object provided'
      });
    }
    
    updateProjectPaths(paths);
    
    res.json({
      success: true,
      paths: getProjectPaths()
    });
  } catch (error) {
    log.error('Error updating paths', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get workflows by analyzing the code
router.get('/analyze', async (req, res) => {
  try {
    log.info('Analyzing workflows...');
    const workflows = await discoverWorkflows();
    
    res.json({
      success: true,
      workflows
    });
  } catch (error) {
    log.error('Workflow analysis error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate a mermaid diagram from analyzed workflows
router.get('/diagram', async (req, res) => {
  try {
    log.info('Generating workflow diagram...');
    const workflows = await discoverWorkflows();
    
    const mermaidCode = generateMermaidDiagram(workflows);
    
    res.json({
      success: true,
      mermaidCode
    });
  } catch (error) {
    log.error('Diagram generation error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Progressive analysis - analyze just one step
router.post('/analyze-step', async (req, res) => {
  try {
    const { step, params } = req.body;
    
    if (!step) {
      return res.status(400).json({
        success: false,
        error: 'Step parameter is required'
      });
    }
    
    log.info(`Analyzing workflow step: ${step}`);
    const result = await discoverWorkflowStep(step, params);
    
    res.json({
      success: true,
      step,
      result
    });
  } catch (error) {
    log.error(`Error in step ${req.body.step}`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get event types
router.get('/eventtypes', async (req, res) => {
  try {
    log.info('Finding event types...');
    const eventTypes = await findEventTypes();
    
    res.json({
      success: true,
      eventTypes
    });
  } catch (error) {
    log.error('Event types error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;