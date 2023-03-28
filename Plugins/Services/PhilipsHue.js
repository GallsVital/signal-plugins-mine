
export function Name() { return "Philips Hue"; }
export function Version() { return "1.1.0"; }
export function Type() { return "network"; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [32, 32]; }
export function DefaultPosition() {return [75, 70]; }
export function DefaultScale(){return 8.0;}
export function SupportsSubdevices(){ return true;}
/* global
controller:readonly
*/
let CurrentArea = "";
let isStreamOpen = false;
let isDtlsConnectionAlive = false;
const lastConnectionAttemptTime = Date.now();

export function Initialize() {
	createLightsForArea(controller.selectedArea);

	device.addFeature("dtls");

	StartStream();
}

function onConnectionMade(){
	device.log("Connection Made!");
	isDtlsConnectionAlive = true;
}

function onConnectionClosed(){
	device.log("Connection Closed!");
	isDtlsConnectionAlive = false;
}

function onConnectionError(){
	device.log("Connection Error!");
	isDtlsConnectionAlive = false;
}

function onStreamStarted(){
	if(isStreamOpen){
		return;
	}

	isStreamOpen = true;
	device.log("Starting Dtls Handshake..");

	dtls.onConnectionEstablished(onConnectionMade);
	dtls.onConnectionClosed(onConnectionClosed);
	dtls.onConnectionError(onConnectionError);

	dtls.createConnection(controller.ip, 2100, controller.username, controller.key);
}

function onStreamStopped(){
	isStreamOpen = false;
}

function getColors(){

	const Lights = controller.areas[controller.selectedArea].lights;
	const RGBData = new Array(9 * Lights.length);
	let index = 0;

	for(let i = 0; i < Lights.length; i++) {
		const lightId = Lights[i];

		RGBData[index] = 0;
		RGBData[index+1] = 0;
		RGBData[index+2] = lightId;

		const color = device.subdeviceColor(`Philip's Hue Light: ${lightId}`, 1, 1);

		color[0] = mapu8Tou16(color[0]);
		color[1] = mapu8Tou16(color[1]);
		color[2] = mapu8Tou16(color[2]);

		RGBData[index+3] = (color[0] >> 8);
		RGBData[index+4] = color[0] & 0xFF;
		RGBData[index+5] = (color[1] >> 8);
		RGBData[index+6] = color[1] & 0xFF;
		RGBData[index+7] = (color[2] >> 8);
		RGBData[index+8] = color[2] & 0xFF;

		index += 9;
	}

	return RGBData;
}


function createHuePacket(RGBData){
	// for(let i = 0; i < 9; i++){
	// 	packet.push("HueStream".charCodeAt(i));
	// }
	let packet = [72, 117, 101, 83, 116, 114, 101, 97, 109];

	packet[9] = 0x01; //majv
	packet[10] = 0x00; //minv
	packet[11] = 0x00; //Seq
	packet[12] = 0x00; //Reserved
	packet[13] = 0x00; //Reserved
	packet[14] = 0x00; //Color Space (0: RGB)
	packet[15] = 0x01; // Linear filter.

	packet = packet.concat(RGBData);

	return packet;
}

function StartStream(){
	XmlHttp.Put(`http://${controller.ip}/api/${controller.username}/groups/${controller.selectedArea}`,
		(xhr) => {
			if (xhr.readyState === 4 && xhr.status === 200){
				device.log(xhr.responseText);

				const response = JSON.parse(xhr.response);

				if(response.length > 0){
					if(response[0].hasOwnProperty("success")){
						onStreamStarted();
					}
				}
			}
		},
		{stream: {active: true}}
	);
}

function StopStream(){
	XmlHttp.Put(`http://${controller.ip}/api/${controller.username}/groups/${controller.selectedArea}`,
		(xhr) => {
			if (xhr.readyState === 4 && xhr.status === 200){
				device.log(xhr.responseText);

				const response = JSON.parse(xhr.response);

				if(response.length > 0){
					if(response[0].hasOwnProperty("success")){
						onStreamStopped();
					}
				}
			}
		},
		{stream: {active: false}}
	);
}


export function Render() {

	if(CurrentArea != controller.selectedArea){
		device.log([CurrentArea, controller.selectedArea]);
		device.log(`Selected Area Changed! Recreating Subdevices!`);
		StopStream();
		createLightsForArea(controller.selectedArea);
		device.log("Waiting for connection to close...");
		dtls.CloseConnection();

		return;
	}

	if(!isStreamOpen && !isDtlsConnectionAlive){
		StartStream();
	}

	if(isStreamOpen && isDtlsConnectionAlive){
		const iRet = dtls.send(createHuePacket(getColors()));

		if(iRet < 0){
			device.log(`send(): Returned ${iRet}!`);
		}
	}

}

