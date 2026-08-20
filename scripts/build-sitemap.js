/**
 * Genere sitemap.xml depuis les donnees reelles du site.
 *
 * Usage : node scripts/build-sitemap.js
 *
 * Le sitemap declare les routes statiques et toutes les routes parametrees
 * (une par saison, par joueur et par jeu), avec la date de derniere modification
 * deduite des donnees. Aucune dependance : bibliotheque standard de Node.
 */
const fs = require('fs');
const path = require('path');
const ROUTES = require('../routes.js');

const SUPABASE_URL = 'https://kxpixfddhqltyxnmeuzl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cGl4ZmRkaHFsdHl4bm1ldXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODk5NDIsImV4cCI6MjA4NTQ2NTk0Mn0.9Ld6co_CfTt3JBzjySpkDH_PVIYXf9h8QBqUPlmpPxE';

function isoDay(value) {
    const date = value ? new Date(value) : new Date();
    return date.toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod, changefreq, priority) {
    return [
        '    <url>',
        '        <loc>' + loc + '</loc>',
        '        <lastmod>' + lastmod + '</lastmod>',
        '        <changefreq>' + changefreq + '</changefreq>',
        '        <priority>' + priority + '</priority>',
        '    </url>'
    ].join('\n');
}

async function main() {
    const response = await fetch(
        SUPABASE_URL + '/rest/v1/seasons?select=name,game,date,players&order=date.asc',
        { headers: { apikey: SUPABASE_ANON_KEY } }
    );
    if (!response.ok) throw new Error('Supabase ' + response.status);
    const rows = await response.json();

    const lastSeasonDate = rows.length ? rows[rows.length - 1].date : null;
    const siteLastmod = isoDay(lastSeasonDate);

    const entries = [];

    // Routes statiques
    for (const [routePath] of ROUTES.STATIC_ROUTES) {
        const priority = routePath === '/' ? '1.0' : (routePath.split('/').length > 2 ? '0.5' : '0.8');
        entries.push(urlEntry(ROUTES.SITE_ORIGIN + routePath, siteLastmod, 'weekly', priority));
    }

    // Une page par annee jouee
    const years = new Set();
    for (const row of rows) {
        if (row.date) years.add(new Date(row.date).getFullYear());
    }
    for (const year of [...years].sort()) {
        entries.push(urlEntry(ROUTES.SITE_ORIGIN + '/classement-annuel/' + year, siteLastmod, 'monthly', '0.6'));
    }

    // Une page par saison, datee du jour de la partie
    for (const row of rows) {
        if (!row.name) continue;
        entries.push(urlEntry(
            ROUTES.SITE_ORIGIN + ROUTES.pathForSeason(row.name), isoDay(row.date), 'yearly', '0.5'
        ));
    }

    // Une page par jeu, datee de sa derniere saison
    const gameLast = new Map();
    for (const row of rows) {
        if (row.game) gameLast.set(row.game, row.date);
    }
    for (const [game, date] of gameLast) {
        entries.push(urlEntry(ROUTES.SITE_ORIGIN + ROUTES.pathForGame(game), isoDay(date), 'monthly', '0.6'));
        entries.push(urlEntry(ROUTES.SITE_ORIGIN + ROUTES.pathForGame(game, true), isoDay(date), 'monthly', '0.5'));
    }

    // Une page par joueur, datee de sa derniere participation
    const playerLast = new Map();
    for (const row of rows) {
        for (const player of row.players || []) playerLast.set(player, row.date);
    }
    for (const [player, date] of [...playerLast].sort()) {
        entries.push(urlEntry(ROUTES.SITE_ORIGIN + ROUTES.pathForPlayer(player), isoDay(date), 'monthly', '0.6'));
    }

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- Genere par scripts/build-sitemap.js — ne pas editer a la main -->',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries.join('\n'),
        '</urlset>',
        ''
    ].join('\n');

    const target = path.join(__dirname, '..', 'sitemap.xml');
    fs.writeFileSync(target, xml, 'utf8');
    console.log('sitemap.xml ecrit : ' + entries.length + ' URL (' + rows.length + ' saisons, '
        + playerLast.size + ' joueurs, ' + gameLast.size + ' jeux)');
}

main().catch(function (err) {
    console.error('Echec de la generation du sitemap :', err.message);
    process.exit(1);
});
