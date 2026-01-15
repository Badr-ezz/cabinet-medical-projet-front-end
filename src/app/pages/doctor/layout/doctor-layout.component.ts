import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

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
  private authService = inject(AuthService);
  
  isSidebarOpen = signal(false);

  // Informations utilisateur connecté
  userName = computed(() => {
    const fullName = this.authService.getUserFullName();
    // Ajouter "Dr." si c'est un médecin
    return this.authService.getUserRole() === 'MEDECIN' ? `Dr. ${fullName}` : fullName;
  });
  userInitials = computed(() => this.authService.getUserInitials());
  userRole = computed(() => this.authService.getRoleLabel());
  
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
    this.authService.logout();
  }
}
