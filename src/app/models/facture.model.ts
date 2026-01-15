/**
 * Facture Model - Modèles pour la gestion de la facturation
 * 
 * Ces modèles correspondent aux DTOs de l'API rendezvous-service (port 8083)
 * La facturation est liée aux rendez-vous terminés
 */

/**
 * Modes de paiement disponibles
 */
export type ModePaiement = 'ESPECES' | 'CARTE' | 'CHEQUE' | 'VIREMENT';

/**
 * Statuts possibles pour une facture
 */
export type StatutFacture = 'PAYEE' | 'EN_ATTENTE' | 'ANNULEE';

/**
 * Interface Facture (Response DTO)
 * Correspond à la table public.factures
 */
export interface Facture {
  idFacture: number;
  montant: number;           // Montant de la facture
  statut: StatutFacture;
  modePaiement: ModePaiement | null;
  dateCreation: string;       // Timestamp de création
  datePaiement?: string;      // Timestamp du paiement
  rendezVousId: number;
  cabinetId: number;
  
  // Champs enrichis par le backend (via rendez-vous)
  patientId?: number;
  patientNom?: string;
  patientPrenom?: string;
  numeroFacture?: string;
}

/**
 * Interface pour créer une facture (Request DTO)
 * Correspond au endpoint POST /api/factures
 * Note: statut est défini automatiquement par le backend (EN_ATTENTE)
 */
export interface FactureRequest {
  rendezVousId: number;
  cabinetId: number;
  montant: number;
  modePaiement: ModePaiement; // REQUIRED par le backend
}

/**
 * Interface pour valider un paiement
 */
export interface PaiementRequest {
  montant?: number;
  modePaiement: ModePaiement;
}

/**
 * Interface pour les statistiques de facturation
 */
export interface BillingStats {
  totalFactures: number;
  totalPaye: number;
  totalEnAttente: number;
  facturesAujourdhui: number;
  facturesCeMois: number;
}

/**
 * Interface pour la facture avec les détails du patient (affichage)
 * Enrichie avec les infos patient via le rendez-vous
 */
export interface FactureWithPatient extends Facture {
  patientId?: number;
  patientNom?: string;
  patientPrenom?: string;
  patient?: {
    id: number;
    nom: string;
    prenom: string;
    cin?: string;
    numTel?: string;
  };
}
