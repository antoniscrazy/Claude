const scriptsInEvents = {

  async Translates_Event2(runtime, localVars) {


    var text_ = localVars.text_;
    var traducciones = new Array();
    var idiomaNavegador = navigator.language || navigator.userLanguage;
    idiomaNavegador = idiomaNavegador.substring(0, 2);
    var return_;



    traducciones["abrir tienda"] = {

      pr: "loja aberta e taxa",
      en: "open shop and rate",
      es: "abrir tienda y calificar",
      fr: "boutique ouverte et tarif",
      it: "negozio aperto e tariffa"

    }



    traducciones["continuar sin calificar"] = {
      pr: "continuar jogando sem avaliar :c",
      en: "Continue playing without rating :C",
      es: "continuar jugando sin calificar :c",
      fr: "continuer à jouer sans note :c",
      it: "continua a giocare senza voto :c"

    }

    traducciones["califica"] = {

      pr: "Classifique o jogo com 5 estrelas :D",
      en: "Rate the game with 5 stars :D",
      es: "Califica el juego con 5 estrellas :D",
      fr: "Notez le jeu avec 5 étoiles :D",
      it: "Valuta il gioco con 5 stelle"

    }

    traducciones["tutorial"] = {
      pr: "Toca para acelerar e equilibrar, se pressionar demais você cairá para trás",
      en: "Tap to accelerate and balance, if you press too hard you will fall backward",
      es: "Toca para acelerar y equilibrar, si presionas demasiado te caerás hacia atrás",
      fr: "Appuyez pour accélérer et équilibrer, si vous appuyez trop fort, vous tomberez en arrière",
      it: "Tocca per accelerare e bilanciare, se premi troppo forte cadrà all'indietro"
    };


    traducciones["test"] = {

      pr: "portugues",
      en: "ingles",
      es: "esp",
      fr: "frances",
      it: "italiano"

    }



    if (traducciones[text_] != null && traducciones[text_] != undefined) {

      return_ = traducciones[text_][idiomaNavegador]
      if (return_ == null || return_ == undefined) {
        return_ = traducciones[text_]["en"]

      }
      localVars.return = return_;

    }

  },

  async Game_Event98(runtime, localVars) {

    var enter = 1;
    //quite aqui para michael
    /*
    if(enter==1&&runtime.callFunction("CAN_SHOW_INTER",0)==1){
    
    	runtime.callFunction("SHOW_INTER",1,localVars.next);
    	enter=0;
    }*/


    /*
    
    if(enter==1&&runtime.callFunction("CAN_QUALIFY",[])==1){	
    		
    	runtime.callFunction("QUALIFY",localVars.next);
    	enter=0;
    }		
    */

    //quite aqui para michael

    /*
    if(enter==1&&runtime.callFunction("CAN_SHOW_MYADS","")==1){
    	runtime.callFunction("SHOW_MYADS",localVars.next);
    	enter=0;		
    		
    }
    */
    if (enter == 1) {

      runtime.goToLayout(localVars.next);

    }





  },

  async Game_Event102(runtime, localVars) {

    var enter = 1;

    //quite aqui para michael
    /*
    if(enter==1&&runtime.callFunction("CAN_QUALIFY",[])==1){	
    		
    	runtime.callFunction("QUALIFY",localVars.next);
    	enter=0;
    }		
    
    if(enter==1&&runtime.callFunction("CAN_SHOW_INTER",0)==1){
    
    	runtime.callFunction("SHOW_INTER",1,localVars.next);
    	enter=0;
    }*/

    /*
    
    if(enter==1&&runtime.callFunction("CAN_SHOW_MYADS","")==1){
    	runtime.callFunction("SHOW_MYADS",localVars.next);
    	enter=0;		
    		
    }
    */
    if (enter == 1) {

      runtime.goToLayout(localVars.next);

    }





  },

  async Rec__Event2(runtime, localVars) {
    window.rec = new Array();
    window.rec_time = 0;

  },

  async Rec__Event4(runtime, localVars) {
    rec[rec.length] = {
      x: Number(localVars.x_.toFixed(2)),
      y: Number(localVars.y_.toFixed(2)),
      angle: Number(localVars.angle_.toFixed(2)),
      time: rec_time
    }
    rec_time += runtime.dt;
  },

  async Rec__Event8(runtime, localVars) {

  },

  async Rec__Event9(runtime, localVars) {
    window.replay = rec;
    window.replay_step = 0;
    window.replay_time = 0;
    console.log(123123)
    window.replay = JSON.parse(window.replay);
    //console.log(window.replay);
  },

  async Rec__Event12(runtime, localVars) {
    var box = runtime.objects.box.getFirstPickedInstance();
    if (replay.length > replay_step) {

      while (replay[replay_step].time < replay_time && replay.length > replay_step) {
        replay_step++;
      }
      box.x = replay[replay_step].x;
      box.y = replay[replay_step].y;
      box.angle = replay[replay_step].angle * Math.PI / 180;

    } else {

      console.log("end");
      runtime.callFunction("end_replay", []);
    }
    replay_step++;
    replay_time += runtime.dt;
  },

  async Ajax__Event4(runtime, localVars) {


    var iframe = document.getElementById('ranking');

    // Define los datos que deseas enviar
    var datos = {
      tabla: localVars.data,
      id: localVars.tag_
    };
    //alert(iframe.src)
    // Envía los datos al iframe
    iframe.contentWindow.postMessage(datos, iframe.src);
  }

};

self.C3.ScriptsInEvents = scriptsInEvents;