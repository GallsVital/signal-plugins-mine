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

const BIG_ENDIAN = 1;
let canStream = false;
let streamRetries = 0;
const MaxAttemptsToOpenStream = 5;
let streamingAddress = "";
let streamingPort = "";
let lightcount = 0;
/** @type {NanoLeafPanelInfo[] } */
let positions;
let stream = undefined;
const ScaleFactor = 12;

class NanoleafStream {
	constructor(value){
		this.hostname = value.hostname;
		this.port = value.port;
		this.key = value.key;
		device.log("Created stream w/key "+this.key);
	}

	getClusterInfo() {
		const instance = this;

		const xhr = new XMLHttpRequest();
		xhr.open("GET", `http://${this.hostname}:${this.port}/api/v1/${this.key}/`, false);
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send();

		device.log("Res: " + xhr.responseText);
	}

	startStream() {
		const instance = this;

		const xhr = new XMLHttpRequest();
		xhr.open("PUT", `http://${this.hostname}:${this.port}/api/v1/${this.key}/effects`, false);
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		const request = {
			"write":{
				"command":"display",
				"animType":"extControl",
				"extControlVersion":"v1"
			}
		};
		device.log(`Requesting Stream Start for ${this.hostname}:${this.port}`);
		xhr.send(JSON.stringify(request));

		device.log("Status: "+xhr.status);
		device.log("Res: " + xhr.response);

		if (xhr.status === 200) {
			const result = JSON.parse(xhr.response);
			streamingAddress = result.streamControlIpAddr;
			streamingPort = result.streamControlPort;
			canStream = true;
		}else{
			device.log(`Failed to Start Stream! Status: ${xhr.status}`);
		}
	}
}


export function Initialize() {
	device.setName(controller.name);

	device.addFeature("udp");

	lightcount = controller.panelinfo.panelLayout.layout.numPanels;
	positions = controller.panelinfo.panelLayout.layout.positionData;

	device.log("Obj host "+controller.hostname+":"+controller.port+"@"+controller.key);
	device.log("Number of lights: " + lightcount);

	NormalizeDeviceSize();
	//DumpPanelInfo();

	stream = new NanoleafStream(controller);
	stream.startStream();
}

function DumpPanelInfo(){
	for(const panel of positions){
		device.log(panel);
	}
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

	const size = [Math.ceil((maxX - minX) / ScaleFactor), Math.ceil((maxY - minY) / ScaleFactor)];
	//device.log(`Scale Factor: ${ScaleFactor}, Ending Size ${size}`);
	device.setSize(size);
}


export function Render() {

	if(canStream){
		SendColors();
	}else if(streamRetries < MaxAttemptsToOpenStream){
		streamRetries++;
		stream.startStream();
	}else{
		// Alert User....
		device.log(`Failed To Open Stream after ${streamRetries} Attempts! Aborting Rendering...`);
	}
}

function SendColors(){
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

	if (canStream) {
		udp.send(streamingAddress, streamingPort, packet, BIG_ENDIAN);
	}
}

function Blackout() {
	const packet = [];

	packet[0] = lightcount;

	for(const [iIdx, lightinfo] of positions.entries()) {

		const startidx = 1 + (iIdx * 7);
		packet[startidx + 0] = lightinfo.panelId;
		packet[startidx + 1] = 1; // reserved
		packet[startidx + 2] = 0; //r
		packet[startidx + 3] = 0; //g
		packet[startidx + 4] = 0; //b
		packet[startidx + 5] = 0; //w
		packet[startidx + 6] = 0; //transition time * 100ms
	}

	if (canStream) {
		udp.send(streamingAddress, streamingPort, packet, BIG_ENDIAN);
	}
}


export function Shutdown() {
	Blackout();
}

// -------------------------------------------<( Discovery Service )>--------------------------------------------------


export function DiscoveryService() {
	this.IconUrl = "https://marketplace.signalrgb.com/brands/products/nanoleaf/icon@2x.png";

	this.MDns = [
		"_nanoleafapi._tcp.local."
	];

	this.Initialize = function(){
		//service.log("Initializing plugin!");

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
		this.hostname = value.hostname;
		this.name = value.name;
		this.port = value.port;
		this.firmwareVersion = value.srcvers;
		this.model = value.md;
		this.id = value.id;
		this.key = service.getSetting(this.id, "key");
		this.connected = this.key != "";
		this.retriesleft = 40;

		service.log("Constructed: "+this.name);

		if (this.connected){
			this.getClusterInfo();
		}
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

		const xhr = new XMLHttpRequest();
		xhr.open("GET", 'http://'+this.hostname+':'+this.port+'/api/v1/'+this.key+'/');
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200){
					instance.setDetails(JSON.parse(xhr.response));
				}
			}
		};

		xhr.send();
	}

	makeRequest(){
		const instance = this;

		const xhr = new XMLHttpRequest();
		xhr.open("POST", 'http://'+this.hostname+':'+this.port+'/api/v1/new');
		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = function () {
			service.log(`Make Request: State: ${xhr.readyState}, Status: ${xhr.status}`);

			if (xhr.readyState === 4) {
				if (xhr.status === 200){
					instance.setKey(JSON.parse(xhr.response));
				}
			}
		};

		xhr.send();
	}


	setDetails(response) {
		// Capture panel and light information.
		this.panelinfo = response;
		service.updateController(this);
		//service.log("DEETS: "+JSON.stringify(response));

		// Instantiate device in SignalRGB, and pass 'this' object to device.
		service.announceController(this);
	}


	startLink() {
		//service.log("Pushlink test for "+this.name);
		this.retriesleft = 40;
		this.waitingforlink = true; //pretend we're connected.

		service.updateController(this); //notify ui.
	}
}