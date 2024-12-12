import express from 'express';
import { getAllJobs } from '../controllers/jobController';

const router = express.Router();

router.get('/', getAllJobs);

export default router;
