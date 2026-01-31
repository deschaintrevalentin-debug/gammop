#!/bin/bash
# Script pour lancer GAMMOP avec le proxy Discord

echo "🚀 Démarrage de GAMMOP..."
echo ""

# Lancer le proxy Discord en arrière-plan
echo "📡 Démarrage du proxy Discord sur http://localhost:3000..."
node discord-proxy.js &
PROXY_PID=$!

# Attendre que le proxy démarre
sleep 2

# Lancer le serveur web
echo "🌐 Démarrage du serveur web sur http://localhost:8000..."
echo ""
echo "✅ GAMMOP est prêt !"
echo "📍 Ouvrez votre navigateur sur : http://localhost:8000"
echo ""
echo "🛑 Pour arrêter : Ctrl+C"
echo ""

# Fonction pour arrêter proprement
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $PROXY_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Lancer le serveur Python
python3 -m http.server 8000
