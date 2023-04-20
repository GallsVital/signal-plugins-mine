
export function Name() { return "Govee"; }
export function Version() { return "1.0.0"; }
export function Type() { return "network"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [22, 1]; }
export function DefaultPosition() {return [75, 70]; }
export function DefaultScale(){return 8.0;}
/* global
controller:readonly
TurnOffOnShutdown:readonly
*/
export function ControllableParameters() {
	return [
		//{"property":"AutoStartStream", "group":"settings", "label":"Automatically Start Stream", "type":"boolean", "default":"false"},
		{"property":"TurnOffOnShutdown", "group":"settings", "label":"Turn off on App Exit", "type":"boolean", "default":"false"},
	];
}

let govee;
let ledCount = 4;
const ledNames = [];
const ledPositions = [];

// todo - poll for device updates
// todo - make leds paintable

export function Initialize(){
	device.addFeature("udp");
	device.addFeature("base64");

	device.log(JSON.stringify(controller));
	device.log(controller.ip);
	device.log(controller.sku);
	device.setName(controller.sku);

	if(GoveeDeviceLibrary.hasOwnProperty(controller.sku)){
		const GoveeDeviceInfo = GoveeDeviceLibrary[controller.sku];
		device.setName(`Govee ${GoveeDeviceInfo.name}`);
		ledCount = GoveeDeviceInfo.ledCount;
	}else{
		device.log("Using Default Layout...");
		device.setName(`Govee: ${controller.sku}`);
		ledCount = 4;
	}

	CreateLedMap();
	device.setControllableLeds(ledNames, ledPositions);

	govee = new GoveeProtocol(controller.ip);
	govee.setDeviceState(true);
	govee.SetRazerMode(true);
}

export function Render(){
	const RGBData = new Array(ledCount * 3);

	for(let i = 0 ; i < ledPositions.length; i++){
		const ledPosition = ledPositions[i];

		const color = device.color(ledPosition[0], ledPosition[1]);
		RGBData[i * 3] = color[0];
		RGBData[i * 3 + 1] = color[1];
		RGBData[i * 3 + 2] = color[2];
	}

	govee.SendRGB(RGBData);
	device.pause(10);
}

export function Shutdown(suspend){
	govee.SetRazerMode(false);

	if(TurnOffOnShutdown){
		govee.setDeviceState(false);
	}
}

function CreateLedMap(){
	ledNames.length = 0;
	ledPositions.length = 0;

	for(let i = 0; i < ledCount; i++){
		ledNames.push(`Led ${i + 1}`);
		ledPositions.push([i, 0]);
	}
}

const GoveeDeviceLibrary = {
	"H619Z": {
		ledCount: 12,
		name: "RGBIC Pro Strip Lights"
	},
	"H6062": {
		ledCount: 4,
		name: "Glide Wall Light"
	}
};

export function DiscoveryService() {
	//this.IconUrl = "";

	this.Initialize = function(){
		service.log("Initializing Plugin!");
		service.log("Searching for network devices...");
		this.CheckForDevices();
	};

	this.UdpBroadcastPort = 4001;
	this.UdpBroadcastAddress = "239.255.255.250";
	this.UdpListenPort = 4002;


	this.lastPollTime = 0;
	this.PollInterval = 60000;

	this.CheckForDevices = function(){
		if(Date.now() - discovery.lastPollTime < discovery.PollInterval){
			return;
		}

		this.lastPollTime = Date.now();
		service.log("Broadcasting device scan...");
		service.broadcast(JSON.stringify({
			msg: {
				cmd: "scan",
				data: {
					account_topic: "reserve",
				},
			}
		}));
	};

	this.Update = function(){
		for(const cont of service.controllers){
			cont.obj.update();
		}

		this.CheckForDevices();
	};

	this.Shutdown = function(){

	};

	this.Discovered = function(value) {
		service.log(value);

		const controller = service.getController(value.id);

		if (controller === undefined) {
			service.addController(new GoveeController(value));
		} else {
			controller.updateWithValue(value);
		}

	};

	this.Removal = function(value){

	};
}

class GoveeController{
	constructor(value){
		this.id = value.id;
		this.port = value.port;

		const response = JSON.parse(value.response).msg.data;

		//service.log(response);

		this.ip = response.ip;
		this.name = response.sku;

		if(GoveeDeviceLibrary.hasOwnProperty(response.sku)){
			const GoveeDeviceInfo = GoveeDeviceLibrary[response.sku];
			this.name = GoveeDeviceInfo.name;
		}

		this.device = response.device;
		this.sku = response.sku;
		this.bleVersionHard = response.bleVersionHard;
		this.bleVersionSoft = response.bleVersionSoft;
		this.wifiVersionHard = response.wifiVersionHard;
		this.wifiVersionSoft = response.wifiVersionSoft;
		this.initialized = false;


		this.DumpControllerInfo();
	}

	DumpControllerInfo(){
		service.log(`id: ${this.id}`);
		service.log(`port: ${this.port}`);
		service.log(`ip: ${this.ip}`);
		service.log(`device: ${this.device}`);
		service.log(`sku: ${this.sku}`);
		service.log(`bleVersionHard: ${this.bleVersionHard}`);
		service.log(`bleVersionSoft: ${this.bleVersionSoft}`);
		service.log(`wifiVersionHard: ${this.wifiVersionHard}`);
		service.log(`wifiVersionSoft: ${this.wifiVersionSoft}`);
	}

	updateWithValue(value){
		this.id = value.id;
		this.port = value.port;

		const response = JSON.parse(value.response).msg.data;

		this.ip = response.ip;
		this.device = response.device;
		this.sku = response.sku;
		this.bleVersionHard = response.bleVersionHard;
		this.bleVersionSoft = response.bleVersionSoft;
		this.wifiVersionHard = response.wifiVersionHard;
		this.wifiVersionSoft = response.wifiVersionSoft;
		service.updateController(this);
	}

	update(){
		if(!this.initialized){
			this.initialized = true;
			service.updateController(this);
			service.announceController(this);
		}
	}
}


//{\"msg\":{\"cmd\":\"razer\",\"data\":{\"pt\":\"uwABsQAL\"}}}

class GoveeProtocol{
	constructor(ip){
		this.ip = ip;
		this.port = 4003;
	}
	static EncodeBase64(string){
		return string.toString('base64');
	}

	setDeviceState(on){
		udp.send(this.ip, this.port, {
			"msg": {
				"cmd": "turn",
				"data": {
					"value": on
				}
			}
		});
	}

	SetRazerMode(enable){
		const command = base64.Encode([0xBB, 0x00, 0x01, 0xB1, 0x00, enable ? 0x0A : 0x0B, 0x00]); // disable
		// device.log(command);
		udp.send(this.ip, this.port, {
			msg: {
				cmd: "razer",
				data: {
					pt: enable ? "uwABsQEK" : "uwABsQAL"
				}
			}
		});
	}

	SendRGB(RGBData){
		const packet = [0xBB, 0x00, 0x0E, 0xB0, 0x01, Math.floor(RGBData.length / 3)].concat(RGBData);
		packet.push(0);

		const command = base64.Encode(packet);
		//device.log(command);

		const ret = udp.send(this.ip, this.port, JSON.stringify({
			msg: {
				cmd: "razer",
				data: {
					pt: command,
				},
			},
		}));

	}
}