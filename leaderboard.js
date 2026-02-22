/**
 * Leaderboard — GitHub Gist
 *
 * Configuration injectée au build par GitHub Actions :
 *   __GIST_TOKEN__  → token PAT scope "gist" uniquement
 *   __GIST_ID__     → ID du Gist qui stocke le JSON des scores
 *
 * En développement local, ces valeurs restent sous forme de placeholder
 * et le leaderboard utilisera des données mock.
 */

const GIST_TOKEN = '__GIST_TOKEN__';
const GIST_ID = '__GIST_ID__';
const GIST_FILE = 'snake_scores.json';

const IS_CONFIGURED = !GIST_TOKEN.startsWith('__') && !GIST_ID.startsWith('__');

// Données mock pour le dev local
const MOCK_SCORES = [
    { name: 'NOK', score: 990 },
    { name: 'AAA', score: 780 },
    { name: 'ZZZ', score: 650 },
    { name: 'CPU', score: 500 },
    { name: 'YOU', score: 300 },
];

/**
 * Lit le leaderboard depuis le Gist (public, pas besoin de token).
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
 * Écrit le nouveau score dans le Gist (PATCH, nécessite le token).
 * @param {string} name
 * @param {number} score
 */
async function submitScore(name, score) {
    if (!IS_CONFIGURED) {
        console.info('[Leaderboard] Mode local — score non soumis.');
        return;
    }
    try {
        // 1. Lecture des scores actuels
        const scores = await fetchLeaderboard();

        // 2. Ajout + tri + top 10
        scores.push({ name, score });
        scores.sort((a, b) => b.score - a.score);
        const top10 = scores.slice(0, 10);

        // 3. Écriture dans le Gist
        const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
            method: 'PATCH',
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${GIST_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: {
                    [GIST_FILE]: {
                        content: JSON.stringify(top10, null, 2),
                    },
                },
            }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || `HTTP ${res.status}`);
        }
        console.info('[Leaderboard] Score soumis avec succès !');
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
