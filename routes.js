/**
 * GAMMOP — table de routes et metadonnees, source unique.
 *
 * Ce fichier est charge a la fois par la page (balise <script src="/routes.js">)
 * et par la fonction de rendu serveur (api/render.js). Les titres et descriptions
 * ne doivent donc etre ecrits qu'ici : toute duplication finirait par diverger.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.GAMMOP_ROUTES = factory();
}(typeof self !== 'undefined' ? self : this, function () {

    var SITE_NAME = 'GAMMOP';
    var SITE_ORIGIN = 'https://www.gammop.com';
    var OG_IMAGE = SITE_ORIGIN + '/og-image.png';

    /** Slug normalise : minuscules, accents translitteres, espaces en tirets. */
    function slugify(value) {
        var raw = String(value == null ? '' : value);
        var slug = raw
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        // Pseudo entierement non latin : on retombe sur un encodage sur
        return slug || encodeURIComponent(raw);
    }

    /** Routes statiques : [chemin, identifiant de vue]. */
    var STATIC_ROUTES = [
        ['/', 'home'],
        ['/discord', 'discord'],
        ['/classement-actuel', 'recent'],
        ['/classement-actuel/evolution', 'leaders-recent'],
        ['/classement-general', 'general'],
        ['/classement-general/evolution', 'leaders'],
        ['/classement-annuel', 'years'],
        ['/palmares', 'years-palmares'],
        ['/vainqueurs', 'winners'],
        ['/vainqueurs/palmares', 'winners-palmares'],
        ['/saisons-speciales', 'special-winners'],
        ['/saisons-speciales/palmares', 'special-palmares'],
        ['/saisons-speciales/organisateurs', 'special-organizers'],
        ['/statistiques', 'stats'],
        ['/statistiques/globales', 'stats-globales'],
        ['/statistiques/classement-actuel', 'stats-classement-actuel'],
        ['/statistiques/classement-general', 'stats-classement-general'],
        ['/statistiques/classement-annuel', 'stats-classement-annuel'],
        ['/statistiques/par-jeux', 'stats-par-jeux'],
        ['/statistiques/faits-interessants', 'stats-faits-interessants'],
        ['/statistiques/pommes-rouges', 'years-stats'],
        ['/jeux', 'games'],
        ['/mentions-legales', 'mentions-legales']
    ];

    var PATH_TO_VIEW = {};
    var VIEW_TO_PATH = {};
    STATIC_ROUTES.forEach(function (entry) {
        PATH_TO_VIEW[entry[0]] = entry[1];
        if (!VIEW_TO_PATH[entry[1]]) VIEW_TO_PATH[entry[1]] = entry[0];
    });

    /** Anciens fragments -> vue, y compris des graphies qui n'ont jamais existe. */
    var LEGACY_HASH_TO_VIEW = {
        'home': 'home', 'discord': 'discord',
        'recent': 'recent', 'current': 'recent',
        'general': 'general',
        'years': 'years', 'annual': 'years',
        'winners': 'winners', 'winners-palmares': 'winners-palmares',
        'special-winners': 'special-winners', 'special': 'special-winners',
        'special-palmares': 'special-palmares', 'special-organizers': 'special-organizers',
        'stats': 'stats', 'games': 'games',
        'leaders': 'leaders', 'leaders-recent': 'leaders-recent',
        'years-palmares': 'years-palmares', 'years-stats': 'years-stats',
        'stats-globales': 'stats-globales',
        'stats-classement-actuel': 'stats-classement-actuel',
        'stats-classement-general': 'stats-classement-general',
        'stats-classement-annuel': 'stats-classement-annuel',
        'stats-par-jeux': 'stats-par-jeux',
        'stats-faits-interessants': 'stats-faits-interessants',
        'mentions-legales': 'mentions-legales'
    };

    /** [titre, description] par vue. Descriptions calibrees entre 140 et 160 caracteres. */
    var PAGE_META = {
        'home': ['GAMMOP — Serveur Discord de mini-jeux', 'GAMMOP, le serveur Discord de mini-jeux : retrouvez tous les classements, les palmarès et les statistiques des joueurs, saison après saison.'],
        'discord': ['Classements et statistiques — GAMMOP', 'Récompenses, classements, chiffres clés et liste des mini-jeux du serveur Discord GAMMOP, mis à jour à chaque nouvelle saison officielle.'],
        'recent': ['Classement actuel — GAMMOP', 'Le classement GAMMOP calculé sur les dix dernières saisons officielles : la forme récente des joueurs du serveur Discord, mise à jour en continu.'],
        'general': ['Classement général — GAMMOP', 'Le classement général de GAMMOP sur toutes les saisons officielles depuis 2018 : points, victoires, podiums et divisions de chaque joueur.'],
        'years': ['Classement annuel — GAMMOP', 'Les classements annuels de GAMMOP, année par année : points, participations et champion de chaque année du serveur Discord de mini-jeux.'],
        'winners': ['Vainqueurs — GAMMOP', 'La liste complète des parties officielles de GAMMOP et de leurs vainqueurs, de la plus récente à la plus ancienne, avec le rang de chaque victoire.'],
        'winners-palmares': ['Palmarès des vainqueurs — GAMMOP', 'Le palmarès des joueurs de GAMMOP classés par nombre de victoires en saison officielle, avec le détail des parties remportées par jeu.'],
        'special-winners': ['Saisons spéciales — GAMMOP', 'Les vainqueurs des saisons spéciales de GAMMOP et leurs poires : les parties hors classement général du serveur Discord de mini-jeux.'],
        'special-palmares': ['Palmarès des saisons spéciales — GAMMOP', 'Palmarès et statistiques des saisons spéciales de GAMMOP : victoires en poires et nombre de saisons organisées par chaque joueur.'],
        'special-organizers': ['Organisateurs des saisons spéciales — GAMMOP', 'Les joueurs qui organisent les saisons spéciales du serveur Discord GAMMOP, avec le détail des parties qu\'ils ont mises en place.'],
        'stats': ['Statistiques — GAMMOP', 'Toutes les statistiques du serveur GAMMOP : taux de participation, taux de victoire, records par jeu et faits marquants de chaque année.'],
        'games': ['Jeux — GAMMOP', 'Tous les mini-jeux du serveur Discord GAMMOP : Majority, Kulture, Hungerity, GuessWat et les autres, avec leurs règles et leurs classements.'],
        'leaders': ['Évolution des leaders — GAMMOP', 'L\'évolution du leader du classement général de GAMMOP saison après saison : qui a dominé le serveur Discord et pendant combien de temps.'],
        'leaders-recent': ['Évolution des leaders (forme récente) — GAMMOP', 'L\'évolution du leader du classement actuel de GAMMOP au fil des saisons : la domination récente sur le serveur Discord de mini-jeux.'],
        'years-palmares': ['Palmarès — GAMMOP', 'Le palmarès annuel de GAMMOP : le champion de chaque année, sa pomme rouge, le nombre de jeux et de participants de la saison écoulée.'],
        'years-stats': ['Statistiques des pommes rouges — GAMMOP', 'Statistiques détaillées des champions annuels de GAMMOP : détenteurs, années récompensées, écarts de points et séries de titres consécutifs.'],
        'stats-globales': ['Statistiques globales — GAMMOP', 'Les statistiques globales du serveur GAMMOP : participation, victoires et régularité de tous les joueurs sur l\'ensemble des saisons.'],
        'stats-classement-actuel': ['Statistiques du classement actuel — GAMMOP', 'Les statistiques détaillées du classement actuel de GAMMOP : forme récente, séries en cours et performances sur les dernières saisons.'],
        'stats-classement-general': ['Statistiques du classement général — GAMMOP', 'Les statistiques détaillées du classement général de GAMMOP : records de points, de victoires et de podiums sur toute l\'histoire du serveur.'],
        'stats-classement-annuel': ['Statistiques du classement annuel — GAMMOP', 'Les statistiques détaillées des classements annuels de GAMMOP : meilleures années, records de points et régularité des joueurs.'],
        'stats-par-jeux': ['Statistiques par jeux — GAMMOP', 'Les statistiques du serveur GAMMOP jeu par jeu : nombre de saisons, vainqueurs et meilleurs joueurs de chaque mini-jeu du Discord.'],
        'stats-faits-interessants': ['Faits intéressants — GAMMOP', 'Les faits marquants et les records de l\'histoire de GAMMOP : séries, remontées, dominations et curiosités du serveur Discord de mini-jeux.'],
        'mentions-legales': ['Mentions légales — GAMMOP', 'Mentions légales, hébergement et politique de données personnelles du site GAMMOP, le serveur Discord de mini-jeux édité par Emmop.']
    };

    /** Chemin d'une vue, avec parametre eventuel (annee). */
    function pathForView(view, param) {
        if (view === 'years' && param) return '/classement-annuel/' + param;
        return VIEW_TO_PATH[view] || '/';
    }

    function pathForSeason(name) { return '/saison/' + slugify(name); }
    function pathForPlayer(name) { return '/joueur/' + slugify(name); }
    function pathForGame(name, palmares) {
        return '/jeu/' + slugify(name) + (palmares ? '/palmares' : '');
    }

    /**
     * Metadonnees d'un chemin, sans acces aux donnees.
     * `resolved` fournit le nom reel des routes parametrees quand il est connu.
     * Retourne toujours un objet : une route inconnue retombe sur l'accueil.
     */
    function metaForPath(path, resolved) {
        var clean = (path || '/').split('?')[0].replace(/\/+$/, '') || '/';
        var name = resolved || null;

        if (PATH_TO_VIEW[clean]) {
            var entry = PAGE_META[PATH_TO_VIEW[clean]] || PAGE_META['home'];
            return { title: entry[0], description: entry[1], view: PATH_TO_VIEW[clean], found: true };
        }

        var parts = clean.split('/').filter(Boolean);

        if (parts[0] === 'classement-annuel' && parts[1]) {
            return {
                title: 'Classement annuel ' + parts[1] + ' — ' + SITE_NAME,
                description: 'Le classement GAMMOP de l\'année ' + parts[1] + ' : points, participations et champion de l\'année sur le serveur Discord de mini-jeux.',
                view: 'years', found: true
            };
        }
        if (parts[0] === 'joueur' && parts[1]) {
            var pseudo = name || parts[1];
            return {
                title: pseudo + ' — ' + SITE_NAME,
                description: 'Le profil de ' + pseudo + ' sur GAMMOP : classements, points, victoires, palmarès et statistiques détaillées sur le serveur Discord.',
                view: 'discord', found: true
            };
        }
        if (parts[0] === 'saison' && parts[1]) {
            var saison = name || parts[1];
            return {
                title: saison + ' — ' + SITE_NAME,
                description: 'Le classement complet de la saison ' + saison + ' sur GAMMOP : vainqueur, participants et résultats détaillés de la partie.',
                view: 'winners', found: true
            };
        }
        if (parts[0] === 'jeu' && parts[1]) {
            var jeu = name || parts[1];
            if (parts[2] === 'palmares') {
                return {
                    title: 'Palmarès ' + jeu + ' — ' + SITE_NAME,
                    description: 'Le palmarès du jeu ' + jeu + ' sur GAMMOP : les joueurs les plus titrés et le détail de leurs victoires sur ce mini-jeu.',
                    view: 'games', found: true
                };
            }
            return {
                title: jeu + ' — ' + SITE_NAME,
                description: 'Le jeu ' + jeu + ' sur GAMMOP : règles, saisons jouées, classement des joueurs et vainqueurs de chaque partie du serveur Discord.',
                view: 'games', found: true
            };
        }

        // Chemin inconnu : on sert l'application, mais sans pretendre que la page existe
        var home = PAGE_META['home'];
        return { title: home[0], description: home[1], view: 'home', found: clean === '/' };
    }

    return {
        SITE_NAME: SITE_NAME,
        SITE_ORIGIN: SITE_ORIGIN,
        OG_IMAGE: OG_IMAGE,
        slugify: slugify,
        STATIC_ROUTES: STATIC_ROUTES,
        PATH_TO_VIEW: PATH_TO_VIEW,
        VIEW_TO_PATH: VIEW_TO_PATH,
        LEGACY_HASH_TO_VIEW: LEGACY_HASH_TO_VIEW,
        PAGE_META: PAGE_META,
        pathForView: pathForView,
        pathForSeason: pathForSeason,
        pathForPlayer: pathForPlayer,
        pathForGame: pathForGame,
        metaForPath: metaForPath
    };
}));
