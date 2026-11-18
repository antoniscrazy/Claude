var CameraRotation = pc.createScript('cameraRotation');


CameraRotation.attributes.add("cam", {type: "entity"});

CameraRotation.attributes.add("cam_look_machine", {type: "entity"});
CameraRotation.attributes.add("cam_look_machine2", {type: "entity"});
CameraRotation.attributes.add("cam_look_colection", {type: "entity"});
CameraRotation.attributes.add("cam_look_brainrot", {type: "entity"});

CameraRotation.attributes.add("rotate_button", {type: "entity"});

CameraRotation.attributes.add("exclamation", {type: "entity"});

CameraRotation.attributes.add("cam_target_pos_machine", {type: "entity"});
CameraRotation.attributes.add("cam_target_pos_brainrot", {type: "entity"});

// initialize code called once per entity
CameraRotation.prototype.initialize = function() {

    CameraRotation.instance = this;

    this.angle = 0;

    this.rotate_flag = false;
    this.show_collection = false;
    this.delay_collection = 0;

    this.current_target_pos = this.cam_target_pos_machine.getLocalPosition();
    this.current_target_look = this.cam_look_machine.getLocalPosition();

    this.camera_end_position = this.cam.getLocalPosition().clone();

    this.cam.setPosition(this.cam.getLocalPosition().add(new pc.Vec3(0,0,20)));

    this.cont = { value: 0 };
    var tween = this.entity.tween(this.cont).to({ value: 1 }, 6, pc.QuarticOut);

    tween.start();

    this.looking_ratio = 0;

    this.app.on("rotate_start", function() {
        if(!this.show_collection)
        {
            this.rotate_flag = true;        
        }    
    }.bind(this));

    this.app.on("rotate_end", function() {
        this.rotate_flag = false;
    }.bind(this));


    this.app.on("collection_down", function() {
        if(this.delay_collection > 0) return;
        this.show_collection = !this.show_collection;
               
        CoinBox.instance.show_button = false;

        if(!this.show_collection)
        {
            if(!AdsManager.instance.gameplay)
            {
                AdsManager.instance.gameplayStart();
            }
        }
        else
        {
            if(AdsManager.instance.gameplay)
            {
                AdsManager.instance.gameplayStop();
            }
        }

        this.delay_collection = 1.5;
        this.exclamation.enabled = false;
    }.bind(this));

};

CameraRotation.prototype.update = function(dt) {

    if(!this.show_collection)
    {
        this.current_target_pos = this.cam_target_pos_machine.getLocalPosition();
        this.current_target_look = this.cam_look_machine.getPosition();

        if(this.rotate_flag)
        {
            this.current_target_look = this.cam_look_machine2.getPosition();
        }
    }
    else
    {
        if(GameManager.instance.current_mode_string == "brainrot")
        {
            this.current_target_pos = this.cam_target_pos_brainrot.getLocalPosition();
            this.current_target_look = this.cam_look_brainrot.getPosition();
        }
        else
        {
            this.current_target_pos = this.cam_target_pos_machine.getLocalPosition();
            this.current_target_look = this.cam_look_colection.getPosition();
        }
    }

    this.delay_collection -= dt;

    this.rotate_button.element.opacity = (!this.show_collection)?1:0.5;

    this.cam.setLocalPosition(new pc.Vec3().lerp(this.cam.getLocalPosition(), this.current_target_pos , 3 * dt));
 
    this.angle = pc.math.lerpAngle(this.angle,(this.rotate_flag)?-90:0,5*dt);

    this.entity.setEulerAngles(0,this.angle,0);


    if(this.rotate_flag)
    {
        this.smoothLookAt(this.cam,this.current_target_look,dt,0.5);
    }
    else
    {
        this.smoothLookAt(this.cam,this.current_target_look,dt,2);
    }
    
};

CameraRotation.prototype.smoothLookAt = function(entity, target, dt, speed) {
    const currentPos = entity.getPosition();

    const desiredMat = new pc.Mat4();
    desiredMat.setLookAt(currentPos, target, pc.Vec3.UP);

    const desiredRot = new pc.Quat();
    desiredRot.setFromMat4(desiredMat);  

    const currentRot = entity.getLocalRotation();
    const newRot = new pc.Quat();
    newRot.slerp(currentRot, desiredRot, dt * speed);

    entity.setLocalRotation(newRot);
};