import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  
  isSidebarOpen = signal(false);
  
  menuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Cabinets', icon: 'cabinets', route: '/admin/cabinets' },
    { label: 'Utilisateurs', icon: 'users', route: '/admin/users' },
    { label: 'Médicaments', icon: 'medications', route: '/admin/medications' },
    { label: 'Paramètres', icon: 'settings', route: '/admin/settings' }
  ]);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
