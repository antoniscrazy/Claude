/* =====================================================================
   7. PPTX-Export (OOXML, eigene ZIP-Implementierung) – echte Folien, editierbare Elemente
   ===================================================================== */
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const XE = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const EMU = v => Math.round(v * 9525);
const hx = c => toHex(c).slice(1).toUpperCase();
function clr(c, alpha) { const h = hx(c); return alpha != null && alpha < 1 ? `<a:srgbClr val="${h}"><a:alpha val="${Math.round(alpha * 100000)}"/></a:srgbClr>` : `<a:srgbClr val="${h}"/>`; }
const gradFill = o => `<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0">${clr(o.fill || '@a1', o.opacity)}</a:gs><a:gs pos="100000">${clr(o.grad.c2 || '@a2', o.opacity)}</a:gs></a:gsLst><a:lin ang="${Math.round((o.grad.ang || 0) * 60000)}" scaled="0"/></a:gradFill>`;
const solid = (c, a) => (!c || c === 'none') ? '<a:noFill/>' : `<a:solidFill>${clr(c, a)}</a:solidFill>`;
const PRST = { rect: 'rect', round: 'roundRect', ellipse: 'ellipse', triangle: 'triangle', diamond: 'diamond', star: 'star5', arrow: 'rightArrow', hexagon: 'hexagon', rtriangle: 'rtTriangle', pentagon: 'pentagon', octagon: 'octagon', parallelogram: 'parallelogram', trapezoid: 'trapezoid', chevron: 'chevron', plus: 'mathPlus', heart: 'heart', donut: 'donut', cloud: 'cloud', callout: 'wedgeRectCallout', larrow: 'leftArrow', uarrow: 'upArrow', darrow: 'downArrow', lrarrow: 'leftRightArrow', frame: 'frame' };
const dataToBytes = d => { const b = atob(d.split(',')[1]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function imgToPngBytes(src) { const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('Bild nicht dekodierbar')); img.src = src; }); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); return dataToBytes(c.toDataURL('image/png')); }

