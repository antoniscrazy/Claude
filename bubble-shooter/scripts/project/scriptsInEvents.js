


const scriptsInEvents = {

	async Gamesheet_Event228_Act1(runtime, localVars)
	{
		function hexToRgb(hex) {
		  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		  return result ? {
		    r: parseInt(result[1], 16),
		    g: parseInt(result[2], 16),
		    b: parseInt(result[3], 16)
		  } : null;
		}
		
		
		localVars.R = hexToRgb(localVars.vHexColor).r
		localVars.G = hexToRgb(localVars.vHexColor).g
		localVars.B = hexToRgb(localVars.vHexColor).b
	},

	async Generalsheet_Event29_Act1(runtime, localVars)
	{
		localVars.vResult =  new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(localVars.Value);
	}

};

self.C3.ScriptsInEvents = scriptsInEvents;

