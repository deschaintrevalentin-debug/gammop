function parseNames(text) {
    return text.split('\n').map(l => {
        console.log('Ligne originale:', JSON.stringify(l));
        l = l.trim();
        if (!l) return null;

        // Supprimer "TOP" et les numéros au début
        l = l.replace(/^(TOP\s*)?\d+[\s:.\-)\]]*\s*/gi, '');
        console.log('Après suppression TOP:', JSON.stringify(l));

        // Supprimer les flèches et symboles de séparation avec regex
        // Chercher le pattern de flèches et prendre ce qui vient après
        const arrowMatch = l.match(/[-=]>|→|>>|[>|]/);
        if (arrowMatch) {
            // Prendre ce qui est après la flèche
            l = l.substring(arrowMatch.index + arrowMatch[0].length).trim();
        }
        console.log('Après flèches:', JSON.stringify(l));

        // Si contient ":" avec des chiffres après, garder seulement ce qui est avant
        if (l.includes(':')) {
            const parts = l.split(':');
            if (parts[1] && /\d/.test(parts[1])) l = parts[0];
        }

        // Supprimer les points/scores à la fin
        l = l.replace(/\s*\d+\s*pts?\.?$/i, '').replace(/\s*\d+\s*points?\.?$/i, '').replace(/\s+\d+$/, '').replace(/\s*\d+\s*pt$/i, '');

        // Supprimer TOUS les emojis
        l = l.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
        console.log('Après emojis:', JSON.stringify(l));

        // Supprimer le contenu entre parenthèses, crochets, accolades
        l = l.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, '');

        // Supprimer les caractères spéciaux en début/fin
        l = l.replace(/\s*[-_=+~#@%&*!?]+\s*$/g, '').replace(/^[-_=+~#@%&*!?]+\s*/g, '');

        // Nettoyer les répétitions
        l = l.replace(/\.{2,}/g, '').replace(/[!?]{2,}/g, '');

        // Normaliser les espaces multiples en un seul espace
        l = l.replace(/\s+/g, ' ').trim();

        // Supprimer les caractères non-alphanumériques au début et à la fin
        l = l.replace(/^[^\w\s]+|[^\w\s]+$/gu, '');

        console.log('Après nettoyage final:', JSON.stringify(l));
        console.log('Longueur:', l.length, 'Test regex:', /[a-zA-Z0-9_]/.test(l));

        // Accepter tout pseudo d'au moins 2 caractères contenant au moins une lettre ou chiffre
        return l.length >= 2 && /[a-zA-Z0-9_]/.test(l) ? l : null;
    }).filter(Boolean);
}

const test = `TOP 1 : Respawn -> 117 pts
TOP 2 : Trake -> 117 pts
TOP 3 : DawZ -> 114 pts
TOP 4 : Rolphy -> 111 pts
TOP 5 : Defa  -> 108 pts
TOP 6 : Ecarus -> 105 pts
TOP 7 : Sakeazey  -> 104 pts
TOP 8 : Maxilou ->  100 pts
TOP 9 : Magnep  -> 99 pts
TOP 10 : Theodiric -> 92 pts
TOP 11 : LiliAka -> 83 pts`;

console.log('\n=== RÉSULTAT FINAL ===');
const result = parseNames(test);
console.log('Nombre de pseudos:', result.length);
console.log('Pseudos:', result);
