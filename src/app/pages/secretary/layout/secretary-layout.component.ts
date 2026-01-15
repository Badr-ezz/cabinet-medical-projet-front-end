import { Component, signal, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-secretary-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './secretary-layout.component.html'
})
export class SecretaryLayoutComponent {
  private authService = inject(AuthService);
  
  // Signal pour l'état de la sidebar sur mobile
  isSidebarOpen = signal(false);

  // Informations utilisateur connecté
  userName = computed(() => this.authService.getUserFullName());
  userInitials = computed(() => this.authService.getUserInitials());
  userRole = computed(() => this.authService.getRoleLabel());

  // Menu items de la sidebar
  menuItems = signal<MenuItem[]>([
    { label: 'Tableau de bord', icon: 'dashboard', route: '/secretary/dashboard' },
    { label: 'Patients', icon: 'patients', route: '/secretary/patients' },
    { label: 'Rendez-vous', icon: 'appointments', route: '/secretary/appointments' },
    { label: 'Facturation', icon: 'billing', route: '/secretary/billing' },
    { label: 'Liste d\'attente', icon: 'waiting', route: '/secretary/waiting-list' }
  ]);

  toggleSidebar() {
    this.isSidebarOpen.update(value => !value);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  logout() {
    this.authService.logout();
  }
}
