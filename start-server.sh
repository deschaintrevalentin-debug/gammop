#!/bin/bash
# Script pour lancer le serveur local GAMMOP

echo "🚀 Démarrage du serveur GAMMOP..."
echo "📍 Ouvrez votre navigateur sur : http://localhost:8000"
echo "🛑 Pour arrêter le serveur : Ctrl+C"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000