function mapu8Tou16(byte){
	return Math.floor((byte / 0xFF) * 0xFFFF);
}

export function Shutdown() {
	dtls.CloseConnection();
	isDtlsConnectionAlive = false;

	isStreamOpen = false;
	StopStream();
}

function createLightsForArea(AreaId){

	for(const light of device.getCurrentSubdevices()){
		device.log(`Removing Light: ${light}`);
		device.removeSubdevice(`Philip's Hue Light: ${light}`);
	}

	device.log(`Lights in current area: [${controller.areas[AreaId].lights}]`);

	for(const light of controller.areas[AreaId].lights){
		device.log(`Adding Light: ${light}`);
		device.createSubdevice(`Philip's Hue Light: ${light}`);
		device.setSubdeviceName(`Philip's Hue Light: ${light}`, controller.lights[light].name);
		device.setSubdeviceSize(`Philip's Hue Light: ${light}`, 3, 3);
		device.setSubdeviceImage(`Philip's Hue Light: ${light}`, "");
		device.setSubdeviceLeds(`Philip's Hue Light: ${light}`, ["Device"], [[1, 1]]);
	}

	CurrentArea = AreaId;
}
// -------------------------------------------<( Discovery Service )>--------------------------------------------------


export function DiscoveryService() {
	this.IconUrl = "https://marketplace.signalrgb.com/brands/products/hue/icon@2x.png";

	this.MDns = [
		"_hue._tcp.local."
	];

	this.Bridges = [];

	this.Initialize = function(){
		//service.log("Initializing plugin!");

	};

	this.Update = function(){
		for(const cont of service.controllers){
			cont.obj.update();
		}
	};

	this.Shutdown = function(){

	};

	this.Discovered = function(value) {
		const controller = service.getController(value.bridgeid);

		if (controller === undefined) {
			service.addController(new HueBridge(value));
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
            height: content.height + 30 //margins plus space
			property var bridge: model.modelData.obj

            Rectangle {
              width: parent.width
              height: parent.height - 10
              color: theme.background3
              radius: 5
            }
            Column {
              id: content
              x: 10
              y: 10

              Text{
                color: theme.primarytextcolor
                text: bridge.name
                font.pixelSize: 16
                font.family: "Poppins"
                font.bold: true
              }
              Text{
                color: theme.secondarytextcolor
                text: "Id: " + bridge.id
              }
              Text{
                color: theme.secondarytextcolor
                text: "Model: "+ bridge.model
              }  
			  Text{
				color: theme.secondarytextcolor
				text: "API Version: "+ bridge.apiversion
			  }

			  Text{
				color: theme.secondarytextcolor
				text: "Ip Address: " + (bridge.ip != "" ? bridge.ip : "Unknown")
			  }

			  Text{
				color: theme.secondarytextcolor
				text: "Linked"
				visible: bridge.connected
			  }
			  
			  Text{
				color: theme.warn
				text: "Bridge firmware doesn't allow streaming. API Version must be atleast 1.22.0"
				visible: !bridge.supportsStreaming && bridge.apiversion != ""
				wrapMode: Text.WrapAtWordBoundaryOrAnywhere
				font.pixelSize: 12
				width: parent.width
			  }

			  Item{
				visible: !bridge.connected && bridge.supportsStreaming
                Rectangle {
                  width: parent.width
				  anchors.verticalCenter: parent.verticalCenter
                  height: 50
                  color: "#22ffffff"
                  radius: 5
                }
                width: parent.width
                height: 60
                Text{
					x: 10
					height: parent.height
					verticalAlignment: Text.AlignVCenter
					color: theme.primarytextcolor
					visible: bridge.waitingforlink
					text: (bridge.waitingforlink === true) ? "Waiting For Link... "+bridge.retriesleft : ""
				  }
                ToolButton {        
                  height: 50
                  width: parent.width
                  anchors.verticalCenter: parent.verticalCenter
                  font.family: "Poppins"
                  font.bold: true 
                  visible: !bridge.connected && !bridge.waitingforlink  
                  text: "Link"
                  anchors.right: parent.right
                  onClicked: {
                    bridge.startLink();
                  }
                }

                BusyIndicator {
                  height: 30
				  anchors.verticalCenter: parent.verticalCenter
                  width: parent.height
                  Material.accent: "#88FFFFFF"
                  anchors.right: parent.right
                  visible: bridge.waitingforlink === true
                } 
			  }

			  ComboBox{
				id: areaComboBox
				width: parent.width
				model: Object.values(bridge.areas)
				textRole: "name"
				valueRole: "id"
				property bool ready: false
				visible: bridge.connected && bridge.supportsStreaming
				onCurrentValueChanged: {
					if(!ready) return;
					console.log(areaComboBox.currentText, areaComboBox.currentValue)
					bridge.setSelectedArea(areaComboBox.currentValue);
				}
				Component.onCompleted: {
					console.log("Selecting Default", bridge.selectedAreaName)
					let idx = areaComboBox.find(bridge.selectedAreaName)
					console.log(idx)
					if(idx >= 0){
						areaComboBox.currentIndex = idx;
					}
					ready = true;
				}
			  }        
            }
          }  
        }
      }
    }`;
	};
}


class HueBridge {
	constructor(value){
		this.updateWithValue(value);

		this.ip = ""; //service.getSetting(this.id, "ip") ?? "";
		this.key = service.getSetting(this.id, "key") ?? "";
		this.username = service.getSetting(this.id, "username") ?? "";
		this.areas = {};
		this.lights = {};
		this.connected = this.key != "";
		this.retriesleft = 60;
		this.waitingforlink = false;
		this.selectedArea = service.getSetting(this.id, "selectedArea") ?? "";
		this.selectedAreaName = service.getSetting(this.id, "selectedAreaName") ?? "";
		this.instantiated = false;
		this.lastPollingTimeStamp = 0;
		this.pollingInterval = 10000;
		this.supportsStreaming = false;
		this.apiversion = "";

		this.DumpBridgeInfo();

		// We should probably resolve the ip address every time incase it moves...
		this.ResolveIpAddress();
	}

	DumpBridgeInfo(){
		service.log("hostname: "+this.hostname);
		service.log("name: "+this.name);
		service.log("port: "+this.port);
		service.log("id: "+this.id);
		service.log("ip: " + (this.ip || "unknown"));
		service.log("model: "+this.model);
		service.log("username: "+(this.username || "unknown"));
		service.log("key: "+(this.key || "unknown"));
		service.log("selectedArea: "+(this.selectedArea || "unknown"));
		service.log("selectedAreaName: "+(this.selectedAreaName || "unknown"));
	}

	ResolveIpAddress(){
		service.log("Attempting to resolve IPV4 address...");

		const instance = this;
		service.resolve(this.hostname, (host) => {
			if(host.protocol === "IPV4"){
				instance.ip = host.ip;
				service.log(`Found IPV4 address: ${host.ip}`);
				//service.saveSetting(instance.id, "ip", instance.ip);
				instance.RequestBridgeConfig();
				service.updateController(instance); //notify ui.
			}else if(host.protocol === "IPV6"){
				service.log(`Skipping IPV6 address: ${host.ip}`);
			}else{
				service.log(`unknown IP config: [${JSON.stringify(host)}]`);
			}

			//service.log(host);
		});
	}

	CreateBridgeDevice(){
		service.updateController(this);
		// Instantiate device in SignalRGB, and pass 'this' object to device.
		service.announceController(this);
	}

	setSelectedArea(AreaId){
		if(this.areas.hasOwnProperty(AreaId)){
			this.selectedArea = AreaId;
			service.log(this.areas[AreaId].name);
			this.selectedAreaName = this.areas[AreaId].name;
			service.saveSetting(this.id, "selectedArea", this.selectedArea);
			service.saveSetting(this.id, "selectedAreaName", this.selectedAreaName);
			service.updateController(this);
			service.log(`Set Selected Area to: [${this.selectedAreaName}], Id: [${this.selectedArea}]`);
		}
	}

	updateWithValue(value){
		this.hostname = value.hostname;
		this.name = value.name;
		this.port = value.port;
		this.id = value.hasOwnProperty("bridgeid") ? value.bridgeid : value.id;
		this.model = value.hasOwnProperty("bridgeid") ? value.modelid : value.md;

		service.log("Updated: " + this.name);
		service.updateController(this);
	}

	setClientKey(response) {
		service.log("Setting key: "+ response.clientkey);

		// Save token.
		this.key = response.clientkey;
		service.saveSetting(this.id, "key", this.key);

		this.username = response.username;
		service.saveSetting(this.id, "username", this.username);

		this.retriesleft = 0;
		this.waitingforlink = false;
		this.connected = true;
		service.updateController(this);

		this.RequestLightInfo();
		this.RequestAreaInfo();
	}

	requestLink(){
		const instance = this;
		service.log("requesting link for "+this.name);

		XmlHttp.Post(`http://${this.ip}/api`, (xhr) => {
			if (xhr.readyState === 4 && xhr.status === 200) {
				service.log(`Make Request: State: ${xhr.readyState}, Status: ${xhr.status}`);

				const response = JSON.parse(xhr.response)[0];
				service.log(JSON.stringify(response));

				if(response.error === undefined && response.success){
					instance.setClientKey(response.success);
				}
			}
		},
		{devicetype: "SignalRGB", generateclientkey: true}
		);

	}

	startLink() {
		service.log("Pushlink test for "+this.name);
		this.retriesleft = 40;
		this.waitingforlink = true; //pretend we're connected.

		service.updateController(this); //notify ui.
	}

	update() {
		if (this.waitingforlink){
			this.retriesleft--;
			this.requestLink();

			//service.log("Waiting for key from: "+ this.name+"...");
			if (this.retriesleft <= 0) {
				this.waitingforlink = false;
			}

			service.updateController(this);
		}

		if(!this.connected){
			return;
		}

		if(!this.instantiated){
			this.RequestLightInfo();
			this.RequestAreaInfo();

			this.CreateBridgeDevice();
			this.instantiated = true;
			this.lastPollingTimeStamp = Date.now();
		}

		// if(Date.now() - this.lastPollingTimeStamp > this.pollingInterval){
		// 	service.log("Polling bridge Info...");
		// 	this.RequestLightInfo();
		// 	this.RequestAreaInfo();
		// 	service.updateController(this);
		// 	this.lastPollingTimeStamp = Date.now();
		// }
	}

	RequestAreaInfo(){
		const instance = this;
		service.log("Requesting Area Info...");

		XmlHttp.Get(`http://${this.ip}/api/${this.username}/groups`, (xhr) => {
			if (xhr.readyState === 4 && xhr.status === 200) {
				//service.log("Areas:" + xhr.response);

				/** @type {Object.<number, EntertainmentArea>} */
				const response = JSON.parse(xhr.response);

				instance.areas = response;

				for(const AreaId in response){
					const Area = response[AreaId];

					if(!Area){
						continue;
					}

					// Save Id for later
					Area.id = AreaId;

					service.log(`Area: ${Area.name}`);
					service.log(`\tId: ${Area.id}`);
					service.log(`\tLights: ${Area.lights}`);
					service.log(`\tType: ${Area.type}`);

					if(Area.type != "Entertainment"){
						service.log(`Skipping Area [${Area.name}:${Area.id}] because it's not a streamable entertainment area...`);
						delete instance.areas[Area.id];
					}

				}
			}
		});
	}

	RequestLightInfo(){
		const instance = this;
		service.log("Requesting Light Info...");

		XmlHttp.Get(`http://${this.ip}/api/${this.username}/lights`, (xhr) => {
			if (xhr.readyState === 4 && xhr.status === 200) {

				/** @type {Object.<number, HueLight>} */
				const response = JSON.parse(xhr.response);
				instance.lights = response;

				for(const lightId in response){

					const light = response[lightId];

					if(!light){
						continue;
					}

					// Save Id for later
					light.id = lightId;

					service.log(`Light: ${light.id}`);
					service.log(`\tName: ${light.name}`);
					service.log(`\Product Name: ${light.productname}`);
					service.log(`\tType: ${light.type}`);
				}
			}
		});
	}

	SetConfig(response){
		this.config = response;
		service.log(JSON.stringify(this.config));
		this.apiversion = response.apiversion;
		service.log(`Api Version: ${this.apiversion}`);

		if(this.StreamableAPIVersion(this.apiversion)){
			this.supportsStreaming = true;
		}

		service.updateController(this);
	}

	StreamableAPIVersion(apiversion){
		const version = (apiversion ?? "0.0.0").split(".");

		return (parseInt(version[0]) >= 1 && parseInt(version[1]) >= 22);
	}

	RequestBridgeConfig(){
		const instance = this;
		service.log(`Requesting bridge config...`);
		XmlHttp.Get(`http://${this.ip}/api/config`, (xhr) => {
			if (xhr.readyState === 4 && xhr.status === 200) {
				instance.SetConfig(JSON.parse(xhr.response));
			}
		});
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

	static Put(url, callback, data){
		const xhr = new XMLHttpRequest();
		xhr.open("PUT", url, false);

		xhr.setRequestHeader("Accept", "application/json");
		xhr.setRequestHeader("Content-Type", "application/json");

		xhr.onreadystatechange = callback.bind(null, xhr);

		xhr.send(JSON.stringify(data));
	}
}