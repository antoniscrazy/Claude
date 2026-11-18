var Claw = pc.createScript('claw');

Claw.attributes.add('arms', {
    type: 'entity',
    array: true
});

Claw.attributes.add('open', {
    type: 'boolean',
});

Claw.attributes.add('up', {
    type: 'boolean',
});

Claw.attributes.add('axis', {
    type: 'entity',
});

Claw.attributes.add('rails', {
    type: 'entity'
});

Claw.attributes.add('lever', {
    type: 'entity'
});

Claw.attributes.add('button', {
    type: 'entity'
});

Claw.attributes.add('cable', {
    type: 'entity'
});

Claw.attributes.add('guard_collision', {
    type: 'entity'
});

Claw.attributes.add('magnet', {
    type: 'entity'
});

Claw.attributes.add('attraction_point', {
    type: 'entity'
});

// initialize code called once per entity
Claw.prototype.initialize = function() {

    Claw.instance = this;


    this.state = "aiming";

    this.minX = -4; // Límite mínimo en X
    this.maxX = 4;  // Límite máximo en X
    this.minZ = -4; // Límite mínimo en Z
    this.maxZ = 4;  // Límite máximo en Z

    this.anim_dx = 0;
    this.anim_dz = 0;
    this.button_y = 0;

    this.coin_in = false;

    this.entity.rigidbody.body.setActivationState(4);

    this.app.on("grab_down", function() {
        if(this.state == "aiming")
        {
            this.startGrab();
        }        
    }.bind(this));

    this.app.keyboard.on("keydown", this.onKeyDown, this);

    this.start_flag = false;

    this.is_magnet = false;
};

Claw.prototype.onKeyDown = function(e) {
    if((e.key == pc.KEY_SPACE) || (e.key == pc.KEY_ENTER)) 
    {
        this.app.fire("grab_down");
    }

/*
    if((e.key == pc.KEY_I)) 
    {
        this.toggleMagnet();
    }    
  */  
};

Claw.prototype.toggleMagnet = function(){
    this.is_magnet = !this.is_magnet;

    this.magnet.enabled = this.is_magnet;

    if(this.is_magnet)
    {
        for(let i = 0; i < this.arms.length; i++)
        {
            this.arms[i].rigidbody.mask = pc.BODYGROUP_TRIGGER;
            this.arms[i].render.enabled = false;
        }
    }
    else
    {        
        for(let i = 0; i < this.arms.length; i++)
        {
            this.arms[i].rigidbody.mask |= (pc.BODYGROUP_USER_2);
            this.arms[i].rigidbody.mask |= (pc.BODYGROUP_USER_3);
            this.arms[i].rigidbody.mask |= (pc.BODYGROUP_USER_4);
            this.arms[i].render.enabled = true;
        }
    };
};

Claw.prototype.enableMagnet = function(){
    this.is_magnet = true;
    this.magnet.enabled = true;

    for(let i = 0; i < this.arms.length; i++)
    {
        this.arms[i].rigidbody.mask = pc.BODYGROUP_TRIGGER;
        this.arms[i].render.enabled = false;
    }
};

Claw.prototype.disableMagnet = function(){
    this.is_magnet = false;
    this.magnet.enabled = false;

    for(let i = 0; i < this.arms.length; i++)
    {
        this.arms[i].rigidbody.mask |= (pc.BODYGROUP_USER_2);
        this.arms[i].rigidbody.mask |= (pc.BODYGROUP_USER_3);
        this.arms[i].rigidbody.mask |= (pc.BODYGROUP_USER_4);
        this.arms[i].render.enabled = true;
    }
};



