export function Name() { return "Nanoleaf"; }
export function Version() { return "1.1.0"; }
export function Type() { return "network"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [48, 48]; }
export function DefaultPosition() {return [75, 70]; }
export function DefaultScale(){return 1.0;}
/* global
controller:readonly
*/

const BIG_ENDIAN = true;
let lightcount = 0;
/** @type {NanoLeafPanelInfo[] } */
let positions;
const ScaleFactor = 12;

class NanoleafDevice{
	constructor(controller){
		this.ip = controller.ip;
		this.key = controller.key;
		this.port = controller.port;
		this.streamingPort = 0;
		this.streamOpen = false;
		this.protocol = new NanoleafProtocol(controller);
		this.openAttempts = 0;
		this.MaxAttemptsToOpenStream = 5;
		this.config = {
			originalBrightness: 100,
			originalEffect: ""
		};
	}

	InitializeDevice(){
		device.log(`Fetching Current Hardware Config...`);

		const currentBrightness = this.protocol.GetBrightness();

		if(currentBrightness.value !== undefined){
			this.config.originalBrightness = currentBrightness.value;
		}else{
			device.log("Failed to read device brightness. Defaulting to 100...");
			this.config.originalBrightness = 100;
		}

		device.log(`Current Brightness: ${this.config.originalBrightness}`);

		const currentEffect = this.protocol.GetCurrentEffect();

		if(typeof currentEffect !== "string"){
			this.config.originalEffect = "Unknown";
		}else{
			this.config.originalEffect = currentEffect;
		}

		device.log(`Current Effect: ${this.config.originalEffect}`);

		this.protocol.SetBrightness(100);

		this.StartStream();
	}

	StartStream(){
		device.log(`Starting Stream with key: [${this.key}]`);

		const result = this.protocol.StartStreamV2();

		if(result){
			this.streamOpen = true;
			this.streamingPort = result.streamingPort;
		}

	}

	Shutdown(){
		device.log(`Setting device back to previous settings...`);
		device.log(`Orignal Brightness: ${this.config.originalBrightness}`);
		this.protocol.SetBrightness(this.config.originalBrightness);
		device.log(`Orignal Effect: ${this.config.originalEffect}`);
		this.protocol.SetCurrentEffect(this.config.originalEffect);
	}

	SendColorsv1(){
		const packet = [];
		packet[0] = lightcount;

		for(const [iIdx, lightinfo] of positions.entries()) {
			const startidx = 1 + (iIdx * 7);
			packet[startidx + 0] = lightinfo.panelId;
			packet[startidx + 1] = 1; // reserved

			const x = lightinfo.x / ScaleFactor;
			const y = lightinfo.y / ScaleFactor;
			const col = device.color(x, y);
			packet[startidx + 2] = col[0]; //r
			packet[startidx + 3] = col[1]; //g
			packet[startidx + 4] = col[2]; //b
			packet[startidx + 5] = 0; //w
			packet[startidx + 6] = 0; //transition time * 100ms
		}

		if (this.streamOpen) {
			udp.send(this.ip, this.streamingPort, packet, BIG_ENDIAN);
		}
	}

	SendColorsv2(){
		const packet = [];
		packet[0] = 0;
		packet[1] = lightcount;

		for(const [iIdx, lightinfo] of positions.entries()) {
			const startidx = 2 + (iIdx * 8);
			packet[startidx] = (lightinfo.panelId << 8) & 0xFF;
			packet[startidx + 1] = lightinfo.panelId & 0xFF; // reserved

			const x = lightinfo.x / ScaleFactor;
			const y = lightinfo.y / ScaleFactor;
			const col = device.color(x, y);
			packet[startidx + 2] = col[0]; //r
			packet[startidx + 3] = col[1]; //g
			packet[startidx + 4] = col[2]; //b
			packet[startidx + 5] = 0; //w
			packet[startidx + 6] = 0; //transition time * 100ms
			packet[startidx + 7] = 1;
		}

		if (this.streamOpen) {
			udp.send(this.ip, this.streamingPort, packet, BIG_ENDIAN);
		}
	}
}
class NanoleafProtocol{
	constructor(controller){
		this.ip = controller.ip;
		this.port = controller.port;
		this.key = controller.key;
		//device.log("Created stream w/key "+this.key);
	}

