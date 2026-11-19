# Erzeugt die temporaere Aufnahme-Seite _trailer-moki.html (nur fuer den Trailer, nicht fuer die echte Seite):
# Termin des Mega-Updates auf Freitag, 20.11.2026, 11:30 Uhr gesetzt. Danach nach der Aufnahme wieder loeschen.
import os
here=os.path.dirname(os.path.abspath(__file__)); root=os.path.abspath(os.path.join(here,'..','..'))
s=open(os.path.join(root,'moki.html'),encoding='utf-8').read()
for a,b in [('new Date("2026-12-02T00:00:00+01:00")','new Date("2026-11-20T11:30:00+01:00")'),
            ('Am 2. Dezember 2026 um 00:00 Uhr. Der Timer läuft schon.','Am Freitag, 20. November 2026 um 11:30 Uhr. Der Timer läuft schon.')]:
    print(a[:40],s.count(a)); s=s.replace(a,b)
open(os.path.join(root,'_trailer-moki.html'),'w',encoding='utf-8').write(s)
