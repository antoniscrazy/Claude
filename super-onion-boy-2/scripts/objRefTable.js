const C3 = self.C3;
self.C3_GetObjectRefTable = function() {
  return [
    C3.Plugins.Tilemap,
    C3.Plugins.Sprite,
    C3.Behaviors.Flash,
    C3.Behaviors.Rotate,
    C3.Behaviors.Pin,
    C3.Plugins.Function,
    C3.Plugins.TiledBg,
    C3.Behaviors.scrollto,
    C3.Behaviors.Platform,
    C3.Behaviors.Timer,
    C3.Behaviors.solid,
    C3.Behaviors.jumpthru,
    C3.Behaviors.Persist,
    C3.Behaviors.Bullet,
    C3.Behaviors.destroy,
    C3.Behaviors.Sin,
    C3.Plugins.Touch,
    C3.Behaviors.Fade,
    C3.Plugins.LocalStorage,
    C3.Plugins.Audio,
    C3.Plugins.Spritefont2,
    C3.Behaviors.lunarray_LiteTween,
    C3.Plugins.Particles,
    C3.Plugins.Browser,
    C3.Plugins.Arr,
    C3.Plugins.Keyboard,
    C3.Plugins.gamepad,
    C3.Plugins.System.Cnds.OnLayoutStart,
    C3.Behaviors.Timer.Acts.StartTimer,
    C3.Plugins.System.Acts.SetGroupActive,
    C3.Plugins.System.Acts.SetVar,
    C3.Behaviors.Pin.Acts.PinByProperties,
    C3.Plugins.System.Cnds.CompareVar,
    C3.Plugins.Arr.Acts.SetX,
    C3.Plugins.Function.Acts.CallFunction,
    C3.Plugins.System.Acts.ScrollToObject,
    C3.Plugins.LocalStorage.Acts.CheckItemExists,
    C3.Plugins.Arr.Cnds.CompareX,
    C3.Plugins.Sprite.Acts.SetPos,
    C3.Plugins.Sprite.Exps.X,
    C3.Plugins.Sprite.Exps.Y,
    C3.Plugins.Sprite.Acts.SetInstanceVar,
    C3.Plugins.Sprite.Acts.SetAnimSpeed,
    C3.Plugins.Sprite.Acts.SetY,
    C3.Behaviors.Sin.Acts.SetEnabled,
    C3.Plugins.Spritefont2.Acts.Destroy,
    C3.Plugins.System.Acts.WaitForPreviousActions,
    C3.Plugins.TiledBg.Acts.SetPos,
    C3.Plugins.TiledBg.Acts.Destroy,
    C3.Plugins.Sprite.Acts.StartAnim,
    C3.Plugins.System.Acts.CreateObject,
    C3.Plugins.Sprite.Acts.SetMirrored,
    C3.Plugins.System.Cnds.IsMobile,
    C3.Plugins.Sprite.Acts.Destroy,
    C3.Plugins.Sprite.Cnds.CompareFrame,
    C3.Plugins.System.Cnds.ForEach,
    C3.Plugins.Arr.Cnds.Contains,
    C3.Plugins.Sprite.Exps.UID,
    C3.Behaviors.Timer.Cnds.OnTimer,
    C3.Plugins.LocalStorage.Cnds.OnItemExists,
    C3.Plugins.LocalStorage.Acts.GetItem,
    C3.Plugins.LocalStorage.Cnds.OnItemMissing,
    C3.Plugins.LocalStorage.Acts.SetItem,
    C3.Plugins.Arr.Exps.AsJSON,
    C3.Plugins.LocalStorage.Cnds.OnItemGet,
    C3.Plugins.LocalStorage.Exps.ItemValue,
    C3.Plugins.Arr.Acts.JSONLoad,
    C3.Behaviors.Platform.Cnds.OnLand,
    C3.Behaviors.Rotate.Acts.SetSpeed,
    C3.Plugins.Sprite.Acts.SetAngle,
    C3.Plugins.Sprite.Cnds.CompareInstanceVar,
    C3.Plugins.Sprite.Cnds.CompareAnimSpeed,
    C3.Plugins.Sprite.Cnds.IsAnimPlaying,
    C3.Plugins.Function.Cnds.OnFunction,
    C3.Plugins.Function.Cnds.CompareParam,
    C3.Behaviors.Platform.Acts.SimulateControl,
    C3.Plugins.Sprite.Cnds.IsMirrored,
    C3.Plugins.System.Cnds.Compare,
    C3.Plugins.Sprite.Exps.Angle,
    C3.Behaviors.Platform.Cnds.IsOnFloor,
    C3.Behaviors.Platform.Acts.SetVectorY,
    C3.Plugins.System.Cnds.Else,
    C3.Behaviors.Platform.Cnds.IsMoving,
    C3.Plugins.Sprite.Acts.SetAnim,
    C3.Behaviors.Platform.Cnds.IsJumping,
    C3.Behaviors.Platform.Cnds.IsFalling,
    C3.Behaviors.Platform.Cnds.OnFall,
    C3.Plugins.Sprite.Acts.SetCollisions,
    C3.Plugins.System.Cnds.TriggerOnce,
    C3.Behaviors.Platform.Exps.VectorY,
    C3.Plugins.System.Cnds.IsGroupActive,
    C3.Plugins.Keyboard.Cnds.IsKeyDown,
    C3.Plugins.Touch.Cnds.IsTouchingObject,
    C3.Plugins.gamepad.Cnds.CompareAxis,
    C3.Plugins.gamepad.Cnds.IsButtonDown,
    C3.Plugins.Keyboard.Cnds.OnKey,
    C3.Plugins.gamepad.Cnds.OnButtonDown,
    C3.Plugins.Touch.Cnds.OnTouchObject,
    C3.Behaviors.Platform.Acts.SetDeceleration,
    C3.Plugins.Sprite.Cnds.IsOverlapping,
    C3.Behaviors.Flash.Cnds.IsFlashing,
    C3.Plugins.Sprite.Cnds.CompareY,
    C3.Plugins.Sprite.Exps.ImagePointY,
    C3.Plugins.Sprite.Cnds.CompareX,
    C3.Behaviors.Platform.Acts.SetVectorX,
    C3.Plugins.Sprite.Cnds.OnCollision,
    C3.Behaviors.Timer.Acts.StopTimer,
    C3.Behaviors.Flash.Acts.Flash,
    C3.Behaviors.Fade.Acts.StartFade,
    C3.Plugins.Sprite.Acts.SetAnimFrame,
    C3.Plugins.Sprite.Acts.SetEffectParam,
    C3.Plugins.Sprite.Cnds.IsCollisionEnabled,
    C3.Behaviors.Flash.Acts.StopFlashing,
    C3.Plugins.Sprite.Cnds.IsOnScreen,
    C3.Plugins.System.Exps.dt,
    C3.Plugins.System.Cnds.Every,
    C3.Plugins.System.Exps.random,
    C3.Plugins.Sprite.Cnds.OnAnyAnimFinished,
    C3.Plugins.System.Acts.Wait,
    C3.Plugins.System.Acts.AddVar,
    C3.Plugins.Arr.Exps.At,
    C3.Plugins.Arr.Acts.Push,
    C3.Behaviors.Platform.Acts.SetJumpStrength,
    C3.Plugins.Sprite.Cnds.CompareOpacity,
    C3.Behaviors.Fade.Acts.SetFadeOutTime,
    C3.Behaviors.Fade.Acts.SetFadeInTime,
    C3.Behaviors.Fade.Acts.RestartFade,
    C3.Plugins.Sprite.Exps.LayerName,
    C3.Plugins.TiledBg.Exps.Y,
    C3.Plugins.TiledBg.Exps.X,
    C3.Plugins.TiledBg.Cnds.CompareInstanceVar,
    C3.Plugins.Sprite.Cnds.OnAnimFinished,
    C3.Behaviors.Platform.Exps.Deceleration,
    C3.Behaviors.Platform.Acts.SetMaxFallSpeed,
    C3.Behaviors.Platform.Exps.MaxFallSpeed,
    C3.Plugins.Sprite.Acts.Spawn,
    C3.Behaviors.Bullet.Acts.SetSpeed,
    C3.Behaviors.Bullet.Acts.SetAngleOfMotion,
    C3.Plugins.Sprite.Cnds.OnFrameChanged,
    C3.Plugins.Sprite.Cnds.OnCreated,
    C3.Plugins.Sprite.Acts.AddInstanceVar,
    C3.Plugins.Sprite.Cnds.OnDestroyed,
    C3.Plugins.Sprite.Acts.SubInstanceVar,
    C3.Behaviors.Platform.Exps.VectorX,
    C3.Plugins.System.Exps.timescale,
    C3.Plugins.Sprite.Exps.AnimationName,
    C3.Plugins.Sprite.Acts.SetX,
    C3.Plugins.System.Exps.viewportright,
    C3.Plugins.System.Exps.viewportbottom,
    C3.Plugins.TiledBg.Acts.SetSize,
    C3.Plugins.System.Exps.viewportleft,
    C3.Plugins.Spritefont2.Cnds.CompareInstanceVar,
    C3.Plugins.Spritefont2.Acts.SetText,
    C3.Plugins.System.Exps.zeropad,
    C3.Plugins.System.Exps.viewporttop,
    C3.Plugins.Sprite.Acts.MoveToBottom,
    C3.Plugins.Audio.Acts.StopAll,
    C3.Plugins.TiledBg.Acts.SetInstanceVar,
    C3.Plugins.System.Exps.int,
    C3.Plugins.Audio.Acts.SetPlaybackRate,
    C3.Behaviors.Platform.Acts.SetMaxSpeed,
    C3.Behaviors.Platform.Cnds.OnJump,
    C3.Plugins.System.Exps.choose,
    C3.Behaviors.Platform.Acts.SetEnabled,
    C3.Plugins.Sprite.Acts.ZMoveToObject,
    C3.Plugins.Sprite.Acts.MoveToTop,
    C3.Behaviors.lunarray_LiteTween.Cnds.OnEnd,
    C3.Plugins.Sprite.Acts.SetVisible,
    C3.Behaviors.Fade.Cnds.OnFadeInEnd,
    C3.Plugins.Sprite.Cnds.IsBoolInstanceVarSet,
    C3.Plugins.TiledBg.Cnds.PickByUID,
    C3.Behaviors.solid.Acts.SetEnabled,
    C3.Plugins.Spritefont2.Cnds.PickByUID,
    C3.Plugins.gamepad.Cnds.HasGamepads,
    C3.Behaviors.Fade.Acts.SetWaitTime,
    C3.Behaviors.lunarray_LiteTween.Acts.Start,
    C3.Plugins.Sprite.Acts.StopAnim,
    C3.Behaviors.Platform.Exps.MaxSpeed,
    C3.Plugins.Particles.Acts.SetRate,
    C3.Behaviors.scrollto.Acts.SetEnabled,
    C3.Behaviors.scrollto.Acts.Shake,
    C3.Behaviors.Bullet.Acts.SetEnabled,
    C3.Behaviors.Rotate.Exps.Speed,
    C3.Plugins.Sprite.Acts.RotateTowardAngle,
    C3.Behaviors.Platform.Cnds.IsByWall,
    C3.Plugins.TiledBg.Cnds.CompareY,
    C3.Behaviors.Bullet.Exps.AngleOfMotion,
    C3.Behaviors.Sin.Exps.Value,
    C3.Plugins.Sprite.Exps.AnimationFrame,
    C3.Behaviors.Platform.Acts.SetGravity,
    C3.Behaviors.Pin.Cnds.IsPinned,
    C3.Behaviors.Pin.Acts.Pin,
    C3.Behaviors.Pin.Acts.Unpin,
    C3.Behaviors.jumpthru.Cnds.IsEnabled,
    C3.Behaviors.jumpthru.Acts.SetEnabled,
    C3.Plugins.TiledBg.Cnds.IsOnScreen,
    C3.Plugins.System.Cnds.EveryTick,
    C3.Plugins.TiledBg.Acts.SetX,
    C3.Plugins.TiledBg.Acts.SetY,
    C3.Plugins.Spritefont2.Acts.SetPos,
    C3.Plugins.Spritefont2.Acts.SetY,
    C3.Behaviors.Flash.Cnds.OnFlashEnded,
    C3.Plugins.Sprite.Acts.MoveToLayer,
    C3.Plugins.System.Cnds.Repeat,
    C3.Plugins.System.Exps.loopindex,
    C3.Plugins.Spritefont2.Acts.SetWidth,
    C3.Behaviors.Platform.Acts.SetAcceleration,
    C3.Behaviors.Sin.Acts.SetMovement,
    C3.Behaviors.Sin.Acts.SetMagnitude,
    C3.Behaviors.Sin.Acts.SetPeriod,
    C3.Behaviors.solid.Cnds.IsEnabled,
    C3.Behaviors.lunarray_LiteTween.Acts.Reverse,
    C3.Behaviors.lunarray_LiteTween.Cnds.OnReverseEnd,
    C3.Plugins.System.Exps.left,
    C3.Plugins.System.Exps.len,
    C3.Plugins.Spritefont2.Exps.Text,
    C3.Behaviors.Fade.Cnds.OnFadeOutEnd,
    C3.Behaviors.lunarray_LiteTween.Acts.Stop,
    C3.Behaviors.Sin.Cnds.IsEnabled,
    C3.Plugins.Touch.Cnds.OnTouchEnd,
    C3.Plugins.System.Acts.SetObjectTimescale,
    C3.Plugins.System.Acts.SetTimescale,
    C3.Plugins.System.Acts.GoToLayoutByName,
    C3.Plugins.System.Acts.ResetGlobals,
    C3.Plugins.System.Acts.ResetPersisted,
    C3.Plugins.Arr.Acts.SetSize,
    C3.Plugins.System.Acts.GoToLayout,
    C3.Plugins.System.Acts.NextPrevLayout,
    C3.Plugins.gamepad.Cnds.OnGamepadDisconnected,
    C3.Plugins.Audio.Acts.SetPaused,
    C3.Behaviors.Sin.Acts.UpdateInitialState,
    C3.Plugins.LocalStorage.Cnds.OnAllGetsComplete,
    C3.Plugins.System.Exps.loadingprogress,
    C3.Plugins.Audio.Acts.Play,
    C3.Plugins.Audio.Acts.Stop,
    C3.Plugins.Browser.Cnds.OnPageVisible,
    C3.Plugins.Audio.Acts.SetSilent,
    C3.Plugins.System.Acts.ScrollY,
    C3.Plugins.TiledBg.Cnds.CompareX,
    C3.Plugins.TiledBg.Exps.Width,
    C3.Plugins.Sprite.Acts.SetTowardPosition,
    C3.Behaviors.lunarray_LiteTween.Acts.SetTarget,
    C3.Plugins.Spritefont2.Acts.SetInstanceVar,
    C3.Behaviors.lunarray_LiteTween.Acts.SetDuration,
    C3.Behaviors.lunarray_LiteTween.Cnds.IsActive,
    C3.Plugins.Audio.Cnds.IsTagPlaying,
    C3.Behaviors.lunarray_LiteTween.Acts.SetEasing,
    C3.Plugins.System.Exps.layoutname,
    C3.Plugins.Browser.Cnds.OnBackButton,
    C3.Plugins.Browser.Acts.Close,
    C3.Plugins.Arr.Acts.Clear,
    C3.Plugins.LocalStorage.Acts.ClearStorage,
    C3.Plugins.Sprite.Cnds.PickByUID,
    C3.Plugins.System.Acts.RestartLayout,
    C3.Plugins.Keyboard.Cnds.OnAnyKey,
    C3.Plugins.Sprite.Cnds.IsVisible,
    C3.Plugins.Spritefont2.Cnds.OnDestroyed,
    C3.Plugins.Sprite.Acts.SetScale,
    C3.Behaviors.Platform.Cnds.OnStop,
    C3.Plugins.Keyboard.Cnds.OnKeyReleased,
    C3.Plugins.gamepad.Cnds.OnButtonUp,
    C3.Plugins.Touch.Cnds.OnTouchStart
  ];
};
self.C3_JsPropNameTable = [{
    Tilemap: 0
  },
  {
    stop: 0
  },
  {
    Variable1: 0
  },
  {
    Flash: 0
  },
  {
    Rotate: 0
  },
  {
    Pin: 0
  },
  {
    Sprite2: 0
  },
  {
    Function: 0
  },
  {
    evento: 0
  },
  {
    ScrollTo: 0
  },
  {
    CAMERA: 0
  },
  {
    jump: 0
  },
  {
    jump2: 0
  },
  {
    limitefire: 0
  },
  {
    score: 0
  },
  {
    startj: 0
  },
  {
    dano: 0
  },
  {
    water: 0
  },
  {
    dash: 0
  },
  {
    power: 0
  },
  {
    cano: 0
  },
  {
    dano2: 0
  },
  {
    cameraY: 0
  },
  {
    Variable2queda: 0
  },
  {
    cameratipo: 0
  },
  {
    quedaY: 0
  },
  {
    speed: 0
  },
  {
    vectY: 0
  },
  {
    heart2: 0
  },
  {
    Platform: 0
  },
  {
    Timer: 0
  },
  {
    player: 0
  },
  {
    perseguir: 0
  },
  {
    Solid: 0
  },
  {
    muro: 0
  },
  {
    Jumpthru: 0
  },
  {
    jumpTrow: 0
  },
  {
    direcao: 0
  },
  {
    Persist: 0
  },
  {
    coin: 0
  },
  {
    Bullet: 0
  },
  {
    DestroyOutsideLayout: 0
  },
  {
    pedra: 0
  },
  {
    shine: 0
  },
  {
    life: 0
  },
  {
    destroi: 0
  },
  {
    nodesative: 0
  },
  {
    bloco: 0
  },
  {
    direcaoo: 0
  },
  {
    monster: 0
  },
  {
    rotate22: 0
  },
  {
    ativar: 0
  },
  {
    tipo: 0
  },
  {
    drop: 0
  },
  {
    m4: 0
  },
  {
    m4b: 0
  },
  {
    dest: 0
  },
  {
    goup: 0
  },
  {
    rotatew: 0
  },
  {
    mage: 0
  },
  {
    teladestroi: 0
  },
  {
    time1: 0
  },
  {
    time2: 0
  },
  {
    modo: 0
  },
  {
    bee: 0
  },
  {
    boss: 0
  },
  {
    steam: 0
  },
  {
    m1: 0
  },
  {
    Sine: 0
  },
  {
    Touch: 0
  },
  {
    bee2: 0
  },
  {
    Sprite10: 0
  },
  {
    fire: 0
  },
  {
    estrela: 0
  },
  {
    boom: 0
  },
  {
    cape: 0
  },
  {
    Fade: 0
  },
  {
    fade: 0
  },
  {
    fases: 0
  },
  {
    fase1: 0
  },
  {
    fadein: 0
  },
  {
    LocalStorage: 0
  },
  {
    balao: 0
  },
  {
    estrelahud: 0
  },
  {
    Audio: 0
  },
  {
    LiteTween: 0
  },
  {
    fonthud: 0
  },
  {
    tile1: 0
  },
  {
    colisionmonster: 0
  },
  {
    m2: 0
  },
  {
    TiledBackground3: 0
  },
  {
    m6: 0
  },
  {
    Tilemap2: 0
  },
  {
    spin: 0
  },
  {
    espinho: 0
  },
  {
    atkm: 0
  },
  {
    TiledBackground12: 0
  },
  {
    bee5: 0
  },
  {
    m3: 0
  },
  {
    cristal: 0
  },
  {
    Particles4: 0
  },
  {
    flash: 0
  },
  {
    events: 0
  },
  {
    Boss: 0
  },
  {
    gameoverr: 0
  },
  {
    placar: 0
  },
  {
    SpriteFont18: 0
  },
  {
    new: 0
  },
  {
    Particles9: 0
  },
  {
    credits: 0
  },
  {
    CREDITT2: 0
  },
  {
    Browser: 0
  },
  {
    pause: 0
  },
  {
    posyX: 0
  },
  {
    PosyY: 0
  },
  {
    targetX: 0
  },
  {
    Variable2: 0
  },
  {
    fase9: 0
  },
  {
    SpriteFont20: 0
  },
  {
    Sprite6: 0
  },
  {
    Particlesb: 0
  },
  {
    Tilemap4: 0
  },
  {
    tile4: 0
  },
  {
    m5: 0
  },
  {
    m7: 0
  },
  {
    m8: 0
  },
  {
    Sprite13: 0
  },
  {
    stages: 0
  },
  {
    LOST: 0
  },
  {
    folha: 0
  },
  {
    Sprite: 0
  },
  {
    loadd: 0
  },
  {
    Array: 0
  },
  {
    heart: 0
  },
  {
    Tilemap5: 0
  },
  {
    dialo: 0
  },
  {
    variable: 0
  },
  {
    noative: 0
  },
  {
    Sprite16: 0
  },
  {
    waterr: 0
  },
  {
    m9: 0
  },
  {
    effect: 0
  },
  {
    Particlesb2: 0
  },
  {
    plataformas: 0
  },
  {
    lugar: 0
  },
  {
    PositionX: 0
  },
  {
    PositionY: 0
  },
  {
    efeito: 0
  },
  {
    Sprite28: 0
  },
  {
    dialogo: 0
  },
  {
    text: 0
  },
  {
    size: 0
  },
  {
    TEXTT: 0
  },
  {
    hud1: 0
  },
  {
    m11: 0
  },
  {
    positionY: 0
  },
  {
    checkY: 0
  },
  {
    save: 0
  },
  {
    savepoint: 0
  },
  {
    Particlesf9: 0
  },
  {
    buttons1: 0
  },
  {
    m10: 0
  },
  {
    waterY: 0
  },
  {
    waterdrop: 0
  },
  {
    Array2: 0
  },
  {
    bee3: 0
  },
  {
    effectsprite: 0
  },
  {
    gameove: 0
  },
  {
    tile6: 0
  },
  {
    Sprite45: 0
  },
  {
    Tilemap6: 0
  },
  {
    Tilemap7: 0
  },
  {
    tile8: 0
  },
  {
    tile9: 0
  },
  {
    teste: 0
  },
  {
    stone: 0
  },
  {
    Tiled3: 0
  },
  {
    Tiled4: 0
  },
  {
    TiledBackground10: 0
  },
  {
    Tilemap10: 0
  },
  {
    Sprite58: 0
  },
  {
    item: 0
  },
  {
    noinvenc: 0
  },
  {
    chest: 0
  },
  {
    TiledBackground15: 0
  },
  {
    Tilemap12: 0
  },
  {
    Sprite59: 0
  },
  {
    bee4: 0
  },
  {
    TiledBackground16: 0
  },
  {
    tile10: 0
  },
  {
    tile12: 0
  },
  {
    m13: 0
  },
  {
    m14: 0
  },
  {
    m16: 0
  },
  {
    m18: 0
  },
  {
    m19: 0
  },
  {
    Tilemap14: 0
  },
  {
    tile13: 0
  },
  {
    tile14: 0
  },
  {
    tile16: 0
  },
  {
    m21: 0
  },
  {
    Sprite29: 0
  },
  {
    bubles: 0
  },
  {
    tile18: 0
  },
  {
    tile19: 0
  },
  {
    Tilemap15: 0
  },
  {
    tiledesert: 0
  },
  {
    tiledesert3: 0
  },
  {
    tiledesert4: 0
  },
  {
    tile21: 0
  },
  {
    m2a: 0
  },
  {
    tile22: 0
  },
  {
    spin2: 0
  },
  {
    m25: 0
  },
  {
    bee8: 0
  },
  {
    flash2: 0
  },
  {
    Tiled5: 0
  },
  {
    Tiled6: 0
  },
  {
    tiled0: 0
  },
  {
    tiled02: 0
  },
  {
    tile23: 0
  },
  {
    m26: 0
  },
  {
    Tilemap18: 0
  },
  {
    Tilemap19: 0
  },
  {
    Sprite80: 0
  },
  {
    stone2: 0
  },
  {
    bee9: 0
  },
  {
    Boss2: 0
  },
  {
    Boss3: 0
  },
  {
    Boss4: 0
  },
  {
    event50: 0
  },
  {
    Boss5: 0
  },
  {
    LVCOMPLET: 0
  },
  {
    Array3: 0
  },
  {
    fade2: 0
  },
  {
    SpriteFont19: 0
  },
  {
    Sprite27: 0
  },
  {
    npc: 0
  },
  {
    dialogo2: 0
  },
  {
    m17: 0
  },
  {
    flash3: 0
  },
  {
    gameoverr3: 0
  },
  {
    Particlesb3: 0
  },
  {
    Sprite14: 0
  },
  {
    Sprite3: 0
  },
  {
    m01: 0
  },
  {
    Array4: 0
  },
  {
    tras: 0
  },
  {
    frente: 0
  },
  {
    cima: 0
  },
  {
    firee: 0
  },
  {
    cima2: 0
  },
  {
    Particlesf10: 0
  },
  {
    Keyboard: 0
  },
  {
    Gamepad: 0
  },
  {
    tuturial: 0
  },
  {
    Array5: 0
  },
  {
    botoess: 0
  },
  {
    fonthud2: 0
  },
  {
    enemies: 0
  },
  {
    colisao: 0
  },
  {
    bosses: 0
  },
  {
    fadee: 0
  },
  {
    limi: 0
  },
  {
    nopause: 0
  },
  {
    fases1: 0
  },
  {
    door: 0
  },
  {
    gamepad: 0
  },
  {
    bau: 0
  },
  {
    stage: 0
  },
  {
    TIMESTAR: 0
  },
  {
    loads: 0
  },
  {
    BEST: 0
  },
  {
    mirror: 0
  },
  {
    positionX: 0
  },
  {
    bonus: 0
  },
  {
    checkpoint: 0
  },
  {
    tuto: 0
  },
  {
    cameraX: 0
  },
  {
    chest2: 0
  },
  {
    speedtext: 0
  },
  {
    botao: 0
  },
  {
    fasenext: 0
  },
  {
    load2: 0
  },
  {
    voltar: 0
  },
  {
    credit: 0
  },
  {
    intro: 0
  },
  {
    tipob: 0
  },
  {
    fadeall: 0
  },
  {
    evento2: 0
  }
];

