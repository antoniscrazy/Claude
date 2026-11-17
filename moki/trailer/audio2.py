# Musik fuer den Trailer (am Computer erzeugt, keine echte Musik). Aufruf: python3 audio2.py <ausgabe.wav>
import numpy as np, wave, sys
L_MOKI=float(sys.argv[2]) if len(sys.argv)>2 else 54.0
STUDIO=14.0+L_MOKI; WALL=STUDIO+28.0; FIN=WALL+8.0; TEASE=FIN+6.0; T=TEASE+14.0
sr=44100; n=int(sr*T); t=np.arange(n)/sr; B=.5
rng=np.random.default_rng(11); out=np.zeros(n)
def add(sig,at,g=1.0):
    i=int(at*sr)
    if i>=n or i<0: return
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
    elif kind=='pluck': s=(saw(f,x)+.5*np.sin(2*np.pi*f*2*x))/1.5
    else: s=(saw(f,x)*.7+np.sign(np.sin(2*np.pi*f*x))*.3)
    return s*e
def nf(m): return 440*2**((m-69)/12)
def riser(a,b,f0=200,f1=2500,g=.25,noise=.2):
    m=(t>=a)&(t<b); u=np.clip((t-a)/(b-a),0,1); ph=2*np.pi*np.cumsum(f0+u**2*(f1-f0))/sr
    nz=lp(rng.standard_normal(n),5000)
    global out; out+=np.where(m,np.sin(ph)*g*u+nz*noise*u,0)
def roll(a,b,g0=.12,g1=.5):
    k=int((b-a)/.0625)
    for i in range(k):
        tt=a+i*.0625*(1-i/(k*2.5)); add(snare(),tt,g0+(g1-g0)*i/k)
CH=[(45,[57,60,64]),(41,[53,57,60]),(48,[55,60,64]),(43,[55,59,62])]   # Am F C G, je 2 s
DROP=4.0; AD0=8.0; RES=11.2; GROOVE=12.0
# --- Intro 0-4: Riser, Drone, Partikel-Ticks
riser(0.0,DROP,80,900,.3,.2)
out+=np.sin(2*np.pi*55*t)*.18*np.clip(t/3,0,1)*(t<FIN)
add(boom(),0.0,.4)
for i in range(18): add(hat(),1.5+i*.12*(1-i/50),.15+.01*i)
# --- Drop 4.0
add(boom(2.6),DROP,1.2); add(crash(),DROP,.8); add(kick(),DROP,1.0)
# --- Takte (Pad/Bass/Arp/Melodie) 4-94, nicht in der Werbe-Szene
def bars(a,b):
    k0=int(np.ceil(a/(B*4)))
    for k in range(k0,int(b/(B*4))+1):
        b0=k*B*4
        if b0<a or b0>=b: continue
        if AD0<=b0<GROOVE: continue
        root,ch=CH[k%4]
        for mm in ch: add(lp(tone(nf(mm),B*4,'pad',.4,.25),2200),b0,.07)
        for q in range(4):
            add(tone(nf(root),B,'bass',.005,2.0),b0+q*B,.3)
            add(tone(nf(root+12),B/2*.9,'bass',.005,6),b0+q*B+B/2,.12)
        pat=[0,1,2,1,2,1,0,2]
        for q in range(8):
            mm=ch[pat[q]]+12
            if b0>=GROOVE or q%2==0: add(lp(tone(nf(mm),.22,'pluck',.003,9),5000),b0+q*B/2,.11)
            if b0>=WALL: add(lp(tone(nf(mm+12),.18,'pluck',.003,10),6000),b0+q*B/2+B/4,.07)
        if b0>=GROOVE+2:
            mel=[ch[2]+12,ch[1]+12,ch[2]+12,ch[0]+24] if k%2 else [ch[0]+24,ch[2]+12,ch[1]+12,ch[2]+12]
            for q,mm in enumerate(mel): add(lp(tone(nf(mm),B*.95,'lead',.01,2.5),4500),b0+q*B,.12)
