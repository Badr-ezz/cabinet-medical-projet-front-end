import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SecretaryLayoutComponent } from './pages/secretary/layout/secretary-layout.component';
import { DashboardComponent } from './pages/secretary/dashboard/dashboard.component';
import { PatientsComponent } from './pages/secretary/patients/patients.component';
import { AppointmentsComponent } from './pages/secretary/appointments/appointments.component';
import { BillingComponent } from './pages/secretary/billing/billing.component';
import { WaitingListComponent } from './pages/secretary/waiting-list/waiting-list.component';

// Doctor imports
import { DoctorLayoutComponent } from './pages/doctor/layout/doctor-layout.component';
import { DoctorDashboardComponent } from './pages/doctor/dashboard/dashboard.component';
import { DoctorPatientsComponent } from './pages/doctor/patients/patients.component';
import { PatientProfileComponent } from './pages/doctor/patient-profile/patient-profile.component';
import { ConsultationComponent } from './pages/doctor/consultation/consultation.component';
import { MedicalRecordComponent } from './pages/doctor/medical-record/medical-record.component';
import { PrescriptionsComponent } from './pages/doctor/prescriptions/prescriptions.component';

// Admin imports
import { AdminLayoutComponent } from './pages/admin/layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { CabinetsComponent } from './pages/admin/cabinets/cabinets.component';
import { UsersComponent } from './pages/admin/users/users.component';
import { MedicationsComponent } from './pages/admin/medications/medications.component';
import { SettingsComponent } from './pages/admin/settings/settings.component';

// Guard import
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Routes publiques (pas de guard)
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // Routes protégées (nécessitent authentification)
  {
    path: 'secretary',
    component: SecretaryLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'waiting-list', component: WaitingListComponent }
    ]
  },
  {
    path: 'doctor',
    component: DoctorLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DoctorDashboardComponent },
      { path: 'patients', component: DoctorPatientsComponent },
      { path: 'patient/:id', component: PatientProfileComponent },
      { path: 'consultation', component: ConsultationComponent },
      { path: 'consultations-list', loadComponent: () => import('./pages/doctor/consultation-list/consultation-list.component').then(m => m.ConsultationListComponent) },
      { path: 'medical-record', component: MedicalRecordComponent },
      { path: 'medical-record/:id', component: MedicalRecordComponent },
      { path: 'prescriptions', component: PrescriptionsComponent }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'cabinets', component: CabinetsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'medications', component: MedicationsComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
