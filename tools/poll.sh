#!/bin/bash
# prueft alle Dateien eines Spiels auf jsDelivr (HTTP 200). Aufruf: poll.sh slug
cd /home/user/Claude; g=$1; snap=$(grep "^$g " /tmp/snaps.txt | cut -d' ' -f2)
for round in 1 2 3 4 5 6 7 8 9 10; do
  miss=0; : > /tmp/miss-$g.txt
  while IFS= read -r f; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 "https://cdn.jsdelivr.net/gh/antoniscrazy/Claude@$snap/$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$f")")
    [ "$code" != 200 ] && { miss=$((miss+1)); echo "$code $f" >> /tmp/miss-$g.txt; }
  done < <(git ls-tree -r --name-only $snap $g)
  echo "$g round $round missing=$miss"
  [ $miss = 0 ] && break; sleep 60
done > /tmp/poll-$g.log