async function buildPptx() {
  const proj = pruneProject(), m = proj.master, W = proj.size.w, H = proj.size.h, files = [], report = { slides: proj.slides.length, skipped: [], anim: 0, animSkipped: 0, transitions: 0, notes: 0 };
  const media = {}; // key -> {name, bytes}
  const mediaFor = async (key, getter, ext) => { if (!media[key]) media[key] = { name: 'image' + (Object.keys(media).length + 1) + '.' + ext, bytes: await getter() }; return media[key]; };
  const slideXmls = [], slideRels = [], notesXmls = [];
  for (let si = 0; si < proj.slides.length; si++) {
    const s = proj.slides[si], rels = [{ id: 'rId1', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' }]; let nid = 1; const spid = {}, animatable = {};
    const newRel = (type, target) => { const id = 'rId' + (rels.length + 1); rels.push({ id, type, target }); return id; };
    const ctx = { master: m, mode: 'show', assets: proj.assets, slide: s };
    const para = (o, st) => { // Absätze aus bereinigtem HTML
      const doc = new DOMParser().parseFromString('<body>' + (o.html || '') + '</body>', 'text/html'), out = [];
      const fam = (st.font || '').split(',')[0].replace(/["']/g, '').trim() || 'Segoe UI', baseSz = Math.round(st.size * 100);
      const runs = (node, f, acc) => { node.childNodes.forEach(n => { if (n.nodeType === 3) { if (n.nodeValue) acc.push(Object.assign({ t: n.nodeValue }, f)); } else if (n.nodeType === 1) { const g = Object.assign({}, f), t = n.tagName; if (t === 'B') g.b = 1; if (t === 'I') g.i = 1; if (t === 'U') g.u = 1; if (t === 'S') g.s = 1; if (t === 'SUB') g.base = -25000; if (t === 'SUP') g.base = 30000; if (n.style && n.style.color) g.color = n.style.color; if (n.style && /px/.test(n.style.fontSize || '')) g.sz = Math.round(parseFloat(n.style.fontSize) * 75); runs(n, g, acc); } }); };
      const lines = Array.from(doc.body.children); if (!lines.length) return '<a:p><a:endParaRPr lang="de-DE" sz="' + baseSz + '"/></a:p>';
      lines.forEach(ln => { const acc = []; runs(ln, { b: st.bold, i: st.italic, u: st.underline, s: st.strike }, acc);
        const algn = { left: 'l', center: 'ctr', right: 'r', justify: 'just' }[st.align || 'left'], bu = st.bullets ? `<a:pPr marL="342900" indent="-342900" algn="${algn}"><a:buFont typeface="Arial"/><a:buChar char="•"/></a:pPr>` : `<a:pPr algn="${algn}"><a:buNone/></a:pPr>`;
        const rs = acc.map(r => `<a:r><a:rPr lang="de-DE" sz="${r.sz || baseSz}"${r.b ? ' b="1"' : ''}${r.i ? ' i="1"' : ''}${r.u ? ' u="sng"' : ''}${r.s ? ' strike="sngStrike"' : ''}${r.base ? ` baseline="${r.base}"` : ''} dirty="0">${solid(r.color || st.color)}<a:latin typeface="${XE(fam)}"/></a:rPr><a:t>${XE(r.t)}</a:t></a:r>`).join('');
        out.push(`<a:p>${bu}${rs || ''}<a:endParaRPr lang="de-DE" sz="${baseSz}"/></a:p>`); });
      return out.join('');
    };
    const txBody = o => { const st = PP.textStyle(o, m, s); return `<p:txBody><a:bodyPr wrap="square" lIns="${EMU(12)}" tIns="${EMU(8)}" rIns="${EMU(12)}" bIns="${EMU(8)}" rtlCol="0" anchor="${{ top: 't', middle: 'ctr', bottom: 'b' }[st.valign || 'top']}"><a:noAutofit/></a:bodyPr><a:lstStyle/>${para(o, st)}</p:txBody>`; };
    const xfrm = (o, tag) => `<${tag || 'a:xfrm'}${o.rot ? ` rot="${Math.round(((o.rot % 360) + 360) % 360 * 60000)}"` : ''}><a:off x="${EMU(o.x)}" y="${EMU(o.y)}"/><a:ext cx="${EMU(o.w)}" cy="${EMU(o.h)}"/></${tag || 'a:xfrm'}>`;
    const ln = o => (o.stroke && o.stroke !== 'none' && o.sw > 0) ? `<a:ln w="${EMU(o.sw)}"><a:solidFill>${clr(o.stroke)}</a:solidFill></a:ln>` : '<a:ln><a:noFill/></a:ln>';
    const shadow = o => o.shadow ? '<a:effectLst><a:outerShdw blurRad="95250" dist="57150" dir="5400000" algn="t" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="30000"/></a:srgbClr></a:outerShdw></a:effectLst>' : '';
    const nv = (o, id) => `<p:cNvPr id="${id}" name="${XE(o.name || o.type)}"/>`;
    const objXml = async (o, top, decor) => {
      if (o.hidden) return ''; const id = ++nid; if (top && !decor) spid[o.id] = id;
      switch (o.type) {
        case 'shape': case 'text': {
          if (o.type === 'text' && o.ph && !PP.plainText(o.html).trim()) { if (top) delete spid[o.id]; return ''; }
          const has = PP.plainText(o.html).trim().length > 0, fill = o.type === 'shape' ? (o.grad ? gradFill(o) : solid(o.fill, o.opacity)) : (o.fill && o.fill !== 'none' ? solid(o.fill, o.opacity) : '<a:noFill/>');
          const geom = o.type === 'text' ? 'rect' : PRST[o.kind] || 'rect', av = o.kind === 'round' && o.radius != null ? `<a:avLst><a:gd name="adj" fmla="val ${Math.round(Math.min(50000, o.radius / Math.min(o.w, o.h) * 100000))}"/></a:avLst>` : '<a:avLst/>';
          if (top && has && !decor) animatable[o.id] = true;
          return `<p:sp><p:nvSpPr>${nv(o, id)}<p:cNvSpPr${o.type === 'text' ? ' txBox="1"' : ''}/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(o)}<a:prstGeom prst="${geom}">${av}</a:prstGeom>${fill}${ln(o)}${shadow(o)}</p:spPr>${has ? txBody(o) : ''}</p:sp>`;
        }
        case 'line': { const st = (o.stroke && o.stroke !== 'none') ? o.stroke : '@a1'; return `<p:cxnSp><p:nvCxnSpPr>${nv(o, id)}<p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr>${xfrm({ x: o.x, y: o.y + o.h / 2, w: o.w, h: 0, rot: o.rot }) }<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${EMU(o.sw || 4)}" cap="rnd"><a:solidFill>${clr(st)}</a:solidFill>${o.arrow ? '<a:tailEnd type="triangle"/>' : ''}</a:ln></p:spPr></p:cxnSp>`; }
        case 'image': case 'chart': {
          let med;
          if (o.type === 'image') { const src = proj.assets[o.src]; if (!src) { report.skipped.push('Bild ohne Daten: ' + o.name); return ''; } const mime = /^data:image\/(png|jpeg|gif)/.exec(src); med = await mediaFor('a:' + o.src, async () => mime ? dataToBytes(src) : imgToPngBytes(src), mime ? (mime[1] === 'jpeg' ? 'jpeg' : mime[1]) : 'png'); }
          else { med = await mediaFor('c:' + o.id, async () => { const svg = PP.chartSVG(o, o.w, o.h, m); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.setAttribute('width', o.w * 2); svg.setAttribute('height', o.h * 2); const bgc = hx(m.bg); const str = new XMLSerializer().serializeToString(svg).replace('>', `><rect width="100%" height="100%" fill="#${bgc}" fill-opacity="0"/>`); return imgToPngBytes('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)); }, 'png'); report.skipped.push('Diagramm „' + o.name + '“ als Bild (nicht als Diagramm-Objekt)'); }
          const rid = newRel('image', '../media/' + med.name), c = o.crop || { l: 0, t: 0, r: 0, b: 0 }, pm = n => Math.round(n * 100000);
          return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${XE(o.name || 'Bild')}" descr="${XE(o.alt || o.name || '')}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}">${o.opacity != null && o.opacity < 1 ? `<a:alphaModFix amt="${pm(o.opacity)}"/>` : ''}</a:blip>${c.l || c.t || c.r || c.b ? `<a:srcRect l="${pm(c.l)}" t="${pm(c.t)}" r="${pm(c.r)}" b="${pm(c.b)}"/>` : ''}<a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrm(o)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${o.type === 'image' ? ln(o) : ''}</p:spPr></p:pic>`;
        }
        case 'table': {
          const nr = o.rows.length, nc = o.rows[0].length, sz = Math.round((o.fs || 16) * 100);
          const rows = o.rows.map((r, ri) => `<a:tr h="${EMU(o.h / nr)}">${r.map(cell => { const hd = o.header && ri === 0; return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="de-DE" sz="${sz}"${hd ? ' b="1"' : ''} dirty="0">${solid(hd ? '#ffffff' : '@tx')}</a:rPr><a:t>${XE(cell)}</a:t></a:r></a:p></a:txBody><a:tcPr anchor="ctr">${solid(hd ? '@a1' : (ri % 2 ? '#f2f2f2' : '#fafafa'))}</a:tcPr></a:tc>`; }).join('')}</a:tr>`).join('');
          return `<p:graphicFrame><p:nvGraphicFramePr>${nv(o, id)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${EMU(o.x)}" y="${EMU(o.y)}"/><a:ext cx="${EMU(o.w)}" cy="${EMU(o.h)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="${o.header ? 1 : 0}" bandRow="1"/><a:tblGrid>${Array.from({ length: nc }, () => `<a:gridCol w="${EMU(o.w / nc)}"/>`).join('')}</a:tblGrid>${rows}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
        }
        case 'group': {
          let kids = ''; for (const c of o.children) kids += await objXml(c, false);
          return `<p:grpSp><p:nvGrpSpPr>${nv(o, id)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm${o.rot ? ` rot="${Math.round(((o.rot % 360) + 360) % 360 * 60000)}"` : ''}><a:off x="${EMU(o.x)}" y="${EMU(o.y)}"/><a:ext cx="${EMU(o.w)}" cy="${EMU(o.h)}"/><a:chOff x="0" y="0"/><a:chExt cx="${EMU(o.ow)}" cy="${EMU(o.oh)}"/></a:xfrm></p:grpSpPr>${kids}</p:grpSp>`;
        }
      } return '';
    };
    let tree = ''; const t = TEMPLATES[m.tpl];
    if (t) for (const d of t.decor(W, H, s.layout === 'title' ? 'title' : s.layout === 'section' ? 'section' : 'content')) { d.name = 'Master-Dekor'; tree += await objXml(d, true, true); }
    for (const o of s.objects) tree += await objXml(o, true);
    /* Animationen */
    let timing = ''; const sched = buildSchedule(s.effects.filter(e => spid[e.objId]));
    if (sched.items.length) {
      let cid = 2; const nx = () => ++cid, tg = sp => `<p:tgtEl><p:spTgt spid="${sp}"/></p:tgtEl>`, ms = v => Math.round(v * 1000);
      const setV = (sp, val, delay) => `<p:set><p:cBhvr><p:cTn id="${nx()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst></p:cTn>${tg(sp)}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="${val}"/></p:to></p:set>`;
      const aEff = (sp, tr, f, d) => `<p:animEffect transition="${tr}" filter="${f}"><p:cBhvr><p:cTn id="${nx()}" dur="${d}"/>${tg(sp)}</p:cBhvr></p:animEffect>`;
      const aXY = (sp, at, a, b, d) => `<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="${nx()}" dur="${d}" fill="hold"/>${tg(sp)}<p:attrNameLst><p:attrName>${at}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${a}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${b}"/></p:val></p:tav></p:tavLst></p:anim>`;
      const SUB = { left: 8, right: 2, top: 1, bottom: 4 }, OFF = { left: ['0-#ppt_w/2', 'x'], right: ['1+#ppt_w/2', 'x'], top: ['0-#ppt_h/2', 'y'], bottom: ['1+#ppt_h/2', 'y'] };
      const flyAnims = (sp, dir, d, inward) => { const [off, ax] = OFF[dir || 'left'], a = inward ? off : '#ppt_' + ax, b = inward ? '#ppt_' + ax : off; return ax === 'x' ? aXY(sp, 'ppt_x', a, b, d) + aXY(sp, 'ppt_y', '#ppt_y', '#ppt_y', d) : aXY(sp, 'ppt_x', '#ppt_x', '#ppt_x', d) + aXY(sp, 'ppt_y', a, b, d); };
      const effPar = it => {
        const e = it.e, sp = spid[e.objId], d = ms(e.dur), W_ = W, H_ = H; let cls = e.cat === 'entrance' ? 'entr' : e.cat === 'exit' ? 'exit' : e.cat === 'emphasis' ? 'emph' : 'path', id = 0, sub = 0, kids = '';
        if (e.cat === 'entrance') { if (e.kind === 'appear') { id = 1; kids = setV(sp, 'visible', 0); } else if (e.kind === 'fade') { id = 10; kids = setV(sp, 'visible', 0) + aEff(sp, 'in', 'fade', d); } else if (e.kind === 'fly') { id = 2; sub = SUB[e.dir || 'left']; kids = setV(sp, 'visible', 0) + flyAnims(sp, e.dir, d, true); } else { id = 53; sub = 16; kids = setV(sp, 'visible', 0) + aXY(sp, 'ppt_w', '0', '#ppt_w', d) + aXY(sp, 'ppt_h', '0', '#ppt_h', d) + aEff(sp, 'in', 'fade', d); } }
        else if (e.cat === 'exit') { if (e.kind === 'disappear') { id = 1; kids = setV(sp, 'hidden', 0); } else if (e.kind === 'fade') { id = 10; kids = aEff(sp, 'out', 'fade', d) + setV(sp, 'hidden', d); } else { id = 2; sub = SUB[e.dir || 'right']; kids = flyAnims(sp, e.dir || 'right', d, false) + setV(sp, 'hidden', d); } }
        else if (e.cat === 'emphasis') { if (e.kind === 'spin') { id = 8; kids = `<p:animRot by="${Math.round((e.amount || 360) * 60000)}"><p:cBhvr><p:cTn id="${nx()}" dur="${d}" fill="hold"/>${tg(sp)}<p:attrNameLst><p:attrName>r</p:attrName></p:attrNameLst></p:cBhvr></p:animRot>`; }
          else if (e.kind === 'grow') { id = 6; kids = `<p:animScale><p:cBhvr><p:cTn id="${nx()}" dur="${d}" fill="hold"/>${tg(sp)}</p:cBhvr><p:by x="${Math.round((e.amount || 1.5) * 100000)}" y="${Math.round((e.amount || 1.5) * 100000)}"/></p:animScale>`; }
          else { id = 26; kids = `<p:animScale><p:cBhvr><p:cTn id="${nx()}" dur="${Math.round(d / 2)}" autoRev="1" fill="hold"/>${tg(sp)}</p:cBhvr><p:by x="118000" y="118000"/></p:animScale>`; } }
        else { const P = e.path || { dx: 200, dy: 0 }, f = n => +(n).toFixed(5), dx = P.dx / W_, dy = P.dy / H_; let path = `M 0 0 L ${f(dx)} ${f(dy)} E`;
          if (e.kind === 'arc') { const cx = (P.cx != null ? P.cx : P.dx / 2 - P.dy * .5) / W_, cy = (P.cy != null ? P.cy : P.dy / 2 + P.dx * .5) / H_; path = `M 0 0 C ${f(cx * 2 / 3)} ${f(cy * 2 / 3)} ${f(dx + (cx - dx) * 2 / 3)} ${f(dy + (cy - dy) * 2 / 3)} ${f(dx)} ${f(dy)} E`; }
          else if (e.kind === 'scurve') { const nxv = -P.dy / W_, nyv = P.dx / H_; path = `M 0 0 C ${f(dx / 3 + nxv * .4)} ${f(dy / 3 + nyv * .4)} ${f(2 * dx / 3 - nxv * .4)} ${f(2 * dy / 3 - nyv * .4)} ${f(dx)} ${f(dy)} E`; }
          kids = `<p:animMotion origin="layout" path="${path}" pathEditMode="relative" rAng="0"><p:cBhvr><p:cTn id="${nx()}" dur="${d}" fill="hold"/>${tg(sp)}<p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr></p:animMotion>`; }
        report.anim++;
        return `<p:par><p:cTn id="${nx()}" presetID="${id}" presetClass="${cls}" presetSubtype="${sub}" fill="hold" grpId="0" nodeType="${e.start === 'click' ? 'clickEffect' : e.start === 'with' ? 'withEffect' : 'afterEffect'}"><p:stCondLst><p:cond delay="${ms(e.delay)}"/></p:stCondLst><p:childTnLst>${kids}</p:childTnLst></p:cTn></p:par>`;
      };
      const groups = sched.groups.map(g => { const steps = []; g.items.forEach(it => { let st = steps.find(x => x.base === it.base); if (!st) steps.push(st = { base: it.base, items: [] }); st.items.push(it); });
        const cond = g.auto ? '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' : '<p:cond delay="indefinite"/>', oid = nx();
        return `<p:par><p:cTn id="${oid}" fill="hold"><p:stCondLst>${cond}</p:stCondLst><p:childTnLst>${steps.map(st => { const sid = nx(); return `<p:par><p:cTn id="${sid}" fill="hold"><p:stCondLst><p:cond delay="${ms(st.base)}"/></p:stCondLst><p:childTnLst>${st.items.map(effPar).join('')}</p:childTnLst></p:cTn></p:par>`; }).join('')}</p:childTnLst></p:cTn></p:par>`; }).join('');
      const bld = Array.from(new Set(sched.items.map(i => i.e.objId))).filter(id => animatable[id]).map(id => `<p:bldP spid="${spid[id]}" grpId="0" animBg="1"/>`).join('');
      timing = `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${groups}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${bld ? `<p:bldLst>${bld}</p:bldLst>` : ''}</p:timing>`;
    }
    report.animSkipped += s.effects.length - sched.items.length;
    /* Übergang */
    const tr = s.transition || { type: 'none' }; let trx = '';
    const dirP = { left: 'r', right: 'l', top: 'd', bottom: 'u' }, dirW = { left: 'l', right: 'r', top: 'u', bottom: 'd' };
    const inner = { fade: '<p:fade/>', morph: '<p:fade/>', dim: '<p:fade thruBlk="1"/>', push: `<p:push dir="${dirP[tr.dir] || 'l'}"/>`, wipe: `<p:wipe dir="${dirW[tr.dir] || 'l'}"/>`, split: `<p:split orient="${tr.dir === 'vertical' ? 'vert' : 'horz'}" dir="out"/>`, zoom: '<p:zoom dir="in"/>' }[tr.type];
    const adv = `${s.advClick === false ? ' advClick="0"' : ''}${s.advTime != null ? ` advTm="${Math.round(s.advTime * 1000)}"` : ''}`, spd = tr.dur >= 1 ? 'slow' : tr.dur >= .6 ? 'med' : 'fast';
    if (inner) { report.transitions++; trx = `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" Requires="p14"><p:transition spd="${spd}"${adv} p14:dur="${Math.round(tr.dur * 1000)}">${inner}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${spd}"${adv}>${inner}</p:transition></mc:Fallback></mc:AlternateContent>`; }
    else if (adv) trx = `<p:transition${adv}/>`;
    const bg = `<p:bg><p:bgPr>${solid(s.bg || m.bg)}<a:effectLst/></p:bgPr></p:bg>`;
    slideXmls.push(XML_HEAD + `<p:sld ${NS}><p:cSld>${bg}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${tree}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${trx}${timing}</p:sld>`);
    if (s.notes && s.notes.trim()) { report.notes++; rels.push({ id: 'rId' + (rels.length + 1), type: 'notesSlide', target: '../notesSlides/notesSlide' + (si + 1) + '.xml' });
      notesXmls[si] = XML_HEAD + `<p:notes ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Folienbild"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notizen"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${s.notes.split(/\r?\n/).map(l => `<a:p><a:r><a:rPr lang="de-DE"/><a:t>${XE(l)}</a:t></a:r></a:p>`).join('')}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`; }
    slideRels.push(rels);
  }
  const RT = t => ({ slideLayout: 'slideLayout', image: 'image', notesSlide: 'notesSlide', notesMaster: 'notesMaster', slide: 'slide', slideMaster: 'slideMaster', theme: 'theme' }[t]);
  const relsXml = list => XML_HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + list.map(r => `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${RT(r.type)}" Target="${r.target}"/>`).join('') + '</Relationships>';
  const fam = f => f.split(',')[0].replace(/["']/g, '').trim();
  const theme = (name) => XML_HEAD + `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="${name}"><a:themeElements><a:clrScheme name="WebOffice"><a:dk1><a:srgbClr val="${hx(m.textColor)}"/></a:dk1><a:lt1><a:srgbClr val="${hx(m.bg)}"/></a:lt1><a:dk2><a:srgbClr val="${hx(m.titleColor)}"/></a:dk2><a:lt2><a:srgbClr val="F2F2F2"/></a:lt2>${m.accents.map((a, i) => `<a:accent${i + 1}><a:srgbClr val="${hx(a)}"/></a:accent${i + 1}>`).join('')}<a:hlink><a:srgbClr val="${hx(m.accents[3])}"/></a:hlink><a:folHlink><a:srgbClr val="${hx(m.accents[4])}"/></a:folHlink></a:clrScheme><a:fontScheme name="WebOffice"><a:majorFont><a:latin typeface="${XE(fam(m.titleFont))}"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="${XE(fam(m.bodyFont))}"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst>${'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3)}</a:fillStyleLst><a:lnStyleLst>${[6350, 12700, 19050].map(w => `<a:ln w="${w}" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>`).join('')}</a:lnStyleLst><a:effectStyleLst>${'<a:effectStyle><a:effectLst/></a:effectStyle>'.repeat(3)}</a:effectStyleLst><a:bgFillStyleLst>${'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3)}</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
  const clrMap = '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>';
  const grp0 = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
  const lvl = tag => `<${tag}><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr></${tag}>`;
  const n = proj.slides.length, ct = [];
  files.push({ name: 'ppt/slideMasters/slideMaster1.xml', data: XML_HEAD + `<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${grp0}</p:spTree></p:cSld>${clrMap}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles>${lvl('p:titleStyle')}${lvl('p:bodyStyle')}${lvl('p:otherStyle')}</p:txStyles></p:sldMaster>` });
  files.push({ name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: relsXml([{ id: 'rId1', type: 'slideLayout', target: '../slideLayouts/slideLayout1.xml' }, { id: 'rId2', type: 'theme', target: '../theme/theme1.xml' }]) });
  files.push({ name: 'ppt/slideLayouts/slideLayout1.xml', data: XML_HEAD + `<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Leer"><p:spTree>${grp0}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>` });
  files.push({ name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: relsXml([{ id: 'rId1', type: 'slideMaster', target: '../slideMasters/slideMaster1.xml' }]) });
  files.push({ name: 'ppt/theme/theme1.xml', data: theme('WebOffice') }, { name: 'ppt/theme/theme2.xml', data: theme('WebOfficeNotes') });
  files.push({ name: 'ppt/notesMasters/notesMaster1.xml', data: XML_HEAD + `<p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${grp0}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Folienbild"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notizen"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4400550"/><a:ext cx="5486400" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="de-DE"/></a:p></p:txBody></p:sp></p:spTree></p:cSld>${clrMap}${lvl('p:notesStyle')}</p:notesMaster>` });
  files.push({ name: 'ppt/notesMasters/_rels/notesMaster1.xml.rels', data: relsXml([{ id: 'rId1', type: 'theme', target: '../theme/theme2.xml' }]) });
  const prels = [{ id: 'rId1', type: 'slideMaster', target: 'slideMasters/slideMaster1.xml' }, { id: 'rId2', type: 'notesMaster', target: 'notesMasters/notesMaster1.xml' }, { id: 'rId3', type: 'theme', target: 'theme/theme1.xml' }];
  for (let i = 0; i < n; i++) {
    prels.push({ id: 'rId' + (4 + i), type: 'slide', target: 'slides/slide' + (i + 1) + '.xml' });
    files.push({ name: `ppt/slides/slide${i + 1}.xml`, data: slideXmls[i] }, { name: `ppt/slides/_rels/slide${i + 1}.xml.rels`, data: relsXml(slideRels[i]) });
    if (notesXmls[i]) files.push({ name: `ppt/notesSlides/notesSlide${i + 1}.xml`, data: notesXmls[i] }, { name: `ppt/notesSlides/_rels/notesSlide${i + 1}.xml.rels`, data: relsXml([{ id: 'rId1', type: 'notesMaster', target: '../notesMasters/notesMaster1.xml' }, { id: 'rId2', type: 'slide', target: '../slides/slide' + (i + 1) + '.xml' }]) });
  }
  files.push({ name: 'ppt/presentation.xml', data: XML_HEAD + `<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:notesMasterIdLst><p:notesMasterId r:id="rId2"/></p:notesMasterIdLst><p:sldIdLst>${proj.slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${4 + i}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${EMU(W)}" cy="${EMU(H)}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>` });
  files.push({ name: 'ppt/_rels/presentation.xml.rels', data: relsXml(prels) });
  Object.values(media).forEach(md => files.push({ name: 'ppt/media/' + md.name, data: md.bytes }));
  files.push({ name: 'docProps/core.xml', data: XML_HEAD + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${XE(proj.title)}</dc:title><dc:creator>WebOffice</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</dcterms:created></cp:coreProperties>` });
  files.push({ name: 'docProps/app.xml', data: XML_HEAD + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>WebOffice Präsentation</Application></Properties>' });
  files.push({ name: '_rels/.rels', data: relsXml([{ id: 'rId1', type: 'slide', target: 'x' }]).replace(/<Relationship Id="rId1"[^>]*\/>/, '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>') });
  const ov = (p, t) => `<Override PartName="${p}" ContentType="application/vnd.openxmlformats-officedocument.${t}+xml"/>`;
  files.unshift({ name: '[Content_Types].xml', data: XML_HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/>' +
    ov('/ppt/presentation.xml', 'presentationml.presentation.main') + ov('/ppt/slideMasters/slideMaster1.xml', 'presentationml.slideMaster') + ov('/ppt/slideLayouts/slideLayout1.xml', 'presentationml.slideLayout') + ov('/ppt/theme/theme1.xml', 'theme').replace('officedocument.theme', 'officedocument.theme') + ov('/ppt/theme/theme2.xml', 'theme') + ov('/ppt/notesMasters/notesMaster1.xml', 'presentationml.notesMaster') +
    proj.slides.map((_, i) => ov(`/ppt/slides/slide${i + 1}.xml`, 'presentationml.slide') + (notesXmls[i] ? ov(`/ppt/notesSlides/notesSlide${i + 1}.xml`, 'presentationml.notesSlide') : '')).join('') +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' });
  return { bytes: ZipLib.build(files), report };
}
async function exportPptx() {
  if (S.editing) endEdit();
  try {
    const { bytes, report } = await buildPptx(); download(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), safeName() + '.pptx');
    dialog({ title: 'PowerPoint-Export abgeschlossen', body: el('div', null, el('p', null, `${report.slides} Folien, ${report.anim} Animationseffekte, ${report.transitions} Übergänge, ${report.notes} Notizen geschrieben.`),
      el('p', { class: 'hint' }, 'Erhalten: Folien mit editierbaren Textfeldern, Formen, Linien, Bildern (inkl. Zuschnitt), Tabellen, Gruppen, Hintergründe, Notizen, Theme-Farben/-Schriften, Übergänge (Überblenden, Schieben, Wischen, Teilen, Abdunkeln, Zoom; Morph wird als Überblenden geschrieben) sowie Eingangs-, Ausgangs-, Hervorhebungs- und Pfadanimationen mit Start, Dauer und Verzögerung.'),
      el('p', { class: 'hint' }, 'Nicht erhalten: Master-Platzhalter und Master-Vererbung (Dekor wird als Formen je Folie geschrieben), Morph-Kopplungen, Diagramme als Datenobjekt (Bild), Drehung von Tabellen, ausgeblendete Objekte. Die Datei wurde nicht in Microsoft PowerPoint geöffnet; Richtungsangaben der Übergänge sind nach Spezifikation gesetzt.'),
      report.skipped.length ? el('p', { class: 'hint' }, 'Hinweise: ' + Array.from(new Set(report.skipped)).join('; ')) : '', report.animSkipped ? el('p', { class: 'hint' }, report.animSkipped + ' Effekt(e) auf nicht exportierten Objekten wurden ausgelassen.') : '') });
  } catch (e) { console.error(e); toast('PPTX-Export fehlgeschlagen: ' + e.message, true); }
}
