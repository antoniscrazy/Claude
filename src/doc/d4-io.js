/* =====================================================================
   4. Projekt speichern/laden, Export (DOCX, HTML, TXT), Druckansicht, Menüband, Tastatur, Start
   ===================================================================== */
const AUTOSAVE_KEY = 'webOffice.doc.autosave.v1';
let autoT = 0, autoMsg = 'Noch nicht gesichert', fileMsg = '';
function docJSONObj() {
  checkpoint(); const used = new Set(); S.doc.blocks.forEach(b => { if (b.t === 'img') used.add(b.src); }); const assets = {}; used.forEach(k => { if (S.doc.assets[k]) assets[k] = S.doc.assets[k]; });
  return { format: 'WebOffice-Dokument', version: 1, title: S.name, page: S.doc.page, hf: S.doc.hf, blocks: S.doc.blocks, assets };
}
const safeName = () => (S.name || 'Dokument').replace(/[äÄöÖüÜß]/g, c => ({ 'ä': 'ae', 'Ä': 'Ae', 'ö': 'oe', 'Ö': 'Oe', 'ü': 'ue', 'Ü': 'Ue', 'ß': 'ss' }[c])).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w .-]+/g, '_').trim().slice(0, 80) || 'Dokument';
function download(blob, name) { const a = el('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function setSaveStatus() { $('#savestat').textContent = [autoMsg, fileMsg].filter(Boolean).join(' · '); }
function scheduleAutosave() { autoMsg = 'Änderungen noch nicht gesichert …'; setSaveStatus(); clearTimeout(autoT); autoT = setTimeout(() => { try { localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(Object.assign({}, S.doc, { title: S.name }))); autoMsg = 'Automatisch gesichert ' + new Date().toLocaleTimeString('de-DE'); } catch (e) { autoMsg = 'Automatische Sicherung nicht möglich (' + (e && e.name === 'QuotaExceededError' ? 'Speicher voll' : 'Browser blockiert Speicher') + ') – bitte Datei herunterladen'; } setSaveStatus(); }, 900); }
function saveProject() { try { const o = docJSONObj(); download(new Blob([JSON.stringify(o)], { type: 'application/json' }), safeName() + '.webdoc.json'); S.dirty = false; fileMsg = 'Projektdatei heruntergeladen ' + new Date().toLocaleTimeString('de-DE'); setSaveStatus(); toast('Dokument als „' + safeName() + '.webdoc.json“ heruntergeladen.'); } catch (e) { toast('Speichern fehlgeschlagen: ' + e.message, true); } }
function adoptDoc(d, name) { S.doc = d; S.name = name || d.title; $('#docname').value = S.name; deselectImage(); renderDoc(); histReset(); S.dirty = false; docEl().scrollTop = 0; $('#scroller').scrollTop = 0; refreshRibbon(); renderStatus(); }
function confirmLoad(d, name) { const go = () => { adoptDoc(d, name); scheduleAutosave(); }; if (S.dirty) dialog({ title: 'Aktuelles Dokument ersetzen?', body: 'Nicht heruntergeladene Änderungen gehen verloren.', buttons: [{ label: 'Abbrechen' }, { label: 'Ersetzen', pri: true, fn: go }], noRestore: true }); else go(); }
function openPicker() {
  const f = $('#fileIn'); f.value = ''; f.onchange = async () => { const file = f.files[0]; if (!file) return;
    try { const raw = JSON.parse(await file.text()); const d = validateDoc(raw); confirmLoad(d, d.title); }
    catch (e) { dialog({ title: 'Datei konnte nicht geöffnet werden', body: el('div', null, el('p', null, e instanceof SyntaxError ? 'Die Datei ist kein gültiges JSON (beschädigt oder falscher Dateityp). Hinweis: .docx-Import wird nicht unterstützt.' : e.message), el('p', { class: 'hint' }, 'Das aktuell geöffnete Dokument wurde nicht verändert.')) }); } }; f.click();
}
function newDialog() { dialog({ title: 'Neues Dokument', body: 'Leeres Dokument oder das integrierte Beispieldokument (mehrere Seiten, Überschriften, Liste, Tabelle, Bild) laden?', buttons: [{ label: 'Abbrechen' }, { label: 'Beispieldokument', fn: () => confirmLoad(sampleDoc(), 'Projektbericht') }, { label: 'Leeres Dokument', pri: true, fn: () => confirmLoad(blankDoc(), 'Dokument') }], noRestore: true }); }

/* ---------- TXT / HTML ---------- */
function exportTxt() {
  checkpoint(); const L = []; let n = 0;
  S.doc.blocks.forEach(b => { if (b.t === 'p') { const t = textOf(b.html.replace(/<br>/g, '\n')); if (b.list === 'ul') L.push('• ' + t); else if (b.list === 'ol') L.push((++n) + '. ' + t); else { L.push(t); } if (b.list !== 'ol') n = 0; if (!b.list && (b.st !== 'normal')) L.push(''); }
    else if (b.t === 'table') { b.rows.forEach(r => L.push(r.map(c => textOf(c.replace(/<br>/g, ' '))).join('\t'))); L.push(''); } else if (b.t === 'img') L.push('[Bild]'); else if (b.t === 'pb') L.push('\f'); if (b.t !== 'p') n = 0; });
  download(new Blob(['﻿' + L.join('\n')], { type: 'text/plain;charset=utf-8' }), safeName() + '.txt'); toast('Als Text exportiert (Formatierung entfällt).');
}
const DOC_CSS = `body{font-family:"Segoe UI",Calibri,Arial,sans-serif;font-size:11pt;line-height:1.15;max-width:800px;margin:2rem auto;padding:0 1rem;color:#1d2330}p,li{margin:0 0 8pt}h1{font-size:20pt;color:#1f3a7a;margin:14pt 0 6pt}h2{font-size:16pt;color:#1f3a7a;margin:12pt 0 6pt}h3{font-size:13pt;color:#1f3a7a;margin:10pt 0 4pt}.s-title{font-size:26pt;font-weight:600;margin:0 0 6pt}.s-subtitle{font-size:14pt;color:#667085;margin:0 0 14pt}table{border-collapse:collapse;width:100%;margin:8pt 0}td,th{border:1px solid #9aa4b2;padding:4pt 6pt;vertical-align:top}th{background:#dbe6ff;text-align:left}figure{margin:8pt 0}hr.pb{border:0;page-break-after:always}`;
function exportHtml() {
  checkpoint(); const tmp = document.createElement('div'); tmp.append(blocksToDOM(S.doc.blocks, S.doc.assets)); tmp.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable')); tmp.querySelectorAll('.b-pb').forEach(e => e.replaceWith(el('hr', { class: 'pb' }))); tmp.querySelectorAll('figure').forEach(f => { f.removeAttribute('data-asset'); });
  const html = '<!DOCTYPE html>\n<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escHtml(S.name) + '</title><style>' + DOC_CSS + '</style></head><body>' + tmp.innerHTML + '</body></html>';
  download(new Blob([html], { type: 'text/html' }), safeName() + '.html'); toast('Als HTML exportiert (ohne Kopf-/Fußzeilen und Seitenzahlen).');
}

/* ---------- DOCX ---------- */
const WX = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const XH = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const TW = mm => Math.round(mm * 56.6929);
function runsXml(html, base) {
  const d = document.createElement('div'); d.innerHTML = html; let out = '';
  const rpr = f => { let x = ''; if (f.font) x += `<w:rFonts w:ascii="${WX(f.font)}" w:hAnsi="${WX(f.font)}" w:cs="${WX(f.font)}"/>`; if (f.b) x += '<w:b/>'; if (f.i) x += '<w:i/>'; if (f.s) x += '<w:strike/>'; if (f.co) x += `<w:color w:val="${f.co}"/>`; if (f.sz) x += `<w:sz w:val="${f.sz}"/><w:szCs w:val="${f.sz}"/>`; if (f.u) x += '<w:u w:val="single"/>'; if (f.bg) x += `<w:shd w:val="clear" w:color="auto" w:fill="${f.bg}"/>`; if (f.va) x += `<w:vertAlign w:val="${f.va}"/>`; return x ? `<w:rPr>${x}</w:rPr>` : ''; };
  const hex = c => { const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c || ''); if (!m) return null; let h = m[1]; if (h.length === 3) h = h.split('').map(x => x + x).join(''); return h.toUpperCase(); };
  const walk = (n, f) => {
    if (n.nodeType === 3) { if (n.nodeValue) out += `<w:r>${rpr(f)}<w:t xml:space="preserve">${WX(n.nodeValue)}</w:t></w:r>`; return; } if (n.nodeType !== 1) return;
    if (n.tagName === 'BR') { out += `<w:r>${rpr(f)}<w:br/></w:r>`; return; } const g = Object.assign({}, f), t = n.tagName;
    if (t === 'B') g.b = 1; if (t === 'I') g.i = 1; if (t === 'U') g.u = 1; if (t === 'S') g.s = 1; if (t === 'SUB') g.va = 'subscript'; if (t === 'SUP') g.va = 'superscript';
    if (t === 'SPAN') { const st = n.style; if (st.color) g.co = hex(st.color.startsWith('rgb') ? '#' + st.color.match(/\d+/g).slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('') : st.color) || g.co; if (st.backgroundColor) { const m = st.backgroundColor.match(/\d+/g); if (m) g.bg = m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('').toUpperCase(); else g.bg = hex(st.backgroundColor); } if (/px$/.test(st.fontSize)) g.sz = Math.round(parseFloat(st.fontSize) * .75 * 2); if (st.fontFamily) g.font = st.fontFamily.replace(/["']/g, '').split(',')[0].trim(); }
    n.childNodes.forEach(c => walk(c, g));
  };
  d.childNodes.forEach(c => walk(c, base || {})); return out;
}
async function buildDocx() {
  const blocks = docJSONObj().blocks, g = pageGeom(), hf = S.doc.hf, files = [], media = [], numInst = []; let docId = 1, olOpen = false;
  const cwTw = TW(g.wmm - S.doc.page.m.l - S.doc.page.m.r), STY = { normal: null, title: 'Title', subtitle: 'Subtitle', h1: 'Heading1', h2: 'Heading2', h3: 'Heading3' }, rels = [];
  const para = (b, base, cell) => {
    let ppr = ''; const sty = !b.list && STY[b.st]; if (b.list) ppr += '<w:pStyle w:val="ListParagraph"/>'; else if (sty) ppr += `<w:pStyle w:val="${sty}"/>`;
    if (b.list) ppr += `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${b.list === 'ul' ? 1 : numInst[numInst.length - 1]}"/></w:numPr>`;
    if (b.sb != null || b.sa != null || b.lh) ppr += `<w:spacing${b.sb != null ? ` w:before="${Math.round(b.sb * 20)}"` : ''}${b.sa != null ? ` w:after="${Math.round(b.sa * 20)}"` : ''}${b.lh ? ` w:line="${Math.round(b.lh * 240)}" w:lineRule="auto"` : ''}/>`; if (b.ind) ppr += `<w:ind w:left="${TW(b.ind)}"/>`;
    if (b.al) ppr += `<w:jc w:val="${{ center: 'center', right: 'right', justify: 'both' }[b.al]}"/>`; return `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ''}${runsXml(b.html, base)}</w:p>`;
  };
  let body = '';
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t === 'p') { if (b.list === 'ol' && !(blocks[i - 1] && blocks[i - 1].t === 'p' && blocks[i - 1].list === 'ol')) numInst.push(numInst.length + 2); body += para(b); }
    else if (b.t === 'pb') body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    else if (b.t === 'table') {
      const nc = b.rows[0].length, cw = Math.floor(cwTw / nc);
      body += `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="${cwTw}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="${b.hdr ? 1 : 0}" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${Array.from({ length: nc }, () => `<w:gridCol w:w="${cw}"/>`).join('')}</w:tblGrid>` +
        b.rows.map((r, ri) => `<w:tr>${b.hdr && ri === 0 ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${r.map(c => `<w:tc><w:tcPr><w:tcW w:w="${cw}" w:type="dxa"/>${b.hdr && ri === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="DBE6FF"/>' : ''}</w:tcPr>${paraCell(c, b.hdr && ri === 0)}</w:tc>`).join('')}</w:tr>`).join('') + '</w:tbl><w:p/>';
    } else if (b.t === 'img') {
      const src = S.doc.assets[b.src], m = /^data:image\/(png|jpeg|gif|webp);base64,(.*)$/.exec(src || ''); if (!m) continue;
      let bytes, ext = m[1] === 'jpeg' ? 'jpeg' : m[1]; const im = await new Promise((res, rej) => { const x = new Image(); x.onload = () => res(x); x.onerror = () => rej(new Error('Bild nicht dekodierbar')); x.src = src; });
      if (m[1] === 'webp') { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); bytes = Uint8Array.from(atob(c.toDataURL('image/png').split(',')[1]), ch => ch.charCodeAt(0)); ext = 'png'; } else bytes = Uint8Array.from(atob(m[2]), ch => ch.charCodeAt(0));
      const name = 'image' + (media.length + 1) + '.' + ext, rid = 'rId' + (10 + media.length); media.push({ name, bytes }); rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`);
      const wpx = Math.min(b.w, g.cw), cx = Math.round(wpx * 9525), cy = Math.round(wpx * im.naturalHeight / im.naturalWidth * 9525), id = docId++;
      body += `<w:p><w:pPr>${b.al ? `<w:jc w:val="${b.al}"/>` : ''}</w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Bild ${id}" descr="Bild"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${WX(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
    }
  }
  function paraCell(html, bold) { const base = bold ? { b: 1 } : {}; return `<w:p>${runsXml(html, base)}</w:p>`; }
  const hfPara = (text, pnPos, which) => {
    const pn = hf.pn !== 'none' && hf.pn.startsWith(which) ? hf.pn : null, fld = (ins) => `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${ins} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
    let num = ''; if (pn) { num = hf.pnFmt === 'of' ? '<w:r><w:t xml:space="preserve">Seite </w:t></w:r>' + fld('PAGE') + '<w:r><w:t xml:space="preserve"> von </w:t></w:r>' + fld('NUMPAGES') : fld('PAGE'); }
    const tabs = (pn && pn.endsWith('center') ? '<w:r><w:tab/></w:r>' : pn && pn.endsWith('right') ? '<w:r><w:tab/></w:r><w:r><w:tab/></w:r>' : '');
    return `<w:p><w:pPr><w:pStyle w:val="${which === 'header' ? 'Header' : 'Footer'}"/><w:tabs><w:tab w:val="clear" w:pos="4680"/><w:tab w:val="clear" w:pos="9360"/><w:tab w:val="center" w:pos="${Math.round(cwTw / 2)}"/><w:tab w:val="right" w:pos="${cwTw}"/></w:tabs></w:pPr>${text ? `<w:r><w:t xml:space="preserve">${WX(text)}</w:t></w:r>` : ''}${tabs}${num}</w:p>`;
  };
  const NSW = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rId8"/><w:footerReference w:type="default" r:id="rId9"/><w:pgSz w:w="${TW(g.wmm)}" w:h="${TW(g.hmm)}"${S.doc.page.orient === 'landscape' ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${TW(S.doc.page.m.t)}" w:right="${TW(S.doc.page.m.r)}" w:bottom="${TW(S.doc.page.m.b)}" w:left="${TW(S.doc.page.m.l)}" w:header="${Math.round(TW(S.doc.page.m.t) / 2)}" w:footer="${Math.round(TW(S.doc.page.m.b) / 2)}" w:gutter="0"/></w:sectPr>`;
  const hs = (id, sz, color, before, after, bold) => `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${{ Heading1: 'heading 1', Heading2: 'heading 2', Heading3: 'heading 3', Title: 'Title', Subtitle: 'Subtitle' }[id]}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="${before}" w:after="${after}"/>${id.startsWith('Heading') ? `<w:outlineLvl w:val="${+id.slice(-1) - 1}"/>` : ''}</w:pPr><w:rPr>${bold ? '<w:b/>' : ''}<w:color w:val="${color}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr></w:style>`;
  const styles = XH + `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>` + hs('Title', 52, '1D2330', 0, 120, true) + hs('Subtitle', 28, '667085', 0, 240, false) + hs('Heading1', 40, '1F3A7A', 280, 120, true) + hs('Heading2', 32, '1F3A7A', 240, 120, true) + hs('Heading3', 26, '1F3A7A', 200, 80, true) +
    '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/><w:ind w:left="720"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:color w:val="667085"/><w:sz w:val="18"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:rPr><w:color w:val="667085"/><w:sz w:val="18"/></w:rPr></w:style>' +
    '<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="9AA4B2"/><w:left w:val="single" w:sz="4" w:space="0" w:color="9AA4B2"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="9AA4B2"/><w:right w:val="single" w:sz="4" w:space="0" w:color="9AA4B2"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="9AA4B2"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="9AA4B2"/></w:tblBorders></w:tblPr></w:style></w:styles>';
  const lvl = (fmt, txt, font) => `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${txt}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>${font ? `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:hint="default"/></w:rPr>` : ''}</w:lvl>`;
  const numbering = XH + `<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${lvl('bullet', '•', 'Symbol').replace('•', '')}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${lvl('decimal', '%1.')}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>${numInst.map(n => `<w:num w:numId="${n}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('')}</w:numbering>`;
  files.push({ name: '[Content_Types].xml', data: XH + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>' });
  files.push({ name: '_rels/.rels', data: XH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' });
  files.push({ name: 'word/_rels/document.xml.rels', data: XH + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' + rels.join('') + '</Relationships>' });
  files.push({ name: 'word/document.xml', data: XH + `<w:document ${NSW}><w:body>${body}${sect}</w:body></w:document>` });
  files.push({ name: 'word/styles.xml', data: styles }, { name: 'word/numbering.xml', data: numbering });
  files.push({ name: 'word/header1.xml', data: XH + `<w:hdr ${NSW}>${hfPara(hf.header, null, 'header')}</w:hdr>` }, { name: 'word/footer1.xml', data: XH + `<w:ftr ${NSW}>${hfPara(hf.footer, null, 'footer')}</w:ftr>` });
  media.forEach(m => files.push({ name: 'word/media/' + m.name, data: m.bytes }));
  return ZipLib.build(files);
}
async function exportDocx() { try { const bytes = await buildDocx(); download(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), safeName() + '.docx'); toast('DOCX exportiert: Absätze, Formatvorlagen, Listen, Tabellen, Bilder, Seitenumbrüche, Seitenformat, Kopf-/Fußzeile mit Seitenzahlfeld.'); } catch (e) { console.error(e); toast('DOCX-Export fehlgeschlagen: ' + e.message, true); } }

/* ---------- Druckansicht: gleiche Paginierung wie im Editor ---------- */
function buildPrintPages(host) {
  const g = pageGeom(), hf = S.doc.hf, n = S.pages.length; host.replaceChildren(); let st = $('#pagestyle'); if (!st) { st = el('style', { id: 'pagestyle' }); document.head.append(st); } st.textContent = `@page{size:${Math.round(g.W)}px ${Math.round(g.H)}px;margin:0}`;
  S.pages.forEach((p, k) => {
    const page = el('div', { class: 'ppage', style: `width:${g.W}px;min-height:${g.H}px;height:${Math.max(g.H, p.h)}px` }), box = el('div', { class: 'docflow pcontent', style: `position:absolute;left:${g.ml}px;top:${g.mt}px;width:${g.cw}px` });
    let curTbl = null, curList = null, lastParent = null;
    for (let i = p.start; i <= p.end; i++) {
      const u = S.units[i];
      if (u.kind === 'block') { curTbl = curList = null; lastParent = null; if (u.el.classList.contains('b-pb')) continue; const c = u.el.cloneNode(true); c.removeAttribute('contenteditable'); c.querySelectorAll('.imgh').forEach(x => x.remove()); c.classList.remove('sel'); box.append(c); }
      else if (u.kind === 'row') { if (!curTbl || lastParent !== u.block) { curTbl = u.block.cloneNode(false); curTbl.append(document.createElement('tbody')); box.append(curTbl); lastParent = u.block; curList = null; } const c = u.el.cloneNode(true); curTbl.firstChild.append(c); }
      else { if (!curList || lastParent !== u.block) { curList = u.block.cloneNode(false); if (u.block.tagName === 'OL') curList.setAttribute('start', 1 + Array.from(u.block.children).filter(x => !x.classList.contains('spacer')).indexOf(u.el)); box.append(curList); lastParent = u.block; curTbl = null; } curList.append(u.el.cloneNode(true)); }
    }
    page.append(box); const mk = (cls, txt, css) => page.append(el('div', { class: 'hf ' + cls, style: css }, txt));
    if (hf.header) mk('h', hf.header, `left:${g.ml}px;top:${g.mt * .45 - 8}px`); if (hf.footer) mk('f', hf.footer, `left:${g.ml}px;bottom:${g.mb * .45 - 8}px`);
    if (hf.pn === 'footer-center') mk('f pn', pnText(k, n), `left:0;right:0;text-align:center;bottom:${g.mb * .45 - 8}px`); else if (hf.pn === 'footer-right') mk('f pn', pnText(k, n), `right:${g.mr}px;bottom:${g.mb * .45 - 8}px`); else if (hf.pn === 'header-right') mk('h pn', pnText(k, n), `right:${g.mr}px;top:${g.mt * .45 - 8}px`);
    host.append(page);
  });
}
function openPrintView(doPrint) {
  checkpoint(); paginate(); let pv = $('#pv'); if (!pv) { pv = el('div', { id: 'pv' }, el('div', { class: 'pvbar' }, el('b', null, 'Druckansicht'), el('span', { id: 'pvinfo' }), el('span', { class: 'sp' }), el('button', { class: 'btn pri', id: 'pvprint', onclick: () => window.print() }, 'Drucken / als PDF speichern'), el('button', { class: 'btn', id: 'pvclose', onclick: closePrintView }, 'Schließen')), el('div', { id: 'pvpages' })); document.body.append(pv); }
  pv.style.display = 'block'; buildPrintPages($('#pvpages')); $('#pvinfo').textContent = S.pages.length + ' Seite(n) · ' + S.doc.page.size + (S.doc.page.orient === 'landscape' ? ' quer' : ' hoch'); document.body.classList.add('printing'); $('#pvclose').focus(); if (doPrint) setTimeout(() => window.print(), 80);
}
function closePrintView() { const pv = $('#pv'); if (pv) pv.style.display = 'none'; document.body.classList.remove('printing'); docEl().focus({ preventScroll: true }); restoreSel(); }

/* ---------- Menüband ---------- */
let ribCtl = [];
function B(o) { const b = el('button', { class: 'rb-btn' + (o.sm ? ' sm' : '') + (o.label ? '' : ' ic-only'), title: o.tip || o.label || '', 'aria-label': o.tip || o.label || o.icon, html: icon(o.icon, o.sm ? 18 : 26) + (o.label ? '<span></span>' : '') }); if (o.label) b.lastChild.textContent = o.label; b.addEventListener('mousedown', e => e.preventDefault()); b.addEventListener('click', () => { if (o.menu) showMenu(b, o.menu()); else o.fn(); }); b._upd = () => { b.disabled = o.en ? !o.en() : false; b.classList.toggle('on', !!(o.on && o.on())); }; ribCtl.push(b); return b; }
function F(o) { const w = el('label', { class: 'rb-field' }, o.label || ''); let inp; if (o.type === 'select') inp = el('select', { 'aria-label': o.label || o.tip, title: o.tip || '', onmousedown: saveSel, onchange: e => { restoreSel(); o.set(e.target.value); } }, ...o.opts.map(([v, t]) => el('option', { value: v }, t))); else inp = el('input', { type: o.type || 'color', min: o.min, max: o.max, step: o.step, title: o.tip || '', 'aria-label': o.label || o.tip, onmousedown: saveSel, onchange: e => { restoreSel(); o.set(o.type === 'number' ? +e.target.value : e.target.value); } }); w.append(inp); if (o.after) w.append(o.after); w._upd = () => { const v = o.get ? o.get() : null; if (v != null && document.activeElement !== inp) inp.value = v; }; ribCtl.push(w); return w; }
const GR = (name, ...items) => el('div', { class: 'grp' }, el('div', { class: 'items' }, ...items), el('div', { class: 'gn' }, name));
const col = (...c) => el('div', { class: 'rb-col' }, ...c);
const inTable = () => !!curCellQuiet();
function curCellQuiet() { const s = getSelection(); if (!s.rangeCount) return null; let n = s.anchorNode; if (n && n.nodeType === 3) n = n.parentNode; return n && docEl().contains(n) ? n.closest('td,th') : null; }
const RIB = {
  file() { return [GR('Dokument', B({ icon: 'new', label: 'Neu', fn: newDialog }), B({ icon: 'open', label: 'Öffnen', tip: 'Projektdatei (.webdoc.json) öffnen', fn: openPicker }), B({ icon: 'save', label: 'Speichern', tip: 'Projekt herunterladen (Strg+S)', fn: saveProject })),
    GR('Exportieren', B({ icon: 'docx', label: 'Word (.docx)', fn: exportDocx }), B({ icon: 'html', label: 'HTML', fn: exportHtml }), B({ icon: 'txt', label: 'Text (.txt)', fn: exportTxt }), B({ icon: 'print', label: 'Drucken / PDF', tip: 'Druckansicht öffnen und drucken', fn: () => openPrintView(true) })), GR('Hilfe', B({ icon: 'help', label: 'Funktionsumfang', fn: helpDialog }))]; },
  start() {
    const fonts = FONTS.slice();
    return [GR('Zwischenablage', B({ icon: 'paste', label: 'Einfügen', tip: 'Einfügen (Strg+V)', fn: () => toast('Einfügen mit Strg+V') }), col(B({ icon: 'cut', sm: 1, label: 'Ausschneiden', fn: () => { ensureSel(); document.execCommand('cut'); onInput(); } }), B({ icon: 'copy', sm: 1, label: 'Kopieren', fn: () => { ensureSel(); document.execCommand('copy'); } }))),
      GR('Schriftart', col(el('div', { class: 'rb-field' }, F({ type: 'select', tip: 'Schriftart', opts: [['', '–']].concat(fonts), get: () => curFontFamily(), set: v => v && exec('fontName', v.replace(/"/g, ''), true) }), F({ type: 'select', tip: 'Schriftgröße (pt)', opts: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48].map(n => [n, n]), get: () => curFontSizePt(), set: v => setFontSize(+v) })),
        el('div', { class: 'rb-field' }, B({ icon: 'bold', sm: 1, tip: 'Fett (Strg+B)', on: () => queryState('bold'), fn: () => exec('bold') }), B({ icon: 'italic', sm: 1, tip: 'Kursiv (Strg+I)', on: () => queryState('italic'), fn: () => exec('italic') }), B({ icon: 'underline', sm: 1, tip: 'Unterstrichen (Strg+U)', on: () => queryState('underline'), fn: () => exec('underline') }), B({ icon: 'strike', sm: 1, tip: 'Durchgestrichen', on: () => queryState('strikeThrough'), fn: () => exec('strikeThrough') }),
          F({ type: 'color', tip: 'Schriftfarbe', get: () => '#000000', set: v => exec('foreColor', v, true), after: el('span', { html: icon('fontcolor', 16) }) }), F({ type: 'color', tip: 'Texthervorhebung', get: () => '#ffff00', set: v => exec('hiliteColor', v, true), after: el('span', { html: icon('highlight', 16) }) }), B({ icon: 'clear', sm: 1, tip: 'Formatierung löschen', fn: clearFormat })))),
      GR('Absatz', col(el('div', { class: 'rb-field' }, ...[['left', 'Linksbündig'], ['center', 'Zentriert'], ['right', 'Rechtsbündig'], ['justify', 'Blocksatz']].map(([a, t]) => B({ icon: 'align' + a[0], sm: 1, tip: t, fn: () => setAlign(a) })), B({ icon: 'bullets', sm: 1, tip: 'Aufzählung', on: () => queryState('insertUnorderedList'), fn: () => toggleList('ul') }), B({ icon: 'numbered', sm: 1, tip: 'Nummerierung', on: () => queryState('insertOrderedList'), fn: () => toggleList('ol') }), B({ icon: 'outdent', sm: 1, tip: 'Einzug verkleinern', fn: () => setIndent(-10) }), B({ icon: 'indent', sm: 1, tip: 'Einzug vergrößern', fn: () => setIndent(10) })),
        el('div', { class: 'rb-field' }, F({ type: 'select', label: 'Zeilenabstand', opts: [['1', '1,0'], ['1.15', '1,15'], ['1.5', '1,5'], ['2', '2,0'], ['2.5', '2,5']], get: () => { const b = topBlocks()[0]; return b && b.style.lineHeight ? String(parseFloat(b.style.lineHeight)) : '1.15'; }, set: v => setLineH(v) }), F({ type: 'number', label: 'Davor', min: 0, max: 100, step: 1, tip: 'Abstand vor Absatz (pt)', get: () => { const b = topBlocks()[0]; return b ? Math.round(parseFloat(getComputedStyle(b).paddingTop) * 72 / 96) : 0; }, set: v => setSpace('paddingTop', clamp(v, 0, 100)) }), F({ type: 'number', label: 'Danach', min: 0, max: 100, step: 1, tip: 'Abstand nach Absatz (pt)', get: () => { const b = topBlocks()[0]; return b ? Math.round(parseFloat(getComputedStyle(b).paddingBottom) * 72 / 96) : 0; }, set: v => setSpace('paddingBottom', clamp(v, 0, 100)) })))),
      GR('Formatvorlagen', el('div', { class: 'gal' }, ...Object.entries(STYLES).map(([k, t]) => B({ icon: 'style', label: t, on: () => curStyle() === k, fn: () => setBlockStyle(k) })))),
      GR('Bearbeiten', B({ icon: 'search', label: 'Suchen / Ersetzen', tip: 'Strg+F / Strg+H', fn: () => openFind(false) }), B({ icon: 'selectall', label: 'Alles markieren', fn: () => { docEl().focus(); document.execCommand('selectAll'); saveSel(); } }))];
  },
  insert() { return [GR('Seiten', B({ icon: 'pagebreak', label: 'Seitenumbruch', tip: 'Seitenumbruch (Strg+Eingabe)', fn: insertPageBreak })), GR('Tabellen', B({ icon: 'table', label: 'Tabelle', fn: insertTableDialog })), GR('Illustrationen', B({ icon: 'image', label: 'Bild', tip: 'Lokales Bild einfügen', fn: pickImage })), GR('Kopf- und Fußzeile', B({ icon: 'header', label: 'Kopf-/Fußzeile', fn: hfDialog }), B({ icon: 'pagenum', label: 'Seitenzahl', menu: () => [['none', 'Keine'], ['footer-center', 'Fußzeile Mitte'], ['footer-right', 'Fußzeile rechts'], ['header-right', 'Kopfzeile rechts']].map(([v, t]) => ({ label: t, fn: () => { S.doc.hf.pn = v; renderSheets(); checkpoint(); } })) }))]; },
  layout() { return [GR('Seite einrichten', B({ icon: 'page', label: 'Seite einrichten …', fn: pageDialog }), col(B({ icon: 'page', sm: 1, label: 'A4', on: () => S.doc.page.size === 'A4', fn: () => { checkpoint(); S.doc.page.size = 'A4'; applyGeometry(); paginate(); checkpoint(); } }), B({ icon: 'page', sm: 1, label: 'Letter', on: () => S.doc.page.size === 'Letter', fn: () => { checkpoint(); S.doc.page.size = 'Letter'; applyGeometry(); paginate(); checkpoint(); } })), col(B({ icon: 'portrait', sm: 1, label: 'Hochformat', on: () => S.doc.page.orient === 'portrait', fn: () => { checkpoint(); S.doc.page.orient = 'portrait'; applyGeometry(); paginate(); checkpoint(); } }), B({ icon: 'landscape', sm: 1, label: 'Querformat', on: () => S.doc.page.orient === 'landscape', fn: () => { checkpoint(); S.doc.page.orient = 'landscape'; applyGeometry(); paginate(); checkpoint(); } }))), GR('Umbruch', B({ icon: 'pagebreak', label: 'Seitenumbruch', fn: insertPageBreak }))]; },
  view() { return [GR('Ansicht', B({ icon: 'nav', label: 'Navigation', on: () => S.navOn, fn: () => { S.navOn = !S.navOn; $('#nav').style.display = S.navOn ? 'flex' : 'none'; setZoom(S.zoomMode === 'fit' ? 'fit' : S.zoom); } }), B({ icon: 'print', label: 'Druckansicht', fn: () => openPrintView(false) })), GR('Zoom', col(F({ label: 'Zoom', type: 'select', opts: [['fit', 'Seitenbreite'], ...[.5, .75, 1, 1.25, 1.5, 2].map(v => [v, Math.round(v * 100) + ' %'])], get: () => S.zoomMode === 'fit' ? 'fit' : S.zoom, set: v => { S.zoomMode = v === 'fit' ? 'fit' : 'num'; setZoom(v === 'fit' ? 'fit' : +v); } })))]; },
  tbl() { const t = () => inTable(); return [GR('Zeilen und Spalten', col(B({ icon: 'plus', sm: 1, label: 'Zeile oben', en: t, fn: () => tableOp('rowA') }), B({ icon: 'plus', sm: 1, label: 'Zeile unten', en: t, fn: () => tableOp('rowB') })), col(B({ icon: 'plus', sm: 1, label: 'Spalte links', en: t, fn: () => tableOp('colL') }), B({ icon: 'plus', sm: 1, label: 'Spalte rechts', en: t, fn: () => tableOp('colR') })), col(B({ icon: 'minus', sm: 1, label: 'Zeile löschen', en: t, fn: () => tableOp('delRow') }), B({ icon: 'minus', sm: 1, label: 'Spalte löschen', en: t, fn: () => tableOp('delCol') }))), GR('Tabelle', B({ icon: 'header', label: 'Kopfzeile', en: t, on: () => { const c = curCellQuiet(); return !!c && c.closest('table').dataset.hdr === '1'; }, fn: () => tableOp('hdr') }), B({ icon: 'trash', label: 'Tabelle löschen', en: t, fn: () => tableOp('delTbl') }))]; }
};
const TABS = [['file', 'Datei'], ['start', 'Start'], ['insert', 'Einfügen'], ['layout', 'Layout'], ['view', 'Ansicht']]; let tabNow = 'start';
function buildTabs() { const defs = TABS.concat(inTable() ? [['tbl', 'Tabelle']] : []); if (tabNow === 'tbl' && !inTable()) tabNow = 'start'; $('#tabs').replaceChildren(...defs.map(([id, l]) => el('button', { class: 'tab' + (tabNow === id ? ' on' : '') + (id === 'tbl' ? ' ctx' : ''), role: 'tab', onmousedown: e => e.preventDefault(), onclick: () => { tabNow = id; S._rk = null; refreshRibbon(); } }, l))); }
function refreshRibbon() { buildTabs(); if (S._rk !== tabNow || (tabNow === 'start' && !$('#ribbon').children.length)) { S._rk = tabNow; ribCtl = []; $('#ribbon').replaceChildren(...RIB[tabNow]()); } ribCtl.forEach(c => c._upd && c._upd()); }
function helpDialog() {
  dialog({ title: 'Funktionsumfang', wide: true, body: el('div', null, el('p', null, 'Seitenorientierte Bearbeitung (A4/Letter, Hoch-/Querformat, einstellbare Ränder) mit automatischem Seitenfluss: Absätze, Überschriften und Bilder rücken als Ganzes auf die nächste Seite, Tabellenzeilen und Listenpunkte werden einzeln verteilt. Ein einzelner Block, der höher als eine Seite ist, wird nicht abgeschnitten – sein Seitenblatt wächst.'),
    el('p', null, 'Dateiformate: Projekt (.webdoc.json) mit Wiederimport; Export als .docx (Absätze, Formatvorlagen, Zeichenformate, Listen, Tabellen, Bilder, Seitenumbrüche, Seitenformat und -ränder, Kopf-/Fußzeile mit Seitenzahlfeld), HTML, TXT; Druck/PDF über die Druckansicht mit derselben Paginierung wie im Editor. Ein .docx-Import ist nicht implementiert.'),
    el('p', { class: 'hint' }, 'Suchen/Ersetzen findet Text innerhalb zusammenhängender Textstücke; Treffer über Formatwechsel hinweg (z. B. halb fett) werden nicht erkannt. Bilder: PNG, JPEG, GIF, WebP (werden ins Projekt eingebettet).')) });
}

/* ---------- Tastatur & Verdrahtung ---------- */
function bindAll() {
  const d = docEl(); d.spellcheck = true; d.lang = 'de'; try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { }
  d.addEventListener('input', () => { if (S.pendingPx) fixFonts(); onInput(); }); d.addEventListener('load', () => schedulePaginate(), true); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => schedulePaginate());
  d.addEventListener('keydown', e => {
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (S.curImg && (k === 'Delete' || k === 'Backspace')) { e.preventDefault(); deleteImage(); return; }
    if (mod && k === 'Enter') { e.preventDefault(); insertPageBreak(); return; }
    if (k === 'Tab' && curCellQuiet()) { e.preventDefault(); const c = curCellQuiet(), cells = Array.from(c.closest('table').querySelectorAll('td,th')).filter(x => !x.closest('.spacer')), i = cells.indexOf(c) + (e.shiftKey ? -1 : 1); if (i >= 0 && i < cells.length) caretTo(cells[i]); else if (!e.shiftKey) { tableOp('rowB'); const nc = Array.from(c.closest('table').querySelectorAll('td,th')).filter(x => !x.closest('.spacer')); caretTo(nc[i]); } }
  });
  d.addEventListener('pointerdown', e => { const f = e.target.closest('figure.b-img'); if (f) { e.preventDefault(); d.focus({ preventScroll: true }); selectImage(f); const r = document.createRange(); r.selectNode(f); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } else deselectImage(); });
  d.addEventListener('paste', e => {
    const cd = e.clipboardData; if (!cd) return; const f = Array.from(cd.files || []).find(x => /^image\//.test(x.type)); if (f) { e.preventDefault(); insertImageFile(f); return; }
    e.preventDefault(); const html = cd.getData('text/html'), text = cd.getData('text/plain');
    if (html) { const p = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html'), bl = domToBlocks(p.body); if (bl.length === 1 && bl[0].t === 'p' && !bl[0].list) document.execCommand('insertHTML', false, bl[0].html); else { const tmp = document.createElement('div'); tmp.append(blocksToDOM(bl.filter(b => b.t !== 'img'), {})); document.execCommand('insertHTML', false, tmp.innerHTML); } }
    else document.execCommand('insertText', false, text);
    onInput(); checkpoint();
  });
  d.addEventListener('drop', e => { const f = Array.from(e.dataTransfer.files || []).find(x => /^image\//.test(x.type)); if (f) { e.preventDefault(); insertImageFile(f); } });
  let selT = 0; document.addEventListener('selectionchange', () => { saveSel(); clearTimeout(selT); selT = setTimeout(() => { if (selInDoc()) { renderStatus(); refreshRibbon(); } }, 80); });
  document.addEventListener('keydown', e => {
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (dlgStack.length) { if (k === 'Escape') { e.preventDefault(); dlgStack[dlgStack.length - 1].close(); } return; }
    if (menuEl && k === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if ($('#pv') && $('#pv').style.display === 'block') { if (k === 'Escape') { e.preventDefault(); closePrintView(); } return; }
    if (mod && (k === 's' || k === 'S')) { e.preventDefault(); saveProject(); return; }
    if (mod && (k === 'p' || k === 'P')) { e.preventDefault(); openPrintView(true); return; }
    if (mod && (k === 'f' || k === 'F')) { e.preventDefault(); openFind(false); return; } if (mod && (k === 'h' || k === 'H')) { e.preventDefault(); openFind(true); return; }
    if (k === 'Escape' && S.findOn) { closeFind(); return; }
    const inDoc = docEl().contains(e.target), inFind = $('#findbar').contains(e.target);
    if (mod && !e.shiftKey && (k === 'z' || k === 'Z') && !inFind && (inDoc || e.target === document.body)) { e.preventDefault(); undo(); return; }
    if (mod && (k === 'y' || k === 'Y' || (e.shiftKey && (k === 'z' || k === 'Z'))) && !inFind && (inDoc || e.target === document.body)) { e.preventDefault(); redo(); return; }
  });
  $('#qSave').onclick = saveProject; $('#qUndo').onclick = () => { undo(); }; $('#qRedo').onclick = () => { redo(); };
  $('#docname').addEventListener('change', e => { S.name = e.target.value.trim() || 'Dokument'; scheduleAutosave(); });
  $('#fq').addEventListener('input', () => { FIND.i = -1; doFind($('#fq').value, $('#fcs').checked, 1); }); $('#fcs').addEventListener('change', () => doFind($('#fq').value, $('#fcs').checked, 1));
  $('#fq').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doFind($('#fq').value, $('#fcs').checked, e.shiftKey ? -1 : 1); } else if (e.key === 'Escape') { e.preventDefault(); closeFind(); } });
  $('#fr').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); replaceCurrent($('#fr').value); } else if (e.key === 'Escape') { e.preventDefault(); closeFind(); } });
  $('#fnext').onclick = () => doFind($('#fq').value, $('#fcs').checked, 1); $('#fprev').onclick = () => doFind($('#fq').value, $('#fcs').checked, -1); $('#frep').onclick = () => { if (!FIND.matches.length) doFind($('#fq').value, $('#fcs').checked, 1); replaceCurrent($('#fr').value); }; $('#frepall').onclick = () => { doFind($('#fq').value, $('#fcs').checked, 1); replaceAll($('#fr').value); }; $('#fclose').onclick = closeFind;
  window.addEventListener('beforeprint', () => { if (!$('#pv') || $('#pv').style.display !== 'block') openPrintView(false); });
  new ResizeObserver(() => { if (S.zoomMode === 'fit') setZoom('fit'); }).observe($('#scroller'));
}
function init() {
  $('#qSave').innerHTML = icon('save', 20); $('#qUndo').innerHTML = icon('undo', 20); $('#qRedo').innerHTML = icon('redo', 20);
  S.doc = blankDoc(); S.zoomMode = 'num'; bindAll(); let loaded = false;
  try { const raw = localStorage.getItem(AUTOSAVE_KEY); if (raw) { const d = validateDoc(JSON.parse(raw)); adoptDoc(d, d.title); autoMsg = 'Arbeitsstand aus Autosave wiederhergestellt'; loaded = true; } } catch (e) { console.warn('Autosave nicht ladbar:', e.message); }
  if (!loaded) adoptDoc(sampleDoc(), 'Projektbericht'); setSaveStatus(); refreshRibbon(); setZoom(1);
  window.WebDOC = { S, HIST, FIND, validateDoc, sampleDoc, blankDoc, adoptDoc, docJSONObj, paginate, checkpoint, undo, redo, buildDocx, buildPrintPages, openPrintView, doFind, replaceAll, replaceCurrent, pageGeom, setBlockStyle, insertTable, domToBlocks, syncModel, renderDoc, insertPageBreak, exportTxt, setZoom };
  docEl().focus({ preventScroll: true });
}
window.addEventListener('DOMContentLoaded', init);
