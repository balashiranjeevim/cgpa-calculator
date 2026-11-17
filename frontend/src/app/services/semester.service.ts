import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Semester } from '../models/semester.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SemesterService {
  private readonly baseUrl = `${environment.apiUrl}/semesters`;

  constructor(private http: HttpClient) {}

  getAllSemesters(): Observable<ApiResponse<Semester[]>> {
    return this.http.get<ApiResponse<Semester[]>>(this.baseUrl);
  }

  getSemesterById(id: number): Observable<ApiResponse<Semester>> {
    return this.http.get<ApiResponse<Semester>>(`${this.baseUrl}/${id}`);
  }

  createSemester(data: Partial<Semester>): Observable<ApiResponse<Semester>> {
    return this.http.post<ApiResponse<Semester>>(this.baseUrl, data);
  }

  updateSemester(id: number, data: Partial<Semester>): Observable<ApiResponse<Semester>> {
    return this.http.put<ApiResponse<Semester>>(`${this.baseUrl}/${id}`, data);
  }

  deleteSemester(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }
}
