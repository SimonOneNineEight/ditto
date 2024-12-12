import express from 'express';
import {
	getAllJobs,
	syncNewJobs,
	updateJobStatus,
} from '@/controllers/JobController';

const router = express.Router();

router.get('/', getAllJobs);
router.get('/sync-new-jobs', syncNewJobs);
router.patch('/:id/status', updateJobStatus);

export default router;
