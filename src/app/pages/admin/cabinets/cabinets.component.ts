import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Cabinet {
  id: number;
  nom: string;
  specialite: string;
  adresse: string;
  telephone: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-cabinets',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cabinets.component.html'
})
export class CabinetsComponent {
  showModal = signal(false);
  editingCabinet = signal<Cabinet | null>(null);

  cabinets = signal<Cabinet[]>([
    { id: 1, nom: 'Cabinet Médical Casablanca', specialite: 'Médecine générale', adresse: '123 Bd Mohammed V, Casablanca', telephone: '0522123456', status: 'active' },
    { id: 2, nom: 'Cabinet Dentaire Rabat', specialite: 'Dentisterie', adresse: '45 Av Hassan II, Rabat', telephone: '0537234567', status: 'active' },
    { id: 3, nom: 'Cabinet Pédiatrie Marrakech', specialite: 'Pédiatrie', adresse: '78 Rue Yougoslavie, Marrakech', telephone: '0524345678', status: 'active' },
    { id: 4, nom: 'Cabinet Médical Fès', specialite: 'Médecine générale', adresse: '12 Bd Allal El Fassi, Fès', telephone: '0535456789', status: 'inactive' },
    { id: 5, nom: 'Cabinet Cardiologie Tanger', specialite: 'Cardiologie', adresse: '90 Av Mohammed VI, Tanger', telephone: '0539567890', status: 'active' }
  ]);

  formData = signal({
    nom: '',
    specialite: '',
    adresse: '',
    telephone: ''
  });

  openCreateModal() {
    this.editingCabinet.set(null);
    this.formData.set({ nom: '', specialite: '', adresse: '', telephone: '' });
    this.showModal.set(true);
  }

  openEditModal(cabinet: Cabinet) {
    this.editingCabinet.set(cabinet);
    this.formData.set({
      nom: cabinet.nom,
      specialite: cabinet.specialite,
      adresse: cabinet.adresse,
      telephone: cabinet.telephone
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingCabinet.set(null);
  }

  updateFormField(field: 'nom' | 'specialite' | 'adresse' | 'telephone', value: string) {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  saveCabinet() {
    console.log('Sauvegarder cabinet:', this.formData());
    alert(this.editingCabinet() ? 'Cabinet modifié (simulation)' : 'Cabinet créé (simulation)');
    this.closeModal();
  }

  deleteCabinet(cabinet: Cabinet) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${cabinet.nom}" ?`)) {
      console.log('Supprimer cabinet:', cabinet);
      alert('Cabinet supprimé (simulation)');
    }
  }

  toggleStatus(cabinet: Cabinet) {
    const newStatus = cabinet.status === 'active' ? 'inactive' : 'active';
    console.log('Changer statut:', cabinet.nom, '->', newStatus);
    alert(`Cabinet ${newStatus === 'active' ? 'activé' : 'désactivé'} (simulation)`);
  }
}
