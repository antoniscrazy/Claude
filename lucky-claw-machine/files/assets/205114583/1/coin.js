var Coin = pc.createScript('coin');

Coin.prototype.initialize = function() {
    if(!Coin.all_coins)
    {
        Coin.all_coins = [];
    }

    Coin.all_coins.push(this);
    
    this.entity.rigidbody.group |= (pc.BODYGROUP_USER_2);
    this.entity.rigidbody.mask |= (pc.BODYMASK_ALL);  
};
