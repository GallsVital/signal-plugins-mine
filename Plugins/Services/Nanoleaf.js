export function Name() { return "Nanoleaf"; }
export function Version() { return "1.1.0"; }
export function Type() { return "network"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [48, 48]; }
export function DefaultPosition() {return [75, 70]; }
export function DefaultScale(){return 1.0;}
/* global
controller:readonly
turnOffOnShutdown:readonly
*/
export function ControllableParameters() {
	return [
		{"property":"turnOffOnShutdown", "group":"settings", "label":"Turn Panels off on Shutdown", "type":"boolean", "default":"false"},
	];
}
const BIG_ENDIAN = true;
/** @type {NanoleafDevice} */
let Nanoleaf;
let lastUpdateTime = Date.now();


export function Initialize() {
	device.setName(controller.name);

	device.addFeature("udp");

	device.log("Obj host "+controller.hostname+":"+controller.port+"@"+controller.key);

	Nanoleaf = new NanoleafDevice(controller);

	Nanoleaf.ExtractPanelInformation(controller.panelinfo);
	Nanoleaf.InitializeDevice();
}


export function Render() {

	if(Nanoleaf.streamOpen){
		// Gen 1 Panels require a frame rate limiter.
		if(!Nanoleaf.isGen1){
			Nanoleaf.SendColorsv2();
		}else if(lastUpdateTime < Date.now() - 50){
			Nanoleaf.SendColorsv2();
			lastUpdateTime = Date.now();
		}

	}else if(Nanoleaf.openAttempts < Nanoleaf.MaxAttemptsToOpenStream){
		Nanoleaf.openAttempts++;

		Nanoleaf.StartStream();
	}else{
		// Alert User....
		device.log(`Failed To Open Stream after ${Nanoleaf.openAttempts} Attempts! Aborting Rendering...`);
	}
}

