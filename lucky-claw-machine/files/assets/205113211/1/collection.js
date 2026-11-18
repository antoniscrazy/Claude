var Collection = pc.createScript('collection');

Collection.attributes.add("toy_displays", {type: "entity",array:true});

// initialize code called once per entity
Collection.prototype.initialize = function() {
    Collection.instance = this;

    this.unlocked_toys = SaveManager.loadString("unlocked_toys","").split(",");

    setTimeout(function(){
        this.updateToys();
    }.bind(this),100)
};

Collection.prototype.checkToy = function(toy) {

    console.log(toy.id);

    if(!this.unlocked_toys.includes(toy.id))
    {
        console.log(toy.id + "es nuevo!");
        this.unlocked_toys.push(toy.id);
        NewPrizePopUp.instance.showNewPrize(toy);
        SaveManager.saveString("unlocked_toys",this.unlocked_toys.toString());
    }
    else
    {
        console.log(toy.id + "ya lo tengo :(");

        Toy.all_toys.splice(Toy.all_toys.indexOf(toy), 1);
        toy.entity.destroy();
        SoundManager.instance.playSound("win");
        Claw.instance.startMachine();
    }

    this.updateToys();
};

Collection.prototype.updateToys = function() {
    console.log("UPDATE TOYS", this.unlocked_toys);

    // Convertir a Set para búsqueda rápida
    const unlockedSet = new Set(this.unlocked_toys);

    for (let i = 0; i < this.toy_displays.length; i++) {
        const toy = this.toy_displays[i];
        const toyName = toy.name;

        if (unlockedSet.has(toyName)) {
            toy.script.displayToy.unlockToy();
        } else {
            toy.script.displayToy.lockToy();
        }
    }
};