bars(DROP,FIN)
# --- Drums
b=DROP
while b<FIN-1e-6:
    inad=AD0<=b<GROOVE
    if inad:
        if int(round((b-AD0)/B))%2==0: add(kick(),b,.5)
    elif b>=DROP:
        add(kick(),b,.95)
        beat=int(round((b-DROP)/B))
        if b>=GROOVE:
            if beat%2==1: add(snare(),b,.5); add(clap(),b,.5)
            add(hat(),b+B/2,.5); add(hat(),b+B/4,.25); add(hat(),b+3*B/4,.25)
            if b>=WALL: add(hat(True),b+B/2,.3)
        else: add(hat(),b+B/2,.4)
    b+=B
# --- Uebergaenge
roll(6.4,8.0)                                   # Intro -> Werbung
m2=(t>=AD0)&(t<RES)                              # Werbe-Szene: schrille Toene
out+=np.where(m2,np.sign(np.sin(2*np.pi*466*t))*.06+np.sign(np.sin(2*np.pi*659*t))*.05,0)*(rng.random(n)>.35)
for k in range(15): add(lp(rng.standard_normal(int(.08*sr)),4000),AD0+k*.2,.3)
riser(10.0,RES,200,2800,.25,.15)
add(boom(2.2),RES,1.1); add(crash(2.0),RES,.8)   # Wisch-Moment
roll(10.4,11.2,.1,.35)
add(crash(2.0),14.0,.6)                          # Moki-Aufnahme beginnt
for c in range(22,int(STUDIO-2),8): add(crash(1.6),float(c),.35)
roll(STUDIO-2,STUDIO)                            # -> Studio
add(crash(2.0),STUDIO,.7)
for c in range(int(STUDIO)+8,int(WALL-2),8): add(crash(1.6),float(c),.35)
roll(WALL-2,WALL,.12,.55)                          # -> Spielewand
add(boom(2.0),WALL,.9); add(crash(2.2),WALL,.8)
riser(FIN-2,FIN,300,3500,.25,.2)
# --- Finale
add(boom(2.8),FIN,1.3); add(crash(3.0),FIN,1.0); add(kick(),FIN,1.0)
for mm in (45,57,60,64,69,72): add(lp(tone(nf(mm),5.0,'pad',.02,.7),3000),FIN,.14)
add(tone(nf(81),4.0,'lead',.02,1.1),FIN,.08)
for q in range(1,6): add(lp(tone(nf([69,72,76,81,76,72][q]),.4,'pluck',.003,6),5000),FIN+q*B,.1)
# --- Teaser: dunkle Drohne, Herzschlag, Ticken, Schlaege zu den Texten
uT=np.clip((t-TEASE)/4.0,0,1)*((t>=TEASE)&(t<T)); lfo=.6+.4*np.sin(2*np.pi*.25*(t-TEASE))
out+=(np.sin(2*np.pi*41*t)*.3+np.sin(2*np.pi*58*t)*.12*lfo)*uT
for k in range(14):
    g=min(.65,.25+k*.04); add(lp(kick(),160),TEASE+k*1.0,g); add(lp(kick(),160),TEASE+k*1.0+.28,g*.6)
for mm in (45,51,57,60):
    add(lp(tone(nf(mm),9.0,'pad',3.0,.3),1400),TEASE+2.0,.06)
for k in range(10): add(lp(rng.standard_normal(int(.012*sr)),9000)*.9,TEASE+4.6+k,.35)
for u0 in (6.2,8.0,10.0,12.0):
    add(boom(1.6),TEASE+u0,.55)
    m=(t>=TEASE+u0-.5)&(t<TEASE+u0); out+=np.where(m,lp(rng.standard_normal(n),6000)*(t-(TEASE+u0-.5))*.5,0)
# --- Sidechain, Fade
sc=np.ones(n)
for i in range(int(DROP/B),int(FIN/B)):
    s0=int(i*B*sr); L=int(.22*sr); sc[s0:s0+L]*=np.linspace(.35,1,min(L,n-s0))
out*=np.where((t>DROP)&(t<FIN),sc,1)
out*=np.clip((T-t)/1.0,0,1)
out=np.tanh(out*1.25); out/=max(abs(out).max(),1e-6); out*=.9
w=wave.open(sys.argv[1],'wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype(np.int16).tobytes());w.close()