	StartStreamV1(){
		let output = {};
		XmlHttp.Put(`http://${this.ip}:${this.port}/api/v1/${this.key}/effects`, (xhr) => {
			//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);
			//device.log(`${xhr.response}`);

			if (xhr.readyState === 4 && xhr.status === 200) {
				const result = JSON.parse(xhr.response);
				output = result;
			}
		},
		{
			"write":{
				"command":"display",
				"animType":"extControl",
				"extControlVersion":"v1"
			}
		});

		return output;
	}
	StartStreamV2(){
		const instance = this;
		let output = {};
		XmlHttp.Put(`http://${this.ip}:${this.port}/api/v1/${this.key}/effects`, (xhr) => {
			if (xhr.readyState === 4 && xhr.status === 204) {
				output = {
					streamingAddress: instance.ip,
					streamingPort: 60222,
				};
			}
		},
		{
			"write":{
				"command":"display",
				"animType":"extControl",
				"extControlVersion":"v2"
			}
		});

		return output;
	}

	GetCurrentEffect(){
		let output = {error: true};
		XmlHttp.Get(`http://${this.ip}:${this.port}/api/v1/${this.key}/effects/select`, (xhr) => {
			if (xhr.readyState === 4) {
				//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);
				if(xhr.responseText) {
					output = JSON.parse(xhr.responseText);
				}else{
					device.log(`GetCurrentEffect(): Command Failed with status: ${xhr.status}`);
				}
			}
		});

		return output;
	}
	SetCurrentEffect(effectName){
		let output = false;
		device.log(`Setting current effect: ${effectName}`);

		XmlHttp.Put(`http://${this.ip}:${this.port}/api/v1/${this.key}/effects`, (xhr) => {
			//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);

			if (xhr.readyState === 4) {
				if(xhr.status === 204) {
					output = true;
				}else{
					device.log(`SetCurrentEffect(): Command Failed with status: ${xhr.status}`);
				}
			}
		},
		{
		  "select" : effectName
		});

		return output;
	}

	GetCurrentState(){
		let output = {error: true};
		XmlHttp.Get(`http://${this.ip}:${this.port}/api/v1/${this.key}/state`, (xhr) => {
			if (xhr.readyState === 4) {
				//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);
				if(xhr.responseText) {
					output = JSON.parse(xhr.responseText);
				}else{
					device.log(`GetCurrentState(): Command Failed with status: ${xhr.status}`);
				}
			}
		});

		return output;
	}
	GetCurrentOnOffState(){
		let output = {value: false};
		XmlHttp.Get(`http://${this.ip}:${this.port}/api/v1/${this.key}/state/on`, (xhr) => {
			if (xhr.readyState === 4) {
				//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);
				if(xhr.responseText) {
					output = JSON.parse(xhr.responseText);
				}else{
					device.log(`GetCurrentOnOffState(): Command Failed with status: ${xhr.status}`);
				}
			}
		});

		return output.value;
	}
	TurnOn(){
		let output = false;
		XmlHttp.Put(`http://${this.ip}:${this.port}/api/v1/${this.key}/state`, (xhr) => {
			if (xhr.readyState === 4) {
				//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);

				if(xhr.status === 204) {
					output = true;
				}else{
					device.log(`TurnOn(): Command Failed with status: ${xhr.status}`);
				}
			}
		},
		{"on" : {"value": true}}
		);

		return output;
	}
	TurnOff(){
		let output = false;
		XmlHttp.Put(`http://${this.ip}:${this.port}/api/v1/${this.key}/state`, (xhr) => {
			if (xhr.readyState === 4) {
				//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);

				if(xhr.status == 204) {
					output = true;
				}else{
					device.log(`TurnOff(): Command Failed with status: ${xhr.status}`);
				}
			}
		},
		{"on" : {"value": false}}
		);


		return output;
	}
	GetBrightness(){
		let output = {error: true};
		XmlHttp.Get(`http://${this.ip}:${this.port}/api/v1/${this.key}/state/brightness`, (xhr) => {
			if (xhr.readyState === 4) {

				if(xhr.responseText) {
					output = JSON.parse(xhr.responseText);
				}else{
					device.log(`GetBrightness(): Command Failed with status: ${xhr.status}`);
				}
			}
		});

		return output;
	}
	SetBrightness(brightness){
		let output = false;
		XmlHttp.Put(`http://${this.ip}:${this.port}/api/v1/${this.key}/state/brightness`, (xhr) => {
			//device.log(`State: ${xhr.readyState}, Status: ${xhr.status}`);

			if (xhr.readyState === 4){
				if(xhr.status === 204) {
					output = true;
				}else{
					device.log(`SetBrightness(): Command Failed with status: ${xhr.status}`);
				}
			}
		},
		{
		  "brightness" : {"value":brightness}
		});

		return output;
	}
}

