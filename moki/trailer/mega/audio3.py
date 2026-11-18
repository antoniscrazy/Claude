# Musik fuer den Mega-Update-Trailer v2 (90 s, 128 BPM), am Computer erzeugt. Aufruf: python3 audio3.py <ausgabe.wav>
import numpy as np, wave, sys
sr=44100; T=90.0; n=int(sr*T); B=60/128
out=np.zeros(n); rng=np.random.default_rng(7)
def add(sig,at,g=1.0):
    i=int(at*sr)
    if i<0 or i>=n: return
    j=min(n,i+len(sig)); out[i:j]+=sig[:j-i]*g
def env(d,a=.003,r=6):
    x=np.arange(int(d*sr))/sr; return np.minimum(1,x/a)*np.exp(-x*r),x
def kick():
    e,x=env(.35,.002,9); ph=2*np.pi*(45*x+(140-45)*(1-np.exp(-x*35))/35); return np.sin(ph)*e
def snare():
    e,x=env(.2,.002,18); return (rng.standard_normal(len(x))*.6+np.sin(2*np.pi*200*x)*.4)*e
def hat():
    e,x=env(.05,.001,90); return rng.standard_normal(len(x))*e*.18
def saw(f,d,g=.12):
    e,x=env(d,.01,2.5); s=sum(2*((f*k*x)%1)-1 for k in(.995,1,1.005))/3; return s*e*g
def rise(d,g=.25):
    x=np.arange(int(d*sr))/sr; f=200+2400*(x/d)**2; ph=2*np.pi*np.cumsum(f)/sr; return np.sin(ph)*(x/d)*g+rng.standard_normal(len(x))*(x/d)**2*.15*g
def crash(d=2.5,g=.35):
    x=np.arange(int(d*sr))/sr; return rng.standard_normal(len(x))*np.exp(-x*1.6)*g
def boom(d=2.5,g=1.0):
    x=np.arange(int(d*sr))/sr; return np.sin(2*np.pi*(40+50*np.exp(-x*3))*x)*np.exp(-x*2.2)*g
# Takte
beats=int(T/B)
for b in range(beats):
    t=b*B
    if t>=T-0.5: break
    if b%4==0: add(kick(),t,.9)
    if b%4 in(1,3): add(snare(),t,.5)
    for k in range(2): add(hat(),t+k*B/2,1)
# Bassline (A-Moll) 16tel-Ansatz, pro Takt ein Ton
bass=[57,57,60,64,55,55,59,62]  # MIDI
for b in range(beats):
    f=440*2**((bass[(b//2)%len(bass)]-69)/12)*0.5
    add(saw(f,B*2,.10),b*B,1)
# Akkord-Pad
for b in range(0,beats,4):
    for m in(69,72,76):
        add(saw(440*2**((m-69)/12),B*4,.04),b*B,1)
# Risers und Einsaetze
for at in (5.0,12.0,24.0,34.0,46.0,56.0,68.0,82.0):
    if at-2.0>0: add(rise(2.0),at-2.0,1)
    add(crash(),at,1)
add(boom(),0.0,1); add(boom(),5.0,1); add(boom(),82.0,.9)
for at in (12.0,24.0,46.0,56.0,68.0): add(boom(),at,.6)
m=np.max(np.abs(out)); out=out/m*0.9 if m>0 else out
fade=int(sr*1.0); out[-fade:]*=np.linspace(1,0,fade)
pcm=(out*32767).astype('<i2')
w=wave.open(sys.argv[1],'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes()); w.close()
print('ok',len(pcm)/sr)
