# Intégration dans CAP-UP_docviewer

Le dépôt fournit un hôte Angular 20 public compilable et un module métier réutilisable. L'hôte public n'embarque pas le socle privé `@coveuse/core`. Pour ton projet existant, appliquer les ajouts ci-dessous en conservant ses fichiers de démarrage, ses dépendances et sa configuration CoveUse.

## 1. Copier le module métier

Copier tout `src/app/viewer/` dans le même chemin du projet CAP-UP. Il contient ViewerComponent, DocumentMenuComponent, PdfViewerComponent, ViewerErrorComponent, les DTO TypeScript et DocumentApiService.

## 2. Compléter AppModule

Ajouter ces imports au fichier existant.

```ts
import { ViewerModule } from './viewer/viewer.module';
import { DOCUMENT_API_URL } from './viewer/services/document-api.service';
```

Ajouter `ViewerModule` au tableau `imports`, puis ce fournisseur au tableau `providers`.

```ts
{ provide: DOCUMENT_API_URL, useFactory: () => environment.apiBack }
```

Conserver `provideCoveUseCommon(withSecurity(environment.security), withLogs(environment.logCentral))`, `SharedModule` et l'initialisation existante de `SessionStorageService`. Le module métier utilise le HttpClient racine et ne crée pas de client qui contournerait les intercepteurs du socle. Si HttpClient n'est pas fourni par ton socle, le configurer à la racine selon sa documentation. L'hôte public utilise `provideHttpClient(withInterceptorsFromDi())`.

## 3. Ajouter les routes

Dans `app-routing.module.ts`, importer le composant et compléter le tableau actuellement vide.

```ts
import { ViewerComponent } from './viewer/viewer.component';

const routes: Routes = [
  { path: '', component: ViewerComponent, pathMatch: 'full' },
  { path: 'viewer', component: ViewerComponent },
  { path: 'faces/view.faces', component: ViewerComponent }
];
```

Le contenu de `app.component.html` devient simplement `<router-outlet />`. Garder ton AppComponent avec `standalone: false` et ton `main.ts` qui démarre AppModule.

## 4. Utiliser le proxy du projet

Ta page est servie en HTTPS. Mettre `apiBack: '/api'` dans les propriétés de `environment.ts` et vérifier que `COVEUSE_CONFIG` ne rétablit pas l'ancienne adresse HTTP. Conserver les propriétés security et logCentral.

Fusionner cette règle dans le proxy existant en adaptant sa syntaxe d'export, avant une éventuelle règle générale `/api`. Garder les règles de sécurité et de logs existantes.

```js
'/api/documents/**': {
  target: 'http://localhost.ads01.priv:8080',
  changeOrigin: true,
  pathRewrite: { '^/api': '/docviewer-service/api' }
}
```

Redémarrer le serveur ngco après changement du proxy. Vérifier qu'il charge bien `src/proxy.conf.js` dans sa configuration de lancement. En déploiement, configurer le reverse proxy équivalent et l'authentification attendue par Quarkus.

## Contrat Quarkus

- `POST /documents/ais?pj=false` avec le corps InterOpId direct.
- `GET /documents/lre?code-acam=...&id-lre=...` et `date-lre` si fourni.
- Réponse DocumentsAis ou DocumentsLre contenant `documents`, avec `contenu` PDF en base64.

Les règles d'ancienneté et le mode démonstration restent côté backend. Le frontend affiche les erreurs métier. Le format exact de l'enveloppe d'erreur du socle devra être confirmé sur une réponse réelle.

## Compatibilité des lancements JSF

Les paramètres GET `mode`, `jsonDoc`, `jsonDemande` sont reconnus. Les formulaires POST historiques nécessitent un adaptateur serveur car le routeur Angular ne reçoit pas leur corps. `server.mjs` fournit cet adaptateur pour `/faces/view.faces`, `/viewer` et `/`. Il insère les champs dans un bloc JSON échappé, lu puis supprimé par le composant. Un serveur Angular de développement seul ne remplace pas cet adaptateur.

## Points restant à valider dans l'environnement interne

- Authentification et intercepteurs CoveUse, réponses réelles Quarkus et enveloppes d'erreur.
- Les pièces jointes déclenchent `afficher-document-list` sur la fenêtre appelante de même origine. Une fenêtre d'une autre origine nécessite un protocole partagé avec l'application appelante.
- Le bouton écran conserve le cookie historique `nbEcrans`. Le placement physique sur un autre écran n'est pas implémenté, faute du script historique complet.
- Le maintien de session et la fermeture via le portail JSF demandent les interfaces du portail, absentes du contrat Quarkus fourni.
- Les logos et feuilles de style historiques n'ont pas été fournis.

Ces points empêchent de déclarer une équivalence intégrale JSF validée en production.
