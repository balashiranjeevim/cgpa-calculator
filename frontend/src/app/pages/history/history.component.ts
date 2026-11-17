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
          <h1 class="page-title">Saved Semesters</h1>
          <p class="text-muted text-sm">Historical archive of semesters stored in MySQL.</p>
        </div>

        <div class="header-actions">
          <a routerLink="/dashboard" class="btn btn-primary btn-sm">
            &larr; Back to Dashboard
          </a>
        </div>
      </div>

      <!-- Search & Sort Filter -->
      <div class="card mb-6 filter-card">
        <div class="filter-controls">
          <input 
            type="text" 
            class="form-input search-input" 
            placeholder="Search by semester heading or number..." 
            [(ngModel)]="searchQuery"
            (input)="applyFilters()"
          />

          <select class="form-select sort-select" [(ngModel)]="sortBy" (change)="applyFilters()">
            <option value="sem_asc">Semester (1 &rarr; N)</option>
            <option value="sem_desc">Semester (N &rarr; 1)</option>
            <option value="sgpa_desc">Highest SGPA</option>
            <option value="sgpa_asc">Lowest SGPA</option>
            <option value="credits_desc">Most Credits</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-box">
        <div class="spinner spinner-primary"></div>
        <span class="text-muted text-sm">Loading records...</span>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredSemesters.length === 0" class="empty-state">
        <h4 class="empty-state-title">No matching semesters found</h4>
        <p class="empty-state-desc">No records found matching your search criteria.</p>
        <button *ngIf="searchQuery" class="btn btn-secondary btn-sm" (click)="resetSearch()">
          Clear Filter
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
      padding: 0.85rem 1.25rem;
    }
    .filter-controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    @media (min-width: 640px) {
      .filter-controls {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
    .search-input {
      flex: 1;
      max-width: 440px;
    }
    .sort-select {
      width: 190px;
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
        this.semesters = res.data || [];
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

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        s.semester_heading.toLowerCase().includes(q) ||
        String(s.semester_number).includes(q)
      );
    }

    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'sem_asc': return a.semester_number - b.semester_number;
        case 'sem_desc': return b.semester_number - a.semester_number;
        case 'sgpa_desc': return b.sgpa - a.sgpa;
        case 'sgpa_asc': return a.sgpa - b.sgpa;
        case 'credits_desc': return b.total_credits - a.total_credits;
        default: return 0;
      }
    });

    this.filteredSemesters = list;
  }

  resetSearch(): void {
    this.searchQuery = '';
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
    if (gpa >= 8.5) return 'Distinction';
    if (gpa >= 6.5) return 'First Class';
    if (gpa >= 5.5) return 'Second Class';
    if (gpa >= 4.0) return 'Pass Class';
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
