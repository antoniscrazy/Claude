var SlimeTowerItemDatabase = pc.createScript('slimeTowerItemDatabase');

SlimeTowerItems = {
    Jetpack: 0,
    FlyingCarpet: 1,
    ResetGame: 2,

    SlapHand: 3,
    SlapBalloon: 4,
    SlapBat: 5,
    SlapCandy: 6,
    SlapLollipop: 7,

    Shield: 8,

    SkinLego: 9,
    SkinBigShoe: 10,
    SkinTurtle: 11,
    SkinEmolingo: 12,
    SkinAxo: 13,
    SkinHacker: 14,
    SkinTri: 15,
    SkinChef: 16,
    SkinBread: 17,
    SkinCat: 18,
    SkinFrog: 19,
    SkinNuclear: 20,
}

SlimeTowerItemDatabase.attributes.add("items", {
    type: "json", schema: [
        {
            name: "id",
            type: "number",
            enum: [
                { 'Jetpack': SlimeTowerItems.Jetpack },
                { 'FylingCarpet': SlimeTowerItems.FlyingCarpet },
                { 'ResetGame': SlimeTowerItems.ResetGame },

                { 'SlapHand': SlimeTowerItems.SlapHand },
                { 'SlapBalloon': SlimeTowerItems.SlapBalloon },
                { 'SlapBat': SlimeTowerItems.SlapBat },
                { 'SlapCandy': SlimeTowerItems.SlapCandy },
                { 'SlapLollipop': SlimeTowerItems.SlapLollipop },

                { 'Shield': SlimeTowerItems.Shield },

                { 'SkinLego': SlimeTowerItems.SkinLego },
                { 'SkinBigShoe': SlimeTowerItems.SkinBigShoe },
                { 'SkinTurtle': SlimeTowerItems.SkinTurtle },
                { 'SkinEmolingo': SlimeTowerItems.SkinEmolingo },
                { 'SkinAxo': SlimeTowerItems.SkinAxo },
                { 'SkinHacker': SlimeTowerItems.SkinHacker },
                { 'SkinTri': SlimeTowerItems.SkinTri },
                { 'SkinChef': SlimeTowerItems.SkinChef },
                { 'SkinBread': SlimeTowerItems.SkinBread },
                { 'SkinCat': SlimeTowerItems.SkinCat },
                { 'SkinFrog': SlimeTowerItems.SkinFrog },
                { 'SkinNuclear': SlimeTowerItems.SkinNuclear },
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
