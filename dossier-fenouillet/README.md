# Documents — Vente 3 rue Fenouillet, Hyères

Bibliothèque web privée des documents liés à la vente de l'appartement
**lot 2, 3 rue Fenouillet, 83400 Hyères** (vendeur : **SAS La Relève Hyères**).
Destinée au notaire, aux associés et à l'acquéreur — public non technique.

Liste les 21 documents, affiche leurs propriétés (type, date, résumé, points
d'attention), permet la **recherche plein texte**, le **filtrage par type**, le
**tri**, et l'**ouverture / téléchargement** de chaque PDF en un clic.

> ⚠️ **Document confidentiel.** Ces PDF contiennent des données personnelles de
> tiers (noms, dates de naissance, adresses, informations financières des
> vendeuses et de l'acquéreur). Lire impérativement la section
> [Confidentialité](#confidentialité) avant tout déploiement.

---

## Stack

- **Vite + React + TypeScript + Tailwind CSS.** Aucun back-end, aucune base de
  données.
- Toutes les métadonnées dans un seul fichier : `src/data/documents.json`.
- Les PDF sont servis en statique depuis `public/documents/`.
- Build 100 % statique (`npm run build`), hébergeable tel quel.

---

## Démarrage local

```bash
npm install
npm run dev          # http://localhost:5173
```

Build de production et prévisualisation :

```bash
npm run build        # génère dist/
npm run preview
```

---

## Copier les PDF (à faire en local)

Les 21 PDF originaux se trouvent sur votre machine, par défaut dans :

```
/Users/theogouman/Downloads/Docs : Hyères
```

…répartis dans `Acquisition/`, `Admin/`, `Diagnostiques/`, `Sinistre/`,
`Travaux/`. Le script ci-dessous **copie** chaque PDF dans `public/documents/`
en le **renommant** selon le slug du manifeste (`file`). **Les originaux ne sont
jamais modifiés.**

```bash
./scripts/copy-docs.sh
# ou avec un autre dossier source :
SRC="/chemin/vers/Docs : Hyères" ./scripts/copy-docs.sh
```

> Ce script doit être lancé **sur votre Mac** : les originaux ne sont pas
> présents dans l'environnement cloud où le projet a été généré.

### Cas particulier : `aae-acte-vente-annexes.pdf`

L'original (`AAE avec annexes …`) fait **~19,5 Mo**. Pour alléger le dépôt, le
script le **compresse sous ~9 Mo** via **Ghostscript**
(`-dPDFSETTINGS=/screen`, 60 dpi) en conservant les **323 pages** et la **couche
texte**, dès lors que `gs` est installé et que l'original dépasse 12 Mo :

```bash
brew install ghostscript   # si nécessaire
```

Sans Ghostscript, le fichier est copié tel quel et un avertissement s'affiche.
Le point d'attention de cette entrée signale qu'une version compressée peut être
servie.

---

## Fonctionnalités

- **Vue cartes** (par défaut) ou **vue tableau** compacte — bascule en haut.
- **Recherche plein texte** instantanée sur le **nom** et le **résumé**,
  insensible aux accents et à la casse.
  > Note : la recherche est exhaustive. Taper « termite » fait ressortir **tous**
  > les documents qui mentionnent le mot (le diagnostic termites, la note de
  > synthèse, la synthèse des attestations et le dossier technique complet).
- **Filtre par type** : puces multi-sélection avec compteur par type, bouton
  « Tout effacer ».
- **Compteur de résultats** (« X documents sur 21 »).
- **Ouvrir** (nouvel onglet) / **Télécharger** chaque PDF. Aucun PDF n'est
  chargé tant qu'on ne clique pas (pas de préchargement ; l'aperçu du panneau
  détail ne se charge qu'au clic sur « Afficher l'aperçu »).
- **Vue détail** (panneau latéral) : résumé complet, type, date, point
  d'attention, nom de fichier, aperçu à la demande, boutons d'action.
- **Tri** : par type (groupé, ordre Acte → Promesse → Diagnostic → Devis →
  Facture → Sinistre → Administratif) ou par nom (A → Z).

### Couleurs des badges (reprises de Notion)

| Type | Couleur |
|------|---------|
| Acte | bleu |
| Promesse | violet |
| Diagnostic | vert |
| Devis | orange |
| Facture | jaune |
| Sinistre | rouge |
| Administratif | gris |

---

## Déploiement

Le site est un build statique. La sortie est `dist/`.

> **Les PDF doivent être présents au moment du build/déploiement.** Par
> sécurité, `public/documents/*.pdf` est **ignoré par git** (voir
> [Confidentialité](#confidentialité)). Pour déployer, soit vous retirez cette
> ligne du `.gitignore` et committez les PDF **dans un dépôt strictement
> privé**, soit vous les téléversez via l'interface de l'hébergeur. Sans les
> PDF, le site fonctionne mais les boutons « Ouvrir / Télécharger » renvoient
> du 404.

### Vercel (recommandé)

1. Pousser le projet sur un dépôt **privé**.
2. Vercel → *Add New* → *Project* → importer le dépôt. Si le projet est dans un
   sous-dossier, régler **Root Directory = `dossier-documents`**.
3. Preset détecté : **Vite** (`npm run build`, sortie `dist/`). *Deploy*.
4. **Protéger l'accès** : *Settings → Deployment Protection → Password
   Protection* (ou Vercel Authentication). Voir Confidentialité.

`vercel.json` ajoute déjà `X-Robots-Tag: noindex, nofollow`.

### Netlify

`netlify.toml` est fourni (build `npm run build`, publication `dist`, fallback
SPA, en-tête noindex). Protéger via **Netlify Identity** ou
*Site settings → Access control*.

### GitHub Pages

Build avec un base path correspondant au nom du dépôt :

```bash
VITE_BASE=/NOM-DU-REPO/ npm run build
# puis publier dist/ sur la branche gh-pages
```

> GitHub Pages **ne propose pas d'authentification** : à éviter pour ce dossier
> confidentiel.

---

## Confidentialité

Ces PDF contiennent des **données personnelles de tiers** et des éléments
juridiques. **Ne déployez pas ce site en accès public sans protection.**

Mesures en place et recommandées :

1. **Dépôt privé.** Gardez le dépôt privé. Les PDF (`public/documents/*.pdf`)
   sont **ignorés par git** par défaut pour éviter de figer des données
   personnelles dans l'historique.
2. **Porte par mot de passe (côté client).** Une page de connexion protège
   l'accès. Le mot de passe est configurable :
   ```bash
   cp .env.example .env.local
   # éditer VITE_ACCESS_PASSWORD
   ```
   Valeur par défaut si non défini : **`fenouillet`** — **à changer**.

   > ⚠️ **Ce n'est PAS une sécurité forte.** Le mot de passe est embarqué dans
   > le JavaScript livré au navigateur ; il **dissuade** mais ne protège pas
   > contre quelqu'un de déterminé. Ne le considérez jamais comme suffisant
   > pour des données sensibles.
3. **Authentification d'hébergeur (vrai contrôle d'accès).** Pour une réelle
   protection, placez le site derrière :
   - **Vercel** : *Deployment Protection* (Password Protection / Vercel
     Authentication) ;
   - **Netlify** : *Netlify Identity* ou contrôle d'accès du site ;
   - ou tout reverse-proxy / hébergement à accès restreint.

Aucun secret n'est committé. Le mot de passe passe par variable
d'environnement, sans valeur sensible en clair dans le dépôt.

---

## Structure

```
dossier-documents/
├── index.html
├── package.json
├── vite.config.ts          # base path configurable (VITE_BASE)
├── tailwind.config.js
├── vercel.json             # noindex + cache assets
├── netlify.toml            # build + fallback SPA + noindex
├── .env.example            # VITE_ACCESS_PASSWORD
├── scripts/
│   └── copy-docs.sh        # copie/renomme/compresse les PDF (local)
├── public/
│   └── documents/          # PDF (ignorés par git ; remplis localement)
└── src/
    ├── App.tsx             # état : recherche, filtres, tri, vue, détail
    ├── data/documents.json # les 21 entrées (source de vérité)
    ├── lib/                # types, normalisation recherche, url PDF, dates
    └── components/         # PasswordGate, Header, SearchBar, TypeFilters,
                            # Toolbar, Badge, DocumentCard, DocumentTable,
                            # DocActions, DetailPanel
```

---

## En faire un dépôt séparé

Ce projet est autonome dans le sous-dossier `dossier-documents/`. Pour le
publier dans son propre dépôt :

```bash
cp -R dossier-documents /chemin/vers/nouveau-projet
cd /chemin/vers/nouveau-projet
git init && git add . && git commit -m "Init: bibliothèque de documents"
# créer un dépôt PRIVÉ sur GitHub, puis :
git remote add origin git@github.com:<vous>/<repo-prive>.git
git push -u origin main
```

Puis lancer `./scripts/copy-docs.sh` pour remplir `public/documents/`.
