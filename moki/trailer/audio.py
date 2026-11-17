import numpy as np, wave, sys
sr=44100; T=34; n=sr*T; t=np.arange(n)/sr
rng=np.random.default_rng(7); out=np.zeros(n)
B=.5; T0=1.0
def add(sig,at,g=1.0):
    i=int(at*sr)
    if i>=n: return
    j=min(n,i+len(sig)); out[i:j]+=sig[:j-i]*g
def lp(x,fc):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/sr); X*=1/(1+(f/fc)**4); return np.fft.irfft(X,len(x))
def env(d,a=.005,r=5):
    x=np.arange(int(d*sr))/sr; return np.minimum(1,x/a)*np.exp(-x*r),x
def kick():
    e,x=env(.5,.002,6); ph=2*np.pi*(42*x+(150-42)*(1-np.exp(-x*30))/30); return (np.sin(ph)+.25*np.sin(2*ph))*e
def snare():
    e,x=env(.3,.002,14); return (rng.standard_normal(len(x))*.8+np.sin(2*np.pi*190*x)*.5)*e
def clap():
    x=np.arange(int(.25*sr))/sr; e=sum(np.exp(-np.maximum(x-d,0)*45)*(x>=d) for d in(0,.012,.024)); return lp(rng.standard_normal(len(x)),6000)*e*.7
def hat(o=False):
    e,x=env(.25 if o else .05,.001,12 if o else 90); return rng.standard_normal(len(x))*e*.25
def boom(d=2.2):
    x=np.arange(int(d*sr))/sr; return (np.sin(2*np.pi*(40+60*np.exp(-x*3))*x)*1.1+lp(rng.standard_normal(len(x)),400)*.8)*np.exp(-x*2.3)
def crash(d=2.5):
    x=np.arange(int(d*sr))/sr; return rng.standard_normal(len(x))*np.exp(-x*1.8)*.35
def saw(f,x): return 2*((f*x)%1)-1
def tone(f,d,kind='lead',a=.01,r=3.0):
    e,x=env(d,a,r)
    if kind=='pad': s=sum(saw(f*dt,x) for dt in(.994,1.0,1.006))/3
    elif kind=='bass': s=np.sin(2*np.pi*f*x)+.4*np.sin(4*np.pi*f*x)
    elif kind=='pluck': s=(saw(f,x)+.5*np.sin(2*np.pi*f*2*x))/1.5; 
    else: s=(saw(f,x)*.7+np.sign(np.sin(2*np.pi*f*x))*.3)
    return s*e
def nf(m): return 440*2**((m-69)/12)
# Akkorde Am - F - C - G (je 2 s = ein Takt), Start bei 1.0
CH=[(45,[57,60,64]),(41,[53,57,60]),(48,[55,60,64]),(43,[55,59,62])]
# 1) Intro 0-1: Riser + Drone
m=t<T0
ph=2*np.pi*np.cumsum(80+(t/T0)**2*900)/sr
out+=np.where(m,np.sin(ph)*(t/T0)**2*.35,0)+np.where(m,lp(rng.standard_normal(n),3000)*(t/T0)**3*.25,0)
add(boom(),0.0,.5)
# 2) Drop 1.0 (Doppel-Hit "Ta-dum")
add(boom(2.6),T0,1.2); add(crash(),T0,.8); add(kick(),T0,1.0)
# 3) Takte ab 1.0 bis 12.5 (5.75 Takte)
bar=0
while T0+bar*2*B*2 < 12.5 and False: bar+=1
for k in range(int((31.0-T0)/(B*4))+1):
    b0=T0+k*B*4; root,ch=CH[k%4]
    # Pad, Bass
    for mm in ch:
        add(lp(tone(nf(mm),B*4,'pad',.4,.25),2200),b0,.07)
    for q in range(4):
        add(tone(nf(root),B,'bass',.005,2.0),b0+q*B,.32)
        add(tone(nf(root+12),B/2*.9,'bass',.005,6),b0+q*B+B/2,.12)
    # Arp 16tel
    pat=[0,1,2,1,2,1,0,2]
    for q in range(8):
        mm=ch[pat[q]]+12
        if b0>=5.0 or q%2==0: add(lp(tone(nf(mm),.22,'pluck',.003,9),5000),b0+q*B/2,.11)
    # Melodie ab Takt 3 (b0>=3.0)
    if b0>=5.0 and not (25.0<=b0<27.0):
        mel=[ch[2]+12,ch[1]+12,ch[2]+12,ch[0]+24] if k%2 else [ch[0]+24,ch[2]+12,ch[1]+12,ch[2]+12]
        for q,mm in enumerate(mel): add(lp(tone(nf(mm),B*.95,'lead',.01,2.5),4500),b0+q*B,.12)
