import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { CabinetService } from '../../../services/cabinet.service';
import { User, CreateUserRequest, UserRole } from '../../../models/user.model';
import { Cabinet } from '../../../models/cabinet.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private cabinetService = inject(CabinetService);
  
  // État de l'interface
  showModal = signal(false);
  editingUser = signal<User | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  // Filtres de recherche
  searchTerm = signal('');
  selectedCabinetId = signal<number | null>(null);
  
  // Données
  cabinets = signal<Cabinet[]>([]);
  users = signal<User[]>([]);

  // Rôles disponibles
  roles: { value: UserRole; label: string }[] = [
    { value: 'MEDECIN', label: 'Médecin' },
    { value: 'SECRETARY', label: 'Secrétaire' },
    { value: 'ADMIN', label: 'Administrateur' }
  ];

  // Filtrage des utilisateurs par recherche et cabinet
  filteredUsers = computed(() => {
    let result = this.users();
    
    // Filtre par cabinet
    const cabinetId = this.selectedCabinetId();
    if (cabinetId) {
      result = result.filter(u => u.cabinetId === cabinetId);
    }
    
    // Filtre par recherche (login, nom, prenom, numTel, nomCabinet)
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter(u => 
        u.login.toLowerCase().includes(search) ||
        u.nom.toLowerCase().includes(search) ||
        u.prenom.toLowerCase().includes(search) ||
        u.numTel.toLowerCase().includes(search) ||
        (u.nomCabinet && u.nomCabinet.toLowerCase().includes(search))
      );
    }
    
    return result;
  });

  // Données du formulaire
  formData = signal<CreateUserRequest>({
    cabinetId: 0,
    login: '',
    pwd: '',
    nom: '',
    prenom: '',
    signature: '',
    numTel: '',
    role: 'MEDECIN'
  });

  ngOnInit(): void {
    this.loadCabinets();
    this.loadUsers();
  }

  /**
   * Charge la liste des cabinets actifs
   */
  loadCabinets(): void {
    this.cabinetService.getActive().subscribe({
      next: (cabinets) => {
        this.cabinets.set(cabinets);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des cabinets:', error);
      }
    });
  }

  /**
   * Charge tous les utilisateurs
   */
  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        this.errorMessage.set('Impossible de charger les utilisateurs');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ouvre le modal pour créer un nouvel utilisateur
   */
  openModal(): void {
    this.editingUser.set(null);
    this.formData.set({
      cabinetId: this.cabinets().length > 0 ? this.cabinets()[0].id : 0,
      login: '',
      pwd: '',
      nom: '',
      prenom: '',
      signature: '',
      numTel: '',
      role: 'MEDECIN'
    });
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  /**
   * Ouvre le modal pour modifier un utilisateur
   */
  openEditModal(user: User): void {
    this.editingUser.set(user);
    this.formData.set({
      id: user.id,
      cabinetId: user.cabinetId,
      login: user.login,
      pwd: '', // Le mot de passe n'est pas pré-rempli pour des raisons de sécurité
      nom: user.nom,
      prenom: user.prenom,
      signature: user.signature || '',
      numTel: user.numTel,
      role: user.role
    });
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.editingUser.set(null);
    this.errorMessage.set('');
  }

  /**
   * Met à jour un champ du formulaire
   */
  updateFormField(field: keyof CreateUserRequest, value: string | number): void {
    this.formData.update(f => ({ ...f, [field]: value }));
  }

  /**
   * Sauvegarde l'utilisateur (création ou modification)
   */
  saveUser(): void {
    const data = this.formData();
    
    // Validation
    if (!data.login || !data.nom || !data.prenom || !data.numTel || !data.cabinetId) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation du mot de passe pour la création
    if (!this.editingUser() && !data.pwd) {
      this.errorMessage.set('Le mot de passe est obligatoire pour la création');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const editing = this.editingUser();

    if (editing) {
      // Mode modification - si pas de nouveau mot de passe, on garde l'ancien
      const updateData = { ...data };
      if (!updateData.pwd) {
        // On envoie quand même la requête, le backend gère le cas pwd vide
        updateData.pwd = '';
      }
      
      this.userService.update(updateData).subscribe({
        next: (updatedUser) => {
          this.users.update(users => 
            users.map(u => u.id === updatedUser.id ? updatedUser : u)
          );
          this.isLoading.set(false);
          this.showSuccess('Utilisateur modifié avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.errorMessage.set(error.error?.message || 'Erreur lors de la modification');
          this.isLoading.set(false);
        }
      });
    } else {
      // Mode création
      this.userService.create(data).subscribe({
        next: (newUser) => {
          this.users.update(users => [...users, newUser]);
          this.isLoading.set(false);
          this.showSuccess('Utilisateur créé avec succès');
          this.closeModal();
        },
        error: (error) => {
          console.error('Erreur lors de la création:', error);
          if (error.status === 409) {
            this.errorMessage.set('Un utilisateur avec ce login existe déjà');
          } else {
            this.errorMessage.set(error.error?.message || 'Erreur lors de la création');
          }
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Supprime un utilisateur
   */
  deleteUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${user.prenom} ${user.nom}" ?`)) {
      this.isLoading.set(true);
      
      this.userService.delete(user.id).subscribe({
        next: () => {
          this.users.update(users => users.filter(u => u.id !== user.id));
          this.isLoading.set(false);
          this.showSuccess('Utilisateur supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          this.errorMessage.set('Erreur lors de la suppression');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Retourne la classe CSS pour le badge de rôle
   */
  getRoleClass(role: UserRole): string {
    switch (role) {
      case 'MEDECIN': return 'bg-purple-100 text-purple-700';
      case 'SECRETARY': return 'bg-blue-100 text-blue-700';
      case 'ADMIN': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  /**
   * Retourne le libellé du rôle
   */
  getRoleLabel(role: UserRole): string {
    const found = this.roles.find(r => r.value === role);
    return found ? found.label : role;
  }

  /**
   * Affiche un message de succès temporaire
   */
  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }
}
