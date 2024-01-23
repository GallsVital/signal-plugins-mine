export function Name() { return "Razer Nommo Pro"; }
export function VendorId() { return 0x1532; }
export function ProductId() { return 0x0518; }
export function Publisher() { return "WhirlwindFX"; }
export function Documentation(){ return "troubleshooting/razer"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [100, 60];}
export function DefaultScale(){return 1.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
	];
}

const Nommo = {
	Speaker_Left : {
		devicename: "Left Speaker",
		deviceid: 0,
		devicecrc: 16,
		lednames: ["Left 1", "Left 2", "Left 3", "Left 4", "Left 5", "Left 6", "Left 7", "Left 8"],
		ledpos:	[[2, 3], [3, 2], [3, 1], [2, 0], [1, 0], [0, 1], [0, 2], [1, 3]],
		width: 4,
		height: 4,
		//image: Image()
	},
	Speaker_Right : {
		devicename: "Right Speaker",
		deviceid: 1,
		devicecrc: 17,
		lednames: ["Right 1", "Right 2", "Right 3", "Right 4", "Right 5", "Right 6", "Right 7", "Right 8"],
		ledpos:	[[2, 3], [3, 2], [3, 1], [2, 0], [1, 0], [0, 1], [0, 2], [1, 3]],
		width: 4,
		height: 4,
		//image: Image()
	}
};

export function Initialize() {
	device.createSubdevice("LeftSpeaker");
	device.setSubdeviceName("LeftSpeaker", `${Nommo.Speaker_Left.devicename}`);
	//device.setSubdeviceImage("LeftSpeaker", Nommo.Speaker_Left.image);
	device.setSubdeviceSize("LeftSpeaker", Nommo.Speaker_Left.width, Nommo.Speaker_Left.height);
	device.setSubdeviceLeds("LeftSpeaker", Nommo.Speaker_Left.lednames, Nommo.Speaker_Left.ledpos);

	device.createSubdevice("RightSpeaker");
	device.setSubdeviceName("RightSpeaker", `${Nommo.Speaker_Right.devicename}`);
	//device.setSubdeviceImage("RightSpeaker", Nommo.Speaker_Right.image); //Something something fix this later
	device.setSubdeviceSize("RightSpeaker", Nommo.Speaker_Right.width, Nommo.Speaker_Right.height);
	device.setSubdeviceLeds("RightSpeaker", Nommo.Speaker_Right.lednames, Nommo.Speaker_Right.ledpos);
}

export function Render() {
	sendColors();
}

export function Shutdown() {
	sendColors(true);
}

function sendColors(shutdown = false) {
	const packet = [];

	packet[2] = 0x1F;
	packet[6] = 0x1D;
	packet[7] = 0x0F;
	packet[8] = 0x03;
	packet[13] = 0x07;

	for(let iIdx = 0; iIdx < Object.keys(Nommo).length; iIdx++){
		const Speaker = Object.values(Nommo)[iIdx];

		for(let i = 0; i < Object.values(Nommo)[iIdx].ledpos.length; i++){
			const iPxX = Speaker.ledpos[i][0];
			const iPxY = Speaker.ledpos[i][1];
			var col;

			if(shutdown){
				col = hexToRgb(shutdownColor);
			}else if (LightingMode === "Forced") {
				col = hexToRgb(forcedColor);
			}else{
				if(iIdx == 0){
					col = device.subdeviceColor("LeftSpeaker", iPxX, iPxY);
				}else{
					col = device.subdeviceColor("RightSpeaker", iPxX, iPxY);
				}
			}

			const iLedIdx = (i*3) + 14;

			packet[iLedIdx] = col[0];
			packet[iLedIdx+1] = col[1];
			packet[iLedIdx+2] = col[2];
		}

		packet[11] = Speaker.deviceid;
		packet[89] = Speaker.devicecrc;
		device.send_report(packet, 91);
		device.pause(1);
	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.interface === 1 && endpoint.usage === 0x0003 && endpoint.usage_page === 0x0001 && endpoint.collection === 0x0000;
	//return endpoint.interface === 0 && endpoint.usage === 0x0001 && endpoint.usage_page === 0x000c && endpoint.collection === 0x0001;
	//return endpoint.interface === 0 && endpoint.usage === 0x0000 && endpoint.usage_page === 0x0001 && endpoint.collection === 0x0002;
}

export function ImageUrl() {
	return "https://assets.signalrgb.com/devices/brands/razer/audio/nommo-pro.png";
}