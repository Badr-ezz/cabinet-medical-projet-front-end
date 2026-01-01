import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  appInfo = signal({
    version: '2.4.1',
    buildDate: '2025-12-28',
    environment: 'Production'
  });

  services = signal([
    { name: 'Base de données', status: 'online', latency: '12ms' },
    { name: 'Serveur d\'authentification', status: 'online', latency: '8ms' },
    { name: 'Service de notifications', status: 'online', latency: '15ms' },
    { name: 'Stockage fichiers', status: 'online', latency: '25ms' },
    { name: 'Service d\'emails', status: 'warning', latency: '120ms' },
    { name: 'Backup automatique', status: 'online', latency: '---' }
  ]);

  systemInfo = signal([
    { label: 'Serveur', value: 'Ubuntu 22.04 LTS' },
    { label: 'CPU', value: '4 cores / 25% utilisé' },
    { label: 'Mémoire', value: '8 GB / 4.2 GB utilisé' },
    { label: 'Disque', value: '100 GB / 45 GB utilisé' },
    { label: 'Dernière sauvegarde', value: 'Aujourd\'hui à 03:00' },
    { label: 'Uptime', value: '45 jours, 12 heures' }
  ]);

  getStatusClass(status: string): string {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'online': return 'En ligne';
      case 'warning': return 'Lent';
      case 'offline': return 'Hors ligne';
      default: return status;
    }
  }
}
