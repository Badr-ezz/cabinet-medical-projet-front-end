/**
 * User - Modèle représentant un utilisateur
 * 
 * Correspond à l'entité User du backend (user-service)
 * Port: 8081
 */

/** Rôles disponibles pour un utilisateur */
export type UserRole = 'MEDECIN' | 'ADMIN' | 'SECRETARY';

/**
 * UserResponse - Réponse de l'API pour un utilisateur
 */
export interface User {
  /** Identifiant unique de l'utilisateur */
  id: number;
  
  /** ID du cabinet associé */
  cabinetId: number;
  
  /** Nom du cabinet (nullable, populated on getAllUsers) */
  nomCabinet: string | null;
  
  /** Login (email ou username) */
  login: string;
  
  /** Nom de famille */
  nom: string;
  
  /** Prénom */
  prenom: string;
  
  /** Chemin vers l'image de signature (nullable) */
  signature: string | null;
  
  /** Numéro de téléphone */
  numTel: string;
  
  /** Rôle de l'utilisateur */
  role: UserRole;
}

/**
 * CreateUserRequest - DTO pour créer ou mettre à jour un utilisateur
 */
export interface CreateUserRequest {
  /** ID (requis pour mise à jour) */
  id?: number;
  
  /** ID du cabinet associé */
  cabinetId: number;
  
  /** Login (email ou username) */
  login: string;
  
  /** Mot de passe (sera crypté côté backend) */
  pwd: string;
  
  /** Nom de famille */
  nom: string;
  
  /** Prénom */
  prenom: string;
  
  /** Chemin vers l'image de signature (optionnel) */
  signature?: string;
  
  /** Numéro de téléphone */
  numTel: string;
  
  /** Rôle de l'utilisateur */
  role: UserRole;
}
