import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = { title: "Conditions d’utilisation" };

export default function TermsPage() {
  return <LegalPage title="Conditions d’utilisation"><p>Le contenu de Zays présente des projets créatifs et des ressources destinées à un usage conforme aux règles des plateformes concernées. Toute utilisation d’un script ou d’une ressource reste sous la responsabilité de l’utilisateur.</p><h2>Utilisation responsable</h2><p>Les contenus ne doivent pas servir à contourner des systèmes de sécurité, perturber une expérience, accéder à des données sans autorisation ou enfreindre les conditions de Roblox.</p><h2>Propriété et disponibilité</h2><p>Les projets peuvent évoluer, être suspendus ou retirés sans préavis. Les noms, marques et services tiers appartiennent à leurs propriétaires respectifs.</p><h2>Indépendance</h2><p>Zays n’est pas affilié, associé ou sponsorisé par Roblox Corporation.</p></LegalPage>;
}
