var SlimeTowerKeyboardSmart = pc.createScript('slimeTowerKeyboardSmart');

SlimeTowerKeyboardSmart.attributes.add("color", {
    type: "number",
    enum: [
        { "Silver":         0 },
        { "Red":            1 },
        { "Orange":         2 },
        { "Yellow":         3 },
        { "Green":          4 },
        { "Blue":           5 },
        { "Purple":         6 },
        { "Pink":           7 },
        { "Brown":          8 },
        //{ "Black":          8 },
    ],
    default: 0
});


SlimeTowerKeyboardSmart.attributes.add("travel", {type:"number", default:.75});

/* SlimeTowerKeyboardSmart.attributes.add("width", {type:"number", default:0});
SlimeTowerKeyboardSmart.attributes.add("height", {type:"number", default:0}); */

// initialize code called once per entity
SlimeTowerKeyboardSmart.prototype.initialize = function() {

    this.keycapAssets = [
        [ 295227584, 295227594, 295227605, 295227614, 295227624, 295227634, 295227643, 295227654, 295227664, 295227674, 295227684, 295227694, 295227704, 295227714, 295227724, 295227734, 295227744, 295227753, 295227764, 295227774, 295227784, 295227794, 295227804, 295227814, 295227824 ], // silver
        [ 295227583, 295227593, 295227603, 295227613, 295227623, 295227633, 295227644, 295227653, 295227663, 295227673, 295227683, 295227693, 295227703, 295227713, 295227723, 295227733, 295227743, 295227754, 295227763, 295227773, 295227783, 295227793, 295227803, 295227813, 295227823 ], // red
        [ 295227580, 295227590, 295227600, 295227610, 295227620, 295227630, 295227640, 295227650, 295227660, 295227670, 295227680, 295227690, 295227700, 295227710, 295227720, 295227730, 295227740, 295227750, 295227759, 295227770, 295227780, 295227790, 295227800, 295227810, 295227820 ], // orange
        [ 295227585, 295227595, 295227604, 295227615, 295227626, 295227635, 295227645, 295227655, 295227665, 295227675, 295227685, 295227695, 295227705, 295227715, 295227725, 295227735, 295227745, 295227755, 295227765, 295227775, 295227785, 295227795, 295227805, 295227815, 295227826 ], // yellow
        [ 295227579, 295227589, 295227599, 295227609, 295227619, 295227629, 295227639, 295227649, 295227659, 295227668, 295227679, 295227689, 295227699, 295227709, 295227719, 295227729, 295227739, 295227749, 295227760, 295227769, 295227779, 295227789, 295227799, 295227809, 295227819 ], // green
        [ 295227576, 295227586, 295227596, 295227606, 295227616, 295227625, 295227636, 295227646, 295227656, 295227666, 295227676, 295227686, 295227696, 295227706, 295227716, 295227726, 295227736, 295227746, 295227756, 295227766, 295227776, 295227786, 295227796, 295227806, 295227816 ], // blue
        [ 295227582, 295227592, 295227602, 295227612, 295227622, 295227632, 295227642, 295227652, 295227661, 295227672, 295227682, 295227692, 295227702, 295227712, 295227722, 295227732, 295227742, 295227752, 295227762, 295227772, 295227782, 295227792, 295227802, 295227812, 295227822 ], // purple
        [ 295227581, 295227591, 295227601, 295227611, 295227621, 295227631, 295227641, 295227651, 295227662, 295227671, 295227681, 295227691, 295227701, 295227711, 295227721, 295227731, 295227741, 295227751, 295227761, 295227771, 295227781, 295227791, 295227801, 295227811, 295227821 ], // pink
        [ 295227577, 295227587, 295227597, 295227607, 295227617, 295227627, 295227637, 295227647, 295227658, 295227667, 295227677, 295227687, 295227697, 295227707, 295227717, 295227727, 295227737, 295227747, 295227757, 295227767, 295227777, 295227787, 295227797, 295227807, 295227817 ], // brown
        //[ 295227578, 295227588, 295227598, 295227608, 295227618, 295227628, 295227638, 295227648, 295227657, 295227669, 295227678, 295227688, 295227698, 295227708, 295227718, 295227728, 295227738, 295227748, 295227758, 295227768, 295227778, 295227788, 295227798, 295227808, 295227818 ], // black
    ]
    
    swapArray(this.keycapAssets, 0, this.color)


    this.goldenKeyAsset = 295543821;
    this.blueKeyAsset = 295543820;
    this.keycapAsset = this.app.assets.get(293423020).resource;
    
    this.keycaps = this.entity.children[1];
    this.triggers = this.entity.children[0];

    this.entity.script.slimeTowerTrigger.onTriggerEnter = ()=>{
        this.triggers.enabled = true;
    }
    this.entity.script.slimeTowerTrigger.onTriggerLeave = ()=>{
        this.triggers.enabled = false;
    }

    this.map = [];

/*     for (let x = 0; x < this.width; x++) {
        this.map[x] = [];
    } */

    this.waves = [];

    this.keycaps.children.forEach((_key,_index)=>{

        _key.keyType = "normal";
        _key.keyIndex = undefined;
        //_key.x = _index % this.width;
        //_key.y = Math.floor(_index / this.height);

        //console.log("x", _key.x, "y", _key.y);
        //this.map[_key.x][_key.y] = _key;

        _key.tags.add("Active");

        const _model = _key;
        const _trigger = _key.children[0].script.slimeTowerTrigger;
        const _triggerEnt = _key.children[0];

        const _pos0 = _key.getLocalPosition().clone();
        const _pos1 = _key.getLocalPosition().clone();
        _pos1.y = - this.travel;

        const _posBefore = _triggerEnt.getPosition().clone();
        _key.children[0].reparent(this.triggers);
        _triggerEnt.setPosition(_posBefore);

        if (_model.render) {
            const _randomKey = getRandomFromArrayWithIndex(this.keycapAssets[0]);
            if (_model.render.asset == 295227584){
                _model.render.asset = _randomKey[0];
                _key.baseIndex = _randomKey[1];
            } else {
                _key.baseIndex = this.keycapAssets[0].findIndex(item => item === _model.render.asset);
            }
            _key.baseAsset = _model.render.asset;
        }

        _trigger.onTriggerEnter = ()=>{
            _model.tween(_model.getLocalPosition())
                .to(_pos1, .085, )
                .start();

            _model.enabled = false;
            _model.render.asset = this.keycapAssets[Math.round(mathRandomRange(1,8))][_key.baseIndex];
            _model.enabled = true;

            clearTimeout(_key.resetTimeOut);
            _key.resetTimeOut = setTimeout(()=>{ if (this.entity && !this.entity.script) return;
                _model.enabled = false;
                _model.render.asset = _key.baseAsset;
                _model.enabled = true;
            }, 1000);
            this.app.gameManager.sounds.playPress();

            console.log("pressed");
            //console.log("x", _key.x, "y", _key.y);
            //this.waves.push(new KeyboardWave(_key.x,_key.y, 1));
        }

        _trigger.onTriggerLeave = ()=>{
            _model.tween(_model.getLocalPosition())
                .to(_pos0, .15, )
                .start();

            //this.gameManager.sounds.playRelease();
        }
    })

    //this.map.forEach((_rows,_x)=>{_rows.forEach((_key, _y)=>{console.log("x",_x,"y",_y, "key",_key)});})
};


SlimeTowerKeyboardSmart.prototype.update = function(dt){

    return;
    if (this.waves.length > 0){
        this.keycaps.children.forEach((_key)=>{
            _key.render.enabled = false;
            _key.render.asset = 295227584;
            _key.render.enabled = true;
        })
    }

    this.waves.forEach((_wave,_index)=>{
        _wave.update(dt);

        if (_wave.dead()){this.waves.splice(_index,1)}


        this.keycaps.children.forEach((_key,_index)=>{
            let dx = _key.x - _wave.x;
            let dy = _key.y - _wave.y;

            let dist = Math.sqrt(dx * dx + dy * dy);
            let diff = Math.abs(dist - _wave.radius);

            let ring = 1 - pc.math.clamp(diff / 1, 0, 1);

            let intensity = ring * _wave.getIntensity();

            //_key.render.asset = getRandomFromArray(this.keycapAssets[]);

            if (intensity > 0){
                _key.render.enabled = false;
                _key.render.asset = 295227583;
                _key.render.enabled = true;
            }
        })
    })

    //console.log("waves:", this.waves.length);
}

