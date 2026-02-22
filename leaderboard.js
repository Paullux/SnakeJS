/**
 * Leaderboard — GitHub Gist (lecture) + workflow_dispatch (écriture)
 *
 * Architecture sécurisée :
 *   - Lecture  : GET public sur le Gist, pas de token nécessaire
 *   - Écriture : déclenche le workflow "submit-score.yml" via l'API GitHub
 *                Le GIST_TOKEN reste 100% côté serveur (secret GitHub Actions)
 *
 * Variables injectées au build par GitHub Actions (deploy.yml) :
 *   __ACTIONS_TOKEN__   → PAT fine-grained, scope "Actions: Read & write" uniquement
 *   __GIST_ID__         → ID du Gist public/secret des scores
 *   __REPO_OWNER__      → ex: Paullux
 *   __REPO_NAME__       → ex: SnakeJS
 */

const ACTIONS_TOKEN = '__ACTIONS_TOKEN__';
const GIST_ID = '__GIST_ID__';
const REPO_OWNER = '__REPO_OWNER__';
const REPO_NAME = '__REPO_NAME__';
const GIST_FILE = 'snake_scores.json';
const WORKFLOW_FILE = 'submit-score.yml';
const BRANCH = 'main';

const IS_CONFIGURED = !!ACTIONS_TOKEN && !ACTIONS_TOKEN.startsWith('__')
    && !!GIST_ID && !GIST_ID.startsWith('__');

// Données mock pour le développement local
const MOCK_SCORES = [
    { name: 'NOK', score: 990 },
    { name: 'AAA', score: 780 },
    { name: 'ZZZ', score: 650 },
    { name: 'CPU', score: 500 },
    { name: 'YOU', score: 300 },
];

/**
 * Lit le leaderboard depuis le Gist (public, aucun token nécessaire).
 * @returns {Promise<Array<{name:string, score:number}>>}
 */
async function fetchLeaderboard() {
    if (!IS_CONFIGURED) return MOCK_SCORES;
    try {
        const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const raw = data.files?.[GIST_FILE]?.content;
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.warn('[Leaderboard] Erreur lecture Gist :', e);
        return MOCK_SCORES;
    }
}

/**
 * Soumet un score en déclenchant le workflow GitHub Actions "submit-score.yml".
 * Le workflow s'exécute côté serveur avec le GIST_TOKEN (secret).
 * @param {string} name
 * @param {number} score
 */
async function submitScore(name, score) {
    if (!IS_CONFIGURED) {
        console.info('[Leaderboard] Mode local — score non soumis.');
        return;
    }
    try {
        const res = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/vnd.github+json',
                    Authorization: `Bearer ${ACTIONS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ref: BRANCH,
                    inputs: {
                        name: name.substring(0, 10).toUpperCase(),
                        score: String(score),
                    },
                }),
            }
        );

        if (res.status === 204) {
            console.info('[Leaderboard] Score soumis ! Mise à jour du leaderboard dans ~30s.');
        } else {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${res.status}`);
        }
    } catch (e) {
        console.warn('[Leaderboard] Erreur soumission :', e);
    }
}

/**
 * Affiche le leaderboard dans l'overlay #leaderboardScreen.
 */
async function loadLeaderboard() {
    const list = document.getElementById('lbList');
    if (!list) return;

    list.innerHTML = '<li style="opacity:.6;font-size:5px;justify-content:center">Chargement…</li>';

    const scores = await fetchLeaderboard();

    if (!scores || scores.length === 0) {
        list.innerHTML = '<li style="justify-content:center;font-size:5px">Aucun score</li>';
        return;
    }

    list.innerHTML = scores
        .map((s, i) => `<li><span>${i + 1}. ${s.name}</span><span>${s.score}</span></li>`)
        .join('');
}
