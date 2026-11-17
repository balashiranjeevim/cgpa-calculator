import { Request, Response, NextFunction } from 'express';
import { semesterService } from '../services/semesterService';

export class SemesterController {
  async getAllSemesters(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const semesters = await semesterService.getAllSemesters();
      res.status(200).json({
        success: true,
        count: semesters.length,
        data: semesters
      });
    } catch (error) {
      next(error);
    }
  }

  async getSemesterById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const semester = await semesterService.getSemesterById(id);
      res.status(200).json({
        success: true,
        data: semester
      });
    } catch (error) {
      next(error);
    }
  }

  async createSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await semesterService.createSemester(req.body);
      res.status(201).json({
        success: true,
        message: 'Semester and subjects saved successfully',
        data: created
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await semesterService.updateSemester(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Semester and subjects updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSemester(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await semesterService.deleteSemester(id);
      res.status(200).json({
        success: true,
        message: 'Semester and associated subjects deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const semesterController = new SemesterController();
