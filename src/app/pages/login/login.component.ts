import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  // Signals pour les champs du formulaire
  login = signal('');
  password = signal('');
  showPassword = signal(false);

  // Signal pour l'état de chargement (démo)
  isLoading = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    // Simulation de soumission (pas de logique réelle)
    console.log('Login attempt:', {
      login: this.login(),
      password: this.password(),
    });
  }
}
