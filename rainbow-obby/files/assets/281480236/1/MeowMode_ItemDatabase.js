var MeowModeItemDatabase = pc.createScript('meowModeItemDatabase');

MeowModeItems = {
    Paw             : 0,
    JETPACK         : 1,
    FLYING_CARPET   : 2,
    Shield          : 3,
    Rebirth         : 4,
    Skin1           : 5,
    Skin2           : 6,
    Skin3           : 7,
    Skin4           : 8,
}

MeowModeItemDatabase.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'Paw':            MeowModeItems.Paw              },
                { 'Jetpack':        MeowModeItems.JETPACK          },
                { 'Fyling Carpet':  MeowModeItems.FLYING_CARPET    },
                { 'Shield':         MeowModeItems.Shield           },
                { 'Rebirth':        MeowModeItems.Rebirth          },
                { 'Skin1':          MeowModeItems.Skin1            },
                { 'Skin2':          MeowModeItems.Skin2            },
                { 'Skin3':          MeowModeItems.Skin3            },
                { 'Skin4':          MeowModeItems.Skin4            },
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