Claw.prototype.startGrab = function() {

    this.coin_in = false;
    CoinBox.instance.show_button = false;

    this.lever.setLocalEulerAngles(0,0,0);
    SoundManager.instance.setVolume("motor_loop",0);

    SoundManager.instance.playSound("down");
    SoundManager.instance.setVolume("reeling_loop",0.5);

    this.state = "grabbing";
    this.up = false;

    this.button_y = -0.6;

    this.cont = { value: 0 };

    var tween_go_down = this.entity.tween(this.cont).to({ value: 1 }, 3, pc.Linear);

    tween_go_down.on("update", function (dt) {
        if(this.entity.script.pointToPointConstraint.constraint)
        {
            let l = (!this.is_magnet)?8:6;
            this.entity.script.pointToPointConstraint.constraint.setPivotA(new Ammo.btVector3(0, pc.math.lerp(1,l,this.cont.value), 0));
        }
    }.bind(this));

    
    tween_go_down.on("complete", function () {
        this.open = false;


        if(this.is_magnet)
        {
            this.selected_toy = this.findClosestToy(); 

            if(this.selected_toy && this.selected_toy.rigidbody) //TODO fix temporal bug 
            {
                this.selected_toy.rigidbody.mass = 0.1;
                this.selected_toy.rigidbody.linearDamping = 0.9;
            }
            else
            {
                this.selected_toy = null;
            }
        }


        SoundManager.instance.setVolume("reeling_loop",0);
        SoundManager.instance.playSound("up",1);

        setTimeout(function(){
            SoundManager.instance.setVolume("reeling_loop",0.5);
        }.bind(this),2000)        
    }.bind(this));


    this.cont2 = { value: 0 };

    var tween_go_up = this.entity.tween(this.cont2).to({ value: 1 }, 3, pc.Linear);

    tween_go_up.on("update", function (dt) {
        if(this.entity.script.pointToPointConstraint.constraint)
        {
            let l = (!this.is_magnet)?8:6;
            this.entity.script.pointToPointConstraint.constraint.setPivotA(new Ammo.btVector3(0, pc.math.lerp(l,1,this.cont2.value), 0));
        }
    }.bind(this));

    tween_go_up.on("complete",function(){

        if(this.anyToyGrabbed())
        {
            this.state = "going_back";
            SoundManager.instance.setVolume("reeling_loop",0);
        }
        else
        {
            SoundManager.instance.setVolume("reeling_loop",0);
            this.state = "ready_to_start";
            this.startMachine();
        }
        
    }.bind(this));

    tween_go_down.chain(tween_go_up.delay(1)).start();
};


Claw.prototype.anyToyGrabbed = function(){

    let any_grabbed = false;

    if(this.selected_toy)
    {
        return true;
    }

    for(let i = 0; i < Toy.all_toys.length; i++)
    {
        if(Toy.all_toys[i] && Toy.all_toys[i].entity.getPosition().y > 5)
        {
            any_grabbed = true;
        }  
    }
    return any_grabbed;
}


Claw.prototype.anyToyInCorner = function(){

    let any_grabbed = false;

    for(let i = 0; i < Toy.all_toys.length; i++)
    {
        if(Toy.all_toys[i] && Toy.all_toys[i].entity.getPosition().x < -2 && Toy.all_toys[i].entity.getPosition().z > 2)
        {
            any_grabbed = true;
        }  
    }

    return any_grabbed;
}

Claw.prototype.startMachine = function(){
    if(this.state == "ready_to_start")
    {
        this.state = "starting";
        this.start_flag = true;
    }
};

Claw.prototype.startSucces = function()
{   
    this.start_flag = false;
    this.coin_in = true;

    AnimatedCoin.instance.doAnimation(function(){
        AdsManager.instance.showCommercialBreak(function(){
            this.state = "aiming";
            this.open = true;
            this.guard_collision.enabled = false;
            SoundManager.instance.playSound("start");
            CoinBox.instance.show_button = true;
            this.disableMagnet();

            if(!CameraRotation.instance.show_collection)
            {
                if(!AdsManager.instance.gameplay)
                {
                    AdsManager.instance.gameplayStart();
                }
            }            
            
        }.bind(this));
    }.bind(this));
}

Claw.prototype.findClosestToy = function()
{
    let min_dist = Infinity;
    let selected = null;

    for(let i = 0; i < Toy.all_toys.length; i++)
    {
        let dist = this.attraction_point.getPosition().distance(Toy.all_toys[i].entity.getPosition());

        if(dist < min_dist)
        {
            min_dist = dist;
            selected = Toy.all_toys[i].entity;
        }
    }

    return selected;
}

