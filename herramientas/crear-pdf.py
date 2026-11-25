#!/usr/bin/env python3
"""
RUIDO ÍNTIMO — crear-pdf.py
Genera el PDF de un devocional con el MISMO diseño y orden para todos:

  1. Portada (imagen del devocional)
  2. Devocional (título, autor, texto)
  3. Concordancias (al final del texto)
  4. Contraportada con las redes de Ruido Íntimo

Lee el texto directamente de la página del devocional, así el PDF y la web
dicen siempre lo mismo. No necesita instalar nada: usa Python y Google Chrome.

USO (desde la carpeta del sitio):
    python3 herramientas/crear-pdf.py semana-09.html     # un devocional
    python3 herramientas/crear-pdf.py --todos            # index + semanas
    python3 herramientas/crear-pdf.py index.html --html  # deja el HTML para revisar

El PDF queda en /pdf; después escribe su nombre en js/devocionales.js (campo pdf).
"""
import html, os, re, shutil, subprocess, sys, tempfile, unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CHROME = next((c for c in (
    os.environ.get('CHROME', ''),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    shutil.which('google-chrome') or '', shutil.which('chromium') or '', shutil.which('chromium-browser') or '',
) if c and Path(c).exists()), '')

# Redes de la contraportada. Si un valor queda vacío, esa red no se muestra.
REDES = {
    'instagram': ('@ruidointimo', 'https://www.instagram.com/ruidointimo/'),
    'web':       ('ruido-intimo.vercel.app', 'https://ruido-intimo.vercel.app'),
    'youtube':   ('', ''),   # ej.: ('@ruidointimo', 'https://www.youtube.com/@ruidointimo')
}


def quitar_tags(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()


def bloque(t, abre, tag):
    """Contenido interno del primer elemento que empieza con `abre`, respetando anidados."""
    i = t.index(abre)
    j = t.index('>', i) + 1
    prof = 1
    for m in re.finditer(rf'<(/?){tag}\b', t[j:]):
        prof += -1 if m.group(1) else 1
        if prof == 0:
            return t[j:j + m.start()]
    raise ValueError('no cierra ' + abre)


def leer_pagina(ruta):
    t = ruta.read_text(encoding='utf-8')
    d = {}
    d['titulo'] = bloque(t, '<h2 id="titulo-devocional"', 'h2').strip()
    d['bajada'] = quitar_tags(bloque(t, '<p class="devocional-bajada"', 'p'))
    meta = bloque(t, '<p class="autor-meta"', 'p')
    d['fecha_iso'] = re.search(r'data-fecha="([\d-]+)"', meta).group(1)
    partes = [p.strip() for p in quitar_tags(meta).split('·')]
    d['cita'] = partes[1] if len(partes) > 2 else ''
    d['lectura'] = partes[-1]
    d['autor'] = quitar_tags(bloque(t, '<p class="autor-nombre"', 'p'))
    d['cuerpo'] = bloque(t, '<div class="devocional-cuerpo"', 'div').strip()
    pie = t[t.index('<footer class="devocional-pie"'):]
    d['temas'] = [quitar_tags(x) for x in re.findall(r'<li>(.*?)</li>', pie[:pie.index('</ul>')], re.S)]
    d['numero'] = re.search(r'data-actual="(\d+)"', t).group(1).zfill(2)
    d['conc'] = []
    for a in re.findall(r'<article class="conc[ "].*?</article>', t, re.S):
        tema = quitar_tags(re.search(r'<p class="conc-tema">(.*?)</p>', a, re.S).group(1))
        ref = quitar_tags(re.sub(r'<span class="chip".*?</span>', '', re.search(r'<h3 class="conc-ref">(.*?)</h3>', a, re.S).group(1), flags=re.S))
        txt = quitar_tags(re.search(r'data-version-texto="PDT">(.*?)</blockquote>', a, re.S).group(1))
        nota = quitar_tags(re.search(r'<p class="conc-nota">(.*?)</p>', a, re.S).group(1))
        d['conc'].append((tema, ref, txt, nota))
    return d


MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
         'septiembre', 'octubre', 'noviembre', 'diciembre']


def fecha_larga(iso):
    a, m, dd = map(int, iso.split('-'))
    return f'{dd} de {MESES[m - 1]} de {a}'


