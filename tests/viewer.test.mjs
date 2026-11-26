import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLaunchParameters, mergePostedParameters } from '../src/app/viewer/services/launch-parameters.ts';
import { toViewerError } from '../src/app/viewer/services/viewer-errors.ts';

test('AIS conserve le corps InterOpId et le choix PJ', () => {
  const body = { idFlux: ['abc'], idSequence: '12', listePiecesJointes: ['doc'] };
  const result = parseLaunchParameters(new URLSearchParams({ jsonDoc: JSON.stringify(body), pj: 'true' }));
  assert.deepEqual(result, { mode: 'ais', demande: body, piecesJointesDemo: true });
});
test('LRE historique conserve dateLRE, sans conversion de fuseau', () => {
  const result = parseLaunchParameters(new URLSearchParams({ mode: 'denotresil', jsonDemande: JSON.stringify({codeAcam: '01', idLre: '002', dateLRE: '2024-02-29'}) }));
  assert.deepEqual(result.demande, {codeAcam: '01', idLre: '002', dateLre: '2024-02-29'});
});
test('une date absente reste absente', () => {
  assert.equal(parseLaunchParameters(new URLSearchParams('mode=lre&id-lre=12')).demande.dateLre, undefined);
});
test('les champs POST priment sur la query, sans altérer celle-ci', () => {
  const query = new URLSearchParams('mode=ais');
  assert.equal(mergePostedParameters(query, '{"mode":"lre"}').get('mode'), 'lre');
  assert.equal(query.get('mode'), 'ais');
});
test('les paramètres malformés sont rejetés', () => {
  for (const jsonDoc of ['[1]', 'true', '{']) assert.throws(() => parseLaunchParameters(new URLSearchParams({jsonDoc})));
});
test('les erreurs archivage et purge affichent le contexte LRE', () => {
  const lre = {idLre:'12'};
  for (const code of ['LRE_ARCHIVEE', 'LRE_PURGEE']) {
    const error = toViewerError(404, {code}, lre);
    assert.equal(error.contactSupport, false);
    assert.deepEqual(error.lre, lre);
  }
});
test('les messages métier du serveur sont conservés', () => {
  assert.equal(toViewerError(400, {messages:[{code:'PARAMETRE_ABSENT',libelle:'Message historique'}]}).message, 'Message historique');
  assert.equal(toViewerError(401, {}).cause, 'Authentification');
});
