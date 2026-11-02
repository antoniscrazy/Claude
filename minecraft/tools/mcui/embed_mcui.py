#!/usr/bin/env python3
"""Bettet die Menü-Texturen (Java-Edition-Look) als CSS-Variablen + die Minecraft-Schrift in index.html ein.

Aufruf:  python3 embed_mcui.py <entpackter-assets/minecraft-Ordner> [index.html]
Die Datei minecraftui.ttf (build_font.py) und panorama_0..5.jpg liegen neben diesem Skript.
Ersetzt den Bereich zwischen /*MCUI_BEGIN*/ und /*MCUI_END*/ im <style id="mcui-data">.
"""
import base64, os, re, sys
root = sys.argv[1]; html = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', '..', 'index.html')
here = os.path.dirname(os.path.abspath(__file__)); gui = os.path.join(root, 'textures/gui')
b64 = lambda p, mime: 'url("data:%s;base64,%s")' % (mime, base64.b64encode(open(p, 'rb').read()).decode())
png = lambda rel: b64(os.path.join(gui, rel), 'image/png')
v = {}
for n in ['button', 'button_highlighted', 'button_disabled', 'text_field', 'text_field_highlighted', 'slider', 'slider_highlighted', 'slider_handle', 'slider_handle_highlighted',
          'tab', 'tab_highlighted', 'tab_selected', 'tab_selected_highlighted', 'checkbox', 'checkbox_highlighted', 'checkbox_selected', 'checkbox_selected_highlighted', 'scroller', 'scroller_background', 'cross_button', 'cross_button_highlighted']:
    v['mc-' + n.replace('_', '-')] = png('sprites/widget/%s.png' % n)
for n in ['header_separator', 'footer_separator', 'inworld_header_separator', 'inworld_footer_separator', 'menu_background', 'menu_list_background', 'inworld_menu_background', 'inworld_menu_list_background']:
    v['mc-' + n.replace('_', '-')] = png('%s.png' % n)
v['mc-logo'] = png('title/minecraft.png'); v['mc-edition'] = png('title/edition.png')
for n, k in [('hud/hotbar', 'hotbar'), ('hud/hotbar_selection', 'hotbar-sel'), ('hud/experience_bar_background', 'xp-bg'), ('hud/experience_bar_progress', 'xp-prog'), ('toast/advancement', 'adv-toast')]:
    v['mc-' + k] = png('sprites/%s.png' % n)
v['mc-tooltip'] = png('sprites/tooltip/background.png'); v['mc-tooltip-frame'] = png('sprites/tooltip/frame.png'); v['mc-popup'] = png('sprites/popup/background.png')
# --- Inventare (Survival/Kreativ) + Reiter + Rezeptbuch-Knopf ---
import io
from PIL import Image
def crop(rel, box):
    im = Image.open(os.path.join(gui, rel)).convert('RGBA').crop(box); bio = io.BytesIO(); im.save(bio, 'PNG')
    return 'url("data:image/png;base64,%s")' % base64.b64encode(bio.getvalue()).decode()
v['mc-inv-bg'] = crop('container/inventory.png', (0, 0, 176, 166))
for k, f in [('items', 'tab_items'), ('search', 'tab_item_search'), ('inv', 'tab_inventory')]:
    v['mc-cr-' + k] = crop('container/creative_inventory/%s.png' % f, (0, 0, 195, 136))
for pos in ('top', 'bottom'):
    for st in ('selected', 'unselected'):
        for i in range(1, 8): v['mc-crtab-%s-%s-%d' % (pos, st[:3], i)] = png('sprites/container/creative_inventory/tab_%s_%s_%d.png' % (pos, st, i))
v['mc-cr-scroll'] = png('sprites/container/creative_inventory/scroller.png'); v['mc-cr-scroll-off'] = png('sprites/container/creative_inventory/scroller_disabled.png')
v['mc-rb-btn'] = png('sprites/recipe_book/button.png'); v['mc-rb-btn-hl'] = png('sprites/recipe_book/button_highlighted.png')
v['mc-rb-bg'] = crop('recipe_book.png', (0, 0, 147, 166)); v['mc-table-bg'] = crop('container/crafting_table.png', (0, 0, 176, 166))
for n, k in [('tab', 'tab'), ('tab_selected', 'tab-sel'), ('slot_craftable', 'slot-c'), ('slot_uncraftable', 'slot-u'), ('filter_enabled', 'fe'), ('filter_disabled', 'fd'), ('filter_enabled_highlighted', 'fe-hl'), ('filter_disabled_highlighted', 'fd-hl'),
             ('page_forward', 'pf'), ('page_backward', 'pb'), ('page_forward_highlighted', 'pf-hl'), ('page_backward_highlighted', 'pb-hl')]:
    v['mc-rb-' + k] = png('sprites/recipe_book/%s.png' % n)
for n in ('helmet', 'chestplate', 'leggings', 'boots', 'shield'): v['mc-slot-' + n] = png('sprites/container/slot/%s.png' % n)
for i in range(6): v['mc-pano-%d' % i] = b64(os.path.join(here, 'panorama_%d.jpg' % i), 'image/jpeg')
css = ':root{\n' + ''.join('  --%s:%s;\n' % (k, val) for k, val in v.items()) + '}\n'
css += '@font-face{font-family:"MinecraftUI";src:%s format("truetype");font-display:block}\n' % b64(os.path.join(here, 'minecraftui.ttf'), 'font/ttf')
s = open(html, encoding='utf-8').read()
a, b = s.index('/*MCUI_BEGIN*/') + len('/*MCUI_BEGIN*/'), s.index('/*MCUI_END*/')
open(html, 'w', encoding='utf-8').write(s[:a] + '\n' + css + s[b:]); print('MCUI eingebettet:', len(css) // 1024, 'KB,', len(v), 'Variablen')