def slug(s, palabras=6):
    s = unicodedata.normalize('NFD', quitar_tags(s).lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-').split('-')
    return '-'.join(s[:palabras])


def imagen_portada(num):
    for rel in (f'img/semana-{num}-versiculo.jpg', f'img/portadas/semana-{num}.jpg'):
        if (RAIZ / rel).exists():
            return rel
    raise FileNotFoundError(f'Falta la imagen de portada del N.º {num} (img/semana-{num}-versiculo.jpg)')


ICO_IG = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>'
ICO_WEB = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>'
ICO_YT = '<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.5l4.5 2.5-4.5 2.5z" fill="currentColor"/></svg>'


def construir_html(d, base='..'):
    num = d['numero']
    img = imagen_portada(num)
    titulo_plano = quitar_tags(d['titulo'])
    redes = ''
    for clave, ico, rotulo in (('instagram', ICO_IG, 'Instagram'), ('youtube', ICO_YT, 'YouTube'), ('web', ICO_WEB, 'Sitio web')):
        nombre, _url = REDES[clave]
        if nombre:
            redes += f'<li><span class="red-ico">{ico}</span><span><b>{rotulo}</b><br>{html.escape(nombre)}</span></li>'
    conc = ''.join(
        f'<article class="conc"><p class="conc-tema">{html.escape(tema)}</p>'
        f'<h3 class="conc-ref">{html.escape(ref)} <span class="chip">PDT</span></h3>'
        f'<blockquote>{html.escape(txt)}</blockquote>'
        f'<p class="conc-nota">{html.escape(nota)}</p></article>'
        for tema, ref, txt, nota in d['conc'])
    temas = ''.join(f'<li>{html.escape(x)}</li>' for x in d['temas'])
    cuerpo = d['cuerpo'].replace(' revelar', '')
    corto = titulo_plano if len(titulo_plano) <= 48 else titulo_plano[:45].rsplit(' ', 1)[0] + '…'
    corto_css = (f'N.º {num} · {corto}').replace('\\', '\\\\').replace("'", "\\'")

    return f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>{html.escape(titulo_plano)} · Ruido Íntimo</title>
<style>
@font-face {{ font-family:'Fraunces'; font-style:normal; font-weight:100 900; src:url('{base}/fonts/fraunces.woff2') format('woff2'); }}
@font-face {{ font-family:'Fraunces'; font-style:italic; font-weight:100 900; src:url('{base}/fonts/fraunces-italic.woff2') format('woff2'); }}
@font-face {{ font-family:'Inter'; font-style:normal; font-weight:100 900; src:url('{base}/fonts/inter.woff2') format('woff2'); }}

:root {{ --crema:#F8F8EA; --papel:#FDFDF5; --tinte:#EFF2E3; --tinta:#1C1C1A; --suave:#5A5B53;
  --verde:#009C68; --verde-texto:#007A51; --hondo:#0B3B2A; --serif:'Fraunces',Georgia,serif; --sans:'Inter',system-ui,sans-serif; }}
* {{ box-sizing:border-box; margin:0; padding:0; }}
html {{ background:var(--crema); -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
body {{ font-family:var(--serif); color:var(--tinta); background:var(--crema); }}

@page {{ size:A4; margin:27mm 22mm 25mm; background:#F8F8EA;
  @top-left {{ content:'RUIDO ÍNTIMO'; font:600 7.5pt/1 var(--sans); letter-spacing:.18em; color:var(--verde-texto); vertical-align:bottom; padding-bottom:6mm; }}
  @top-right {{ content:'{corto_css}'; font:500 7.5pt/1 var(--sans); color:var(--suave); vertical-align:bottom; padding-bottom:6mm; }}
  @bottom-left {{ content:'ruido-intimo.vercel.app'; font:500 7.5pt/1 var(--sans); color:var(--suave); vertical-align:top; padding-top:7mm; }}
  @bottom-right {{ content:counter(page); font:700 8pt/1 var(--sans); color:var(--verde-texto); vertical-align:top; padding-top:7mm; }}
}}
@page portada {{ size:A4; margin:0; }}

/* ---------- Portada y contraportada ---------- */
.hoja {{ page:portada; position:relative; width:210mm; height:297mm; overflow:hidden; break-after:page; }}
.hoja:last-child {{ break-after:auto; }}
.portada {{ background:var(--hondo); color:var(--crema); }}
/* La foto aparece poco a poco desde el verde hondo (sin capas translúcidas encima, para que se vea igual en todos los lectores de PDF) */
.portada .foto {{ position:absolute; left:0; top:10.5mm; width:210mm; height:262.5mm; background:url('{base}/{img}') center/cover no-repeat;
  -webkit-mask-image:linear-gradient(to bottom, transparent 0, transparent 70mm, #000 135mm); mask-image:linear-gradient(to bottom, transparent 0, transparent 70mm, #000 135mm); }}
.portada .base {{ position:absolute; left:0; right:0; bottom:0; height:24mm; background:var(--hondo); }}
.portada .logo {{ position:absolute; left:18mm; top:16mm; height:15mm; }}
.portada .num {{ position:absolute; right:18mm; top:19mm; font:700 8.5pt/1 var(--sans); letter-spacing:.2em; text-transform:uppercase; color:var(--crema); border:1.2px solid rgba(248,248,234,.75); border-radius:99px; padding:2.6mm 5mm; }}
.portada .texto {{ position:absolute; left:18mm; right:18mm; top:52mm; }}
.portada .cita {{ font:600 9pt/1 var(--sans); letter-spacing:.2em; text-transform:uppercase; color:#8CEBC4; margin-bottom:7mm; }}
.portada h1 {{ font:400 41pt/1.02 var(--serif); letter-spacing:-.03em; font-variation-settings:"opsz" 144; text-wrap:balance; }}
.portada h1.largo {{ font-size:34pt; }}
.portada h1 em {{ font-style:italic; font-weight:500; color:#8CEBC4; }}
.portada .pie {{ position:absolute; left:18mm; right:18mm; bottom:8mm; display:flex; justify-content:space-between; align-items:flex-end; font:500 9pt/1.5 var(--sans); }}
.portada .pie b {{ display:block; font-weight:700; font-size:10.5pt; }}

.contra {{ background:var(--hondo); color:var(--crema); }}
.contra::before {{ content:''; position:absolute; inset:0; background:url('{base}/img/grano.png'); opacity:.5; mix-blend-mode:multiply; }}
.contra .brillo {{ position:absolute; inset:0; background:radial-gradient(120mm 90mm at 85% 8%, rgba(79,211,160,.30), transparent 70%); }}
.contra .interior {{ position:absolute; inset:0; padding:22mm 22mm 18mm; display:flex; flex-direction:column; }}
.contra .logo {{ height:20mm; align-self:flex-start; }}
.contra .centro {{ margin-top:auto; margin-bottom:auto; }}
.contra .eyebrow {{ color:#8CEBC4; margin-bottom:8mm; }}
.contra h2 {{ font:400 40pt/1.04 var(--serif); letter-spacing:-.03em; font-variation-settings:"opsz" 144; margin-bottom:9mm; }}
.contra h2 em {{ font-style:italic; font-weight:500; color:#8CEBC4; }}
.contra .lead {{ font:400 12.5pt/1.6 var(--serif); max-width:118mm; color:rgba(248,248,234,.9); margin-bottom:14mm; }}
.redes {{ list-style:none; display:grid; gap:5mm; }}
.redes li {{ display:flex; align-items:center; gap:6mm; padding:5mm 6mm; border:1.2px solid rgba(248,248,234,.28); border-radius:5mm; background:rgba(248,248,234,.06); font:500 11pt/1.4 var(--sans); }}
.redes li b {{ font-size:7.5pt; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:#8CEBC4; }}
.red-ico {{ flex:none; display:grid; place-items:center; width:13mm; height:13mm; border-radius:50%; background:var(--verde); color:var(--crema); }}
.red-ico svg {{ width:7mm; height:7mm; fill:none; stroke:currentColor; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }}
.contra .legal {{ font:500 8pt/1.5 var(--sans); color:rgba(248,248,234,.7); display:flex; justify-content:space-between; border-top:1px solid rgba(248,248,234,.22); padding-top:5mm; }}

/* ---------- Texto ---------- */
.eyebrow {{ font:700 8pt/1 var(--sans); letter-spacing:.2em; text-transform:uppercase; color:var(--verde-texto); }}
.cabecera {{ padding-bottom:9mm; margin-bottom:10mm; border-bottom:1px solid rgba(28,28,26,.14); }}
.cabecera .eyebrow {{ margin-bottom:6mm; }}
.cabecera h1 {{ font:400 34pt/1.02 var(--serif); letter-spacing:-.03em; font-variation-settings:"opsz" 144; margin-bottom:6mm; text-wrap:balance; }}
.cabecera h1 em {{ font-style:italic; font-weight:500; color:var(--verde); }}
.bajada {{ font:400 14pt/1.4 var(--serif); color:var(--suave); margin-bottom:7mm; }}
.autor {{ display:flex; align-items:center; gap:4mm; font-family:var(--sans); }}
.autor .av {{ display:grid; place-items:center; width:11mm; height:11mm; border-radius:50%; background:var(--verde); color:var(--crema); font:800 8pt/1 var(--sans); letter-spacing:.04em; }}
.autor b {{ display:block; font-size:9.5pt; }}
.autor span {{ font-size:8pt; color:var(--suave); }}

.cuerpo {{ font-size:11.5pt; line-height:1.68; orphans:3; widows:3; }}
.cuerpo > * + * {{ margin-top:4.2mm; }}
.cuerpo em {{ color:var(--verde-texto); }}
.cuerpo strong {{ font-weight:700; }}
.cuerpo h3 {{ margin-top:9mm; font:800 11.5pt/1.3 var(--sans); letter-spacing:-.01em; break-after:avoid; }}
.capitular::first-letter {{ float:left; font-size:4.3em; line-height:.8; font-weight:600; font-style:italic; color:var(--verde); padding:.05em .09em 0 0; }}
.cita-destacada {{ margin:8mm 0 !important; padding-left:6mm; border-left:1.2mm solid var(--verde); font:italic 400 15pt/1.4 var(--serif); letter-spacing:-.01em; break-inside:avoid; }}
.cita-destacada p {{ margin:0; }}
.bloque {{ margin:8mm 0 !important; padding:6mm 7mm; background:var(--tinte); border-radius:4mm; break-inside:avoid; }}
.bloque-etq {{ font:700 7.5pt/1 var(--sans); letter-spacing:.2em; text-transform:uppercase; color:var(--verde-texto); margin-bottom:3.5mm; }}
.bloque p:last-child, .bloque li {{ font-size:12pt; line-height:1.5; }}
.bloque ol {{ padding-left:6mm; display:grid; gap:2.5mm; }}
.lista-pacto, .cuerpo ol {{ padding-left:7mm; display:grid; gap:2.5mm; }}
.dialogo {{ display:grid; gap:2.5mm; }}
.dialogo p {{ margin:0 !important; }}
.dialogo-dios {{ font-style:italic; color:var(--verde-texto); border-left:.9mm solid var(--verde); padding-left:5mm; margin-left:-6mm !important; }}
.dialogo-dios strong {{ color:var(--tinta); font-style:normal; }}
.dialogo-narra {{ font:600 9.5pt/1.4 var(--sans); color:var(--suave); }}
.temas {{ list-style:none; display:flex; flex-wrap:wrap; gap:2.5mm; margin-top:9mm; padding-top:6mm; border-top:1px solid rgba(28,28,26,.14); }}
.temas li {{ padding:1.8mm 4mm; border-radius:99px; background:#DCEFE4; color:var(--verde-texto); font:700 8pt/1.2 var(--sans); }}

/* ---------- Concordancias ---------- */
.salto {{ height:0; break-after:page; }}
.concs .eyebrow {{ margin-bottom:6mm; }}
.concs h2 {{ font:400 26pt/1.05 var(--serif); letter-spacing:-.025em; font-variation-settings:"opsz" 144; margin-bottom:4mm; }}
.concs h2 em {{ font-style:italic; font-weight:500; color:var(--verde); }}
.concs .intro {{ font:400 10.5pt/1.5 var(--sans); color:var(--suave); margin-bottom:7mm; max-width:130mm; }}
.conc {{ margin-bottom:4.5mm; padding:5mm 6.5mm; background:var(--papel); border:1px solid rgba(28,28,26,.12); border-radius:4mm; break-inside:avoid; }}
.conc-tema {{ font:700 7pt/1 var(--sans); letter-spacing:.16em; text-transform:uppercase; color:var(--verde-texto); margin-bottom:2.2mm; }}
.conc-ref {{ font:800 11pt/1.2 var(--sans); letter-spacing:-.01em; margin-bottom:2.4mm; }}
.chip {{ display:inline-block; margin-left:2mm; padding:1mm 2.4mm; border-radius:99px; background:#DCEFE4; color:var(--verde-texto); font:700 6.5pt/1.2 var(--sans); letter-spacing:.06em; vertical-align:middle; }}
.conc blockquote {{ font:italic 400 12pt/1.45 var(--serif); }}
.conc-nota {{ margin-top:3mm; padding-top:2.8mm; border-top:1px dashed rgba(28,28,26,.2); font:400 9pt/1.5 var(--sans); color:var(--suave); }}
</style></head>
<body>

<section class="hoja portada">
  <div class="foto"></div><div class="base"></div>
  <img class="logo" src="{base}/img/logo-blanco.png" alt="Ruido Íntimo">
  <span class="num">Devocional N.º {num}</span>
  <div class="texto">
    <p class="cita">{html.escape(d['cita'])}</p>
    <h1 class="{'largo' if len(titulo_plano) > 34 else ''}">{d['titulo']}</h1>
  </div>
  <div class="pie">
    <div><b>{html.escape(d['autor'])}</b>{fecha_larga(d['fecha_iso'])}</div>
    <div>ruido-intimo.vercel.app</div>
  </div>
</section>

<main>
  <header class="cabecera">
    <p class="eyebrow">Devocional N.º {num} · {html.escape(d['cita'])}</p>
    <h1>{d['titulo']}</h1>
    <p class="bajada">{html.escape(d['bajada'])}</p>
    <div class="autor"><span class="av">{html.escape(''.join(w[0] for w in d['autor'].split()[:2]).upper())}</span><div><b>{html.escape(d['autor'])}</b><span>{fecha_larga(d['fecha_iso'])} · {html.escape(d['cita'])} · {html.escape(d['lectura'])}</span></div></div>
  </header>
  <div class="cuerpo">
{cuerpo}
  </div>
  <ul class="temas">{temas}</ul>

  <div class="salto"></div>
  <section class="concs">
    <p class="eyebrow">Concordancias</p>
    <h2>La Escritura <em>ilumina</em> la Escritura</h2>
    <p class="intro">Pasajes que acompañan {html.escape(d['cita'])} y las ideas del devocional (Palabra de Dios para Todos). En la web puedes verlos también en RVR1960, NBLA y NTV.</p>
    {conc}
  </section>
</main>

<section class="hoja contra">
  <div class="brillo"></div>
  <div class="interior">
    <img class="logo" src="{base}/img/logo-blanco.png" alt="Ruido Íntimo">
    <div class="centro">
      <p class="eyebrow">Sigue caminando</p>
      <h2>Cada miércoles,<br><em>un nuevo encuentro.</em></h2>
      <p class="lead">Un devocional nuevo cada semana para bajar el ruido y acercarte a Dios. Compártelo con alguien que lo necesite y cuéntanos qué te habló.</p>
      <ul class="redes">{redes}</ul>
    </div>
    <div class="legal"><span>© 2026 Ruido Íntimo</span><span>Devocional N.º {num} · {html.escape(d['cita'])}</span></div>
  </div>
</section>

</body></html>'''


def crear(pagina, dejar_html=False):
    d = leer_pagina(RAIZ / pagina)
    # Si ya hay un PDF de este número, se reemplaza con el mismo nombre (el enlace de la web no cambia)
    previos = sorted((RAIZ / 'pdf').glob(f'semana-{d["numero"]}-*.pdf'))
    nombre = previos[0].name if previos else f'semana-{d["numero"]}-{slug(d["titulo"])}.pdf'
    salida = RAIZ / 'pdf' / nombre
    ruta_html = RAIZ / 'herramientas' / f'_pdf-{d["numero"]}.html'
    ruta_html.write_text(construir_html(d), encoding='utf-8')
    with tempfile.TemporaryDirectory() as perfil:
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', f'--user-data-dir={perfil}',
                        '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw', '--virtual-time-budget=8000',
                        f'--print-to-pdf={salida}', ruta_html.as_uri()],
                       check=True, capture_output=True)
    if not dejar_html:
        ruta_html.unlink()
    print(f'{pagina} → pdf/{nombre} ({salida.stat().st_size // 1024} KB)')
    return nombre


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--todos' in sys.argv:
        args = ['index.html'] + sorted(p.name for p in RAIZ.glob('semana-*.html'))
    if not args:
        sys.exit(__doc__)
    for a in args:
        crear(a, '--html' in sys.argv)
