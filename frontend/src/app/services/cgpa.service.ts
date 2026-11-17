import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, CgpaSummary } from '../models/semester.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CgpaService {
  private readonly baseUrl = `${environment.apiUrl}/cgpa`;

  constructor(private http: HttpClient) {}

  getOverallCGPA(): Observable<ApiResponse<CgpaSummary>> {
    return this.http.get<ApiResponse<CgpaSummary>>(this.baseUrl);
  }

  /**
   * Client-side dynamic SGPA calculator for instantaneous real-time feedback
   */
  calculateLocalSGPA(subjects: Array<{ credits: number; grade_point: number }>): {
    sgpa: number;
    totalCredits: number;
    totalPoints: number;
  } {
    if (!subjects || subjects.length === 0) {
      return { sgpa: 0, totalCredits: 0, totalPoints: 0 };
    }

    let totalPoints = 0;
    let totalCredits = 0;

    for (const sub of subjects) {
      const cr = Number(sub.credits) || 0;
      const gp = Number(sub.grade_point) || 0;
      if (cr > 0) {
        totalCredits += cr;
        totalPoints += cr * gp;
      }
    }

    if (totalCredits === 0) {
      return { sgpa: 0, totalCredits: 0, totalPoints: 0 };
    }

    const sgpa = Number((totalPoints / totalCredits).toFixed(2));
    const roundedCredits = Number(totalCredits.toFixed(2));
    const roundedPoints = Number(totalPoints.toFixed(2));

    return { sgpa, totalCredits: roundedCredits, totalPoints: roundedPoints };
  }

  /**
   * Client-side dynamic CGPA calculation across multiple semesters
   */
  calculateLocalCGPA(semesters: Array<{ total_credits: number; sgpa: number }>): {
    cgpa: number;
    totalCompletedCredits: number;
  } {
    if (!semesters || semesters.length === 0) {
      return { cgpa: 0, totalCompletedCredits: 0 };
    }

    let sumWeightedPoints = 0;
    let totalCredits = 0;

    for (const sem of semesters) {
      const cr = Number(sem.total_credits) || 0;
      const gpa = Number(sem.sgpa) || 0;
      if (cr > 0) {
        totalCredits += cr;
        sumWeightedPoints += cr * gpa;
      }
    }

    if (totalCredits === 0) {
      return { cgpa: 0, totalCompletedCredits: 0 };
    }

    const cgpa = Number((sumWeightedPoints / totalCredits).toFixed(2));
    const roundedCredits = Number(totalCredits.toFixed(2));

    return { cgpa, totalCompletedCredits: roundedCredits };
  }
}
