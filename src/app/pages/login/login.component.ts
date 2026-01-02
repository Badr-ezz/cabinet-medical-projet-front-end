import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

/**
 * LoginComponent - Page de connexion
 * 
 * Responsabilités :
 * - Afficher le formulaire de connexion
 * - Appeler AuthService pour l'authentification
 * - Rediriger l'utilisateur selon son rôle après login
 * - Afficher les erreurs de connexion
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  
  // Injection des dépendances
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals pour les champs du formulaire
  login = signal('');
  password = signal('');
  showPassword = signal(false);

  // Signal pour l'état de chargement
  isLoading = signal(false);
  
  // Signal pour les messages d'erreur
  errorMessage = signal('');

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  /**
   * Gère la soumission du formulaire de connexion
   * 
   * Étapes :
   * 1. Appelle AuthService.login()
   * 2. En cas de succès : redirige selon le rôle
   * 3. En cas d'erreur : affiche le message d'erreur
   */
  onSubmit(event: Event) {
    event.preventDefault();
    
    // Réinitialise le message d'erreur
    this.errorMessage.set('');
    
    // Active l'état de chargement
    this.isLoading.set(true);

    // Appelle l'API de login
    this.authService.login(this.login(), this.password()).subscribe({
      next: (response) => {
        // Vérifie si la réponse contient une erreur
        if (response.error) {
          this.isLoading.set(false);
          this.errorMessage.set(response.error);
          return;
        }
        
        // Vérifie si le token est expiré
        if (response.tokenExpired) {
          this.isLoading.set(false);
          this.errorMessage.set('Session expirée, veuillez vous reconnecter');
          return;
        }
        
        // Login réussi - récupère le rôle et redirige
        const role = this.authService.getUserRole();
        this.redirectBasedOnRole(role);
      },
      error: (error) => {
        // Gestion des erreurs HTTP
        this.isLoading.set(false);

        console.log(error);
        
        if (error.status === 401) {
          this.errorMessage.set('Login ou mot de passe incorrect');
        } else if (error.status === 0) {
          this.errorMessage.set('Impossible de contacter le serveur');
        } else {
          this.errorMessage.set('Une erreur est survenue');
        }
      }
    });
  }

  /**
   * Redirige l'utilisateur vers la page appropriée selon son rôle
   * 
   * Mapping des rôles :
   * - ADMIN     → /admin
   * - MEDECIN   → /doctor
   * - SECRETARY → /secretary
   */
  private redirectBasedOnRole(role: string | null): void {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'MEDECIN':
        this.router.navigate(['/doctor']);
        break;
      case 'SECRETARY':
        this.router.navigate(['/secretary']);
        break;
      default:
        // Rôle inconnu - reste sur la page de login
        this.isLoading.set(false);
        this.errorMessage.set('Rôle utilisateur non reconnu');
    }
  }
}
