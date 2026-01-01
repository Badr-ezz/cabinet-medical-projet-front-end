import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './doctor-layout.component.html'
})
export class DoctorLayoutComponent {
  isSidebarOpen = signal(false);
  
  menuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: 'dashboard', route: '/doctor/dashboard' },
    { label: 'Patients', icon: 'patients', route: '/doctor/patients' },
    { label: 'Consultation en cours', icon: 'consultation', route: '/doctor/consultation' },
    { label: 'Dossier médical', icon: 'medical-record', route: '/doctor/medical-record' },
    { label: 'Ordonnances', icon: 'prescriptions', route: '/doctor/prescriptions' }
  ]);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    console.log('Déconnexion...');
    // Navigation vers login (visuel uniquement)
  }
}
