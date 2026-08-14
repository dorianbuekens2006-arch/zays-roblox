# Zays

Site gaming premium Rouge / Noir / Blanc pour centraliser les projets Roblox Zays. Le projet comprend le site public, un panel d’administration protégé, une médiathèque, les statistiques essentielles et une configuration prête pour Railway.

## Fonctionnalités

- Accueil cinématique avec visuels originaux, glow rouge et animations légères
- Cartes de jeux administrables, ordre manuel, statut et liens Roblox
- Section Zays Executor avec statuts `SOON`, `ONLINE`, `OFFLINE`, `MAINTENANCE`
- Bibliothèque de scripts avec recherche, catégories, aperçu et copie
- Bloc Discord et liens sociaux configurables
- Panel Admin séparé : Dashboard, Accueil, Jeux, Executor, Scripts, Images, Liens, Paramètres
- Brouillon, annulation, aperçu avant publication et publication contrôlée
- Upload PNG/JPG/JPEG/WEBP validé par signature côté serveur (5 Mo par défaut)
- Sessions HTTP-only, mots de passe scrypt, CSRF, routes protégées et rate limiting de la connexion
- Base SQLite persistante et stockage des images sur un volume Railway

## Démarrage local

Pré-requis : Node.js 22.13 ou supérieur (Node 22 LTS recommandé).

```bash
npm ci
cp .env.example .env.local
npm run hash-password
```

Copie la valeur produite dans `ADMIN_PASSWORD_HASH` de `.env.local`, puis lance :

```bash
npm run dev
```

Le site public est disponible sur `http://localhost:3000` et le panel sur `http://localhost:3000/admin`.

## Déploiement Railway

1. Envoie ce projet dans un dépôt GitHub, puis crée un nouveau service Railway depuis ce dépôt.
2. Railway détecte `railway.json` et `nixpacks.toml`. La construction utilise `npm run build` et le démarrage `npm run start`.
3. Ajoute un volume persistant et monte-le sur `/data`.
4. Dans les variables du service, ajoute :

```text
DATA_DIR=/data
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt$...$...
SESSION_TTL_HOURS=8
MAX_UPLOAD_MB=5
NODE_ENV=production
```

5. Génère `ADMIN_PASSWORD_HASH` localement avec `npm run hash-password`. Le mot de passe est saisi de manière masquée : ne le mets jamais en clair dans Railway ou dans le dépôt.
6. Génère un domaine public depuis les paramètres réseau du service Railway.
7. Après le premier démarrage, ouvre `/admin`, configure tes vrais liens Roblox et Discord, puis publie.

### Persistance

La base et les uploads sont stockés sous `DATA_DIR`. Sans volume Railway, les modifications du panel et les images peuvent disparaître lors d’un redéploiement. Pour éviter la corruption, garde une seule réplique du service avec cette architecture SQLite.

### Sauvegarde

Sauvegarde régulièrement le volume `/data`, qui contient `zays.sqlite` (contenu, sessions, statistiques, métadonnées) et `uploads/` (images ajoutées depuis la médiathèque).

## Sécurité

- Le mot de passe n’est jamais envoyé au frontend ni écrit dans le JavaScript client.
- Le hash scrypt est lu depuis l’environnement serveur.
- Les sessions sont stockées sous forme de hash et transmises dans un cookie HTTP-only, `SameSite=Strict` et `Secure` en production.
- Les écritures Admin exigent une session valide et un jeton CSRF.
- La connexion est limitée à 5 échecs sur 15 minutes par adresse réseau hachée.
- Les entrées sont normalisées côté serveur et les requêtes SQLite sont préparées.
- Les uploads sont limités, renommés avec un identifiant aléatoire et contrôlés par signature binaire.

## Contenu par défaut

Les URLs Roblox et Discord sont volontairement vides afin de ne pas pointer vers de fausses destinations. Configure-les dans le Panel Admin avant la publication finale.

Zays n’est pas affilié, associé ou sponsorisé par Roblox Corporation.
