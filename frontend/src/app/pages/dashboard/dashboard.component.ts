import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CgpaService } from '../../services/cgpa.service';
import { SemesterService } from '../../services/semester.service';
import { NotificationService } from '../../services/notification.service';
import { CgpaSummary, SemesterOverviewItem, GRADE_PRESETS, GradePreset } from '../../models/semester.model';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

interface CalculationResult {
  sgpa: number;
  totalCredits: number;
  totalPoints: number;
  standing: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, StatCardComponent, ConfirmModalComponent],
  template: `
    <div class="dashboard-page">
      <!-- Minimalist Header -->
      <div class="dashboard-header mb-6">
        <div>
          <h1 class="page-title">Academic Performance &amp; CGPA Calculator</h1>
          <p class="text-muted text-sm">Calculate semester SGPA, save records to MySQL, and track cumulative CGPA.</p>
        </div>
      </div>

      <!-- Overview Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <app-stat-card
          title="Overall CGPA"
          [value]="(cgpaSummary && cgpaSummary.total_semesters > 0) ? cgpaSummary.cgpa.toFixed(2) : '0.00'"
          [subtitle]="(cgpaSummary && cgpaSummary.total_semesters > 0) ? getAcademicStanding(cgpaSummary.cgpa) : 'No records found in database'"
          [badgeText]="(cgpaSummary && cgpaSummary.total_semesters > 0) ? '/ 10.0' : '0.0'"
        ></app-stat-card>

        <app-stat-card
          title="Completed Credits"
          [value]="(cgpaSummary && cgpaSummary.total_semesters > 0) ? cgpaSummary.total_completed_credits.toFixed(1) : '0.0'"
          [subtitle]="(cgpaSummary && cgpaSummary.total_semesters > 0) ? 'Total credit hours accumulated' : 'No records found'"
          badgeText="Credits"
        ></app-stat-card>

        <app-stat-card
          title="Total Semesters"
          [value]="cgpaSummary?.total_semesters || 0"
          [subtitle]="(cgpaSummary && cgpaSummary.total_semesters > 0) ? 'Persisted in database' : 'No records found'"
          badgeText="Semesters"
        ></app-stat-card>
      </div>

      <!-- INLINE CALCULATOR SECTION -->
      <div class="card mb-8" id="calculator-section">
        <div class="card-header">
          <div>
            <h3>{{ isEditMode ? 'Edit Semester Record' : 'Semester SGPA Calculator' }}</h3>
            <p class="text-muted text-sm">
              Enter course credits and grades below, then click "Calculate SGPA" to view the calculation result.
            </p>
          </div>

          <div class="header-actions">
            <button type="button" class="btn btn-outline btn-sm" (click)="resetForm()">
              {{ isEditMode ? 'Cancel Edit' : 'Reset Form' }}
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="loadSampleTemplate()" *ngIf="!isEditMode">
              Load Sample
            </button>
          </div>
        </div>

        <!-- Calculator Form -->
        <form [formGroup]="calcForm" (ngSubmit)="onCalculateClick()" class="mt-2">
          <!-- Semester Meta Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="form-group">
              <label class="form-label">Semester Number <span class="required">*</span></label>
              <input 
                type="number" 
                class="form-input" 
                formControlName="semester_number" 
                placeholder="1, 2, 3..." 
                min="1" 
                max="50"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Semester Heading / Title <span class="required">*</span></label>
              <input 
                type="text" 
                class="form-input" 
                formControlName="semester_heading" 
                placeholder="e.g. Semester 1 - Fall 2024"
              />
            </div>
          </div>

          <!-- Dynamic Subjects FormArray -->
          <div class="subjects-container" formArrayName="subjects">
            <div class="subjects-header-row">
              <span class="text-sm font-semibold">Courses List ({{ subjectsArray.length }})</span>
              <button type="button" class="btn btn-outline btn-sm" (click)="addSubject()">
                + Add Course
              </button>
            </div>

            <div 
              *ngFor="let subjectGroup of subjectsArray.controls; let i = index" 
              [formGroupName]="i"
              class="subject-item-row"
            >
              <div class="row-num font-mono text-muted">#{{ i + 1 }}</div>

              <!-- Subject Name -->
              <div class="col-name">
                <input 
                  type="text" 
                  class="form-input" 
                  formControlName="subject_name" 
                  placeholder="Course Name"
                />
              </div>

              <!-- Subject Code -->
              <div class="col-code">
                <input 
                  type="text" 
                  class="form-input font-mono" 
                  formControlName="subject_code" 
                  placeholder="Code (opt)"
                />
              </div>

              <!-- Credits -->
              <div class="col-credits">
                <input 
                  type="number" 
                  step="0.5"
                  min="0.5" 
                  max="30"
                  class="form-input font-mono" 
                  formControlName="credits" 
                  placeholder="Credits"
                />
              </div>

              <!-- Grade Preset Selector -->
              <div class="col-preset">
                <select 
                  class="form-select text-xs" 
                  (change)="onPresetChange(i, $event)"
                >
                  <option value="">Grade</option>
                  <option *ngFor="let p of gradePresets" [value]="p.gradePoint">
                    {{ p.grade.split(' ')[0] }} ({{ p.gradePoint }})
                  </option>
                </select>
              </div>

              <!-- Grade Point -->
              <div class="col-gp">
                <input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  class="form-input font-mono" 
                  formControlName="grade_point" 
                  placeholder="Point"
                />
              </div>

              <!-- Points Preview -->
              <div class="col-pts font-mono text-sm font-semibold">
                {{ getSubjectPoints(i) }}
              </div>

              <!-- Remove -->
              <button 
                type="button" 
                class="btn-remove" 
                (click)="removeSubject(i)"
                [disabled]="subjectsArray.length <= 1"
                title="Remove course"
              >
                &times;
              </button>
            </div>
          </div>

          <!-- Bottom Action Buttons: Calculate Button -->
          <div class="calc-actions-row mt-4">
            <button type="button" class="btn btn-outline btn-sm" (click)="addSubject()">
              + Add Another Course
            </button>

            <button 
              type="button" 
              class="btn btn-primary btn-lg calculate-btn" 
              (click)="onCalculateClick()"
              [disabled]="subjectsArray.length === 0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="16" height="20" x="4" y="2" rx="2"/>
                <line x1="8" x2="16" y1="6" y2="6"/>
                <line x1="16" x2="16" y1="14"/>
                <path d="M16 10h.01"/>
                <path d="M12 10h.01"/>
                <path d="M8 10h.01"/>
                <path d="M12 14h.01"/>
                <path d="M8 14h.01"/>
                <path d="M12 18h.01"/>
                <path d="M8 18h.01"/>
              </svg>
              Calculate SGPA
            </button>
          </div>
        </form>

        <!-- CALCULATION RESULT DISPLAY CARD -->
        <div *ngIf="calculationResult" class="result-card mt-6">
          <div class="result-header">
            <div>
              <span class="result-badge">Calculation Result</span>
              <h4 class="result-title">{{ calcForm.get('semester_heading')?.value || 'Semester Calculation' }}</h4>
            </div>
            <div class="result-standing-badge">
              {{ calculationResult.standing }}
            </div>
          </div>

          <div class="result-grid">
            <div class="result-metric">
              <span class="result-label">Calculated SGPA</span>
              <span class="result-value font-mono">{{ calculationResult.sgpa.toFixed(2) }}</span>
              <span class="result-sub">Out of 10.00</span>
            </div>

            <div class="result-metric">
              <span class="result-label">Total Credits</span>
              <span class="result-value font-mono">{{ calculationResult.totalCredits.toFixed(1) }}</span>
              <span class="result-sub">{{ subjectsArray.length }} Courses</span>
            </div>

            <div class="result-metric">
              <span class="result-label">Quality Points</span>
              <span class="result-value font-mono">{{ calculationResult.totalPoints.toFixed(2) }}</span>
              <span class="result-sub">&Sigma; (Credits &times; Grade Point)</span>
            </div>
          </div>

          <div class="result-footer">
            <div class="formula-text font-mono text-xs text-muted">
              SGPA = {{ calculationResult.totalPoints.toFixed(2) }} / {{ calculationResult.totalCredits.toFixed(1) }} = {{ calculationResult.sgpa.toFixed(2) }}
            </div>

            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="onSaveSemester()"
              [disabled]="isSaving || calcForm.invalid"
            >
              <div *ngIf="isSaving" class="spinner"></div>
              <span>{{ isEditMode ? 'Update Semester in Database' : 'Save Result to Database' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- SAVED SEMESTERS TABLE SECTION -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3>Saved Semester Records in Database</h3>
            <p class="text-muted text-sm">Persisted semester history stored in MySQL database.</p>
          </div>
          <span class="badge badge-neutral font-mono font-bold">
            {{ cgpaSummary?.semesters?.length || 0 }} Records
          </span>
        </div>

        <!-- Filter Controls when records exist -->
        <div class="filter-controls-row mb-4" *ngIf="!loading && cgpaSummary && cgpaSummary.semesters && cgpaSummary.semesters.length > 0">
          <input 
            type="text" 
            class="form-input search-input" 
            placeholder="Search saved records by heading, number, or grade..." 
            [(ngModel)]="historySearchQuery"
            (ngModelChange)="applyHistoryFilters()"
          />
          <div class="filter-selects-group">
            <select class="form-select filter-select" [(ngModel)]="historyFilterStanding" (ngModelChange)="applyHistoryFilters()">
              <option value="all">All Classifications</option>
              <option value="distinction">Distinction (&ge; 8.5)</option>
              <option value="first">First Class (&ge; 6.5)</option>
              <option value="second">Second Class (&ge; 5.5)</option>
              <option value="pass">Pass Class (&ge; 4.0)</option>
              <option value="fail">Fail (&lt; 4.0)</option>
            </select>
            <select class="form-select filter-select" [(ngModel)]="historySortBy" (ngModelChange)="applyHistoryFilters()">
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
              *ngIf="historySearchQuery || historyFilterStanding !== 'all' || historySortBy !== 'sem_asc'"
              type="button" 
              class="btn btn-outline btn-sm" 
              (click)="resetHistoryFilters()"
            >
              Reset
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading-box">
          <div class="spinner spinner-primary"></div>
          <span class="text-muted text-sm">Querying database...</span>
        </div>

        <div *ngIf="!loading && loadError" class="empty-state">
          <h4 class="empty-state-title">Could not load saved records</h4>
          <p class="empty-state-desc">{{ loadError }}</p>
          <button type="button" class="btn btn-secondary btn-sm" (click)="loadData()">Try again</button>
        </div>

        <!-- Explicit "No Records Found" State -->
        <div *ngIf="!loading && !loadError && (!cgpaSummary || !cgpaSummary.semesters || cgpaSummary.semesters.length === 0)" class="empty-state">
          <div class="empty-icon font-mono">&#9633;</div>
          <h4 class="empty-state-title">No records found</h4>
          <p class="empty-state-desc">
            No records found in database. Enter your courses in the calculator above, click <strong>"Calculate SGPA"</strong>, and save your calculation.
          </p>
        </div>

        <!-- Filter Empty State (Records exist, but filter matched 0) -->
        <div *ngIf="!loading && cgpaSummary && cgpaSummary.semesters && cgpaSummary.semesters.length > 0 && filteredHistorySemesters.length === 0" class="empty-state">
          <h4 class="empty-state-title">No matching records found</h4>
          <p class="empty-state-desc">No saved semester matches your current search query or filter.</p>
          <button type="button" class="btn btn-secondary btn-sm" (click)="resetHistoryFilters()">Clear Filter</button>
        </div>

        <!-- Semesters Table -->
        <div *ngIf="!loading && filteredHistorySemesters.length > 0" class="table-container">
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
              <tr *ngFor="let sem of filteredHistorySemesters">
                <td>
                  <span class="font-mono font-bold">#{{ sem.semester_number }}</span>
                </td>
                <td>
                  <span class="font-semibold">{{ sem.semester_heading }}</span>
                </td>
                <td>
                  <span class="text-muted">{{ sem.subject_count }}</span>
                </td>
                <td>
                  <span class="font-mono font-semibold">{{ sem.total_credits }}</span>
                </td>
                <td>
                  <span class="font-mono font-bold text-lg">
                    {{ sem.sgpa.toFixed(2) }}
                  </span>
                </td>
                <td>
                  <span class="badge">
                    {{ getAcademicStanding(sem.sgpa) }}
                  </span>
                </td>
                <td>
                  <span class="text-xs text-muted">{{ formatDate(sem.created_at) }}</span>
                </td>
                <td style="text-align: right;">
                  <div class="flex justify-end gap-2">
                    <button class="btn btn-secondary btn-sm" (click)="editSemesterInCalculator(sem.id)">
                      Edit
                    </button>
                    <a [routerLink]="['/semester', sem.id]" class="btn btn-outline btn-sm">
                      Details
                    </a>
                    <button class="btn btn-danger-outline btn-sm" (click)="confirmDeleteSemester(sem)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <app-confirm-modal
        [isOpen]="isDeleteModalOpen"
        title="Delete Semester Record"
        [subtitle]="'Delete ' + (selectedSemesterToDelete?.semester_heading || 'this semester') + '?'"
        confirmText="Confirm Delete"
        [isDanger]="true"
        (confirm)="executeDeleteSemester()"
        (cancel)="closeDeleteModal()"
      >
        <p>This action removes this semester and all related courses permanently from MySQL. Overall CGPA will automatically recalculate.</p>
      </app-confirm-modal>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.25rem;
    }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .subjects-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }
    .subjects-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .subject-item-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fafafa;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem 0.75rem;
    }
    .row-num {
      width: 28px;
      font-size: 0.75rem;
    }
    .col-name { flex: 3 1 180px; }
    .col-code { flex: 1 1 90px; }
    .col-credits { flex: 1 1 80px; }
    .col-preset { flex: 1.2 1 100px; }
    .col-gp { flex: 1 1 80px; }
    .col-pts {
      width: 50px;
      text-align: right;
    }
    .btn-remove {
      background: none;
      border: none;
      color: #737373;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
    }
    .btn-remove:hover:not(:disabled) {
      color: #000000;
      background: #e5e5e5;
    }
    .btn-remove:disabled {
      opacity: 0.25;
      cursor: not-allowed;
    }
    .calc-actions-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
    }
    .calculate-btn {
      font-size: 0.95rem;
      padding: 0.75rem 1.75rem;
      letter-spacing: 0.02em;
    }

    /* Result Card Styles */
    .result-card {
      background: #000000;
      color: #ffffff;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      border: 1px solid #262626;
      animation: fadeIn 0.2s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .result-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #262626;
    }
    .result-badge {
      font-size: 0.675rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #a3a3a3;
      font-weight: 700;
    }
    .result-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0.15rem;
    }
    .result-standing-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-sm);
      background: #ffffff;
      color: #000000;
      letter-spacing: 0.02em;
    }
    .result-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (min-width: 640px) {
      .result-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .result-metric {
      background: #121212;
      border: 1px solid #262626;
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .result-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #a3a3a3;
      text-transform: uppercase;
    }
    .result-value {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.1;
      margin: 0.25rem 0;
      color: #ffffff;
    }
    .result-sub {
      font-size: 0.725rem;
      color: #737373;
    }
    .result-footer {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #262626;
      padding-top: 1rem;
    }
    @media (min-width: 640px) {
      .result-footer {
        flex-direction: row;
      }
    }
    .result-footer .btn-primary {
      background: #ffffff;
      color: #000000;
      border-color: #ffffff;
    }
    .result-footer .btn-primary:hover:not(:disabled) {
      background: #e5e5e5;
      color: #000000;
    }

    .loading-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem 1rem;
    }
    .empty-icon {
      font-size: 1.5rem;
      color: #737373;
      margin-bottom: 0.5rem;
    }
    .filter-controls-row {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    @media (min-width: 768px) {
      .filter-controls-row {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
    .filter-selects-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .filter-select {
      width: 170px;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  cgpaSummary: CgpaSummary | null = null;
  loading = true;
  loadError: string | null = null;

  // History Filter state
  historySearchQuery = '';
  historyFilterStanding = 'all';
  historySortBy = 'sem_asc';
  filteredHistorySemesters: SemesterOverviewItem[] = [];

  // Calculator Form
  calcForm!: FormGroup;
  gradePresets: GradePreset[] = GRADE_PRESETS;
  calculationResult: CalculationResult | null = null;

  isSaving = false;
  isEditMode = false;
  editingSemesterId: number | null = null;

  // Delete modal
  isDeleteModalOpen = false;
  selectedSemesterToDelete: SemesterOverviewItem | null = null;

  private valueSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private cgpaService: CgpaService,
    private semesterService: SemesterService,
    private notificationService: NotificationService,
    private changeDetector: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();

    // Check if queryParam ?edit=id exists
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        const id = parseInt(params['edit'], 10);
        if (!isNaN(id)) {
          this.editSemesterInCalculator(id);
        }
      }
    });
  }

  @HostListener('window:focus')
  refreshDataOnFocus(): void {
    if (!this.loading) {
      this.loadData();
    }
  }

  ngOnDestroy(): void {
    this.valueSub?.unsubscribe();
  }

  private initForm(): void {
    this.calcForm = this.fb.group({
      semester_number: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
      semester_heading: ['Semester 1', [Validators.required, Validators.maxLength(150)]],
      subjects: this.fb.array([])
    });

    // Populate initial 4 blank subject rows if empty
    if (this.subjectsArray.length === 0) {
      for (let i = 0; i < 4; i++) {
        this.addSubject();
      }
    }

    // When form inputs change, invalidate old calculation result if any
    this.valueSub = this.calcForm.valueChanges.subscribe(() => {
      if (this.calculationResult) {
        // Automatically keep calculated result updated if already calculated
        this.calculateSGPAValues();
      }
    });
  }

  get subjectsArray(): FormArray {
    return this.calcForm.get('subjects') as FormArray;
  }

  createSubjectGroup(initial?: { name?: string; code?: string; credits?: number; grade_point?: number }): FormGroup {
    return this.fb.group({
      subject_name: [initial?.name || '', [Validators.required]],
      subject_code: [initial?.code || ''],
      credits: [initial?.credits ?? 3.0, [Validators.required, Validators.min(0.5)]],
      grade_point: [initial?.grade_point ?? 8.0, [Validators.required, Validators.min(0), Validators.max(10)]]
    });
  }

  addSubject(initial?: { name?: string; code?: string; credits?: number; grade_point?: number }): void {
    this.subjectsArray.push(this.createSubjectGroup(initial));
    if (this.calculationResult) {
      this.calculateSGPAValues();
    }
  }

  removeSubject(index: number): void {
    if (this.subjectsArray.length > 1) {
      this.subjectsArray.removeAt(index);
      if (this.calculationResult) {
        this.calculateSGPAValues();
      }
    }
  }

  onPresetChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = parseFloat(target.value);
    if (!isNaN(value)) {
      const subjectGroup = this.subjectsArray.at(index);
      subjectGroup.get('grade_point')?.setValue(value);
      if (this.calculationResult) {
        this.calculateSGPAValues();
      }
    }
  }

  getSubjectPoints(index: number): string {
    const group = this.subjectsArray.at(index);
    const cr = Number(group.get('credits')?.value) || 0;
    const gp = Number(group.get('grade_point')?.value) || 0;
    return (cr * gp).toFixed(2);
  }

  /**
   * Action when user explicitly clicks "Calculate SGPA"
   */
  onCalculateClick(): void {
    if (this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      this.notificationService.error('Please fill in required course names, credits, and grade points');
      return;
    }

    if (this.subjectsArray.length === 0) {
      this.notificationService.error('Add at least one course to calculate');
      return;
    }

    this.calculateSGPAValues();
    this.notificationService.success(`Calculation complete: SGPA is ${this.calculationResult?.sgpa.toFixed(2)}`);
  }

  private calculateSGPAValues(): void {
    const rawSubjects = this.subjectsArray.value || [];
    const local = this.cgpaService.calculateLocalSGPA(rawSubjects);
    this.calculationResult = {
      sgpa: local.sgpa,
      totalCredits: local.totalCredits,
      totalPoints: local.totalPoints,
      standing: this.getAcademicStanding(local.sgpa)
    };
  }

  resetForm(): void {
    const nextSemNum = (this.cgpaSummary?.semesters?.length || 0) + 1;
    this.calcForm.reset({
      semester_number: nextSemNum,
      semester_heading: `Semester ${nextSemNum}`
    });
    this.subjectsArray.clear();
    for (let i = 0; i < 4; i++) {
      this.addSubject();
    }
    this.calculationResult = null;
    this.isEditMode = false;
    this.editingSemesterId = null;
    this.router.navigate([], { queryParams: {} });
  }

  loadSampleTemplate(): void {
    this.calcForm.patchValue({
      semester_number: 1,
      semester_heading: 'Semester 1 - Core'
    });
    this.subjectsArray.clear();

    const samples = [
      { name: 'Engineering Mathematics', code: 'MAT101', credits: 4, grade_point: 9.0 },
      { name: 'Physics for Engineers', code: 'PHY101', credits: 4, grade_point: 8.0 },
      { name: 'Computer Programming', code: 'CSE101', credits: 3, grade_point: 10.0 },
      { name: 'Engineering Lab', code: 'LAB101', credits: 1.5, grade_point: 9.0 }
    ];

    samples.forEach(s => this.addSubject(s));
    this.calculateSGPAValues();
    this.notificationService.success('Sample courses loaded and calculated');
  }

  loadData(): void {
    this.loading = true;
    this.loadError = null;
    this.cgpaService.getOverallCGPA().subscribe({
      next: (res) => {
        this.cgpaSummary = res.data;
        this.loading = false;
        // If not editing, set semester_number to next sequential semester
        if (!this.isEditMode && (!this.calcForm.get('semester_number')?.value || this.calcForm.get('semester_number')?.value === 1)) {
          const next = (res.data.semesters?.length || 0) + 1;
          this.calcForm.patchValue({
            semester_number: next,
            semester_heading: `Semester ${next}`
          });
        }
        this.applyHistoryFilters();
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        console.error('Failed loading CGPA data', err);
        this.loadError = err.error?.message || 'Check that the server is available, then try again.';
        this.loading = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  applyHistoryFilters(): void {
    let list = [...(this.cgpaSummary?.semesters || [])].map(s => ({
      ...s,
      semester_number: Number(s.semester_number),
      sgpa: Number(s.sgpa),
      total_credits: Number(s.total_credits)
    }));

    if (this.historySearchQuery && this.historySearchQuery.trim()) {
      const q = this.historySearchQuery.toLowerCase().trim();
      list = list.filter(s => {
        const headingMatch = (s.semester_heading || '').toLowerCase().includes(q);
        const numberMatch = String(s.semester_number).includes(q) || `sem ${s.semester_number}`.includes(q) || `semester ${s.semester_number}`.includes(q);
        const standingMatch = this.getAcademicStanding(s.sgpa).toLowerCase().includes(q);
        const sgpaMatch = s.sgpa.toFixed(2).includes(q);
        return headingMatch || numberMatch || standingMatch || sgpaMatch;
      });
    }

    if (this.historyFilterStanding && this.historyFilterStanding !== 'all') {
      list = list.filter(s => {
        const val = Number(s.sgpa);
        switch (this.historyFilterStanding) {
          case 'distinction': return val >= 8.5;
          case 'first': return val >= 6.5 && val < 8.5;
          case 'second': return val >= 5.5 && val < 6.5;
          case 'pass': return val >= 4.0 && val < 5.5;
          case 'fail': return val < 4.0;
          default: return true;
        }
      });
    }

    list.sort((a, b) => {
      const semA = Number(a.semester_number) || 0;
      const semB = Number(b.semester_number) || 0;
      const sgpaA = Number(a.sgpa) || 0;
      const sgpaB = Number(b.sgpa) || 0;
      const credA = Number(a.total_credits) || 0;
      const credB = Number(b.total_credits) || 0;

      switch (this.historySortBy) {
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

    this.filteredHistorySemesters = list;
    this.changeDetector.detectChanges();
  }

  resetHistoryFilters(): void {
    this.historySearchQuery = '';
    this.historyFilterStanding = 'all';
    this.historySortBy = 'sem_asc';
    this.applyHistoryFilters();
  }

  editSemesterInCalculator(id: number): void {
    this.semesterService.getSemesterById(id).subscribe({
      next: (res) => {
        const sem = res.data;
        this.isEditMode = true;
        this.editingSemesterId = id;

        this.calcForm.patchValue({
          semester_number: sem.semester_number,
          semester_heading: sem.semester_heading
        });

        this.subjectsArray.clear();
        if (sem.subjects && sem.subjects.length > 0) {
          sem.subjects.forEach(sub => {
            this.addSubject({
              name: sub.subject_name,
              code: sub.subject_code || '',
              credits: sub.credits,
              grade_point: sub.grade_point
            });
          });
        } else {
          this.addSubject();
        }

        this.calculateSGPAValues();

        // Scroll up to calculator
        document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
        this.notificationService.info(`Loaded ${sem.semester_heading} for editing`);
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to load semester for editing');
      }
    });
  }

  onSaveSemester(): void {
    if (this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      this.notificationService.error('Please fill required course fields');
      return;
    }

    this.isSaving = true;
    const formVal = this.calcForm.value;

    const payload = {
      semester_number: Number(formVal.semester_number),
      semester_heading: formVal.semester_heading.trim(),
      subjects: formVal.subjects.map((s: any) => ({
        subject_name: s.subject_name.trim(),
        subject_code: s.subject_code ? s.subject_code.trim() : null,
        credits: Number(s.credits),
        grade_point: Number(s.grade_point)
      }))
    };

    if (this.isEditMode && this.editingSemesterId) {
      this.semesterService.updateSemester(this.editingSemesterId, payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.notificationService.success(`Semester updated! SGPA: ${res.data.sgpa.toFixed(2)}`);
          this.resetForm();
          this.loadData();
        },
        error: (err) => {
          this.isSaving = false;
          this.notificationService.error(err.error?.message || 'Failed to update semester');
        }
      });
    } else {
      this.semesterService.createSemester(payload).subscribe({
        next: (res) => {
          this.isSaving = false;
          this.notificationService.success(`Semester saved! SGPA: ${res.data.sgpa.toFixed(2)}`);
          this.resetForm();
          this.loadData();
        },
        error: (err) => {
          this.isSaving = false;
          this.notificationService.error(err.error?.message || 'Failed to save semester');
        }
      });
    }
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

  confirmDeleteSemester(sem: SemesterOverviewItem): void {
    this.selectedSemesterToDelete = sem;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedSemesterToDelete = null;
  }

  executeDeleteSemester(): void {
    if (!this.selectedSemesterToDelete) return;

    const id = this.selectedSemesterToDelete.id;
    this.semesterService.deleteSemester(id).subscribe({
      next: () => {
        this.notificationService.success('Semester deleted successfully');
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to delete semester');
        this.closeDeleteModal();
      }
    });
  }
}
