import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HistoryComponent } from './pages/history/history.component';
import { SemesterDetailComponent } from './pages/semester-detail/semester-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard & Calculator' },
  { path: 'calculator', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'history', component: HistoryComponent, title: 'Saved Semesters' },
  { path: 'semester/:id', component: SemesterDetailComponent, title: 'Semester Details' },
  { path: '**', redirectTo: 'dashboard' }
];
