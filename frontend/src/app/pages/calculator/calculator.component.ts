import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { SemesterService } from '../../services/semester.service';
import { CgpaService } from '../../services/cgpa.service';
import { NotificationService } from '../../services/notification.service';
import { GRADE_PRESETS, GradePreset } from '../../models/semester.model';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="calculator-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <a routerLink="/dashboard">Dashboard</a> &rsaquo; 
            <span>{{ isEditMode ? 'Edit Semester' : 'SGPA / CGPA Calculator' }}</span>
          </div>
          <h1>{{ isEditMode ? 'Edit Semester Record' : 'Semester SGPA Calculator' }}</h1>
          <p class="text-muted text-sm">
            Enter semester details and subjects. SGPA and credit-weighted points update in real-time as you type.
          </p>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-secondary" (click)="resetForm()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset Form
          </button>
          <button type="button" class="btn btn-outline" (click)="loadSampleSubjects()" *ngIf="!isEditMode">
            Load Template
          </button>
        </div>
      </div>

      <!-- Live Calculation Floating Summary Card -->
      <div class="live-summary-card">
        <div class="live-metric">
          <span class="live-label">Calculated SGPA</span>
          <span class="live-value sgpa-glow font-mono">{{ liveCalculation.sgpa.toFixed(2) }}</span>
          <span class="live-hint">Σ (Credits &times; Grade Point) / Σ Credits</span>
        </div>
        <div class="live-divider"></div>
        <div class="live-metric">
          <span class="live-label">Total Credits</span>
          <span class="live-value font-mono">{{ liveCalculation.totalCredits.toFixed(1) }}</span>
          <span class="live-hint">{{ subjectsArray.length }} Subjects added</span>
        </div>
        <div class="live-divider"></div>
        <div class="live-metric">
          <span class="live-label">Quality Points</span>
          <span class="live-value font-mono">{{ liveCalculation.totalPoints.toFixed(2) }}</span>
          <span class="live-hint">Σ Credit Points Earned</span>
        </div>
      </div>

      <!-- Main Form -->
      <form [formGroup]="calcForm" (ngSubmit)="onSubmit()" class="form-container">
        <!-- Semester Metadata Section -->
        <div class="card mb-6">
          <div class="card-header">
            <h3>Semester Information</h3>
            <span class="badge badge-primary">Details</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label" for="semester_number">
                Semester Number <span class="required">*</span>
              </label>
              <input 
                id="semester_number"
                type="number" 
                class="form-input" 
                formControlName="semester_number" 
                placeholder="e.g. 1, 2, 3..."
                min="1"
                max="50"
                [class.is-invalid]="hasError('semester_number')"
              />
              <span *ngIf="hasError('semester_number')" class="form-error">
                Please enter a valid semester number (1 - 50).
              </span>
            </div>

            <div class="form-group">
              <label class="form-label" for="semester_heading">
                Semester Heading / Label <span class="required">*</span>
              </label>
              <input 
                id="semester_heading"
                type="text" 
                class="form-input" 
                formControlName="semester_heading" 
                placeholder="e.g. Semester 1 - Fall 2024"
                [class.is-invalid]="hasError('semester_heading')"
              />
              <span *ngIf="hasError('semester_heading')" class="form-error">
                Semester heading is required (max 150 characters).
              </span>
            </div>
          </div>
        </div>

        <!-- Subjects Dynamic Array Section -->
        <div class="card mb-6">
          <div class="card-header">
            <div>
              <h3>Subjects &amp; Grade Points</h3>
              <p class="text-muted text-sm">Add each course with its credit value and obtained grade point.</p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" (click)="addSubject()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Subject
            </button>
          </div>

          <!-- Empty subjects warning -->
          <div *ngIf="subjectsArray.length === 0" class="empty-state">
            <p class="empty-state-desc">No subjects added yet. Click below to add your first subject.</p>
            <button type="button" class="btn btn-primary" (click)="addSubject()">
              + Add First Subject
            </button>
          </div>

          <!-- Subjects List -->
          <div class="subjects-list" formArrayName="subjects">
            <div 
              *ngFor="let subjectGroup of subjectsArray.controls; let i = index" 
              [formGroupName]="i"
              class="subject-row-card"
            >
              <div class="subject-row-header">
                <span class="subject-index-badge">#{{ i + 1 }}</span>
                <span class="subject-row-title font-semibold">
                  {{ subjectGroup.get('subject_name')?.value || 'Subject ' + (i + 1) }}
                </span>
                <button 
                  type="button" 
                  class="btn-remove" 
                  (click)="removeSubject(i)"
                  [disabled]="subjectsArray.length <= 1"
                  title="Remove this subject"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div class="subject-row-grid">
                <!-- Subject Name -->
                <div class="form-group flex-2">
                  <label class="form-label">Course Name <span class="required">*</span></label>
                  <input 
                    type="text" 
                    class="form-input" 
                    formControlName="subject_name" 
                    placeholder="e.g. Data Structures"
                    [class.is-invalid]="isSubjectInvalid(i, 'subject_name')"
                  />
                  <span *ngIf="isSubjectInvalid(i, 'subject_name')" class="form-error">
                    Course name is required
                  </span>
                </div>

                <!-- Subject Code -->
                <div class="form-group flex-1">
                  <label class="form-label">Code (Optional)</label>
                  <input 
                    type="text" 
                    class="form-input" 
                    formControlName="subject_code" 
                    placeholder="e.g. CS201"
                  />
                </div>

                <!-- Credits -->
                <div class="form-group flex-1">
                  <label class="form-label">Credits <span class="required">*</span></label>
                  <input 
                    type="number" 
                    step="0.5"
                    min="0.5"
                    max="30"
                    class="form-input" 
                    formControlName="credits" 
                    placeholder="e.g. 4.0"
                    [class.is-invalid]="isSubjectInvalid(i, 'credits')"
                  />
                  <span *ngIf="isSubjectInvalid(i, 'credits')" class="form-error">
                    Credits > 0
                  </span>
                </div>

                <!-- Grade Preset Selector -->
                <div class="form-group flex-1">
                  <label class="form-label">Letter Grade</label>
                  <select 
                    class="form-select" 
                    (change)="onGradePresetChange(i, $event)"
                  >
                    <option value="">Select Grade</option>
                    <option *ngFor="let preset of gradePresets" [value]="preset.gradePoint">
                      {{ preset.grade }} ({{ preset.gradePoint }})
                    </option>
                  </select>
                </div>

                <!-- Grade Point Numeric -->
                <div class="form-group flex-1">
                  <label class="form-label">Grade Point (0-10) <span class="required">*</span></label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="10"
                    class="form-input" 
                    formControlName="grade_point" 
                    placeholder="10.0"
                    [class.is-invalid]="isSubjectInvalid(i, 'grade_point')"
                  />
                  <span *ngIf="isSubjectInvalid(i, 'grade_point')" class="form-error">
                    0 to 10
                  </span>
                </div>

                <!-- Row Calculated Points Preview -->
                <div class="form-group flex-auto points-preview">
                  <label class="form-label">Points</label>
                  <div class="points-pill font-mono">
                    {{ getRowPoints(i) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Add Subject Row -->
          <div class="mt-4 flex justify-between items-center">
            <button type="button" class="btn btn-outline" (click)="addSubject()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Another Subject
            </button>
            <span class="text-sm text-muted">
              {{ subjectsArray.length }} subject(s) in this semester
            </span>
          </div>
        </div>

        <!-- Submit & Actions Bar -->
        <div class="form-actions-card">
          <div class="actions-info">
            <span class="font-semibold">Ready to save?</span>
            <span class="text-sm text-muted">Records are stored permanently in MySQL database.</span>
          </div>

          <div class="actions-buttons">
            <a routerLink="/history" class="btn btn-secondary">
              Cancel
            </a>
            <button 
              type="submit" 
              class="btn btn-primary btn-lg" 
              [disabled]="isSubmitting || calcForm.invalid || subjectsArray.length === 0"
            >
              <div *ngIf="isSubmitting" class="spinner"></div>
              <svg *ngIf="!isSubmitting" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {{ isEditMode ? 'Update Semester Record' : 'Save Semester to Database' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .calculator-page {
      display: flex;
      flex-direction: column;
    }
    .page-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    @media (min-width: 768px) {
      .page-header {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }
    .breadcrumb {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.35rem;
    }
    .breadcrumb a {
      color: var(--primary);
      text-decoration: none;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .live-summary-card {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: var(--shadow-lg);
      border: 1px solid #334155;
    }
    @media (min-width: 640px) {
      .live-summary-card {
        flex-direction: row;
        align-items: center;
        justify-content: space-around;
      }
    }
    .live-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .live-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      font-weight: 600;
    }
    .live-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      margin: 0.25rem 0;
    }
    .sgpa-glow {
      color: #38bdf8;
      text-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
    }
    .live-hint {
      font-size: 0.75rem;
      color: #64748b;
    }
    .live-divider {
      width: 1px;
      height: 60px;
      background: #334155;
      display: none;
    }
    @media (min-width: 640px) {
      .live-divider {
        display: block;
      }
    }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 1rem; }
    .subjects-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .subject-row-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      transition: all 0.15s ease;
    }
    .subject-row-card:hover {
      border-color: #cbd5e1;
      background: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .subject-row-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #edf2f7;
    }
    .subject-index-badge {
      font-size: 0.75rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #475569;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .subject-row-title {
      flex: 1;
      font-size: 0.95rem;
      color: #1e293b;
    }
    .btn-remove {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      transition: all 0.15s ease;
    }
    .btn-remove:hover:not(:disabled) {
      color: var(--danger);
      background: var(--danger-light);
    }
    .btn-remove:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .subject-row-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .flex-2 { flex: 2 1 200px; }
    .flex-1 { flex: 1 1 120px; }
    .flex-auto { flex: 0 0 90px; }
    .points-preview {
      display: flex;
      flex-direction: column;
    }
    .points-pill {
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary);
      text-align: center;
    }
    .form-actions-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }
    @media (min-width: 640px) {
      .form-actions-card {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }
    .actions-info {
      display: flex;
      flex-direction: column;
    }
    .actions-buttons {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  `]
})
export class CalculatorComponent implements OnInit, OnDestroy {
  calcForm!: FormGroup;
  gradePresets: GradePreset[] = GRADE_PRESETS;
  liveCalculation = { sgpa: 0, totalCredits: 0, totalPoints: 0 };

  isSubmitting = false;
  isEditMode = false;
  editingSemesterId: number | null = null;

  private valueChangesSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private semesterService: SemesterService,
    private cgpaService: CgpaService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Check if query param ?edit=id exists
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        const id = parseInt(params['edit'], 10);
        if (!isNaN(id)) {
          this.isEditMode = true;
          this.editingSemesterId = id;
          this.loadExistingSemester(id);
        }
      } else {
        // If brand new, add 4 initial blank subjects
        if (this.subjectsArray.length === 0) {
          for (let i = 0; i < 4; i++) {
            this.addSubject();
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.valueChangesSub?.unsubscribe();
  }

  private initForm(): void {
    this.calcForm = this.fb.group({
      semester_number: [1, [Validators.required, Validators.min(1), Validators.max(50)]],
      semester_heading: ['Semester 1', [Validators.required, Validators.maxLength(150)]],
      subjects: this.fb.array([])
    });

    // Subscribe to form value changes to calculate live SGPA
    this.valueChangesSub = this.calcForm.valueChanges.subscribe(() => {
      this.recalculateLive();
    });
  }

  get subjectsArray(): FormArray {
    return this.calcForm.get('subjects') as FormArray;
  }

  createSubjectGroup(initial?: { name?: string; code?: string; credits?: number; grade_point?: number }): FormGroup {
    return this.fb.group({
      subject_name: [initial?.name || '', [Validators.required, Validators.maxLength(150)]],
      subject_code: [initial?.code || '', [Validators.maxLength(50)]],
      credits: [initial?.credits ?? 3.0, [Validators.required, Validators.min(0.5), Validators.max(30)]],
      grade_point: [initial?.grade_point ?? 8.0, [Validators.required, Validators.min(0), Validators.max(10)]]
    });
  }

  addSubject(initial?: { name?: string; code?: string; credits?: number; grade_point?: number }): void {
    this.subjectsArray.push(this.createSubjectGroup(initial));
    this.recalculateLive();
  }

  removeSubject(index: number): void {
    if (this.subjectsArray.length > 1) {
      this.subjectsArray.removeAt(index);
      this.recalculateLive();
    }
  }

  onGradePresetChange(index: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = parseFloat(target.value);
    if (!isNaN(value)) {
      const subjectGroup = this.subjectsArray.at(index);
      subjectGroup.get('grade_point')?.setValue(value);
      this.recalculateLive();
    }
  }

  getRowPoints(index: number): string {
    const group = this.subjectsArray.at(index);
    const cr = Number(group.get('credits')?.value) || 0;
    const gp = Number(group.get('grade_point')?.value) || 0;
    return (cr * gp).toFixed(2);
  }

  recalculateLive(): void {
    const rawSubjects = this.subjectsArray.value || [];
    this.liveCalculation = this.cgpaService.calculateLocalSGPA(rawSubjects);
  }

  hasError(field: string): boolean {
    const control = this.calcForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isSubjectInvalid(index: number, field: string): boolean {
    const subjectGroup = this.subjectsArray.at(index);
    const control = subjectGroup.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  resetForm(): void {
    this.calcForm.reset({
      semester_number: 1,
      semester_heading: 'Semester 1'
    });
    this.subjectsArray.clear();
    for (let i = 0; i < 4; i++) {
      this.addSubject();
    }
    this.isEditMode = false;
    this.editingSemesterId = null;
    this.router.navigate(['/calculator']);
    this.notificationService.info('Form has been reset');
  }

  loadSampleSubjects(): void {
    this.calcForm.patchValue({
      semester_number: 1,
      semester_heading: 'Semester 1 - Fall 2024'
    });
    this.subjectsArray.clear();

    const samples = [
      { name: 'Engineering Mathematics I', code: 'MAT101', credits: 4, grade_point: 9.0 },
      { name: 'Physics for Engineers', code: 'PHY101', credits: 4, grade_point: 8.0 },
      { name: 'Programming in C', code: 'CSE101', credits: 3, grade_point: 10.0 },
      { name: 'Basic Electrical Engineering', code: 'EEE101', credits: 3, grade_point: 8.0 },
      { name: 'Engineering Physics Lab', code: 'PHY102', credits: 1.5, grade_point: 9.0 }
    ];

    samples.forEach(s => this.addSubject(s));
    this.notificationService.success('Loaded standard academic template');
  }

  loadExistingSemester(id: number): void {
    this.semesterService.getSemesterById(id).subscribe({
      next: (res) => {
        const sem = res.data;
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

        this.recalculateLive();
        this.notificationService.info(`Loaded ${sem.semester_heading} for editing`);
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Failed to load semester for editing');
        this.router.navigate(['/history']);
      }
    });
  }

  onSubmit(): void {
    if (this.calcForm.invalid) {
      this.calcForm.markAllAsTouched();
      this.notificationService.error('Please fix validation errors in the form');
      return;
    }

    if (this.subjectsArray.length === 0) {
      this.notificationService.error('At least one subject is required to save');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.calcForm.value;

    const payload = {
      semester_number: Number(formValue.semester_number),
      semester_heading: formValue.semester_heading.trim(),
      subjects: formValue.subjects.map((s: any) => ({
        subject_name: s.subject_name.trim(),
        subject_code: s.subject_code ? s.subject_code.trim() : null,
        credits: Number(s.credits),
        grade_point: Number(s.grade_point)
      }))
    };

    if (this.isEditMode && this.editingSemesterId) {
      this.semesterService.updateSemester(this.editingSemesterId, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notificationService.success(`Semester updated! SGPA: ${res.data.sgpa.toFixed(2)}`);
          this.router.navigate(['/semester', this.editingSemesterId]);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notificationService.error(err.error?.message || 'Failed to update semester');
        }
      });
    } else {
      this.semesterService.createSemester(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notificationService.success(`Semester saved! SGPA: ${res.data.sgpa.toFixed(2)}`);
          this.router.navigate(['/semester', res.data.id]);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.notificationService.error(err.error?.message || 'Failed to save semester');
        }
      });
    }
  }
}
