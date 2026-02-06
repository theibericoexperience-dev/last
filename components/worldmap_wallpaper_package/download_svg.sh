#!/usr/bin/env bash
# Script para descargar los SVGs desde GitHub raw.
# Ejecuta: bash download_svg.sh
set -e
echo "Descargando world-states-provinces.svg..."
curl -L -o world-states-provinces.svg \
  "https://raw.githubusercontent.com/raphaellepuschitz/SVG-World-Map/master/src/world-states-provinces.svg"
echo "Descargando world-states.svg (versión pequeña)..."
curl -L -o world-states.svg \
  "https://raw.githubusercontent.com/raphaellepuschitz/SVG-World-Map/master/src/world-states.svg"
echo "Listo. Ahora tienes los SVGs en este directorio."
