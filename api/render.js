/**
 * GAMMOP — rendu des metadonnees par route.
 *
 * Le site est une application a page unique : sans cette fonction, le HTML servi
 * serait identique pour toutes les URL et les robots d'indexation liraient partout
 * le meme <title>. Vercel redirige donc les routes propres ici (voir vercel.json) :
 * on lit index.html une fois, on y injecte les metadonnees de la route demandee,
 * et on renvoie le tout. Le JavaScript de la page continue de faire son travail
 * normalement ensuite.
 *
 * Aucune dependance : uniquement la bibliotheque standard de Node.
 */
const fs = require('fs');
const path = require('path');
const ROUTES = require('../routes.js');

const SUPABASE_URL = 'https://kxpixfddhqltyxnmeuzl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cGl4ZmRkaHFsdHl4bm1ldXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODk5NDIsImV4cCI6MjA4NTQ2NTk0Mn0.9Ld6co_CfTt3JBzjySpkDH_PVIYXf9h8QBqUPlmpPxE';

// Caches de processus : une instance chaude ressert sans refaire le travail.
let htmlCache = null;
let namesCache = null;
let namesCacheAt = 0;
const NAMES_TTL_MS = 10 * 60 * 1000;

function readTemplate() {
    if (htmlCache) return htmlCache;
    // includeFiles (vercel.json) place index.html a cote du bundle de la fonction
    const candidates = [
        path.join(process.cwd(), 'index.html'),
        path.join(__dirname, '..', 'index.html')
    ];
    for (const file of candidates) {
        try {
            htmlCache = fs.readFileSync(file, 'utf8');
            return htmlCache;
        } catch (err) { /* on essaie le chemin suivant */ }
    }
    throw new Error('index.html introuvable');
}

/** Noms reels des saisons, jeux et joueurs, pour resoudre les slugs. */
async function loadNames() {
    if (namesCache && Date.now() - namesCacheAt < NAMES_TTL_MS) return namesCache;

    const response = await fetch(
        SUPABASE_URL + '/rest/v1/seasons?select=name,game,players',
        { headers: { apikey: SUPABASE_ANON_KEY } }
    );
    if (!response.ok) throw new Error('Supabase ' + response.status);

    const rows = await response.json();
    const seasons = new Map();
    const games = new Map();
    const players = new Map();

    for (const row of rows) {
        if (row.name) seasons.set(ROUTES.slugify(row.name), row.name);
        if (row.game) games.set(ROUTES.slugify(row.game), row.game);
        for (const player of row.players || []) {
            players.set(ROUTES.slugify(player), player);
        }
    }

    namesCache = { seasons, games, players };
    namesCacheAt = Date.now();
    return namesCache;
}

/** Nom reel derriere un slug, ou null si la route n'est pas parametree. */
async function resolveName(cleanPath) {
    const parts = cleanPath.split('/').filter(Boolean);
    const kinds = { saison: 'seasons', joueur: 'players', jeu: 'games' };
    const kind = kinds[parts[0]];
    if (!kind || !parts[1]) return null;
    try {
        const names = await loadNames();
        return names[kind].get(parts[1]) || null;
    } catch (err) {
        // Base injoignable : on retombe sur le slug, jamais sur une erreur 500
        return null;
    }
}

function escapeAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Remplace la valeur de l'attribut d'une balise reperee par son id. */
function setAttributeById(html, id, attribute, value) {
    const pattern = new RegExp(
        '(<[^>]*\\bid="' + id + '"[^>]*\\b' + attribute + '=")[^"]*(")'
    );
    if (pattern.test(html)) return html.replace(pattern, '$1' + escapeAttribute(value) + '$2');
    // La balise existe mais sans l'attribut vise : on l'ajoute
    const withoutAttribute = new RegExp('(<[^>]*\\bid="' + id + '")');
    return html.replace(withoutAttribute, '$1 ' + attribute + '="' + escapeAttribute(value) + '"');
}

function buildHtml(template, meta, url) {
    let html = template;
    html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + escapeAttribute(meta.title) + '</title>');
    html = setAttributeById(html, 'metaDescription', 'content', meta.description);
    html = setAttributeById(html, 'metaOgTitle', 'content', meta.title);
    html = setAttributeById(html, 'metaOgDescription', 'content', meta.description);
    html = setAttributeById(html, 'metaTwitterTitle', 'content', meta.title);
    html = setAttributeById(html, 'metaTwitterDescription', 'content', meta.description);
    html = setAttributeById(html, 'metaOgUrl', 'content', url);
    html = setAttributeById(html, 'metaCanonical', 'href', url);
    html = setAttributeById(html, 'metaOgImage', 'content', ROUTES.OG_IMAGE);
    html = setAttributeById(html, 'metaTwitterImage', 'content', ROUTES.OG_IMAGE);
    return html;
}

module.exports = async function handler(request, response) {
    // La reecriture Vercel passe le chemin d'origine dans le parametre p
    const query = request.query || {};
    const raw = String(query.p || request.url || '/').split('?')[0];
    const cleanPath = raw.replace(/\/+$/, '') || '/';

    let template;
    try {
        template = readTemplate();
    } catch (err) {
        response.status(500).send('Template introuvable');
        return;
    }

    const resolved = await resolveName(cleanPath);
    const meta = ROUTES.metaForPath(cleanPath, resolved);
    // Chemin inconnu : canonique vers l'accueil et statut 404, pour ne pas laisser
    // les moteurs indexer des URL qui n'existent pas
    const url = ROUTES.SITE_ORIGIN + (meta.found ? cleanPath : '/');

    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Cache CDN : la quasi-totalite des requetes ne reveille jamais la fonction
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
    response.status(meta.found ? 200 : 404).send(buildHtml(template, meta, url));
};
