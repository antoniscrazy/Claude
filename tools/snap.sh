#!/bin/bash
# Erzeugt je Spiel einen Zwischenstand-Commit (nur dieser Ordner) + Wiederherstellungs-Commit. Ausgabe: slug SHA
set -e
cur=$(git rev-parse HEAD); full=$(git rev-parse 'HEAD^{tree}')
for g in "$@"; do
  t=$(git rev-parse "HEAD:$g")
  tree=$(printf '040000 tree %s\t%s\n' "$t" "$g" | git mktree)
  c=$(git commit-tree "$tree" -p "$cur" -m "Zwischenstand fuer jsDelivr ($g)")
  cur=$(git commit-tree "$full" -p "$c" -m "Restore repo files after jsDelivr snapshot ($g)")
  echo "$g $c"
done
echo "TIP $cur"
