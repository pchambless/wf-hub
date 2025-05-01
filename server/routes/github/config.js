import express from 'express';
import { log } from '../../utils/github.js';
import 'dotenv/config';
import process from 'process';

const router = express.Router();

// GitHub configuration endpoint
router.get('/config', (req, res) => {
  log.info('Serving GitHub config');
  res.json({
    organization: process.env.GITHUB_ORG || 'pchambless'
  });
});

export default router;