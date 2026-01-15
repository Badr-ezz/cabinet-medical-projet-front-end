import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { MedicalContextService } from '../../../services/medical-context.service';
import { MedecinService } from '../../../services/medecin.service';

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
export class DoctorLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private contextService = inject(MedicalContextService);
  private medecinService = inject(MedecinService);

  isSidebarOpen = signal(false);
  doctorName = signal('Dr. Médecin');
  doctorSpecialty = signal('Médecin généraliste');

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

  ngOnInit() {
    this.loadDoctorInfo();
  }

  loadDoctorInfo() {
    const user = this.authService.getUser();
    if (user && user.id) {
      this.medecinService.getById(user.id).subscribe({
        next: (medecin) => {
          this.doctorName.set(`Dr. ${medecin.nom} ${medecin.prenom}`);
          this.doctorSpecialty.set(medecin.specialite || 'Médecin généraliste');
        },
        error: (err) => {
          console.error('Error loading doctor info', err);
        }
      });
    }
  }

  logout() {
    this.authService.logout();
  }
}
