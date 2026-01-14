/**
 * Patient Model - Modèles pour la gestion des patients
 * 
 * Correspond à l'API patient-service sur le port 8085
 */

/**
 * Interface Patient (réponse de l'API)
 */
export interface Patient {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: string;
  numTel?: string;
  typeMutuelle?: string;
  email?: string;
  adresse?: string;
  cabinetId: number;
}

/**
 * Interface pour la création/modification d'un patient
 */
export interface PatientRequest {
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: string;
  numTel?: string;
  typeMutuelle?: string;
  email?: string;
  adresse?: string;
  cabinetId: number;
}

/**
 * Interface pour le dossier médical
 */
export interface DossierMedical {
  idDossier?: number;
  antecedentsMedicaux?: string;
  antecedentsChirurgicaux?: string;
  allergies?: string;
  traitements?: string;
  habitudes?: string;
  documentsMedicaux?: string;
  dateCreation?: string;
  patientId: number;
}
