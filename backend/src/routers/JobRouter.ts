import express from 'express';
import { getAllJobs, syncNewJobs } from '@/controllers/JobController';

const router = express.Router();

router.get('/', getAllJobs);
router.get('/sync-new-jobs', syncNewJobs);

export default router;
