export interface Subject {
  id?: number;
  semester_id?: number;
  subject_name: string;
  subject_code?: string | null;
  credits: number;
  grade_point: number;
  created_at?: string;
  updated_at?: string;
}

export interface Semester {
  id?: number;
  semester_number: number;
  semester_heading: string;
  sgpa: number;
  total_credits: number;
  subject_count?: number;
  created_at?: string;
  updated_at?: string;
  subjects?: Subject[];
}

export interface SemesterOverviewItem {
  id: number;
  semester_number: number;
  semester_heading: string;
  sgpa: number;
  total_credits: number;
  subject_count: number;
  created_at: string;
}

export interface CgpaSummary {
  cgpa: number;
  total_completed_credits: number;
  total_semesters: number;
  semesters: SemesterOverviewItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  errors?: Array<{ field: string; message: string }>;
}

export interface GradePreset {
  grade: string;
  gradePoint: number;
  description: string;
}

export const GRADE_PRESETS: GradePreset[] = [
  { grade: 'O (Outstanding)', gradePoint: 10.0, description: '90 - 100%' },
  { grade: 'A+ (Excellent)', gradePoint: 9.0, description: '80 - 89%' },
  { grade: 'A (Very Good)', gradePoint: 8.0, description: '70 - 79%' },
  { grade: 'B+ (Good)', gradePoint: 7.0, description: '60 - 69%' },
  { grade: 'B (Above Average)', gradePoint: 6.0, description: '55 - 59%' },
  { grade: 'C (Average)', gradePoint: 5.0, description: '50 - 54%' },
  { grade: 'P (Pass)', gradePoint: 4.0, description: '40 - 49%' },
  { grade: 'F (Fail)', gradePoint: 0.0, description: 'Below 40%' }
];
