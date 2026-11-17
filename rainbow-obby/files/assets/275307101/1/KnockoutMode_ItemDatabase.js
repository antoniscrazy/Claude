var KnockoutModeItemDatabase = pc.createScript('knockoutModeItemDatabase');

KnockoutModeItems = {
    SpikeBall        : 0,
    Slime            : 1,
    Bomb             : 2,
    PenguinDefault   : 3,
    PenguinFemale    : 4,
    PenguinBinted    : 5,
    PenguinPimp      : 6,
    Wall             : 7,
}

KnockoutModeItemDatabase.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'SpikeBall':       KnockoutModeItems.SpikeBall         },
                { 'Slime':           KnockoutModeItems.Slime             },
                { 'Bomb':            KnockoutModeItems.Bomb              },
                { 'PenguinDefault':  KnockoutModeItems.PenguinDefault    },
                { 'PenguinFemale':   KnockoutModeItems.PenguinFemale     },
                { 'PenguinBinted':   KnockoutModeItems.PenguinBinted     },
                { 'PenguinPimp':     KnockoutModeItems.PenguinPimp       },
                { 'Wall':            KnockoutModeItems.Wall              },
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
            name: "priceCoin",
            type: "number",
        },
        {
            name: "repurchasable",
            type: "boolean"
        },
    ], array: true
});
