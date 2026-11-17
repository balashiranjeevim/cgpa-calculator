import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SemesterService } from '../../services/semester.service';
import { NotificationService } from '../../services/notification.service';
import { Semester, Subject } from '../../models/semester.model';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-semester-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmModalComponent],
  template: `
    <div class="detail-page">
      <!-- Breadcrumb -->
      <div class="breadcrumb mb-4">
        <a routerLink="/dashboard">Dashboard</a> &rsaquo;
        <span>{{ semester?.semester_heading || 'Semester Details' }}</span>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner spinner-primary"></div>
        <span class="text-muted text-sm mt-3">Loading details...</span>
      </div>

      <div *ngIf="!loading && loadError" class="empty-state">
        <h4 class="empty-state-title">Could not load semester details</h4>
        <p class="empty-state-desc">{{ loadError }}</p>
        <a routerLink="/history" class="btn btn-secondary btn-sm">Back to Saved Semesters</a>
      </div>

      <!-- Main Semester Content -->
      <div *ngIf="!loading && semester">
        <!-- Top Hero Card -->
        <div class="card mb-6">
          <div class="detail-hero-content">
            <div class="detail-hero-left">
              <div class="sem-badge-row">
                <span class="badge font-mono">Semester {{ semester.semester_number }}</span>
                <span class="badge">{{ getAcademicStanding(semester.sgpa) }}</span>
              </div>
              <h1 class="sem-title">{{ semester.semester_heading }}</h1>
              <p class="text-muted text-sm">
                Recorded on {{ formatDate(semester.created_at) }} &bull; {{ (semester.subjects?.length || 0) }} Courses
              </p>
            </div>

            <div class="detail-hero-right">
              <div class="sgpa-stat-box">
                <span class="sgpa-stat-label">SGPA</span>
                <span class="sgpa-stat-val font-mono">{{ semester.sgpa.toFixed(2) }}</span>
                <span class="sgpa-stat-max">/ 10.00</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="card">
            <span class="text-muted text-xs uppercase font-semibold">Total Credits</span>
            <div class="font-mono font-bold text-xl mt-1">{{ semester.total_credits.toFixed(1) }}</div>
          </div>

          <div class="card">
            <span class="text-muted text-xs uppercase font-semibold">Total Quality Points</span>
            <div class="font-mono font-bold text-xl mt-1">{{ getTotalQualityPoints().toFixed(2) }}</div>
          </div>

          <div class="card">
            <span class="text-muted text-xs uppercase font-semibold">Points Per Credit</span>
            <div class="font-mono font-bold text-xl mt-1">
              {{ semester.total_credits > 0 ? (getTotalQualityPoints() / semester.total_credits).toFixed(2) : '0.00' }}
            </div>
          </div>
        </div>

        <!-- Detailed Courses Table -->
        <div class="card mb-6">
          <div class="card-header">
            <h3>Course Breakdown</h3>
            <span class="badge font-mono">{{ semester.subjects?.length || 0 }} Courses</span>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course Name</th>
                  <th>Code</th>
                  <th>Credits (C)</th>
                  <th>Grade Point (G)</th>
                  <th>Letter</th>
                  <th>Points (C &times; G)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sub of semester.subjects; let i = index">
                  <td class="font-mono text-muted">{{ i + 1 }}</td>
                  <td class="font-semibold">{{ sub.subject_name }}</td>
                  <td class="font-mono text-muted">{{ sub.subject_code || '—' }}</td>
                  <td class="font-mono">{{ sub.credits.toFixed(1) }}</td>
                  <td class="font-mono">{{ sub.grade_point.toFixed(1) }}</td>
                  <td>
                    <span class="badge">{{ getLetterGrade(sub.grade_point) }}</span>
                  </td>
                  <td class="font-mono font-semibold">{{ (sub.credits * sub.grade_point).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="table-total-row">
                  <td colspan="3" class="font-bold">Total / Summary</td>
                  <td class="font-mono font-bold">{{ semester.total_credits.toFixed(1) }}</td>
                  <td colspan="2"></td>
                  <td class="font-mono font-bold">{{ getTotalQualityPoints().toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between items-center flex-wrap gap-4">
          <a routerLink="/dashboard" class="btn btn-secondary btn-sm">
            &larr; Back to Dashboard
          </a>

          <div class="flex gap-2">
            <a [routerLink]="['/dashboard']" [queryParams]="{ edit: semester.id }" class="btn btn-primary btn-sm">
              Edit in Dashboard
            </a>
            <button class="btn btn-danger-outline btn-sm" (click)="confirmDelete()">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Modal -->
      <app-confirm-modal
        [isOpen]="isDeleteModalOpen"
        title="Delete Semester Record"
        [subtitle]="'Delete ' + (semester?.semester_heading || 'this semester') + '?'"
        confirmText="Confirm Delete"
        [isDanger]="true"
        (confirm)="executeDelete()"
        (cancel)="closeDeleteModal()"
      >
        <p>This action permanently removes this semester and its subjects from MySQL.</p>
      </app-confirm-modal>
    </div>
  `,
  styles: [`
    .detail-page {
      display: flex;
      flex-direction: column;
    }
    .breadcrumb {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .breadcrumb a {
      color: #000000;
      text-decoration: underline;
    }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }
    .detail-hero-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    @media (min-width: 640px) {
      .detail-hero-content {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
    .sem-badge-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .sem-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.25rem;
    }
    .sgpa-stat-box {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.75rem;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .sgpa-stat-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .sgpa-stat-val {
      font-size: 2.25rem;
      font-weight: 800;
      color: #000000;
      line-height: 1.1;
      margin: 0.2rem 0;
    }
    .sgpa-stat-max {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .table-total-row td {
      background: #fafafa;
      border-top: 2px solid var(--border-color);
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
    }
  `]
})
export class SemesterDetailComponent implements OnInit {
  semester: Semester | null = null;
  loading = true;
  loadError: string | null = null;
  isDeleteModalOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private semesterService: SemesterService,
    private notificationService: NotificationService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (Number.isInteger(id) && id > 0) {
        this.loadSemester(id);
      } else {
        this.loading = false;
        this.loadError = 'The semester ID is invalid.';
        this.changeDetector.detectChanges();
      }
    });
  }

  loadSemester(id: number): void {
    this.loading = true;
    this.loadError = null;
    this.semesterService.getSemesterById(id).subscribe({
      next: (res) => {
        this.semester = res.data;
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        this.semester = null;
        const message = err.error?.message || 'Semester not found. Check the server and try again.';
        this.loadError = message;
        this.loading = false;
        this.notificationService.error(message);
        this.changeDetector.detectChanges();
      }
    });
  }

  getTotalQualityPoints(): number {
    if (!this.semester?.subjects) return 0;
    return this.semester.subjects.reduce((sum, s) => sum + (s.credits * s.grade_point), 0);
  }

  getLetterGrade(gp: number): string {
    if (gp >= 10.0) return 'O (10)';
    if (gp >= 9.0) return 'A+ (9)';
    if (gp >= 8.0) return 'A (8)';
    if (gp >= 7.0) return 'B+ (7)';
    if (gp >= 6.0) return 'B (6)';
    if (gp >= 5.0) return 'C (5)';
    if (gp >= 4.0) return 'P (4)';
    return 'F (0)';
  }

  getAcademicStanding(gpa: number): string {
    if (gpa >= 8.5) return 'Distinction';
    if (gpa >= 6.5) return 'First Class';
    if (gpa >= 5.5) return 'Second Class';
    if (gpa >= 4.0) return 'Pass Class';
    return 'Fail';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  confirmDelete(): void {
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
  }

  executeDelete(): void {
    if (!this.semester?.id) return;
    this.semesterService.deleteSemester(this.semester.id).subscribe({
      next: () => {
        this.notificationService.success('Semester deleted successfully');
        this.closeDeleteModal();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to delete semester');
        this.closeDeleteModal();
      }
    });
  }
}