export function Shutdown(suspend) {

	// if(suspend){
	// 	//Blackoutv1();
	// 	return;
	// }
	Nanoleaf.streamOpen = false;

	Nanoleaf.Shutdown();

	if(turnOffOnShutdown){
		Nanoleaf.protocol.TurnOff();
	}
}

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
		this.ScaleFactor = 12;
		this.lightCount = 0;
		/** @type {NanoLeafPanelInfo[]} */
		this.panels = [];
		this.effectList = [];
		this.firmwareVerion = "0.0.0";
		this.isGen1 = false;
		this.ledNames = [];
		this.ledPositions = [];
	}

	NormalizeDeviceSize(){
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for(const panel of this.panels){
			// if(panel.panelId === 0){
			// 	continue;
			// }

			minX = Math.min(minX, panel.x);
			minY = Math.min(minY, panel.y);
			maxX = Math.max(maxX, panel.x);
			maxY = Math.max(maxY, panel.y);
		}

		//device.log(`Nanoleaf Canvas TopLeft Point: {${minX},${minY}}.`);
		//device.log(`Nanoleaf Canvas BottomRight Point: {${maxX},${maxY}}.`);

		const size = [Math.ceil((maxX) / this.ScaleFactor) + 1, Math.ceil((maxY) / this.ScaleFactor) + 1];
		device.log(`Scale Factor: ${this.ScaleFactor}, Ending Size ${size}`);
		device.setSize(size);
	}

	ExtractPanelInformation(panelConfig){
		this.lightCount = panelConfig.panelLayout.layout.numPanels;
		device.log("Number of lights: " + this.lightCount);

		this.panels = panelConfig.panelLayout.layout.positionData;

		this.firmwareVerion = panelConfig.firmwareVersion;
		device.log(`Controller Firmware Version: ${this.firmwareVerion}`);

		// FPS on Gen 1 panels (firmware < 6.5.1) should be limited to 10fps according to docs.
		// Not throttling fps gives periodic soft locks for 3-5 seconds.
		if(Semver.isLessThan(this.firmwareVerion, "6.5.1")){
			device.log(`Panels with firmware lower than 6.5.1 have limited frame rate.`);
			this.isGen1 = true;
		}

		this.NormalizeDeviceSize();

		this.ledNames = [];
		this.ledPositions = [];

		for(const panel of this.panels){
			// Skip controller
			if(panel.panelId === 0){
				continue;
			}

			this.ledNames.push(`Panel: ${panel.panelId.toString()}`);
			this.ledPositions.push([Math.floor(panel.x / this.ScaleFactor), Math.floor(panel.y / this.ScaleFactor)]);
		}

		device.setControllableLeds(this.ledNames, this.ledPositions);

		const effectsList = [];

		for(let i = 0; i < panelConfig.effects.effectsList.length; i ++){
			const effect = panelConfig.effects.effectsList[i];

			if(effect !== "*Dynamic*" && effect !== "*ExtControl*"){
				effectsList.push(effect);
			}
		}

		this.effectList = effectsList;
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
		}else if(currentEffect !== "*Dynamic*" && currentEffect !== "*ExtControl*"){
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

		if(this.config.originalEffect === "" && this.effectList.length > 0){
			device.log(`Shutdown(): invalid original effect. Setting to first effect found: [${this.effectList[0]}]`);
			this.protocol.SetCurrentEffect(this.effectList[0]);

			return;
		}

		this.protocol.SetCurrentEffect(this.config.originalEffect);
	}

	SendColorsv1(){
		const packet = [];
		packet[0] = this.lightCount;

		for(const [iIdx, lightinfo] of this.panels.entries()) {

			const startidx = 1 + (iIdx * 7);
			packet[startidx + 0] = lightinfo.panelId;
			packet[startidx + 1] = 1; // reserved

			const x = lightinfo.x / this.ScaleFactor;
			const y = lightinfo.y / this.ScaleFactor;
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
		packet[1] = this.lightCount;

		for(const [iIdx, lightinfo] of this.panels.entries()) {

			const startidx = 2 + (iIdx * 8);
			packet[startidx] = (lightinfo.panelId >> 8) & 0xFF;
			packet[startidx + 1] = lightinfo.panelId & 0xFF; // reserved

			const x = lightinfo.x / this.ScaleFactor;
			const y = lightinfo.y / this.ScaleFactor;

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

				if(xhr.status === 204) {
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

// -------------------------------------------<( Discovery Service )>--------------------------------------------------


export function DiscoveryService() {
	this.IconUrl = "https://marketplace.signalrgb.com/brands/products/nanoleaf/icon@2x.png";

	this.MDns = [
		"_nanoleafapi._tcp.local."
	];

	this.Initialize = function(){
		//service.log("Initializing plugin!");
		// const cache = service.getSetting("base", "cache");
		// service.log(cache);

		// for(let i = 0; i < cache.length; i++){
		// 	service.log(cache[i]);
		// 	this.Discovered(cache[i]);
		// }
	};

	this.Update = function() {
		for(const cont of service.controllers){
			cont.obj.update();
		}
	};

	this.Discovered = function(value) {
		service.log(value);

		// const cache = service.getSetting("base", "cache") || [];
		// let hostExists = false;

		// for(let i = 0; i < cache.length; i++){
		// 	if(value.hostname === cache[i].hostname){
		// 		hostExists = true;
		// 	}
		// }

		// if(!hostExists){
		// 	cache.push(value);
		// 	service.saveSetting("base", "cache", cache);
		// }

		this.CreateController(value);
	};

	this.CreateController = function(value){
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
		
		Rectangle{
			id: scanningItem
			height: 50
			width: childrenRect.width + 15
			visible: service.controllers.length == 0
			color: theme.background3
			radius: theme.radius

			BusyIndicator {
				id: scanningIndicator
				height: 30
				anchors.verticalCenter: parent.verticalCenter
				width: parent.height
				Material.accent: "#88FFFFFF"
				running: scanningItem.visible
			}  

			Column{
				width: childrenRect.width
				anchors.left: scanningIndicator.right
				anchors.verticalCenter: parent.verticalCenter

				Text{
					color: theme.secondarytextcolor
					text: "Searching network for Nanoleaf Controllers" 
					font.pixelSize: 14
					font.family: "Montserrat"
				}
				Text{
					color: theme.secondarytextcolor
					text: "This may take several minutes..." 
					font.pixelSize: 14
					font.family: "Montserrat"
				}
			}
		}
		

        Repeater {
			model: service.controllers          
			delegate: Item {
				width: 300
            	height: content.height + 100 //margins plus space

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
					id: content
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
						width: parent.width
						height: 50

						Rectangle {
							width: parent.width
							height: parent.height
							color: "#22ffffff"
							radius: 5
						}
						Text{
							height: parent.height
							x: 10
							color: theme.primarytextcolor
							verticalAlignment: Text.AlignVCenter
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
					Text{
						width: parent.width
						color: theme.primarytextcolor
						verticalAlignment: Text.AlignVCenter
						visible: !model.modelData.obj.connected
						text: "To link this controller start the linking process above and then put the controller into pairing mode."
						wrapMode: Text.WrapAtWordBoundaryOrAnywhere
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
		this.retriesleft = 60;
		this.ip = "";
		this.deviceCreated = false;
		this.panelinfo = {};
		this.lastPollTime = 0;
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
		//this.serviceValue = value;
		service.log("Updated: "+this.name);
		service.updateController(this);
	}

	ResolveIpAddress(){
		service.log("Attempting to resolve IPV4 address...");

		const instance = this;
		service.resolve(this.hostname, (host) => {
			// Only fire on the first valid ip resolved.
			if(instance.ip != ""){
				return;
			}

			if(host.protocol === "IPV4"){
				instance.ip = host.ip;

				// let ipcache = service.getSetting("base", "ipcache") || [];
				// service.log(ipcache);
				// ipcache.push(instance.ip);
				// ipcache = ipcache.filter((c, index) => {
				// 	return ipcache.indexOf(c) === index;
				// });
				// service.log(ipcache);
				// service.saveSetting("base", "ipcache", ipcache);

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

			return;
		}


		if(this.connected && !this.panelinfo){
			if(this.lastPollTime < Date.now() - 5000){
				this.getClusterInfo();
				this.lastPollTime = Date.now();
			}
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
		this.retriesleft = 60;
		this.waitingforlink = true; //pretend we're connected.

		service.updateController(this); //notify ui.
	}
}


// Swiper no XMLHttpRequest boilerplate!
class XmlHttp{
	static Get(url, callback, async = false){
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url, async);

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

class Semver{
	static isEqualTo(a, b){
		return this.compare(a, b) === 0;
	}
	static isGreaterThan(a, b){
		return this.compare(a, b) > 0;
	}
	static isLessThan(a, b){
		return this.compare(a, b) < 0;
	}
	static isGreaterThanOrEqual(a, b){
		return this.compare(a, b) >= 0;
	}
	static isLessThanOrEqual(a, b){
		return this.compare(a, b) <= 0;
	}

	static compare(a, b){
		const parsedA = a.split(".").map((x) => parseInt(x));
		const parsedB = b.split(".").map((x) => parseInt(x));

		return this.recursiveCompare(parsedA, parsedB);
	}

	static recursiveCompare(a, b){
		if (a.length === 0) { a = [0]; }

		if (b.length === 0) { b = [0]; }

		if (a[0] !== b[0] || (a.length === 1 && b.length === 1)) {
			if(a[0] < b[0]){
				return -1;
			}

			if(a[0] > b[0]){
				return 1;
			}

			return 0;

		}

		return this.recursiveCompare(a.slice(1), b.slice(1));
	}
}