/** @type {NanoleafDevice} */
let Nanoleaf;

export function Initialize() {
	device.setName(controller.name);

	device.addFeature("udp");

	lightcount = controller.panelinfo.panelLayout.layout.numPanels;
	positions = controller.panelinfo.panelLayout.layout.positionData;

	device.log("Obj host "+controller.hostname+":"+controller.port+"@"+controller.key);
	device.log("Number of lights: " + lightcount);

	NormalizeDeviceSize();

	Nanoleaf = new NanoleafDevice(controller);

	//device.log(Nanoleaf.protocol.GetBrightness().value);
	//device.log(Nanoleaf.protocol.SetBrightness(75));
	//device.log(Nanoleaf.protocol.GetCurrentOnOffState());
	//device.log(Nanoleaf.protocol.GetCurrentState());

	//device.log(Nanoleaf.protocol.SetCurrentEffect("Snowfall"));
	//device.log(["TurnOff", false, true, Nanoleaf.protocol.TurnOff()]); // fuckery...
	//device.log(Nanoleaf.protocol.TurnOff());
	//device.log(Nanoleaf.protocol.TurnOn());

	Nanoleaf.InitializeDevice();
}

function NormalizeDeviceSize(){
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	for(const panel of positions){
		minX = Math.min(minX, panel.x);
		minY = Math.min(minY, panel.y);
		maxX = Math.max(maxX, panel.x);
		maxY = Math.max(maxY, panel.y);
	}

	//device.log(`Nanoleaf Canvas TopLeft Point: {${minX},${minY}}.`);
	//device.log(`Nanoleaf Canvas BottomRight Point: {${maxX},${maxY}}.`);

	const size = [Math.ceil((maxX - minX) / ScaleFactor) + 1, Math.ceil((maxY - minY) / ScaleFactor) + 1];
	//device.log(`Scale Factor: ${ScaleFactor}, Ending Size ${size}`);
	device.setSize(size);
}


export function Render() {
	// TODO: Nanoleaf docs say to limit to 10fps?

	if(Nanoleaf.streamOpen){
		Nanoleaf.SendColorsv2();
	}else if(Nanoleaf.openAttempts < Nanoleaf.MaxAttemptsToOpenStream){
		Nanoleaf.openAttempts++;

		Nanoleaf.StartStream();
	}else{
		// Alert User....
		device.log(`Failed To Open Stream after ${Nanoleaf.openAttempts} Attempts! Aborting Rendering...`);
	}
}

// function Blackoutv1() {
// 	const packet = [];

// 	packet[0] = lightcount;

// 	for(const [iIdx, lightinfo] of positions.entries()) {

// 		const startidx = 1 + (iIdx * 7);
// 		packet[startidx + 0] = lightinfo.panelId;
// 		packet[startidx + 1] = 1; // reserved
// 		packet[startidx + 2] = 0; //r
// 		packet[startidx + 3] = 0; //g
// 		packet[startidx + 4] = 0; //b
// 		packet[startidx + 5] = 0; //w
// 		packet[startidx + 6] = 0; //transition time * 100ms
// 	}