self.InstanceType = {
  Tilemap: class extends self.ITilemapInstance {},
  Sprite2: class extends self.ISpriteInstance {},
  Function: class extends self.IInstance {},
  CAMERA: class extends self.ITiledBackgroundInstance {},
  player: class extends self.ISpriteInstance {},
  muro: class extends self.ITiledBackgroundInstance {},
  jumpTrow: class extends self.ITiledBackgroundInstance {},
  coin: class extends self.ISpriteInstance {},
  pedra: class extends self.ISpriteInstance {},
  shine: class extends self.ISpriteInstance {},
  bloco: class extends self.ISpriteInstance {},
  m1: class extends self.ISpriteInstance {},
  life: class extends self.ISpriteInstance {},
  Touch: class extends self.IInstance {},
  bee: class extends self.ISpriteInstance {},
  bee2: class extends self.ISpriteInstance {},
  Sprite10: class extends self.ISpriteInstance {},
  fire: class extends self.ISpriteInstance {},
  estrela: class extends self.ISpriteInstance {},
  boom: class extends self.ISpriteInstance {},
  cape: class extends self.ISpriteInstance {},
  fade: class extends self.ITiledBackgroundInstance {},
  fadein: class extends self.ITiledBackgroundInstance {},
  LocalStorage: class extends self.IInstance {},
  balao: class extends self.ISpriteInstance {},
  cano: class extends self.ISpriteInstance {},
  estrelahud: class extends self.ISpriteInstance {},
  m4: class extends self.ISpriteInstance {},
  Audio: class extends self.IInstance {},
  fonthud: class extends self.ISpriteFontInstance {},
  tile1: class extends self.ITiledBackgroundInstance {},
  colisionmonster: class extends self.ITiledBackgroundInstance {},
  m2: class extends self.ISpriteInstance {},
  TiledBackground3: class extends self.ITiledBackgroundInstance {},
  m6: class extends self.ISpriteInstance {},
  Tilemap2: class extends self.ITilemapInstance {},
  spin: class extends self.ITiledBackgroundInstance {},
  espinho: class extends self.ISpriteInstance {},
  atkm: class extends self.ISpriteInstance {},
  TiledBackground12: class extends self.ITiledBackgroundInstance {},
  bee5: class extends self.ISpriteInstance {},
  m3: class extends self.ISpriteInstance {},
  cristal: class extends self.ISpriteInstance {},
  Particles4: class extends self.IParticlesInstance {},
  flash: class extends self.ITiledBackgroundInstance {},
  Boss: class extends self.ISpriteInstance {},
  gameoverr: class extends self.ISpriteInstance {},
  placar: class extends self.ISpriteInstance {},
  SpriteFont18: class extends self.ISpriteFontInstance {},
  new: class extends self.ISpriteInstance {},
  Particles9: class extends self.IParticlesInstance {},
  credits: class extends self.ISpriteFontInstance {},
  CREDITT2: class extends self.ITiledBackgroundInstance {},
  Browser: class extends self.IInstance {},
  pause: class extends self.ITiledBackgroundInstance {},
  fase9: class extends self.ISpriteInstance {},
  SpriteFont20: class extends self.ISpriteFontInstance {},
  Sprite6: class extends self.ISpriteInstance {},
  Particlesb: class extends self.IParticlesInstance {},
  Tilemap4: class extends self.ITilemapInstance {},
  tile4: class extends self.ITiledBackgroundInstance {},
  m5: class extends self.ISpriteInstance {},
  m7: class extends self.ISpriteInstance {},
  m8: class extends self.ISpriteInstance {},
  Sprite13: class extends self.ISpriteInstance {},
  stages: class extends self.ISpriteFontInstance {},
  LOST: class extends self.ISpriteFontInstance {},
  folha: class extends self.ISpriteInstance {},
  Sprite: class extends self.ISpriteInstance {},
  loadd: class extends self.ISpriteInstance {},
  Array: class extends self.IArrayInstance {},
  heart: class extends self.ISpriteInstance {},
  Tilemap5: class extends self.ITilemapInstance {},
  dialo: class extends self.ISpriteInstance {},
  Sprite16: class extends self.ISpriteInstance {},
  waterr: class extends self.ITiledBackgroundInstance {},
  m9: class extends self.ISpriteInstance {},
  effect: class extends self.ISpriteInstance {},
  Particlesb2: class extends self.IParticlesInstance {},
  plataformas: class extends self.ISpriteInstance {},
  Sprite28: class extends self.ISpriteInstance {},
  dialogo: class extends self.ISpriteFontInstance {},
  TEXTT: class extends self.ITiledBackgroundInstance {},
  hud1: class extends self.ISpriteInstance {},
  m11: class extends self.ISpriteInstance {},
  save: class extends self.ISpriteInstance {},
  savepoint: class extends self.ISpriteInstance {},
  Particlesf9: class extends self.IParticlesInstance {},
  buttons1: class extends self.ISpriteInstance {},
  m10: class extends self.ISpriteInstance {},
  evento: class extends self.ITiledBackgroundInstance {},
  waterdrop: class extends self.ITiledBackgroundInstance {},
  Array2: class extends self.IArrayInstance {},
  bee3: class extends self.ISpriteInstance {},
  effectsprite: class extends self.ISpriteInstance {},
  gameove: class extends self.ITiledBackgroundInstance {},
  tile6: class extends self.ITiledBackgroundInstance {},
  Sprite45: class extends self.ISpriteInstance {},
  Tilemap6: class extends self.ITilemapInstance {},
  Tilemap7: class extends self.ITilemapInstance {},
  tile8: class extends self.ITiledBackgroundInstance {},
  tile9: class extends self.ITiledBackgroundInstance {},
  stone: class extends self.ISpriteInstance {},
  Tiled3: class extends self.ITiledBackgroundInstance {},
  Tiled4: class extends self.ITiledBackgroundInstance {},
  TiledBackground10: class extends self.ITiledBackgroundInstance {},
  Tilemap10: class extends self.ITilemapInstance {},
  Sprite58: class extends self.ISpriteInstance {},
  chest: class extends self.ISpriteInstance {},
  TiledBackground15: class extends self.ITiledBackgroundInstance {},
  Tilemap12: class extends self.ITilemapInstance {},
  Sprite59: class extends self.ISpriteInstance {},
  bee4: class extends self.ISpriteInstance {},
  TiledBackground16: class extends self.ITiledBackgroundInstance {},
  tile10: class extends self.ITiledBackgroundInstance {},
  tile12: class extends self.ITiledBackgroundInstance {},
  m13: class extends self.ISpriteInstance {},
  m14: class extends self.ISpriteInstance {},
  m16: class extends self.ISpriteInstance {},
  m18: class extends self.ISpriteInstance {},
  m19: class extends self.ISpriteInstance {},
  Tilemap14: class extends self.ITilemapInstance {},
  tile13: class extends self.ITiledBackgroundInstance {},
  tile14: class extends self.ITiledBackgroundInstance {},
  tile16: class extends self.ITiledBackgroundInstance {},
  m21: class extends self.ISpriteInstance {},
  Sprite29: class extends self.ISpriteInstance {},
  bubles: class extends self.IParticlesInstance {},
  tile18: class extends self.ITiledBackgroundInstance {},
  tile19: class extends self.ITiledBackgroundInstance {},
  Tilemap15: class extends self.ITilemapInstance {},
  tiledesert: class extends self.ITiledBackgroundInstance {},
  tiledesert3: class extends self.ITiledBackgroundInstance {},
  tiledesert4: class extends self.ITiledBackgroundInstance {},
  tile21: class extends self.ITiledBackgroundInstance {},
  m2a: class extends self.ISpriteInstance {},
  tile22: class extends self.ITiledBackgroundInstance {},
  spin2: class extends self.ITiledBackgroundInstance {},
  m25: class extends self.ISpriteInstance {},
  bee8: class extends self.ISpriteInstance {},
  flash2: class extends self.ITiledBackgroundInstance {},
  Tiled5: class extends self.ITiledBackgroundInstance {},
  Tiled6: class extends self.ITiledBackgroundInstance {},
  tiled0: class extends self.ITiledBackgroundInstance {},
  tiled02: class extends self.ITiledBackgroundInstance {},
  tile23: class extends self.ITiledBackgroundInstance {},
  m26: class extends self.ISpriteInstance {},
  Tilemap18: class extends self.ITilemapInstance {},
  Tilemap19: class extends self.ITilemapInstance {},
  Sprite80: class extends self.ISpriteInstance {},
  stone2: class extends self.ISpriteInstance {},
  bee9: class extends self.ISpriteInstance {},
  Boss2: class extends self.ISpriteInstance {},
  Boss3: class extends self.ISpriteInstance {},
  Boss4: class extends self.ISpriteInstance {},
  Boss5: class extends self.ISpriteInstance {},
  LVCOMPLET: class extends self.ISpriteFontInstance {},
  Array3: class extends self.IArrayInstance {},
  fade2: class extends self.ITiledBackgroundInstance {},
  SpriteFont19: class extends self.ISpriteFontInstance {},
  Sprite27: class extends self.ISpriteInstance {},
  npc: class extends self.ISpriteInstance {},
  dialogo2: class extends self.ISpriteFontInstance {},
  m17: class extends self.ISpriteInstance {},
  flash3: class extends self.ITiledBackgroundInstance {},
  gameoverr3: class extends self.ISpriteInstance {},
  Particlesb3: class extends self.IParticlesInstance {},
  Sprite14: class extends self.ISpriteInstance {},
  Sprite3: class extends self.ISpriteInstance {},
  m01: class extends self.ISpriteInstance {},
  Array4: class extends self.IArrayInstance {},
  tras: class extends self.ISpriteInstance {},
  frente: class extends self.ISpriteInstance {},
  cima: class extends self.ISpriteInstance {},
  firee: class extends self.ISpriteInstance {},
  cima2: class extends self.ISpriteInstance {},
  Particlesf10: class extends self.IParticlesInstance {},
  Keyboard: class extends self.IInstance {},
  Gamepad: class extends self.IInstance {},
  tuturial: class extends self.ISpriteInstance {},
  Array5: class extends self.IArrayInstance {},
  botoess: class extends self.ISpriteInstance {},
  fonthud2: class extends self.ISpriteFontInstance {},
  enemies: class extends self.ISpriteInstance {},
  colisao: class extends self.ISpriteInstance {},
  bosses: class extends self.ISpriteInstance {},
  fadee: class extends self.ISpriteInstance {}
}