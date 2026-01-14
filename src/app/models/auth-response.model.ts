/**
 * AuthResponse - Réponse du backend après une tentative de login
 * 
 * Structure correspondant à la classe Java :
 * public class AuthResponse {
 *     private String token;
 *     private boolean tokenExpired;
 *     private String error;
 *     private String userRole;
 * }
 */
export interface AuthResponse {
  /** Le token JWT généré */
  token: string;
  
  /** Indique si le token est expiré */
  tokenExpired: boolean;
  
  /** Message d'erreur en cas d'échec */
  error: string | null;
  
  /** Le rôle de l'utilisateur (ADMIN, MEDECIN, SECRETARY) */
  userRole: string | null;
}