// 	if (canStream) {
// 		udp.send(streamingAddress, streamingPort, packet, BIG_ENDIAN);
// 	}
// }

export function Shutdown(suspend) {
	if(suspend){
		//Blackoutv1();
		return;
	}

	Nanoleaf.Shutdown();

}

// -------------------------------------------<( Discovery Service )>--------------------------------------------------


export function DiscoveryService() {
	this.IconUrl = "https://marketplace.signalrgb.com/brands/products/nanoleaf/icon@2x.png";

	this.MDns = [
		"_nanoleafapi._tcp.local."
	];

	this.Initialize = function(){
		//service.log("Initializing plugin!");
		//const value = {"hostname":"Nanoleaf-Light-Panels-54-08-7B.local.", "id":"32:F1:DA:C3:5C:C4", "md":"NL22", "name":"Nanoleaf Light Panels 54:08:7B", "port":16021, "srcvers":"5.1.0"};

		//service.addController(new NanoleafBridge(value));
	};

	this.Update = function() {
		for(const cont of service.controllers){
			cont.obj.update();
		}

	};

	this.Discovered = function(value) {
		service.log(value);

		const controller = service.getController(value.id);

		if (controller === undefined) {
			service.addController(new NanoleafBridge(value));
		} else {
			controller.updateWithValue(value);
		}
	};

	this.Interface = function() {
		return `
    Item {
      anchors.fill: parent
      Column{
        width: parent.width
        height: parent.height

        Repeater {
          model: service.controllers          
          delegate: Item {
            width: 300
            height: 250
            Rectangle {
              width: parent.width
              height: parent.height - 10
              color: "#3baf29"
              radius: 5
            }
            Image {
              x: 10
              y: 10
              height: 50                
              source: "https://marketplace.signalrgb.com/brands/products/nanoleaf/dark_logo.png"
              fillMode: Image.PreserveAspectFit
              antialiasing: true
              mipmap:true
            }
            Column {
              x: 10
              y: 80
              width: parent.width - 20
              spacing: 10
              
              Text{
                color: theme.primarytextcolor
                text: model.modelData.obj.name
                font.pixelSize: 16
                font.family: "Poppins"
                font.bold: true
              }
              Text{
                color: theme.primarytextcolor
                text: "Id: " + model.modelData.obj.id
              }
              Text{
                color: theme.primarytextcolor
                text: "Firmware v"+model.modelData.obj.firmwareVersion
              }    
              Item{
                Rectangle {
                  width: parent.width
                  height: parent.height
                  color: "#22ffffff"
                  radius: 5
                }
                width: parent.width
                height: 50
                Text{
                  x: 10
                  height: parent.height
                  verticalAlignment: Text.AlignVCenter
                  color: theme.primarytextcolor
                  text: (model.modelData.obj.connected === true) ? "Linked" : (model.modelData.obj.waitingforlink === true) ? "Waiting For Link..."+model.modelData.obj.retriesleft : "Not Linked"
                }
                ToolButton {        
                  height: 50
                  width: 120
                  anchors.verticalCenter: parent.verticalCenter
                  font.family: "Poppins"
                  font.bold: true 
                  visible: !model.modelData.obj.connected && !model.modelData.obj.waitingforlink  
                  text: "Link"
                  anchors.right: parent.right
                  onClicked: {
                    model.modelData.obj.startLink();
                  }
                }
                BusyIndicator {
                  y: 10
                  height: 30
                  width: parent.height
                  Material.accent: "#88FFFFFF"
                  anchors.right: parent.right
                  visible: model.modelData.obj.waitingforlink === true
                }

              }          
            }
            
          }  
        }
      }
    }`;
	};
}


