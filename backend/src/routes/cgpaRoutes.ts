import { Router } from 'express';
import { cgpaController } from '../controllers/cgpaController';

const router = Router();

router.get('/', (req, res, next) => cgpaController.getOverallCGPA(req, res, next));

export default router;
