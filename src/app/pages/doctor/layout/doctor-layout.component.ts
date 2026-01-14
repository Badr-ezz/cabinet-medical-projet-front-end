import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { MedicalContextService } from '../../../services/medical-context.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule], // Need CommonModule/NgClass for dropdown
  templateUrl: './doctor-layout.component.html'
})
export class DoctorLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private contextService = inject(MedicalContextService);

  isSidebarOpen = signal(false);

  menuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: 'dashboard', route: '/doctor/dashboard' },
    { label: 'Patients', icon: 'patients', route: '/doctor/patients' },
    { label: 'Consultations', icon: 'consultation', route: '/doctor/consultations-list' },
    { label: 'Dossier Médical en cours', icon: 'medical-record', route: 'medical-record-context' }
  ]);

  toggleSubMenu(item: MenuItem) {
    if (item.children) {
      item.isOpen = !item.isOpen;
      // Force update for signals if object mutation isn't detected deep
      this.menuItems.update(items => [...items]);
    }
  }

  handleNavigation(route: string) {
    if (route === 'medical-record-context') {
      const patientId = this.contextService.getPatientId();
      if (patientId) {
        this.router.navigate(['/doctor/medical-record', patientId]);
      } else {
        alert('Aucun dossier patient ouvert actuellement. Veuillez sélectionner un patient.');
        this.router.navigate(['/doctor/patients']);
      }
    } else {
      this.router.navigate([route]);
    }
    this.isSidebarOpen.set(false);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
