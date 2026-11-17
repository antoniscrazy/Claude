var SpiderObbyItemDatabase = pc.createScript('spiderObbyItemDatabase');

SpiderObbyItems = {
    Jetpack         : 0,
    FlyingCarpet    : 1,
    ResetGame       : 2,
}

SpiderObbyItemDatabase.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'Jetpack':        SpiderObbyItems.Jetpack          },
                { 'FylingCarpet':   SpiderObbyItems.FlyingCarpet     },
                { 'ResetGame'    :  SpiderObbyItems.ResetGame        },
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