# Drums
FIN=31.0
b=T0
while b<FIN-1e-6:
    ad=25.0<=b<27.0
    if not ad: add(kick(),b,.95)
    elif int(round((b-25.0)/B))%2==0: add(kick(),b,.5)
    if b>=5.0 and not ad:
        if round((b-T0)/B)%2==1: add(snare(),b,.5); add(clap(),b,.5)
        add(hat(),b+B/2,.5); add(hat(),b+B/4,.25); add(hat(),b+3*B/4,.25)
    else: add(hat(),b+B/2,.4)
    b+=B
# Crash an Sektionsgrenzen
for sct in (5.0,9.0,13.0,17.0,19.0,22.0,29.0): add(crash(1.8),sct,.5)
# Snare-Roll vor 25 (24-25)
for i in range(16):
    tt=24.0+i*.0625*(1-i/40); add(snare(),tt,.15+.025*i)
# Werbe-Szene 25-27: schrille Toene + Stoerrauschen, Riser 26-27
m2=(t>=25.0)&(t<27.0)
out+=np.where(m2,np.sign(np.sin(2*np.pi*466*t))*.06+np.sign(np.sin(2*np.pi*659*t))*.05,0)*(rng.random(n)>.35)
for k in range(10): add(lp(rng.standard_normal(int(.08*sr)),4000),25.0+k*.2,.35)
ph2=2*np.pi*np.cumsum(200+np.clip(t-26.0,0,1)**2*2500)/sr; u=(t>26.0)&(t<27.0); out+=np.where(u,np.sin(ph2)*.25*(t-26.0),0)
# Aufloesung bei 27.0: Boom, Akkord
add(boom(2.2),27.0,1.1); add(crash(2.0),27.0,.8)
# Snare-Roll vor 29
for i in range(16):
    tt=28.0+i*.0625*(1-i/40); add(snare(),tt,.12+.02*i)
# Riser vor Finale 30-31
u=(t>30.0)&(t<31.0); ph3=2*np.pi*np.cumsum(300+np.clip(t-30.0,0,1)**2*3500)/sr; out+=np.where(u,np.sin(ph3)*.25*(t-30.0)*2+lp(rng.standard_normal(n),5000)*.2*(t-30.0),0)
# 4) Finale 12.5: Akkord, Boom, Crash
add(boom(2.6),31.0,1.3); add(crash(3),31.0,1.0); add(kick(),31.0,1.0)
for mm in (45,57,60,64,69,72):
    add(lp(tone(nf(mm),2.8,'pad',.02,.9),3000),31.0,.14)
add(tone(nf(81),2.8,'lead',.02,1.2),31.0,.08)
# Sidechain-Pump auf die Takte
sc=np.ones(n)
for i in range(int(T0/B*1),int(31.0/B)):
    s=int(i*B*sr)
    if s>=n: break
    L=int(.22*sr); sc[s:s+L]*=np.linspace(.35,1,min(L,n-s))
out*=np.where(t>T0,sc,1)
out*=np.clip((T-t)/.7,0,1)
out=np.tanh(out*1.25); out/=max(abs(out).max(),1e-6); out*=.9
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype(np.int16).tobytes());w.close()
