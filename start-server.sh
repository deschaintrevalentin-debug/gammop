#!/bin/bash
# Serveur local GAMMOP.
# Le site utilise des URL de chemin (/discord, /joueur/xxx...) : un serveur de
# fichiers classique renverrait 404. Ce serveur reproduit le comportement de
# Vercel en repliant les chemins inconnus sur index.html.

cd "$(dirname "$0")"

echo "Demarrage du serveur GAMMOP sur http://localhost:8000"
echo "Ctrl+C pour arreter."
echo ""

python3 - "$@" <<'PYEOF'
import http.server, os, socketserver, sys

PORT = 8000

class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        target = os.path.join(os.getcwd(), path.lstrip('/'))
        # Fichier ou dossier existant : comportement normal
        if path == '/' or os.path.exists(target):
            return super().do_GET()
        # Chemin applicatif inconnu : on sert index.html (repli type Vercel)
        self.path = '/index.html'
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(('', PORT), SpaHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
PYEOF
