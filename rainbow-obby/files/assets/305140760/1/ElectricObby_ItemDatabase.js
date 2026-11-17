var ElectricObbyItemDatabase = pc.createScript('electricObbyItemDatabase');

ElectricObbyItems = {
    Jetpack         : 0,
    FlyingCarpet    : 1,
    ResetGame       : 2,
}

ElectricObbyItemDatabase.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'Jetpack':        ElectricObbyItems.Jetpack          },
                { 'FylingCarpet':   ElectricObbyItems.FlyingCarpet     },
                { 'ResetGame'    :  ElectricObbyItems.ResetGame        },
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
