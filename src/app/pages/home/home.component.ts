import { Component, signal } from '@angular/core';

// Interface pour les valeurs du cabinet
interface CabinetValue {
  icon: string;
  title: string;
  description: string;
}

// Interface pour les informations de contact
interface ContactInfo {
  icon: string;
  title: string;
  lines: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  // Signals pour les données statiques (démo)
  cabinetName = signal('Cabinet Médical');
  heroSubtitle = signal('Soins et Confiance');
  
  // Signal pour les valeurs du cabinet
  values = signal<CabinetValue[]>([
    {
      icon: 'shield',
      title: 'Professionnalisme',
      description: 'Une équipe de médecins qualifiés et expérimentés à votre service pour des diagnostics précis.'
    },
    {
      icon: 'heart',
      title: 'Confiance',
      description: 'Un accompagnement personnalisé dans une relation de confiance et de respect mutuel.'
    },
    {
      icon: 'clipboard',
      title: 'Suivi Médical',
      description: 'Un suivi régulier et attentif de votre état de santé pour une prise en charge optimale.'
    }
  ]);

  // Signal pour les informations de contact
  contactInfos = signal<ContactInfo[]>([
    {
      icon: 'clock',
      title: 'Horaires',
      lines: ['Lundi - Vendredi : 8h00 - 19h00', 'Samedi : 9h00 - 13h00', 'Dimanche : Fermé']
    },
    {
      icon: 'location',
      title: 'Adresse',
      lines: ['123 Avenue de la Santé', '75001 Paris', 'France']
    },
    {
      icon: 'phone',
      title: 'Contact',
      lines: ['Tél : 01 23 45 67 89', 'Email : contact@cabinet-medical.fr']
    }
  ]);
}
