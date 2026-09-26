// Board definitions mirror plateau.boards in supabase/migrations/0002_plateau.sql (keys must match).
// Titles and blurbs are translated in i18n (board_<key>_t / board_<key>_b).
export const BOARDS = [
  { key: 'lobby', space: 'research', group: 'general', color: '#16794A' },
  { key: 'methods', space: 'research', group: 'general', color: '#2F5BD3' },
  { key: 'finding-data', space: 'research', group: 'general', color: '#0E8A8A' },
  { key: 'papers', space: 'research', group: 'general', color: '#8A5CD0' },
  { key: 'show-your-work', space: 'research', group: 'general', color: '#C2410C' },
  { key: 'platform-help', space: 'research', group: 'general', color: '#78827B' },
  { key: 'tcga-gbm', space: 'research', group: 'datasets', color: '#1D4ED8' },
  { key: 'cgga', space: 'research', group: 'datasets', color: '#B91C1C' },
  { key: 'msk-impact', space: 'research', group: 'datasets', color: '#0F766E' },
  { key: 'cptac-gbm', space: 'research', group: 'datasets', color: '#A16207' },
  { key: 'newly-diagnosed', space: 'family', group: 'family', color: '#B45309' },
  { key: 'caregivers', space: 'family', group: 'family', color: '#BE5A38' },
  { key: 'questions-for-doctors', space: 'family', group: 'family', color: '#2F5BD3' },
  { key: 'everyday-life', space: 'family', group: 'family', color: '#16794A' },
  { key: 'remembrance', space: 'family', group: 'family', color: '#8A5CD0' },
];
export const boardsOf = (space) => BOARDS.filter((b) => b.space === space);
export const boardByKey = (key) => BOARDS.find((b) => b.key === key);
export const RESEARCH_ROLES = ['student', 'researcher', 'clinician', 'teacher', 'other'];
export const FAMILY_ROLES = ['patient', 'caregiver', 'family', 'other'];
export const TAGS = ['survival analysis', 'genomics', 'imaging', 'epidemiology', 'clinical trials', 'machine learning', 'neuro-oncology', 'statistics teaching'];
export const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,23}$/;
export const spaceBase = (space) => (space === 'family' ? '/families' : '/research');
export const tagKey = (tag) => `tag_${String(tag).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
