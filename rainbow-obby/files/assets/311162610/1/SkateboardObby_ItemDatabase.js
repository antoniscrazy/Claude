var SkateboardObbyItemDatabase = pc.createScript('skateboardObbyItemDatabase');

SkateboardObbyItems = {
    Jetpack         : 0,
    FlyingCarpet    : 1,
    ResetGame       : 2,
    Boost           : 5,    // power-up: VIP olmayanlarda sureli Boost (items[5])
}

SkateboardObbyItemDatabase.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'Jetpack':        SkateboardObbyItems.Jetpack          },
                { 'FylingCarpet':   SkateboardObbyItems.FlyingCarpet     },
                { 'ResetGame'    :  SkateboardObbyItems.ResetGame        },
                { 'Boost'        :  SkateboardObbyItems.Boost            },
            ],
        },
        {
            name: "name",
            type: "string",
        },
        {
            name: "texture",
            type: "string",
        },
        {
            name: "priceAd",
            type: "number",
        },
        {
            name: "priceWins",
            type: "number",
        },
        {
            name: "priceAura",
            type: "number",
        },
        {
            name: "repurchasable",
            type: "boolean"
        },
        {
            name: "maxDurability",
            type: "number"
        },
    ], array: true
});


// Kaykay / skin yuvalari: id = dizideki sira (0 = default, 1 = VIP, 2 = BOSS VIP). VIP alininca kademe id'si
// otomatik takilir. Bos yuva (render ve template yok) = sahnedeki default model.
//  - render: Skin altindaki default render'in (SkateBoard_Default / SkateBoardObby_Skin_Default) yerine gecer.
//    Ayni rig'e skin'lenmis olmali (ayni FBX'ten), yoksa kemikleri takip etmez.
//  - template: default render gizlenir, template `bone` adli kemigin (bos = Skin) altina eklenir.
var SkateboardObbyCosmeticSchema = [
    { name: "name", type: "string" },
    { name: "render", type: "asset", assetType: "render", description: "Ayni rig'e skin'lenmis render asset. Bos = default model" },
    { name: "materials", type: "asset", assetType: "material", array: true, description: "Render'in materyalleri (sira = mesh sirasi). Bos = render'in kendi materyalleri" },
    { name: "template", type: "asset", assetType: "template", description: "Alternatif: kemige takilan template (render bos birakilir)" },
    { name: "bone", type: "string", description: "Template'in takilacagi kemik / entity adi (Skin altinda). Bos = Skin" },
];

SkateboardObbyItemDatabase.attributes.add("boards", { type: "json", array: true, schema: SkateboardObbyCosmeticSchema, title: "Boards (id = index: 0 Default, 1 VIP, 2 BOSS VIP)" });
SkateboardObbyItemDatabase.attributes.add("skins", { type: "json", array: true, schema: SkateboardObbyCosmeticSchema, title: "Skins (id = index: 0 Default, 1 VIP, 2 BOSS VIP)" });

var SkateboardObby_Cosmetics = {
    // sabit yuvalar (VIP kademesiyle ayni): liste kisa olsa bile bu id'ler gecerli, model yoksa default gorunur
    DEFAULT: 0,
    VIP: 1,
    BOSS_VIP: 2,
    MAX_ID: 32,     // server Client:SetBoard / Client:SetSkin ust siniri

    // Skin altindaki default render entity'leri
    TARGETS: { board: "SkateBoard_Default", skin: "SkateBoardObby_Skin_Default" },
    DEFAULT_BONE: { board: "Board", skin: "" },

    list: function (database, kind) {
        const list = database ? database[kind === "board" ? "boards" : "skins"] : null;
        return list || [];
    },

    // Gecersiz / eski kayit (ornek: template'ten kalan skin 9..14) -> 0
    sanitize: function (database, kind, id) {
        id = Number(id);
        if (!Number.isInteger(id) || id < 0) return 0;
        const count = Math.max(this.BOSS_VIP + 1, this.list(database, kind).length);
        return id < count && id <= this.MAX_ID ? id : 0;
    },

    entry: function (database, kind, id) {
        const item = this.list(database, kind)[id];
        if (!item) return null;
        if (!item.render && !item.template) return null;
        return item;
    },

    // Oyuncu basina durum: default render'in asset / materyalleri ve takili template
    state: function (entity, kind) {
        if (!entity._skateCosmetics) entity._skateCosmetics = {};
        let state = entity._skateCosmetics[kind];
        if (!state) {
            const skinRoot = entity.findByName("Skin");
            const target = skinRoot ? skinRoot.findByName(this.TARGETS[kind]) : null;
            state = {
                skinRoot: skinRoot,
                target: target,
                defaultAsset: target && target.render ? target.render.asset : null,
                defaultMaterials: target && target.render ? target.render.materialAssets.slice() : [],
                extra: null,
                id: 0,
            };
            entity._skateCosmetics[kind] = state;
        }
        return state;
    },

    // entity: oyuncu koku (Player / RemotePlayer kopyasi). Sadece id degisince calisir.
    apply: function (app, database, entity, kind, id) {
        const state = this.state(entity, kind);
        if (!state.target || !state.target.render) return;
        id = this.sanitize(database, kind, id);
        if (state.id === id) return;
        state.id = id;

        if (state.extra) {
            state.extra.destroy();
            state.extra = null;
        }

        const item = this.entry(database, kind, id);
        const render = state.target.render;
        const templateAsset = item && item.template ? app.assets.get(item.template) : null;

        if (templateAsset) {
            state.target.enabled = false;
            const attach = () => {
                if (state.id !== id || state.extra || !entity.parent) return;   // bu arada degisti / silindi
                const bone = item.bone || this.DEFAULT_BONE[kind];
                const parent = (bone && state.skinRoot.findByName(bone)) || state.skinRoot;
                state.extra = templateAsset.resource.instantiate();
                parent.addChild(state.extra);
            };
            if (templateAsset.loaded) attach();
            else {
                templateAsset.ready(attach);
                app.assets.load(templateAsset);
            }
            return;
        }

        state.target.enabled = true;
        const renderAsset = item && item.render ? item.render : state.defaultAsset;
        const materials = item && item.render ? (item.materials && item.materials.length ? item.materials : null) : state.defaultMaterials;
        if (render.asset !== renderAsset) render.asset = renderAsset;
        if (materials) render.materialAssets = materials;
    },
};
