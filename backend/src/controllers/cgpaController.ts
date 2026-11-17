import { Request, Response, NextFunction } from 'express';
import { cgpaService } from '../services/cgpaService';

export class CgpaController {
  async getOverallCGPA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await cgpaService.calculateOverallCGPA();
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cgpaController = new CgpaController();
