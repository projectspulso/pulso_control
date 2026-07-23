#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Montador genérico molde bolha (SEM loop). Uso: python make_video.py <slug>
Lê D:/tmp/pulso_lote4/<slug>/ : narracao_DANIEL.mp3 + alignment.json + clips/ + trilha.mp3
SCENES (cena->fim_span) definido por slug abaixo. Cada clip toca 1x, time-stretch pro span."""
import os, json, math, subprocess, tempfile, sys
import numpy as np
from PIL import Image, ImageDraw, ImageChops, ImageFont
FF=r"C:/Users/junio/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe"
AV=r"D:/projetos/pulso_control/public/pulso/expression"
slug=sys.argv[1]
VID=f"D:/tmp/pulso_lote4/{slug}"; BR=f"{VID}/clips"
TRILHA=f"{VID}/trilha.mp3"; NARR=f"{VID}/narracao_DANIEL.mp3"; ALIGN=f"{VID}/alignment.json"
OUT=f"{VID}/FINAL_{slug}.mp4"
SCENES_BY={
 "irmaos_pollock":[("p1_dolls",5.2),("p2_street",15.0),("p4_crib",21.0),("p5_photos",32.4),("p7_window",46.3),("p6_soul",61.0),("p3_road",67.1)],
 "chuva_sapos":[("s1_sky",3.4),("s3_town",9.4),("s2_frogs",18.8),("s5_waterspout",30.9),("s6_vortex",40.4),("s4_crowd",51.8),("s7_frog",67.5)],
 "efeito_mandela":[("m1_glitch",6.1),("m2_crowd",12.7),("m3_prison",22.0),("m4_galaxy",31.2),("m5_brain",37.9),("m6_mind",43.7)],
 "titanic_premonicao":[("s1_book",4.8),("s2_titan",11.89),("s3_unsink",19.52),("s4_iceberg",25.68),("s5_size",32.40),("s6_april",37.47),("s7_14anos",44.55),("s8_author",51.98),("s9_close",58.98),("s10_cta",65.62)],
 "voynich":[("s1_book",4.69),("s2_manuscript",12.69),("s3_pages",20.47),("s4_plants",27.55),("s11_secret",29.88),("s5_crypto",37.77),("s7_alchemy",45.44),("s8_hoax",50.40),("s9_time",58.36),("s10_compare",65.22),("s12_cipher",70.69),("s13_cta1",77.93)],
 "copa_polvo":[("s1_octopus",6.13),("s2_boxes",14.07),("s3_choose",20.91),("s4_final",27.85),("s5_trophy",34.69),("s6_celeb",40.00),("s7_science",46.70),("s8_mystery",51.92),("s9_cta",56.52)],
 "copa_cachorro":[("s1_london66",4.0),("s2_stolen",10.3),("s3_police",14.4),("s4_dogwalk",19.2),("s5_sniff",22.6),("s6_reveal",27.7),("s7_doghero",30.9),("s8_medal",35.9),("s9_thief",40.0),("s10_reflect",45.9),("s11_cta",49.0)],
 "copa_gol11s":[("s1_fast",5.0),("s2_2002",9.5),("s3_kickoff",14.5),("s4_goal",20.1),("s5_clock",23.3),("s6_record",29.9),("s7_irony",35.7),("s8_history",40.1),("s9_cta",45.33)],
 "copa_milla":[("s1_older",5.8),("s2_cameroon",9.6),("s3_1990",14.1),("s4_comeback",19.4),("s5_dance",26.0),("s6_fever",29.3),("s7_1994",35.9),("s8_record",42.5),("s9_cta",49.08)],
 "ia_ceo":[("s1_robotoffice",7.96),("s2_ceochair",15.93),("s3_data",21.9),("s4_hongkong",29.87),("s5_lab",35.84),("s6_efficiency",43.81),("s7_contrast",49.78),("s8_brain",57.75),("s9_futurework",63.72),("s11_servers",69.69),("s12_global",75.67),("s10_cta",81.64)],
 "mot_jobs":[("s1_boardroom",7.97),("s2_failing",13.95),("s3_decision",21.92),("s4_clock",27.9),("s5_cut",35.87),("s6_simple",41.85),("s7_transform",49.83),("s8_devices",55.8),("s10_legacy",63.78),("s9_cta",71.75)],
 "copa_maracanazo":[("s1_silence",5.7),("s2_maracana",9.5),("s3_festa",13.3),("s4_jogo",17.1),("s5_gol",22.8),("s6_emudeceu",26.6),("s7_trauma",30.4),("s8_uniforme",36.1),("s9_amarela",39.9),("s10_cta",43.7)],
 "infantil_sapato":[("s1_shoe",5.61),("s2_house",11.21),("s3_search",16.82),("s4_friends",22.42),("s5_park",28.03),("s6_clue",33.63),("s7_follow",39.24),("s8_dog",44.84),("s9_found",50.45),("s10_cta",56.05)],
 "psico_vergonhas":[("s1_awake",5.98),("s2_flash",11.96),("s3_brain",17.94),("s4_night",23.93),("s5_network",29.91),("s6_file",35.89),("s7_alarm",41.87),("s8_naming",47.85),("s9_calm",53.83),("s10_cta",59.81)],
 "trailer_pulso":[("s1_hook",3.0),("s2_science",5.99),("s3_world",8.99),("s4_fast",11.98),("s5_brand",14.98),("s6_cta",17.97)],
 "mh370":[("s1_vanish",6.65),("s2_takeoff",13.3),("s3_radar",19.95),("s4_silence",26.6),("s5_turn",33.25),("s6_ocean",39.9),("s7_debris",46.55),("s8_search",53.2),("s9_enigma",59.85),("s10_cta",66.5)],
 "cerebro_preguicoso":[("s1_brain",7.83),("s2_puzzle",15.67),("s3_chess",23.51),("s4_familiar",31.34),("s5_challenge",39.17),("s6_insight",47.01),("s7_cta",54.84)],
 "cor_humor":[("s1_red",6.2),("s2_spectrum",12.4),("s3_blue",18.6),("s4_yellow",24.8),("s5_green",31.0),("s6_brain",37.2),("s7_passion",43.4),("s8_palette",49.6),("s9_wardrobe",55.8),("s10_cta",62.0)],
 "tregua_natal":[("s1_trench",7.1),("s2_noman",14.2),("s3_war",21.3),("s4_candle",28.4),("s5_lights",35.5),("s6_truce",42.6),("s7_gifts",49.7),("s8_ball",56.81),("s9_dawn",63.91),("s10_cta",71.01)],
 "pomodoro":[("s1_timer",7.31),("s2_desk",14.63),("s3_25min",21.94),("s4_break",29.26),("s5_focus",36.57),("s6_marathon",43.89),("s7_sprint",51.2),("s8_office",58.51),("s9_learn",65.83),("s10_cta",73.14)],
}
# WORKER-READY: scenes.json (do worker) traz os spans em "spans"; senao usa o dict fixo.
_SJ=f"{VID}/scenes.json"
if os.path.exists(_SJ):
    _d=json.load(open(_SJ,encoding="utf-8"))
    if _d.get("spans"):
        SCENES=[(n,float(t)) for n,t in _d["spans"]]
        print(f"[make_video] usando spans do scenes.json ({len(SCENES)} cenas, worker)",flush=True)
    else:
        SCENES=SCENES_BY[slug]
else:
    SCENES=SCENES_BY[slug]
# REGRA DE FLUIDEZ (17/06): clipe-fonte Veo = 8s. Nenhuma cena pode esticar > 8s de span,
# senao vira camera lenta travada (judder). Faltou clipe? Quebra o bloco em 2 cortes / puxa do
# banco — NUNCA estica. Alvo: ~9-10 cenas/video, span 6-8s (fator 0.75-1.0).
SPAN_MAX=8.0
_t0=0.0; _viol=[]
for _c,_t1 in SCENES:
    _sp=_t1-_t0
    if _sp>SPAN_MAX+0.05: _viol.append((_c,_sp,_sp/SPAN_MAX))
    _t0=_t1
if _viol:
    print("="*58)
    print("[FLUIDEZ] *** AVISO: %d cena(s) acima de %.0fs (judder de camera lenta) ***"%(len(_viol),SPAN_MAX))
    for _c,_sp,_f in _viol: print("  %-16s span %.1fs (%.2fx) -> quebrar em 2 cortes ou puxar do banco"%(_c,_sp,_f))
    print("[FLUIDEZ] regra: ~9-10 cenas/video, span <= 8s. Corrija SCENES_BY antes de publicar.")
    print("="*58)
W,H,FPS=1080,1920,30
tmp=tempfile.mkdtemp(prefix="vid_")
def run(a): subprocess.run(a,check=True,capture_output=True)
VM={}
for c in "aàáâãeéêiíïy":VM[c]="AEI"
for c in "oóôõ":VM[c]="O"
for c in "uúüw":VM[c]="U"
for c in "l":VM[c]="L"
for c in "mbp":VM[c]="MBP"
for c in "fv":VM[c]="FV"
for c in "stdnrcgjkqxzhç":VM[c]="AEI"
def vis_at(al,t):
    for c,s,e in zip(al["characters"],al["character_start_times_seconds"],al["character_end_times_seconds"]):
        if s<=t<e:
            c=c.lower(); return "MBP" if not c.strip() else VM.get(c,"AEI")
    return "MBP"
al=json.load(open(ALIGN,encoding="utf-8")); dur=SCENES[-1][1]
# REGRA PULSO-CTA: janela do CTA = ultimo "segue" (...o pulso) ate o fim da narracao
_full="".join(al["characters"]).lower(); _idx=_full.rfind("segue")
CTA_T0 = al["character_start_times_seconds"][_idx] if _idx>=0 else dur
# PISO DE CONVERSAO: o CTA visual (mascote + botao Seguir) precisa de >=3s pra registrar e
# converter. Alguns roteiros dizem "segue" so no ultimo 1s (janela de 1.0-1.4s) -> o mascote
# nem termina de aparecer. Aqui garantimos que o visual comeca no minimo 3s antes do fim,
# mesmo que a palavra "segue" venha depois. Videos com CTA ja >=3s nao mudam.
CTA_T0 = min(CTA_T0, dur-3.0)
print(f"{slug}: dur {dur:.1f}s | CTA janela {CTA_T0:.2f}s->fim ({dur-CTA_T0:.1f}s)")
FFP=FF.replace("ffmpeg.exe","ffprobe.exe")
def _srcdur(p):
    r=subprocess.run([FFP,"-v","error","-show_entries","format=duration","-of","csv=p=0",p],capture_output=True,text=True)
    try: return float(r.stdout.strip())
    except: return 8.0
parts=[]; t0=0.0
for i,(clip,t1) in enumerate(SCENES):
    # factor = span / duracao REAL do clipe (clipes Veo agora tem 4/6/8s variavel — NUNCA assumir 8s)
    span=t1-t0; factor=span/_srcdur(f"{BR}/{clip}.mp4"); o=f"{tmp}/b{i}.mp4"
    run([FF,"-y","-i",f"{BR}/{clip}.mp4",
         "-vf",f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setpts={factor:.4f}*PTS,fps={FPS}",
         "-an","-t",f"{span:.3f}","-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p",o]); parts.append(o); t0=t1
open(f"{tmp}/c.txt","w").write("".join(f"file '{p}'\n" for p in parts))
bg=f"{tmp}/bg.mp4"
# RE-ENCODA no concat (NUNCA -c copy): segmentos com setpts quebram o copy e truncam o video
# (bug 22/06: video saiu 35.9s vs audio 49s — cenas finais + CTA sumiram). CFR garante duracao certa.
run([FF,"-y","-f","concat","-safe","0","-i",f"{tmp}/c.txt","-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p","-r",str(FPS),"-vsync","cfr",bg])
fr=f"{tmp}/fr"; os.makedirs(fr); run([FF,"-y","-i",bg,"-vf",f"fps={FPS}",f"{fr}/f_%05d.png"])
n=len([x for x in os.listdir(fr) if x.endswith(".png")]); print(f"frames {n}")
# TRAVA DE DURACAO: o video montado tem que cobrir a narracao toda (senao congela + perde CTA)
_esperado=int(dur*FPS)
if n < _esperado*0.95:
    print(f"[ERRO] montagem truncada: {n} frames ({n/FPS:.1f}s) < esperado {_esperado} ({dur:.1f}s). Abortando.")
    sys.exit(1)
D=int(0.34*W); RING=10; YELLOW=(255,214,10,255); SIZE=D+RING*2
def make_bubble(av_img):
    layer=Image.new("RGBA",(D,D),(0,0,0,0)); bgc=Image.new("RGBA",(D,D),(0,0,0,0)); pb=bgc.load()
    cx=cy=D/2
    for y in range(D):
        for x in range(D):
            dd=math.hypot(x-cx,y-cy)/(D/2)
            if dd<=1:
                v=int(46*(1-dd)+14); pb[x,y]=(v,int(v*0.8),int(v*1.6),255)
    layer.alpha_composite(bgc)
    s=(D*1.18)/av_img.width; aw,ah=int(av_img.width*s),int(av_img.height*s)
    av=av_img.resize((aw,ah),Image.LANCZOS); layer.alpha_composite(av,((D-aw)//2, D//2-int(0.36*ah)))
    mask=Image.new("L",(D,D),0); ImageDraw.Draw(mask).ellipse((0,0,D-1,D-1),fill=255)
    layer.putalpha(ImageChops.multiply(layer.split()[3],mask))
    canvas=Image.new("RGBA",(SIZE,SIZE),(0,0,0,0)); canvas.alpha_composite(layer,(RING,RING))
    ImageDraw.Draw(canvas).ellipse((RING//2,RING//2,SIZE-RING//2-1,SIZE-RING//2-1),outline=YELLOW,width=RING)
    return canvas
bub={v:make_bubble(Image.open(f"{AV}/viseme_{v}.png").convert("RGBA")) for v in ["AEI","O","U","L","MBP","FV"]}
# PISCAR (olhos vivos) — usa os _blink dos visemas (mesmo frame, so o olho fecha). Pisca a cada
# ~3.3s por ~2 frames; as vezes uma piscada dupla rapida (mais humano). Fallback: sem _blink, nao pisca.
_HASBLINK=all(os.path.exists(f"{AV}/viseme_{v}_blink.png") for v in ["AEI","O","U","L","MBP","FV"])
bubB={v:make_bubble(Image.open(f"{AV}/viseme_{v}_blink.png").convert("RGBA")) for v in ["AEI","O","U","L","MBP","FV"]} if _HASBLINK else {}
def _pisca(t):
    if not _HASBLINK: return False
    ph=t%3.3
    return ph<0.09 or (2.55<ph<2.62)  # piscada normal + as vezes uma dupla rapida
BX=28; BY=int(0.78*H)-SIZE//2  # opcao B: sobe a bolha p/ rosto (metade de cima) ficar acima da UI do TikTok
# --- mascote grande do CTA (8 quadros transparentes), ancorado pelos pes ---
CTADIR=r"D:/tmp/cta_frames"
CNAMES=["1_enter_squash","2_pop_up","3_present_open","4_present_closed","5_point_open","6_point_closed","7_thumbs_up","8_thumbs_wink"]
CTAF={}; CANC={}
for nm in CNAMES:
    im=Image.open(f"{CTADIR}/{nm}.png").convert("RGBA"); CTAF[nm]=im
    aa=np.array(im)[:,:,3]>40; bb=aa[int(aa.shape[0]*0.86):,:]
    xs=np.where(bb.any(axis=0))[0]; ax=(xs.min()+xs.max())/2 if len(xs) else im.width/2
    CANC[nm]=(ax,im.height)
CREF=float(np.median([CTAF[n].height for n in ["3_present_open","5_point_open","7_thumbs_up"]]))
CSCALE=820.0/CREF; CCX,CBASE=W//2,1180
FT=ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",112); FB=ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf",56)
VOG=set("aàáâãeéêiíïoóôõuúüy")
def boca_ab(t):
    for c,s,e in zip(al["characters"],al["character_start_times_seconds"],al["character_end_times_seconds"]):
        if s<=t<e: return c.lower() in VOG
    return False
def cta_frame(t):  # qual quadro + tipo de easing, por posicao na janela
    p=(t-CTA_T0)/max(0.1,(dur-CTA_T0))
    if p<0.08: return "1_enter_squash","enter",p
    if p<0.16: return "2_pop_up","pop",p
    if p<0.45: return ("5_point_open" if boca_ab(t) else "6_point_closed"),"talk",p
    if p<0.78: return ("3_present_open" if boca_ab(t) else "4_present_closed"),"talk",p
    if p<0.90: return "7_thumbs_up","hold",p
    return "8_thumbs_wink","wink",p
for i in range(1,n+1):
    t=(i-0.5)/FPS; fp=f"{fr}/f_{i:05d}.png"; base=Image.open(fp).convert("RGBA")
    if t<CTA_T0:  # corpo: bolha do canto (lip-sync)
        k=min(1.0,t/0.4); floaty=int(6*math.sin(2*math.pi*0.5*t)); _vz=vis_at(al,t)
        b=(bubB if _pisca(t) else bub)[_vz]
        if k<1.0: b=b.copy(); b.putalpha(b.split()[3].point(lambda p:int(p*k)))
        base.alpha_composite(b,(BX,BY+floaty))
    else:         # janela CTA: bolha some, entra o mascote grande (gesto + lip-sync na narracao)
        nm,kind,p=cta_frame(t); src=CTAF[nm]; ax,ay=CANC[nm]
        if kind=="enter": sc=0.55+0.45*min(1.0,(t-CTA_T0)/0.10)
        elif kind=="pop": sc=1.0+0.10*(1-min(1.0,(t-CTA_T0-0.10)/0.12))
        else: sc=1.0
        bob=10*math.sin(2*math.pi*1.0*(t-CTA_T0))
        s=CSCALE*sc; w=max(1,int(src.width*s)); h=max(1,int(src.height*s))
        m=src.resize((w,h),Image.LANCZOS); d=ImageDraw.Draw(base)
        shw=int(w*0.40); d.ellipse((CCX-shw,CBASE-20,CCX+shw,CBASE+20),fill=(10,6,26,110))
        base.alpha_composite(m,(int(CCX-ax*s),int(CBASE-ay*s+bob)))
        if p>0.12:
            txt="SEGUE O PULSO"; tw=d.textlength(txt,font=FT); tx=(W-tw)//2; ty=1290
            d.text((tx+5,ty+5),txt,font=FT,fill=(0,0,12,200)); d.text((tx,ty),txt,font=FT,fill=(255,255,255,255))
        if p>0.40:
            bw,bh=430,116; bx=(W-bw)//2; by=1440
            d.rounded_rectangle((bx,by,bx+bw,by+bh),radius=58,fill=(255,214,10,255))
            bt="+ Seguir"; bw2=d.textlength(bt,font=FB); d.text((bx+(bw-bw2)//2,by+30),bt,font=FB,fill=(28,16,48,255))
    base.convert("RGB").save(fp)
ov=f"{tmp}/ov.mp4"; run([FF,"-y","-framerate",str(FPS),"-i",f"{fr}/f_%05d.png","-pix_fmt","yuv420p","-c:v","libx264","-preset","veryfast",ov])
def srt(al,path):
    words=[];cur="";ini=None;fim=None
    for c,s,e in zip(al["characters"],al["character_start_times_seconds"],al["character_end_times_seconds"]):
        if c.strip()=="":
            if cur:words.append((cur,ini,fim));cur="";ini=None
        else:
            if ini is None:ini=s
            cur+=c;fim=e
    if cur:words.append((cur,ini,fim))
    words=[w for w in words if w[1] is not None and w[1]<CTA_T0]  # regra: legenda some na janela do CTA
    ch=[];i=0
    while i<len(words): g=words[i:i+3];ch.append((" ".join(w[0] for w in g),g[0][1],g[-1][2]));i+=3
    def ts(t):
        h=int(t//3600);m=int((t%3600)//60);s=int(t%60);ms=int((t-int(t))*1000);return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    open(path,"w",encoding="utf-8").write("".join(f"{n}\n{ts(a)} --> {ts(b)}\n{x.upper()}\n\n" for n,(x,a,b) in enumerate(ch,1)))
s=f"{tmp}/l.srt"; srt(al,s); sff=s.replace(chr(92),'/').replace(':','\\:')
run([FF,"-y","-i",ov,"-i",NARR,"-stream_loop","-1","-i",TRILHA,
     "-filter_complex",
     f"[0:v]subtitles='{sff}':force_style='Fontname=Arial,Fontsize=20,Bold=1,PrimaryColour=&H00FFFFFF,Outline=3,OutlineColour=&H00101020,Alignment=2,MarginV=170'[v];"
     f"[2:a]volume=0.12,afade=t=out:st={dur-2:.1f}:d=2[m];[1:a][m]amix=inputs=2:duration=first[a]",
     "-map","[v]","-map","[a]","-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-t",f"{dur:.2f}",OUT])
print(f"OK -> {OUT}  (regra PULSO-CTA embutida: mascote grande na janela, audio original)")