// update code called every frame
Claw.prototype.update = function(dt) {  

    if(this.selected_toy)
    {
        let dir = new pc.Vec3().sub2(this.attraction_point.getPosition(),this.selected_toy.getPosition()).normalize().mulScalar(0.1);
        this.selected_toy.rigidbody.applyImpulse(dir.x,dir.y,dir.z,0,0,0);
    }

    var dx = 0;
    var dz = 0;   
    var speed = 2; // Movement speed 

    if((this.state == "aiming") && !(CameraRotation.instance && CameraRotation.instance.show_collection)) 
    {
        var input = this.app.keyboard;

        var joystick = window.touchJoypad.sticks['joystick0'];

        if(!CameraRotation.instance.rotate_flag)
        {
            dx = pc.math.clamp(((input.isPressed(pc.KEY_D) || input.isPressed(pc.KEY_RIGHT) - (input.isPressed(pc.KEY_A) || input.isPressed(pc.KEY_LEFT)))) + joystick.x,-1,1);
            dz = pc.math.clamp(((input.isPressed(pc.KEY_W) || input.isPressed(pc.KEY_UP) - (input.isPressed(pc.KEY_S) || input.isPressed(pc.KEY_DOWN)))) + joystick.y,-1,1);
        }
        else
        {
            dz = pc.math.clamp(((input.isPressed(pc.KEY_D) || input.isPressed(pc.KEY_RIGHT) - (input.isPressed(pc.KEY_A) || input.isPressed(pc.KEY_LEFT)))) + joystick.x,-1,1) * -1;
            dx = pc.math.clamp(((input.isPressed(pc.KEY_W) || input.isPressed(pc.KEY_UP) - (input.isPressed(pc.KEY_S) || input.isPressed(pc.KEY_DOWN)))) + joystick.y,-1,1);
        }
      
        this.anim_dx = pc.math.lerp(this.anim_dx,dx,10*dt);
        this.anim_dz = pc.math.lerp(this.anim_dz,dz,10*dt);

        this.lever.setLocalEulerAngles(-this.anim_dz*15,0,-this.anim_dx*15);

        SoundManager.instance.setVolume("motor_loop",Math.abs(this.anim_dx) + Math.abs(this.anim_dz) * 0.25);
           
        // Calcula nueva posición
        var newX = this.axis.getPosition().x + dx  * speed * dt;
        var newZ = this.axis.getPosition().z - dz  * speed * dt;

        // Aplica límites
        newX = pc.math.clamp(newX, this.minX, this.maxX);
        newZ = pc.math.clamp(newZ, this.minZ, this.maxZ);

        // Actualiza posición
        this.axis.setPosition(newX, this.axis.getPosition().y, newZ);
    }

    if(this.state == "going_back")
    {
        var newX = this.axis.getPosition().x -speed * dt;
        var newZ = this.axis.getPosition().z +speed * dt;

        newX = pc.math.clamp(newX, this.minX, this.maxX);
        newZ = pc.math.clamp(newZ, this.minZ, this.maxZ);

        SoundManager.instance.setVolume("motor_loop",0.5);

        this.axis.setPosition(newX, this.axis.getPosition().y, newZ);

        if((newX == this.minX)&&(newZ == this.maxZ))
        {
            this.state = "waiting_to_drop";

            setTimeout(function(){
                
                this.open = true;                
                SoundManager.instance.setVolume("motor_loop",0);

                setTimeout(function()
                {
                    this.open = false; 

                    if(this.selected_toy)
                    {
                        this.selected_toy.rigidbody.linearDamping = 0;
                    }

                    this.selected_toy = null;
                    this.state = "ready_to_start";
                }.bind(this),1000);

                if(!this.anyToyInCorner())
                {
                    this.startMachine();
                }
                else
                {
                    this.guard_collision.enabled = true;

                    //si no gana en unos segundos arrancar denuevo para que no se bueguee
                    setTimeout(function(){
                        if(!this.coin_in)
                        {
                            this.startMachine();
                        }
                    }.bind(this),8000);
                }

            }.bind(this),500)
        }
    }

    this.button_y = pc.math.lerp(this.button_y,0,3 * dt);

    this.button.setLocalPosition(0,this.button_y,0);

    for(let i = 0; i < this.arms.length; i++)
    {
        this.arms[i].script.hingeConstraint.motorTargetVelocity = (this.open)?2000:-2000;
    }

    let dist = this.axis.getPosition().distance(this.entity.getPosition());
    this.cable.setLocalScale(0.1,0.1,dist);
    this.cable.setPosition(this.axis.getPosition());
    this.cable.lookAt(this.entity.getPosition());
    this.rails.setPosition(0,10,this.axis.getPosition().z);

    if(this.start_flag)
    {
        this.startSucces();
    }
};

// uncomment the swap method to enable hot-reloading for this script
// update the method body to copy state from the old instance
// Claw.prototype.swap = function(old) { };

// learn more about scripting here:
// https://developer.playcanvas.com/user-manual/scripting/