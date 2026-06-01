import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VocalService {
  private synth = window.speechSynthesis;

  constructor() {}

  /**
   * Synthétise vocalement le calendrier d'un enfant dans la langue du parent
   * @param prenom Enfant concerné
   * @param carnetVaccinal Liste des lignes de vaccins issues de PostgreSQL
   * @param codeLangue 'FR' | 'WO' | 'BA' | 'MO'
   */
  public lireCalendrierVocal(prenom: string, carnetVaccinal: any[], codeLangue: string): void {
    if (this.synth.speaking) {
      this.synth.cancel(); // Arrête la lecture en cours si l'utilisateur re-clique
      return;
    }

    let texteA_Lire = '';

    // 🌍 1. TRADUCTION ET ADAPTATION SYNTAXIQUE DU TEXTE SELON LA LANGUE
    if (codeLangue === 'WO') { // WOLOF (Sénégal)
      texteA_Lire = `Fiitalu faju u ${prenom}. `;
      const vaccinsA_Venir = carnetVaccinal.filter(v => v.statut !== 'ADMINISTRE');
      
      if (vaccinsA_Venir.length > 0) {
        const prochain = vaccinsA_Venir[0];
        texteA_Lire += `Li ci topp, sa doom wara na am piqûre u ${prochain.vaccin_code} ngir xeex ${prochain.nom_maladie_cible}, ci bisu ${prochain.date_prevue}.`;
      } else {
        texteA_Lire += `Matal na mbooloo piqûre yi. Jërëjëf !`;
      }
    } 
    else if (codeLangue === 'BA') { // BAMBARA (Mali)
      texteA_Lire = `${prenom} ka banna fura siri kalandriye. `;
      const vaccinsA_Venir = carnetVaccinal.filter(v => v.statut !== 'ADMINISTRE');
      
      if (vaccinsA_Venir.length > 0) {
        const prochain = vaccinsA_Venir[0];
        texteA_Lire += `Fura siri tògò tèmènen, a bɛ nà banna fura siri sɔ̀rɔ̀ ${prochain.vaccin_code} kama, k'a dabila ${prochain.nom_maladie_cible}, don ${prochain.date_prevue}.`;
      } else {
        texteA_Lire += `Fura siri bɛɛ bannyana. Barika !`;
      }
    } 
    else if (codeLangue === 'MO') { // MOORÉ (Burkina Faso)
      texteA_Lire = `${prenom} tiim gãf kibare. `;
      const vaccinsA_Venir = carnetVaccinal.filter(v => v.statut !== 'ADMINISTRE');
      
      if (vaccinsA_Venir.length > 0) {
        const prochain = vaccinsA_Venir[0];
        texteA_Lire += `Prochain tiim la ${prochain.vaccin_code} n paam tiim ${prochain.nom_maladie_cible}, daar fãa ${prochain.date_prevue}.`;
      } else {
        texteA_Lire += `Tiim mbooloo paamna. Barka !`;
      }
    } 
    else { // FRANÇAIS PAR DÉFAUT
      texteA_Lire = `Carnet de santé de ${prenom}. `;
      const vaccinsA_Venir = carnetVaccinal.filter(v => v.statut !== 'ADMINISTRE');
      
      if (vaccinsA_Venir.length > 0) {
        const prochain = vaccinsA_Venir[0];
        texteA_Lire += `Le prochain vaccin obligatoire est le ${prochain.vaccin_code} contre la ${prochain.nom_maladie_cible}, prévu pour le ${prochain.date_prevue}.`;
      } else {
        texteA_Lire += `Toutes les étapes du programme élargi de vaccination sont validées pour cet enfant.`;
      }
    }

    // 🤖 2. CONFIGURATION DU MOTEUR AUDIO NATIF
    const utterance = new SpeechSynthesisUtterance(texteA_Lire);
    
    // Configuration des accents locaux de synthèse si disponibles sur l'OS, sinon utilise le fallback
    if (codeLangue === 'FR') {
      utterance.lang = 'fr-FR';
    } else {
      // Pour les langues africaines non supportées nativement par les voix Android/Windows, 
      // on utilise un rythme de diction ralenti pour maximiser la clarté de lecture des syllabes phonétiques
      utterance.lang = 'fr-FR'; 
      utterance.rate = 0.82; // Ralentissement de la voix pour la prononciation locale
      utterance.pitch = 1.0;
    }

    this.synth.speak(utterance);
  }
}
