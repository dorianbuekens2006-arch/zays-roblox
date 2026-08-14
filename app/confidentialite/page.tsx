import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return <LegalPage title="Politique de confidentialité"><p>Zays conserve uniquement les données nécessaires au fonctionnement et à la sécurité du site.</p><h2>Données techniques</h2><p>Des compteurs agrégés enregistrent les visites et certains clics. La connexion administrateur utilise une session sécurisée temporaire et un mécanisme de limitation des tentatives.</p><h2>Médiathèque</h2><p>Les images téléversées par l’administrateur sont stockées sur l’espace persistant du serveur. Aucun fichier ne doit contenir de données sensibles ou appartenir à un tiers sans autorisation.</p><h2>Contact</h2><p>Le lien communautaire configuré sur le site permet de contacter l’équipe Zays pour toute question relative aux données.</p></LegalPage>;
}
