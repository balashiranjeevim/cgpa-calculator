export interface Subject {
  id?: number;
  semester_id?: number;
  subject_name: string;
  subject_code?: string | null;
  credits: number;
  grade_point: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Semester {
  id?: number;
  semester_number: number;
  semester_heading: string;
  sgpa: number;
  total_credits: number;
  created_at?: Date | string;
  updated_at?: Date | string;
  subjects?: Subject[];
}

export interface SubjectInput {
  subject_name: string;
  subject_code?: string | null;
  credits: number;
  grade_point: number;
}

export interface SemesterInput {
  semester_number: number;
  semester_heading: string;
  subjects: SubjectInput[];
}

export interface CgpaSummary {
  cgpa: number;
  total_completed_credits: number;
  total_semesters: number;
  semesters: Array<{
    id: number;
    semester_number: number;
    semester_heading: string;
    sgpa: number;
    total_credits: number;
    subject_count: number;
    created_at: string;
  }>;
}
