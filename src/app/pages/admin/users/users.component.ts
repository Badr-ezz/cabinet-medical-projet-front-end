import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  nom: string;
  prenom: string;
  role: 'Médecin' | 'Secrétaire' | 'Admin';
  telephone: string;
  cabinet: string;
  status: 'active' | 'inactive';
}

interface Cabinet {
  id: number;
  nom: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent {
  showModal = signal(false);
  selectedCabinet = signal('');

  cabinets = signal<Cabinet[]>([
    { id: 1, nom: 'Cabinet Médical Casablanca' },
    { id: 2, nom: 'Cabinet Dentaire Rabat' },
    { id: 3, nom: 'Cabinet Pédiatrie Marrakech' },
    { id: 4, nom: 'Cabinet Médical Fès' },
    { id: 5, nom: 'Cabinet Cardiologie Tanger' }
  ]);

  users = signal<User[]>([
    { id: 1, nom: 'Alami', prenom: 'Mohammed', role: 'Médecin', telephone: '0661234567', cabinet: 'Cabinet Médical Casablanca', status: 'active' },
    { id: 2, nom: 'Bennani', prenom: 'Fatima', role: 'Secrétaire', telephone: '0662345678', cabinet: 'Cabinet Médical Casablanca', status: 'active' },
    { id: 3, nom: 'Tazi', prenom: 'Karim', role: 'Médecin', telephone: '0663456789', cabinet: 'Cabinet Dentaire Rabat', status: 'active' },
    { id: 4, nom: 'El Fassi', prenom: 'Sara', role: 'Secrétaire', telephone: '0664567890', cabinet: 'Cabinet Dentaire Rabat', status: 'active' },
    { id: 5, nom: 'Amrani', prenom: 'Ahmed', role: 'Médecin', telephone: '0665678901', cabinet: 'Cabinet Pédiatrie Marrakech', status: 'active' },
    { id: 6, nom: 'Chraibi', prenom: 'Nadia', role: 'Admin', telephone: '0666789012', cabinet: 'Cabinet Médical Fès', status: 'inactive' }
  ]);

  filteredUsers = computed(() => {
    if (!this.selectedCabinet()) {
      return this.users();
    }
    return this.users().filter(u => u.cabinet === this.selectedCabinet());
  });

  formData = signal({
    nom: '',
    prenom: '',
    role: '' as 'Médecin' | 'Secrétaire' | 'Admin' | '',
    telephone: '',
    cabinet: ''
  });

  openModal() {
    this.formData.set({ nom: '', prenom: '', role: '', telephone: '', cabinet: '' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  updateFormField(field: string, value: string) {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  saveUser() {
    console.log('Créer utilisateur:', this.formData());
    alert('Utilisateur créé (simulation)');
    this.closeModal();
  }

  editUser(user: User) {
    console.log('Modifier utilisateur:', user);
    alert('Modification utilisateur (simulation)');
  }

  deleteUser(user: User) {
    if (confirm(`Supprimer ${user.prenom} ${user.nom} ?`)) {
      console.log('Supprimer:', user);
      alert('Utilisateur supprimé (simulation)');
    }
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'Médecin': return 'bg-purple-100 text-purple-700';
      case 'Secrétaire': return 'bg-blue-100 text-blue-700';
      case 'Admin': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
