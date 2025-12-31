import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SecretaryLayoutComponent } from './pages/secretary/layout/secretary-layout.component';
import { DashboardComponent } from './pages/secretary/dashboard/dashboard.component';
import { PatientsComponent } from './pages/secretary/patients/patients.component';
import { AppointmentsComponent } from './pages/secretary/appointments/appointments.component';
import { BillingComponent } from './pages/secretary/billing/billing.component';
import { WaitingListComponent } from './pages/secretary/waiting-list/waiting-list.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { 
    path: 'secretary', 
    component: SecretaryLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'waiting-list', component: WaitingListComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
