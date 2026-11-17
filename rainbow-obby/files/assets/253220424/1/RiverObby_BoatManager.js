var RiverObbyBoatManager = pc.createScript('riverObbyBoatManager');


RiverObbyBoatType = {
    DEFAULT: 0,
    CHICKEN: 1,
    DUCK: 2,
    TURTLE: 3,
    SPIDER: 4,
    SHIP: 5,
    PLANE: 6,
    JETSKI: 7,
};

RiverObbyOwnedBoats = [RiverObbyBoatType.DEFAULT];

RiverObbyBoatManager.prototype.initialize = function () {
    if (window.localStorage.getItem("RIVEROBBY_OwnedBoats")) {
        RiverObbyOwnedBoats = Array.from(JSON.parse(window.localStorage.getItem("RIVEROBBY_OwnedBoats")));
    } else {
        window.localStorage.setItem("RIVEROBBY_OwnedBoats", JSON.stringify(RiverObbyOwnedBoats));
    };

    //console.log("Type:", typeof RiverObbyOwnedBoats, "Value:", RiverObbyOwnedBoats);
}

RiverObbyBoatManager.isOwnsBoat = function (boatID) {
    return RiverObbyOwnedBoats.includes(boatID);
}

const RiverObbyBoatDatabase = {
    [RiverObbyBoatType.DEFAULT]: {
        name: "Default Boat",
        asset: 252965262,
        oarL: 253952052,
        oarR: 253952050,
        image: 253260654,
        price: 0,
        ads: 0,
        speedMul: 1.0,
    },

    [RiverObbyBoatType.CHICKEN]: {
        name: "Chicken Boat",
        asset: 242681641,
        oarL: 242681642,
        oarR: 242681644,
        image: 253260655,
        price: 3,
        ads: 1,
        speedMul: 1.025,
    },

    [RiverObbyBoatType.DUCK]: {
        name: "Duck Boat",
        asset: 242681643,
        oarL: 242681645,
        oarR: 242681645,
        image: 253260656,
        price: 5,
        ads: 1,
        speedMul: 1.05,
    },

    [RiverObbyBoatType.TURTLE]: {
        name: "Turtle Boat",
        asset: 242681647,
        oarL: 242681648,
        oarR: 242681648,
        image: 253260658,
        price: 10,
        ads: 2,
        speedMul: 1.075,
    },

    [RiverObbyBoatType.SPIDER]: {
        name: "Spider Boat",
        asset: 242681650,
        oarL: 242681652,
        oarR: 242681652,
        image: 253260657,
        price: 15,
        ads: 2,
        speedMul: 1.1,
    },

    [RiverObbyBoatType.SHIP]: {
        name: "Ship Boat",
        asset: 242681653,
        oarL: 242681654,
        oarR: 242681654,
        image: 253260651,
        price: 30,
        ads: 2,
        speedMul: 1.15,
    },

    [RiverObbyBoatType.PLANE]: {
        name: "Plane Boat",
        asset: 242681656,
        oarL: 242681657,
        oarR: 242681657,
        image: 253260653,
        price: 50,
        ads: 3,
        speedMul: 1.2,
    },

    [RiverObbyBoatType.JETSKI]: {
        name: "Jetski Boat",
        asset: 242681659,
        oarL: 242681660,
        oarR: 242681660,
        image: 253260652,
        price: 100,
        ads: 3,
        speedMul: 1.25,
    },
};
