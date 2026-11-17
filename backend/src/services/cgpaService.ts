import { RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/db';
import { CgpaSummary } from '../models/types';
import { calculateCGPA } from '../utils/calculator';

interface SemesterOverviewRow extends RowDataPacket {
  id: number;
  semester_number: number;
  semester_heading: string;
  sgpa: number;
  total_credits: number;
  subject_count: number;
  created_at: Date;
}

export class CgpaService {
  /**
   * Calculates overall CGPA dynamically from all stored semester records in MySQL
   */
  async calculateOverallCGPA(): Promise<CgpaSummary> {
    const query = `
      SELECT 
        s.id,
        s.semester_number,
        s.semester_heading,
        s.sgpa,
        s.total_credits,
        COUNT(sub.id) AS subject_count,
        s.created_at
      FROM semesters s
      LEFT JOIN subjects sub ON s.id = sub.semester_id
      GROUP BY s.id, s.semester_number, s.semester_heading, s.sgpa, s.total_credits, s.created_at
      ORDER BY s.semester_number ASC, s.id ASC
    `;

    const [rows] = await pool.query<SemesterOverviewRow[]>(query);

    const semestersInput = rows.map(r => ({
      total_credits: Number(r.total_credits),
      sgpa: Number(r.sgpa)
    }));

    const { cgpa, totalCompletedCredits } = calculateCGPA(semestersInput);

    return {
      cgpa,
      total_completed_credits: totalCompletedCredits,
      total_semesters: rows.length,
      semesters: rows.map(r => ({
        id: r.id,
        semester_number: r.semester_number,
        semester_heading: r.semester_heading,
        sgpa: Number(r.sgpa),
        total_credits: Number(r.total_credits),
        subject_count: Number(r.subject_count || 0),
        created_at: r.created_at.toISOString()
      }))
    };
  }
}

export const cgpaService = new CgpaService();