class NanoleafBridge {
	constructor(value){
		this.updateWithValue(value);

		this.key = service.getSetting(this.id, "key");
		this.connected = this.key != "";
		this.retriesleft = 40;
		this.ip = "";
		this.deviceCreated = false;
		this.panelinfo = {};

		service.log("Constructed: "+this.name);

		this.ResolveIpAddress();
	}

	updateWithValue(value) {
		this.hostname = value.hostname;
		this.name = value.name;
		this.port = value.port;
		this.firmwareVersion = value.srcvers;
		this.model = value.md;
		this.id = value.id;
		service.log("Updated: "+this.name);
		service.updateController(this);
	}

	ResolveIpAddress(){
		service.log("Attempting to resolve IPV4 address...");

		const instance = this;
		service.resolve(this.hostname, (host) => {
			if(host.protocol === "IPV4"){
				instance.ip = host.ip;
				service.log(`Found IPV4 address: ${host.ip}`);

				//service.saveSetting(instance.id, "ip", instance.ip);
				//instance.RequestBridgeConfig();
				if (instance.connected && !this.panelinfo){
					instance.getClusterInfo();
				}

				service.updateController(instance); //notify ui.
			}else if(host.protocol === "IPV6"){
				service.log(`Skipping IPV6 address: ${host.ip}`);
			}else{
				service.log(`unknown IP config: [${JSON.stringify(host)}]`);
			}

			//service.log(host);
		});
	}

	update() {
		if (this.waitingforlink){
			this.retriesleft--;
			this.makeRequest();

			//service.log("Waiting for key from: "+ this.name+"...");
			if (this.retriesleft <= 0) {
				this.waitingforlink = false;
			}

			service.updateController(this);
		}
	}

	setKey(response) {
		service.log("Setting key: "+response.auth_token);

		// Save token.
		this.key = response.auth_token;
		service.saveSetting(this.id, "key", this.key);

		this.retriesleft = 0;
		this.waitingforlink = 0;
		this.connected = true;
		service.updateController(this);
		this.getClusterInfo();
	}

	getClusterInfo() {
		const instance = this;
		service.log(`Requesting Panel Info...`);
		service.log(`http://${this.ip}:${this.port}/api/v1/${this.key}/`);
		XmlHttp.Get(`http://${this.ip}:${this.port}/api/v1/${this.key}/`, (xhr) => {
			service.log(`getClusterInfo(): State: ${xhr.readyState}, Status: ${xhr.status}`);

			if (xhr.readyState === 4 && xhr.status === 200) {
				instance.setDetails(JSON.parse(xhr.response));
			}
		});
		service.log(`Panel Info Grabbed`);

	}

	makeRequest(){
		const instance = this;
		XmlHttp.Post(`http://${this.ip}:${this.port}/api/v1/new`, (xhr) => {
			service.log(`Make Request: State: ${xhr.readyState}, Status: ${xhr.status}`);

			if (xhr.readyState === 4 && xhr.status === 200) {
				instance.setKey(JSON.parse(xhr.response));
			}
		},
		{/* No Data*/});
	}

	setDetails(response) {

		// Capture panel and light information.
		this.panelinfo = response;
		service.log(this.panelinfo);

		service.updateController(this);
		//service.log("DEETS: "+JSON.stringify(response));

		// Instantiate device in SignalRGB, and pass 'this' object to device.
		if(!this.deviceCreated){
			this.deviceCreated = true;
			service.announceController(this);
		}
	}

	startLink() {
		//service.log("Pushlink test for "+this.name);
		this.retriesleft = 40;
		this.waitingforlink = true; //pretend we're connected.

		service.updateController(this); //notify ui.
	}
}


// Swiper no XMLHttpRequest boilerplate!
class XmlHttp{
	static Get(url, callback){
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send();
	}

	static Post(url, callback, data){
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url, false);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send(JSON.stringify(data));
	}
	static Delete(url, callback, data){
		const xhr = new XMLHttpRequest();
		xhr.open("DELETE", url, false);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send(JSON.stringify(data));
	}

	static Put(url, callback, data){
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url, false);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send(JSON.stringify(data));
	}
}