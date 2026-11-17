import numpy as np, wave, sys
sr=44100; T=15; n=sr*T; t=np.arange(n)/sr
rng=np.random.default_rng(3); out=np.zeros(n)
def add(sig,at,g=1.0):
    i=int(at*sr); j=min(n,i+len(sig)); out[i:j]+=sig[:j-i]*g
def kick(d=.45,f0=140,f1=38):
    x=np.arange(int(d*sr))/sr; ph=2*np.pi*(f1*x+(f0-f1)*(1-np.exp(-x*25))/25); return np.sin(ph)*np.exp(-x*7)
def boom(d=1.6):
    x=np.arange(int(d*sr))/sr; nz=rng.standard_normal(len(x)); 
    lp=np.convolve(nz,np.ones(60)/60,'same'); return (np.sin(2*np.pi*45*x)*1.0+lp*1.5)*np.exp(-x*3)
def hat(d=.06): x=np.arange(int(d*sr))/sr; return rng.standard_normal(len(x))*np.exp(-x*70)*.3
def note(f,d,sh='saw'):
    x=np.arange(int(d*sr))/sr; s=sum(np.sin(2*np.pi*f*k*x)/k for k in range(1,7))*(1 if sh=='saw' else .4)
    return s*np.minimum(1,x*80)*np.exp(-x*4)
# Drohnen / Rumpeln bis 5.7
m=t<5.7; out+=np.sin(2*np.pi*55*t)*.25*np.clip(t/3,0,1)*m
r=rng.standard_normal(n); r=np.convolve(r,np.ones(200)/200,'same')
out+=r*3*np.clip((t-1.2)/1.0,0,1)*(t<2.2)*(t>1.2)*.5
for h in(2.2,3.15,4.55): add(boom(1.4),h,.9); add(kick(.5,120,30),h,.9)
# Brüllen/Riser 4.8-5.7
u=(t>4.8)&(t<5.7); ph=2*np.pi*np.cumsum(120+(t-4.8)*1800)/sr
out+=np.where(u,np.sin(ph)*np.clip((t-4.8)/.9,0,1)*.28,0)+np.where(u,r*6*np.clip((t-4.8)/.9,0,1)*.25,0)
add(boom(2.0),5.7,1.1)
# Trailer 6.6-13 @140bpm
b=60/140
k=0
while 6.6+k*b<13.0:
    add(kick(),6.6+k*b,.9)
    for e in(0,1): add(hat(),6.6+k*b+e*b/2+b/4*0,.5 if e else .3)
    k+=1
bass=[41.2,41.2,49.0,41.2,55.0,41.2,49.0,36.7]
for i in range(int((13.0-6.6)/(b/2))):
    add(note(bass[i%8]*2,b/2*.9),6.6+i*b/2,.18)
arp=[329.6,392,493.9,659.3,493.9,392]
for i in range(int((13.0-8.6)/(b/2))):
    add(note(arp[i%6],b/2,'sq'),8.6+i*b/2,.16)
# Finale
add(boom(2.0),13.0,1.2)
for f in(164.8,246.9,329.6,493.9): add(note(f,2.0)*np.exp(t[:int(2*sr)]*3.5),13.0,.12)
# Fade
out*=np.clip((T-t)/.5,0,1)
out=np.tanh(out*1.3); out/=max(abs(out).max(),1e-6); out*=.9
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype(np.int16).tobytes());w.close()
