# DocView — Angular 20 et API Quarkus

Viewer Angular organisé en composants NgModule, adapté aux parcours AIS et LRE du backend fourni.

## Pour CAP-UP_docviewer

Suivre [INTEGRATION-CAP-UP.md](INTEGRATION-CAP-UP.md). Copier le module métier `src/app/viewer/` puis compléter le module et les routes existants. Le démarrage CoveUse reste celui de CAP-UP.

## Organisation

- `src/app/viewer/viewer.component.*` orchestre le chargement AIS/LRE et la sélection.
- `document-menu/` affiche la liste des documents.
- `pdf-viewer/` transforme le base64 en PDF et libère les URL blob.
- `viewer-error/` affiche les erreurs métier et techniques.
- `services/document-api.service.ts` appelle Quarkus via HttpClient.
- `models/document.models.ts` décrit les DTO.

Le premier document est sélectionné au chargement. Le panneau latéral est redimensionnable. Les métadonnées AIS et les pièces jointes sont affichées selon la réponse. Les règles métier LRE restent côté Quarkus.

## Exécution de l'hôte public

Node compatible Angular 20 requis, par exemple Node 22.12+ ou 24.

```sh
npm ci
npm test
npm run build
npm start
```

Le proxy de développement `/api` vise `http://localhost:8080/docviewer-service/api`. Adapter `proxy.json` pour un autre serveur. L'hôte public ne contient pas le socle privé CoveUse.

Pour les formulaires POST historiques, après compilation utiliser `npm run serve` puis `http://localhost:4201/faces/view.faces`. Le serveur relaie `/api` vers Quarkus. Variables disponibles `PORT` et `API_BACK` (adresse de base complète, par défaut `http://localhost:8080/docviewer-service/api`).

Les routes `/`, `/viewer` et `/faces/view.faces` acceptent les paramètres de lancement. Exemple GET LRE `/viewer?mode=denotresil&code-acam=01&id-lre=123&date-lre=2024-01-01`. AIS utilise `jsonDoc` contenant InterOpId encodé comme paramètre URL ou champ de formulaire.

## Validation et limites

La compilation vérifie les composants et templates Angular. `npm test` couvre les paramètres de lancement et les erreurs métier. L'authentification CoveUse et les appels à l'API interne doivent être testés dans CAP-UP. Les limites de compatibilité portail, multi-écran et fenêtre appelante sont détaillées dans le guide d'intégration.
