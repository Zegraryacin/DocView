# Documents Viewer Angular
Projet standalone Angular 20.3. Utiliser Node 22.12+ de la branche 22 et npm.

## Démarrage
Lancer Quarkus sur localhost:8080, puis npm install et npm start dans ce dossier. Ouvrir http://localhost:4200/?mode=denotresil&code-acam=EXEMPLE&id-lre=EXEMPLE (remplacer les deux valeurs). Ajouter &date-lre=2025-01-15 si nécessaire. Pour le bouchon AIS ouvrir /?pj=true ; pour le bouchon LRE ouvrir /?mode=denotresil. La politique de démo et les droits restent ceux de Quarkus. Pour changer la cible de développement modifier proxy.json.

## Lancement par l'application appelante
Pour les POST de l'ancien portail, exécuter npm run build puis npm run serve. Le serveur local sur 4201 accepte les formulaires URL-encodés vers /faces/view.faces, y compris avec un préfixe historique. Il transmet les paramètres à Angular dans la page initiale. Exemple de champs AIS : mode=ais et jsonDoc contenant l'objet InterOpId sérialisé. En LRE : mode=denotresil et jsonDemande contenant codeAcam, idLre et, si connue, dateLRE. Les boutons historiques TEST, TEST SANS DATE et TEST BOUCHON correspondent à une demande avec date, sans date et sans paramètres métier.

En déploiement, exposer le viewer à la racine de son origine et router /documents/* vers la racine REST réelle de Quarkus. Envoyer les pages et bundles vers le port 4201. Le serveur de développement Angular sert au lancement GET ; le serveur de compatibilité traite les POST. Utiliser la session du portail et sa passerelle d'authentification. Si le socle impose un intercepteur Bearer, enregistrer celui du projet au bootstrap. Le frontend ne fabrique aucun jeton.

## Comportement et raccordements
- AIS transmet l'objet InterOpId directement en JSON à POST /documents/ais. LRE utilise GET /documents/lre avec code-acam, id-lre et date-lre facultative. La composition, les seuils de purge/archivage et le choix du jeu de démo restent sur le serveur.
- Le menu suit l'ordre du tableau documents de Quarkus. Chaque fenêtre conserve sa propre sélection et décode uniquement le contenu du PDF sélectionné. Le navigateur doit autoriser son lecteur PDF et frame-src blob:.
- Les pièces jointes envoient à la fenêtre ouvrante l'événement afficher-document-list avec detail.idDocumentList. Le portail doit conserver window.opener et partager l'origine exacte du viewer ; un portail sur une autre origine nécessite un relais postMessage validé des deux côtés.
- Le bouton écran mémorise le choix dans nbEcrans. Le placement physique appartient au lanceur. menuview.js et les logos originaux ne figuraient pas dans les captures. Le titre texte peut être remplacé par les ressources graphiques de l'application.
- Conserver pageTechnique.jsp au cours de la transition si le portail l'appelle dans une iframe. Elle utilise l'API du portail pour keepalive et logout ; ces routes ne figurent pas dans DocumentResource. Le viewer Angular ne remplace pas ce contrat de session.
- L'adaptateur d'erreurs dans src/main.ts lit code/libelle, message ou messages[0]. Vérifier le JSON réel du socle pour un 400 LRE_ARCHIVEE, un 401/403 et une erreur technique. Un résultat vide donne un message explicite.
