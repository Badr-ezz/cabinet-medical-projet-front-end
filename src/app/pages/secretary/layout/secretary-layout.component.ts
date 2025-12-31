import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
  // Signal pour l'état de la sidebar sur mobile
  isSidebarOpen = signal(false);

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
}
