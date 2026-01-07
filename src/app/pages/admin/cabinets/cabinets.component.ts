import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CabinetService } from '../../../services/cabinet.service';
import { Cabinet, CreateCabinetRequest } from '../../../models/cabinet.model';

@Component({
  selector: 'app-cabinets',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cabinets.component.html'
})
export class CabinetsComponent implements OnInit {
  private cabinetService = inject(CabinetService);
  
  // État de l'interface
  showModal = signal(false);
  editingCabinet = signal<Cabinet | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Liste des cabinets
  cabinets = signal<Cabinet[]>([]);

  // Données du formulaire
  formData = signal<CreateCabinetRequest>({
    nom: '',
    logo: '',
    specialite: '',
    adresse: '',
    telephone: '',
    email: '',
    actif: true
  });

  ngOnInit(): void {
    this.loadCabinets();
  }

  /**
   * Charge tous les cabinets depuis l'API
   */
  loadCabinets(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.cabinetService.getAll().subscribe({
      next: (cabinets) => {
        this.cabinets.set(cabinets);
        this.isLoading.set(false);

        console.log(this.cabinets);
        
      },
      error: (error) => {
        console.error('Erreur lors du chargement des cabinets:', error);
        this.errorMessage.set('Impossible de charger les cabinets');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ouvre le modal pour créer un nouveau cabinet
   */
  openCreateModal(): void {
    this.editingCabinet.set(null);
    this.formData.set({
      nom: '',
      logo: '',
      specialite: '',
      adresse: '',
      telephone: '',
      email: '',
      actif: true
    });
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  /**
   * Ouvre le modal pour modifier un cabinet existant
   */
  openEditModal(cabinet: Cabinet): void {
    this.editingCabinet.set(cabinet);
    this.formData.set({
      nom: cabinet.nom,
      logo: cabinet.logo || '',
      specialite: cabinet.specialite,
      adresse: cabinet.adresse,
      telephone: cabinet.telephone,
      email: cabinet.email,
      actif: cabinet.actif
    });
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.editingCabinet.set(null);
    this.errorMessage.set('');
  }

  /**
   * Met à jour un champ du formulaire
   */
  updateFormField(field: keyof CreateCabinetRequest, value: string | boolean): void {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  /**
   * Sauvegarde le cabinet (création ou modification)
   */
  saveCabinet(): void {
    const data = this.formData();
    
    // Validation basique
    if (!data.nom || !data.specialite || !data.adresse || !data.telephone || !data.email) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const editing = this.editingCabinet();

    if (editing) {
      // Mode modification
      this.cabinetService.update(editing.id, data).subscribe({
        next: (updatedCabinet) => {
          // Met à jour le cabinet dans la liste
          this.cabinets.update(cabinets => 
            cabinets.map(c => c.id === updatedCabinet.id ? updatedCabinet : c)
          );
          this.isLoading.set(false);
          this.showSuccess('Cabinet modifié avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.errorMessage.set(error.error?.message || 'Erreur lors de la modification du cabinet');
          this.isLoading.set(false);
        }
      });
    } else {
      // Mode création
      this.cabinetService.create(data).subscribe({
        next: (newCabinet) => {
          // Ajoute le nouveau cabinet à la liste
          this.cabinets.update(cabinets => [...cabinets, newCabinet]);
          this.isLoading.set(false);
          this.showSuccess('Cabinet créé avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          this.errorMessage.set(error.error?.message || 'Erreur lors de la création du cabinet');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Désactive un cabinet (soft delete)
   */
  deleteCabinet(cabinet: Cabinet): void {
    if (confirm(`Êtes-vous sûr de vouloir désactiver "${cabinet.nom}" ?`)) {
      this.isLoading.set(true);
      
      this.cabinetService.delete(cabinet.id).subscribe({
        next: () => {
          // Met à jour le statut dans la liste locale
          this.cabinets.update(cabinets => 
            cabinets.map(c => c.id === cabinet.id ? { ...c, actif: false } : c)
          );
          this.isLoading.set(false);
          this.showSuccess('Cabinet désactivé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la désactivation:', error);
          this.errorMessage.set('Erreur lors de la désactivation du cabinet');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Active/désactive un cabinet
   */
  toggleStatus(cabinet: Cabinet): void {
    const newStatus = !cabinet.actif;
    const data: CreateCabinetRequest = {
      nom: cabinet.nom,
      logo: cabinet.logo || '',
      specialite: cabinet.specialite,
      adresse: cabinet.adresse,
      telephone: cabinet.telephone,
      email: cabinet.email,
      actif: newStatus
    };

    this.isLoading.set(true);
    
    this.cabinetService.update(cabinet.id, data).subscribe({
      next: (updatedCabinet) => {
        this.cabinets.update(cabinets => 
          cabinets.map(c => c.id === updatedCabinet.id ? updatedCabinet : c)
        );
        this.isLoading.set(false);
        this.showSuccess(`Cabinet ${newStatus ? 'activé' : 'désactivé'} avec succès`);
      },
      error: (error) => {
        console.error('Erreur lors du changement de statut:', error);
        this.errorMessage.set('Erreur lors du changement de statut');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Affiche un message de succès temporaire
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}
