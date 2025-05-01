import express from 'express';
import configRouter from './config.js';
import issuesRouter from './issues.js';
import commentsRouter from './comments.js';  // Make sure this import exists
import downloadsRouter from './downloads.js';

const router = express.Router();

// Mount the various routers
router.use('/config', configRouter);  // For /api/github/config endpoints
router.use('/issues', issuesRouter);   // For /api/github/issues endpoints
router.use('/issues', commentsRouter); // For /api/github/issues/:owner/:repo/:issueNumber/comments
router.use('/download-issue', downloadsRouter);

export default router;