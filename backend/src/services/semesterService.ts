import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from '../config/db';
import { Semester, Subject, SemesterInput } from '../models/types';
import { calculateSGPA } from '../utils/calculator';
import { AppError } from '../middlewares/errorHandler';

interface SemesterRow extends RowDataPacket {
  id: number;
  semester_number: number;
  semester_heading: string;
  sgpa: number;
  total_credits: number;
  subject_count?: number;
  created_at: Date;
  updated_at: Date;
}

interface SubjectRow extends RowDataPacket {
  id: number;
  semester_id: number;
  subject_name: string;
  subject_code: string | null;
  credits: number;
  grade_point: number;
  created_at: Date;
  updated_at: Date;
}

export class SemesterService {
  /**
   * Retrieves all saved semesters, ordered by semester number ascending
   */
  async getAllSemesters(): Promise<SemesterRow[]> {
    const query = `
      SELECT 
        s.id,
        s.semester_number,
        s.semester_heading,
        s.sgpa,
        s.total_credits,
        COUNT(sub.id) AS subject_count,
        s.created_at,
        s.updated_at
      FROM semesters s
      LEFT JOIN subjects sub ON s.id = sub.semester_id
      GROUP BY s.id, s.semester_number, s.semester_heading, s.sgpa, s.total_credits, s.created_at, s.updated_at
      ORDER BY s.semester_number ASC, s.id ASC
    `;

    const [rows] = await pool.query<SemesterRow[]>(query);
    return rows;
  }

  /**
   * Retrieves a single semester with all its associated subjects
   */
  async getSemesterById(id: number): Promise<Semester> {
    const semesterQuery = `
      SELECT id, semester_number, semester_heading, sgpa, total_credits, created_at, updated_at
      FROM semesters
      WHERE id = ?
    `;

    const [semRows] = await pool.query<SemesterRow[]>(semesterQuery, [id]);
    if (semRows.length === 0) {
      const err: AppError = new Error(`Semester with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const semester = semRows[0];

    const subjectsQuery = `
      SELECT id, semester_id, subject_name, subject_code, credits, grade_point, created_at, updated_at
      FROM subjects
      WHERE semester_id = ?
      ORDER BY id ASC
    `;

    const [subRows] = await pool.query<SubjectRow[]>(subjectsQuery, [id]);

    return {
      id: semester.id,
      semester_number: semester.semester_number,
      semester_heading: semester.semester_heading,
      sgpa: Number(semester.sgpa),
      total_credits: Number(semester.total_credits),
      created_at: semester.created_at,
      updated_at: semester.updated_at,
      subjects: subRows.map(sub => ({
        id: sub.id,
        semester_id: sub.semester_id,
        subject_name: sub.subject_name,
        subject_code: sub.subject_code,
        credits: Number(sub.credits),
        grade_point: Number(sub.grade_point),
        created_at: sub.created_at,
        updated_at: sub.updated_at
      }))
    };
  }

  /**
   * Creates a semester and its subjects within an ACID transaction
   */
  async createSemester(data: SemesterInput): Promise<Semester> {
    const { sgpa, totalCredits } = calculateSGPA(data.subjects);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const insertSemSql = `
        INSERT INTO semesters (semester_number, semester_heading, sgpa, total_credits)
        VALUES (?, ?, ?, ?)
      `;
      const [semResult] = await connection.execute<ResultSetHeader>(insertSemSql, [
        data.semester_number,
        data.semester_heading,
        sgpa,
        totalCredits
      ]);

      const semesterId = semResult.insertId;

      const insertedSubjects: Subject[] = [];
      const insertSubSql = `
        INSERT INTO subjects (semester_id, subject_name, subject_code, credits, grade_point)
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const sub of data.subjects) {
        const [subResult] = await connection.execute<ResultSetHeader>(insertSubSql, [
          semesterId,
          sub.subject_name,
          sub.subject_code || null,
          sub.credits,
          sub.grade_point
        ]);

        insertedSubjects.push({
          id: subResult.insertId,
          semester_id: semesterId,
          subject_name: sub.subject_name,
          subject_code: sub.subject_code || null,
          credits: Number(sub.credits),
          grade_point: Number(sub.grade_point)
        });
      }

      await connection.commit();

      return {
        id: semesterId,
        semester_number: data.semester_number,
        semester_heading: data.semester_heading,
        sgpa,
        total_credits: totalCredits,
        subjects: insertedSubjects
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Updates an existing semester and its subjects within an ACID transaction
   */
  async updateSemester(id: number, data: SemesterInput): Promise<Semester> {
    // Check if semester exists
    const [existing] = await pool.query<SemesterRow[]>(
      'SELECT id FROM semesters WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      const err: AppError = new Error(`Semester with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const { sgpa, totalCredits } = calculateSGPA(data.subjects);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update semester header
      const updateSemSql = `
        UPDATE semesters
        SET semester_number = ?, semester_heading = ?, sgpa = ?, total_credits = ?
        WHERE id = ?
      `;
      await connection.execute(updateSemSql, [
        data.semester_number,
        data.semester_heading,
        sgpa,
        totalCredits,
        id
      ]);

      // 2. Delete existing subjects for this semester
      await connection.execute('DELETE FROM subjects WHERE semester_id = ?', [id]);

      // 3. Insert updated subjects
      const insertedSubjects: Subject[] = [];
      const insertSubSql = `
        INSERT INTO subjects (semester_id, subject_name, subject_code, credits, grade_point)
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const sub of data.subjects) {
        const [subResult] = await connection.execute<ResultSetHeader>(insertSubSql, [
          id,
          sub.subject_name,
          sub.subject_code || null,
          sub.credits,
          sub.grade_point
        ]);

        insertedSubjects.push({
          id: subResult.insertId,
          semester_id: id,
          subject_name: sub.subject_name,
          subject_code: sub.subject_code || null,
          credits: Number(sub.credits),
          grade_point: Number(sub.grade_point)
        });
      }

      await connection.commit();

      return {
        id,
        semester_number: data.semester_number,
        semester_heading: data.semester_heading,
        sgpa,
        total_credits: totalCredits,
        subjects: insertedSubjects
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Deletes a semester by ID (cascades to delete associated subjects)
   */
  async deleteSemester(id: number): Promise<void> {
    const [existing] = await pool.query<SemesterRow[]>(
      'SELECT id FROM semesters WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      const err: AppError = new Error(`Semester with ID ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    await pool.execute('DELETE FROM semesters WHERE id = ?', [id]);
  }
}

export const semesterService = new SemesterService();
