import { Router } from 'express';
import { semesterController } from '../controllers/semesterController';
import {
  validateSemesterBody,
  validateSemesterIdParam
} from '../middlewares/validateRequest';

const router = Router();

router.get('/', (req, res, next) => semesterController.getAllSemesters(req, res, next));
router.get('/:id', validateSemesterIdParam, (req, res, next) => semesterController.getSemesterById(req, res, next));
router.post('/', validateSemesterBody, (req, res, next) => semesterController.createSemester(req, res, next));
router.put('/:id', validateSemesterIdParam, validateSemesterBody, (req, res, next) => semesterController.updateSemester(req, res, next));
router.delete('/:id', validateSemesterIdParam, (req, res, next) => semesterController.deleteSemester(req, res, next));

export default router;
