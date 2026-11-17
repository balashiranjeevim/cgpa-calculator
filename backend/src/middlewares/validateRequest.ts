import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const subjectSchema = z.object({
  id: z.number().int().positive().optional(),
  subject_name: z
    .string({ required_error: 'Subject name is required' })
    .trim()
    .min(1, 'Subject name cannot be empty')
    .max(150, 'Subject name must be under 150 characters'),
  subject_code: z
    .string()
    .trim()
    .max(50, 'Subject code must be under 50 characters')
    .optional()
    .nullable()
    .transform(val => (val === '' ? null : val)),
  credits: z
    .number({ required_error: 'Credits are required' })
    .positive('Credits must be greater than 0')
    .max(30, 'Credits per subject must be 30 or less'),
  grade_point: z
    .number({ required_error: 'Grade point is required' })
    .min(0, 'Grade point cannot be negative')
    .max(10, 'Grade point cannot exceed 10.00')
});

export const semesterSchema = z.object({
  semester_number: z
    .number({ required_error: 'Semester number is required' })
    .int('Semester number must be an integer')
    .min(1, 'Semester number must be at least 1')
    .max(50, 'Semester number must be 50 or less'),
  semester_heading: z
    .string({ required_error: 'Semester heading is required' })
    .trim()
    .min(1, 'Semester heading cannot be empty')
    .max(150, 'Semester heading must be under 150 characters'),
  subjects: z
    .array(subjectSchema)
    .min(1, 'At least one subject is required for a semester')
});

export const semesterIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Semester ID must be a positive integer')
    .transform(val => parseInt(val, 10))
});

export function validateSemesterBody(req: Request, res: Response, next: NextFunction): void {
  try {
    req.body = semesterSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    next(error);
  }
}

export function validateSemesterIdParam(req: Request, res: Response, next: NextFunction): void {
  try {
    const parsed = semesterIdParamSchema.parse(req.params);
    req.params.id = String(parsed.id);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: 'Invalid semester ID',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    next(error);
  }
}
