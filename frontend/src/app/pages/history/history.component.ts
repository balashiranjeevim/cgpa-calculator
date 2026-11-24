import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SemesterService } from '../../services/semester.service';
import { NotificationService } from '../../services/notification.service';
import { Semester } from '../../models/semester.model';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="history-page">
      <div class="page-header mb-6">
        <div>
          <h1 class="page-title">Saved Semesters History</h1>
          <p class="text-muted text-sm">Historical archive of semester calculations stored in MySQL.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/dashboard" class="btn btn-primary btn-sm">
            &larr; Back to Dashboard
          </a>
        </div>
      </div>

      <!-- Search, Classification & Sort Filter Bar -->
      <div class="card mb-6 filter-card">
        <div class="filter-controls">
          <div class="search-box">
            <input 
              type="text" 
              class="form-input search-input" 
              placeholder="Search by heading, semester number, or grade..." 
              [(ngModel)]="searchQuery"
              (ngModelChange)="applyFilters()"
            />
          </div>

          <div class="filter-selects">
            <select class="form-select filter-standing-select" [(ngModel)]="filterStanding" (ngModelChange)="applyFilters()">
              <option value="all">All Classifications</option>
              <option value="distinction">Distinction (&ge; 8.5)</option>
              <option value="first">First Class (&ge; 6.5)</option>
              <option value="second">Second Class (&ge; 5.5)</option>
              <option value="pass">Pass Class (&ge; 4.0)</option>
              <option value="fail">Fail (&lt; 4.0)</option>
            </select>

            <select class="form-select sort-select" [(ngModel)]="sortBy" (ngModelChange)="applyFilters()">
              <option value="sem_asc">Semester (1 &rarr; N)</option>
              <option value="sem_desc">Semester (N &rarr; 1)</option>
              <option value="sgpa_desc">Highest SGPA</option>
              <option value="sgpa_asc">Lowest SGPA</option>
              <option value="credits_desc">Most Credits</option>
              <option value="credits_asc">Least Credits</option>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
            </select>

            <button 
              *ngIf="searchQuery || filterStanding !== 'all' || sortBy !== 'sem_asc'" 
              class="btn btn-outline btn-sm reset-btn" 
              (click)="resetFilters()"
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>

        <div class="filter-status-bar" *ngIf="!loading && semesters.length > 0">
          <span class="text-xs text-muted">
            Showing {{ filteredSemesters.length }} of {{ semesters.length }} semester records
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-box">
        <div class="spinner spinner-primary"></div>
        <span class="text-muted text-sm">Loading records from database...</span>
      </div>

      <!-- Empty State (No records at all in DB) -->
      <div *ngIf="!loading && semesters.length === 0" class="empty-state">
        <h4 class="empty-state-title">No records found</h4>
        <p class="empty-state-desc">There are no semester records saved in the database yet.</p>
        <a routerLink="/dashboard" class="btn btn-primary btn-sm">
          Go to Calculator
        </a>
      </div>

      <!-- Filter Empty State (Records exist, but filter matched 0) -->
      <div *ngIf="!loading && semesters.length > 0 && filteredSemesters.length === 0" class="empty-state">
        <h4 class="empty-state-title">No matching records found</h4>
        <p class="empty-state-desc">No saved semester matches your current search or classification filter.</p>
        <button class="btn btn-secondary btn-sm" (click)="resetFilters()">
          Clear Filters
        </button>
      </div>

      <!-- Semesters Table -->
      <div *ngIf="!loading && filteredSemesters.length > 0" class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sem</th>
                <th>Heading</th>
                <th>Courses</th>
                <th>Credits</th>
                <th>SGPA</th>
                <th>Classification</th>
                <th>Saved Date</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sem of filteredSemesters">
                <td class="font-mono font-bold">#{{ sem.semester_number }}</td>
                <td>
                  <a [routerLink]="['/semester', sem.id]" class="sem-link">
                    {{ sem.semester_heading }}
                  </a>
                </td>
                <td class="text-muted">{{ sem.subject_count || 0 }}</td>
                <td class="font-mono">{{ sem.total_credits }}</td>
                <td class="font-mono font-bold">{{ sem.sgpa.toFixed(2) }}</td>
                <td>
                  <span class="badge">{{ getAcademicStanding(sem.sgpa) }}</span>
                </td>
                <td class="text-xs text-muted">{{ formatDate(sem.created_at) }}</td>
                <td style="text-align: right;">
                  <div class="flex justify-end gap-2">
                    <a [routerLink]="['/dashboard']" [queryParams]="{ edit: sem.id }" class="btn btn-secondary btn-sm">
                      Edit
                    </a>
                    <a [routerLink]="['/semester', sem.id]" class="btn btn-outline btn-sm">
                      Details
                    </a>
                    <button class="btn btn-danger-outline btn-sm" (click)="confirmDelete(sem)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Delete Modal -->
      <app-confirm-modal
        [isOpen]="isDeleteModalOpen"
        title="Delete Semester Record"
        [subtitle]="'Delete ' + (selectedSemesterToDelete?.semester_heading || 'this semester') + '?'"
        confirmText="Confirm Delete"
        [isDanger]="true"
        (confirm)="executeDelete()"
        (cancel)="closeDeleteModal()"
      >
        <p>This action permanently removes this semester from the database.</p>
      </app-confirm-modal>
    </div>
  `,
  styles: [`
    .history-page {
      display: flex;
      flex-direction: column;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.25rem;
    }
    .mb-6 { margin-bottom: 1.5rem; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .filter-card {
      padding: 1rem 1.25rem;
    }
    .filter-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    @media (min-width: 768px) {
      .filter-controls {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
    .search-box {
      flex: 1;
    }
    .search-input {
      width: 100%;
    }
    .filter-selects {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .filter-standing-select {
      width: 165px;
    }
    .sort-select {
      width: 175px;
    }
    .reset-btn {
      padding: 0.45rem 0.75rem;
    }
    .filter-status-bar {
      margin-top: 0.65rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }
    .sem-link {
      color: #000000;
      text-decoration: none;
      font-weight: 600;
    }
    .sem-link:hover {
      text-decoration: underline;
    }
    .loading-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem 1rem;
    }
  `]
})
export class HistoryComponent implements OnInit {
  semesters: Semester[] = [];
  filteredSemesters: Semester[] = [];
  loading = true;

  searchQuery = '';
  filterStanding = 'all';
  sortBy = 'sem_asc';

  isDeleteModalOpen = false;
  selectedSemesterToDelete: Semester | null = null;

  constructor(
    private semesterService: SemesterService,
    private notificationService: NotificationService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSemesters();
  }

  loadSemesters(): void {
    this.loading = true;
    this.semesterService.getAllSemesters().subscribe({
      next: (res) => {
        this.semesters = (res.data || []).map(s => ({
          ...s,
          semester_number: Number(s.semester_number),
          sgpa: Number(s.sgpa),
          total_credits: Number(s.total_credits)
        }));
        this.applyFilters();
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to load semester history');
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let list = [...this.semesters];

    // 1. Text Search Filter
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(s => {
        const headingMatch = (s.semester_heading || '').toLowerCase().includes(q);
        const numberMatch = String(s.semester_number).includes(q) || `sem ${s.semester_number}`.includes(q) || `semester ${s.semester_number}`.includes(q);
        const standingMatch = this.getAcademicStanding(s.sgpa).toLowerCase().includes(q);
        const sgpaMatch = s.sgpa.toFixed(2).includes(q);
        return headingMatch || numberMatch || standingMatch || sgpaMatch;
      });
    }

    // 2. Standing / Classification Filter
    if (this.filterStanding && this.filterStanding !== 'all') {
      list = list.filter(s => {
        const val = Number(s.sgpa);
        switch (this.filterStanding) {
          case 'distinction': return val >= 8.5;
          case 'first': return val >= 6.5 && val < 8.5;
          case 'second': return val >= 5.5 && val < 6.5;
          case 'pass': return val >= 4.0 && val < 5.5;
          case 'fail': return val < 4.0;
          default: return true;
        }
      });
    }

    // 3. Sorting
    list.sort((a, b) => {
      const semA = Number(a.semester_number) || 0;
      const semB = Number(b.semester_number) || 0;
      const sgpaA = Number(a.sgpa) || 0;
      const sgpaB = Number(b.sgpa) || 0;
      const credA = Number(a.total_credits) || 0;
      const credB = Number(b.total_credits) || 0;

      switch (this.sortBy) {
        case 'sem_asc': return semA - semB;
        case 'sem_desc': return semB - semA;
        case 'sgpa_desc': return sgpaB - sgpaA;
        case 'sgpa_asc': return sgpaA - sgpaB;
        case 'credits_desc': return credB - credA;
        case 'credits_asc': return credA - credB;
        case 'date_desc': {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tB - tA;
        }
        case 'date_asc': {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tA - tB;
        }
        default: return 0;
      }
    });

    this.filteredSemesters = list;
    this.changeDetector.detectChanges();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterStanding = 'all';
    this.sortBy = 'sem_asc';
    this.applyFilters();
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

  getAcademicStanding(gpa: number): string {
    const val = Number(gpa);
    if (val >= 8.5) return 'Distinction';
    if (val >= 6.5) return 'First Class';
    if (val >= 5.5) return 'Second Class';
    if (val >= 4.0) return 'Pass Class';
    return 'Fail';
  }

  confirmDelete(sem: Semester): void {
    this.selectedSemesterToDelete = sem;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedSemesterToDelete = null;
  }

  executeDelete(): void {
    if (!this.selectedSemesterToDelete?.id) return;
    const id = this.selectedSemesterToDelete.id;
    this.semesterService.deleteSemester(id).subscribe({
      next: () => {
        this.notificationService.success('Semester deleted successfully');
        this.closeDeleteModal();
        this.loadSemesters();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to delete semester');
        this.closeDeleteModal();
      }
    });
  }
}
