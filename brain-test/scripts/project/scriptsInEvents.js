var ad1 = null;
window.showAd1 = function(){
	destroyAd1();
	ad1 = document.createElement('div');
    // we make it ignore any standard positioning
	ad1.style.position = 'absolute';
	ad1.setAttribute('id', 'q7');	
	// position it here, 50% is in the center
	ad1.style.left = '50%';
	// 25% is close to the bottom
	ad1.style.bottom = '2%';
	// potential padding
	ad1.style.paddingBottom = '2px';
	// put the pivot of the ad in the center
	ad1.style.transform = 'translate(-50%, -50%)';
	document.body.appendChild(ad1);
	PokiSDK.displayAd(ad1, '728x90');
}
window.showAd2 = function(){
	destroyAd1();
	ad1 = document.createElement('div');
    // we make it ignore any standard positioning
	ad1.style.position = 'absolute';
	ad1.setAttribute('id', 'q7');
	// position it here, 50% is in the center
	ad1.style.left = '50%';
	// 25% is close to the bottom
	ad1.style.bottom = '33%';
	ad1.style.marginTop = "0";
	// potential padding
	ad1.style.paddingBottom = '2px';
	// put the pivot of the ad in the center
	ad1.style.transform = 'translate(-50%, -50%)';	
	document.body.appendChild(ad1);
	PokiSDK.displayAd(ad1, '320x50');
}

window.showAd3 = function(){
	destroyAd1();
	ad1 = document.createElement('div');
    // we make it ignore any standard positioning
	ad1.style.position = 'absolute';
	ad1.setAttribute('id', 'q7');
	// position it here, 50% is in the center
	ad1.style.left = '50%';
	// 25% is close to the bottom
	ad1.style.bottom = "0";
     ad1.style.marginTop = "-20%";
	// potential padding
	ad1.style.paddingBottom = '2px';
	// put the pivot of the ad in the center
	ad1.style.transform = 'translate(-50%, -50%)';	
	document.body.appendChild(ad1);
	PokiSDK.displayAd(ad1, '320x50');
}


window.setPositionLandscape=function(){
	if(ad1){
	 ad1.style.bottom = "0";
     ad1.style.marginTop = "-20%";
	}
}

window.setPositionPortrait=function(){
	if(ad1){
	ad1.style.bottom = "15%";
	ad1.style.marginTop = "0";
	}
}

window.destroyAd1 = function(){
	if(ad1){
		PokiSDK.destroyAd(ad1);
		ad1 = null;
	}
}









const scriptsInEvents = {

		async Globalevent_Event17_Act2(runtime, localVars)
		{
			window.destroyAd1();
		},

		async Globalevent_Event18_Act2(runtime, localVars)
		{
			PokiSDK.happyTime(1.0);
		},

		async Globalevent_Event18_Act11(runtime, localVars)
		{
			PokiSDK.gameplayStop();
		},

		async Globalevent_Event18_Act12(runtime, localVars)
		{
			PokiSDK.customEvent('Brain Test', 'level_end', { segment: ''+runtime.globalVars.level });
		},

		async Globalevent_Event20_Act1(runtime, localVars)
		{
			window.showAd2();
			window.setPositionPortrait();
		},

		async Globalevent_Event21_Act1(runtime, localVars)
		{
			window.showAd3();
			window.setPositionLandscape();
		},

		async Globalevent_Event23_Act1(runtime, localVars)
		{
			window.showAd3();
			
		},

		async Globalevent_Event24_Act1(runtime, localVars)
		{
			window.showAd1();
		},

		async Globalevent_Event30_Act8(runtime, localVars)
		{
			PokiSDK.gameplayStop();
		},

		async Globalevent_Event36_Act1(runtime, localVars)
		{
			PokiSDK.customEvent('Brain Test', 'skip_level', { segment: ''+runtime.globalVars.level });
		},

		async Globalevent_Event41_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Globalevent_Event56_Act4(runtime, localVars)
		{
			PokiSDK.gameplayStop();
		},

		async Globalevent_Event60_Act3(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Globalevent_Event68_Act1(runtime, localVars)
		{
			  PokiSDK.commercialBreak()
			   .then(() => {
			   runtime.callFunction("pokiCommercialC"); 
			   runtime.callFunction("unpauseGame");
			   
			   });
		},

		async Globalevent_Event70_Act1(runtime, localVars)
		{
			  PokiSDK.commercialBreak()
			   .then(() => {
			   runtime.callFunction("pokiCommercial"); 
			   runtime.callFunction("unpauseGame");
			   PokiSDK.gameplayStart();
			   });
		},

		async Globalevent_Event85_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStop();
		},

		async Globalevent_Event88_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStop();
		},

		async Globalevent_Event89_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStop();
		},

		async Globalevent_Event93_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStop();
		},

		async Globalevent_Event100_Act5(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Globalevent_Event102_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Globalevent_Event105_Act1(runtime, localVars)
		{
			 PokiSDK.rewardedBreak().then(
			 
			        (withReward) => {
			            if(withReward){
			               
			                //resume game
							runtime.callFunction("rewardedSuccessful");
							PokiSDK.gameplayStart();
			            }else{
						runtime.callFunction("unpauseGame");
						PokiSDK.gameplayStart();
						}
			        }
			
			    )
		},

		async Globalevent_Event106_Act1(runtime, localVars)
		{
			 PokiSDK.rewardedBreak().then(
			 
			        (withReward) => {
			            if(withReward){
			               
			                //resume game
							runtime.callFunction("rewardedSuccessful");
							runtime.callFunction("hintAfterRewarded");
							PokiSDK.gameplayStart();
			            }else{
						
						runtime.callFunction("unpauseGame");	
						PokiSDK.gameplayStart();
						}
			        }
			
			    )
		},

		async Globalevent_Event107_Act3(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Globalevent_Event113_Act4(runtime, localVars)
		{
			PokiSDK.customEvent('Brain Test', 'level_start', { segment: ''+runtime.globalVars.level });
		},

		async Globalevent_Event122_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Levelselecte_Event21_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Levelselecte_Event37_Act4(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Starte_Event1_Act13(runtime, localVars)
		{
			PokiSDK.init().then(
			    () => {
			    }   
			).catch(
			    () => {    
			    }   
			);
		},

		async Starte_Event3_Act4(runtime, localVars)
		{
			  PokiSDK.commercialBreak()
			   .then(() => {
			   PokiSDK.gameplayStart();
			   });
		},

		async Settingse_Event5_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Levelselecte2_Event5_Act1(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Levelselecte2_Event10_Act4(runtime, localVars)
		{
			PokiSDK.gameplayStart();
		},

		async Loaderlayout_Event1_Act1(runtime, localVars)
		{
			PokiSDK.gameLoadingFinished();
		},

		async Loaderlayout_Event3_Act1(runtime, localVars)
		{
			PokiSDK.gameLoadingStart();
			
		}

};

self.C3.ScriptsInEvents = scriptsInEvents;

