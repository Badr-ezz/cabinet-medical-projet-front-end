/**
 * Cabinet - Modèle représentant un cabinet médical
 * 
 * Correspond à l'entité Cabinet du backend (cabinet-service)
 * Port: 8082
 */
export interface Cabinet {
  /** Identifiant unique du cabinet */
  id: number;
  
  /** Nom du cabinet */
  nom: string;
  
  /** URL du logo du cabinet */
  logo: string | null;
  
  /** Spécialité médicale du cabinet */
  specialite: string;
  
  /** Adresse physique du cabinet */
  adresse: string;
  
  /** Numéro de téléphone */
  telephone: string;
  
  /** Adresse email de contact */
  email: string;
  
  /** Statut actif/inactif du cabinet */
  actif: boolean;
  
  /** Date de création */
  createdAt: string;
  
  /** Date de dernière mise à jour */
  updatedAt: string;
}

/**
 * CreateCabinetRequest - DTO pour créer ou mettre à jour un cabinet
 */
export interface CreateCabinetRequest {
  nom: string;
  logo?: string;
  specialite: string;
  adresse: string;
  telephone: string;
  email: string;
  actif: boolean;
}
