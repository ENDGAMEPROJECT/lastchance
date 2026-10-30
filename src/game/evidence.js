/* Every piece of evidence a run can collect, in district order. Ids/labels
   mirror each room's own addEvidence() call; keep them in sync. */
export function getAllEvidence(t, narrative) {
  return [
    { id: 'ev-links', label: 'The “deal” link was a look-alike domain, not the real store.' }, // LinkDistrict
    { id: 'ev-roulette', label: t('rooms.roulette.investigation.evidence') },
    { id: 'ev-influencer', label: t('rooms.influencer.evidenceLabel') },
    { id: 'ev-algo', label: t('rooms.algorithm.evidence', { friend: narrative.friend }) },
    { id: 'ev-ads', label: t('rooms.ads.evidence') },
    { id: 'ev-persuasion', label: t('rooms.persuasion.evidence') },
  ]
}
