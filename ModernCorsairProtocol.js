

function Convert_To_16Bit(values) {
	let returnValue = 0;

	for(let i = 0; i < values.length; i++) {
		returnValue += values[i] << (8 * i);
	}

	return returnValue;
}

function Convert_From_16Bit(value, LittleEndian = false) {
	const returnValue = [];

	while(value > 0){
		returnValue.push(value & 0xFF);
		value = value >> 8;
	}

	return LittleEndian ? returnValue : returnValue.reverse();
}

function decimalToHex(d, padding) {
	let hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

	while (hex.length < padding) {
		hex = "0" + hex;
	}

	return "0x" + hex;
}

function getKeyByValue(object, value) {
	const Key = Object.keys(object).find(key => object[key] === value);

	return parseInt(Key);
}


/**
 * @typedef {String} PropertyName
 * @typedef {Number} PropertyId
 */

/**
 * Protocol Library for Corsair's Modern Protocol. (BRAGI)
 * @class ModernCorsairProtocol
 */
export class ModernCorsairProtocol{
	constructor(options = {}) {
		this.DeviceBufferSize = 1280;
		this.IsLightingController = options.hasOwnProperty("IsLightingController") ? options.IsLightingController : false;
		this.developmentFirmwareVersion = options.hasOwnProperty("developmentFirmwareVersion") ? options.developmentFirmwareVersion : "Unknown";

		this.KeyCodes = [];
		this.KeyCount = 0;

		this.WiredCommand = 0x08;
		this.WirelessCommand = 0x09;

		this.CommandMode = this.WiredCommand;

		this.setProperty = 0x01;
		this.getProperty = 0x02;
		this.closeHandle = 0x05;
		this.writeEndpoint = 0x06;
		this.streamEndpoint = 0x07;
		this.readEndpoint = 0x08;
		this.checkHandle = 0x09;
		this.openEndpoint = 0x0D;
		this.pingDevice = 0x12;
		this.confirmChange = 0x15; // ??? Used to apply led count changes to Commander Core [XT]

		this.hardwareMode = 0x01;
		this.softwareMode = 0x02;

		/**
		 * Contains the PropertyId's of all known Properties.
		 * The device values these represent can be read and set using the following commands:
		 * - FetchProperty(PropertyId)
		 * - ReadProperty(PropertyId)
		 * - SetProperty(PropertyId, Value)
		 * - CheckAndSetProperty(PropertyId, Value)
		 */

		this.Properties = {
			/** Device Polling Rate PropertyId */
			pollingRate: 0x01,
			/** Device Hardware Brightness PropertyId */
			brightness: 0x02,
			/** Device Mode [Software/Hardware] PropertyId. Uses a 0-1000 Range.  */
			mode: 0x03,
			/** Device Angle Snapping State PropertyId */
			angleSnap: 0x07,
			/** Device Idle Mode Toggle PropertyId. Only effects wireless devices. */
			idleMode: 0x0d,
			/** Device Battery Level PropertyID. Uses a 0-1000 Range. [READONLY] */
			batteryLevel: 0x0F,
			/** Device Charging State PropertyID. [READONLY] */
			batteryStatus: 0x10,
			/** Device VendorID PropertyID. [READONLY] */
			vid: 0x11,
			/** Device ProductID PropertyID. [READONLY] */
			pid: 0x12,
			/** Device Firmware PropertyID. [READONLY] */
			firmware:0x13,
			/** Device BootLoader Firmware PropertyID. [READONLY] */
			BootLoaderFirmware: 0x14,
			/** Device Wireless Chip Firmware PropertyID. [READONLY] */
			WirelessChipFirmware: 0x15,
			/** Device Current DPI Profile Index PropertyID. Dark Core Pro SE uses a 0-3 Range.*/
			dpiProfile: 0x1E,
			dpiMask: 0x1F,
			/** Device's Current X DPI PropertyID. */
			dpiX: 0x21,
			/** Device's Current Y DPI PropertyID. */
			dpiY: 0x22,
			/** Device's Idle Timeout PropertyId. Value is in Milliseconds and has a max of 99 Minutes. */
			idleModeTimeout: 0x37,
			/** Device's Physical Layout PropertyId. Only applies to Keyboards. */
			layout: 0x41,
			BrightnessLevel: 0x44,
			/** Device's WinKey Lock Status. Only applies to Keyboards. */
			WinLockState: 0x45,
			/** Device's WinKey Lock Bit flag. Governs what key combinations are disabled by the devices Lock mode. Only Applies to Keyboards. */
			LockedShortcuts: 0x4A,
			/** Device's Max Polling Rate PropertyId. Not supported on all devices. */
			maxPollingRate: 0x96,
			ButtonResponseOptimization: 0xB0,
		};
		/** This Object maps PropertyId's to a human readable name string. */
		this.PropertyNames = {
			0x01: "Polling Rate",
			0x02: "HW Brightness",
			0x03: "Mode",
			0x07: "Angle Snapping",
			0x0d: "Idle Mode",
			0x0F: "Battery Level",
			0x10: "Battery Status",
			0x11: "Vendor Id",
			0x12: "Product Id",
			0x13: "Firmware Version",
			0x1E: "DPI Profile",
			0x1F: "DPI Mask",
			0x21: "DPI X",
			0x22: "DPI Y",
			0x37: "Idle Mode Timeout",
			0x41: "HW Layout",
			0x96: "Max Polling Rate",
		};
		/**
		 * Contains the EndpointId's of all known Endpoints. These handle advanced device functions like Lighting and Fan Control.
		 * To manually interact with these you must open a Handle to the Endpoint first using OpenHandle(HandleId, EndpointId).
		 *
		 * Helper Functions to interact with these exist as the following:
		 * - WriteEndpoint(HandleId, EndpointId, CommandId)
		 * - ReadEndpoint(HandleId, EndpointId, CommandId)
		 */
		this.Endpoints = {
			Lighting: 0x01,
			Buttons: 0x02,
			PairingID: 0x05,
			FanRPM: 0x17,
			FanSpeeds: 0x18,
			FanStates: 0x1A,
			LedCount_3Pin: 0x1D,
			LedCount_4Pin: 0x1E,
			TemperatureData: 0x21,
			LightingController: 0x22,
			ErrorLog: 0x27,
		};

		/** This Object maps EndpointId's to a human readable name string. */
		this.EndpointNames = {
			0x01: "Lighting",
			0x02: "Buttons",
			0x17: "Fan RPMs",
			0x08: "Fan Speeds",
			0x1A: "Fan States",
			0x1D: "3Pin Led Count",
			0x1E: "4Pin Led Count",
			0x21: "Temperature Probes",
			0x22: "Lighting Controller",
		};

		/** This Object maps device ChargingStateId's to a human readable name string. */
		this.ChargingStates = {
			1: "Charging",
			2: "Discharging",
			3: "Fully Charged",
		};

		this.Modes = {
			Hardware: 0x01,
			Software: 0x02,
		};

		/** This Object maps device ModeId's to a human readable name string. */
		this.ModeNames = {
			0x01: "Hardware",
			0x02: "Software"
		};

		this.ResponseIds = {
			firmware: 0x02,
			command: 0x06,
			openEndpoint: 0x0D,
			closeEndpoint: 0x05,
			getRpm: 0x06,
			fanConfig: 0x09,
			temperatureData: 0x10,
			LedConfig: 0x0F,
		};
		/**
		 * Contains the Handle's of useable device Handles. These are used to open internal device Endpoints for advanced functions like Lighting and Fan Control.
		 * Each HandleId can only be open for one EndpointId at a time, and must be closed before the EndpointId can be changed.
		 * For best practice all non-lighting Handles should be closed immediately after you are done interacting with it.
		 *
		 * Auxiliary (0x02) Should only be needed in very specific cases.
		 *
		 * Helper Functions to interact with these exist as the following:
		 * - OpenHandle(HandleId, EndpointId)
		 * - CloseHandle(HandleId)
		 * - CheckHandle(HandleId) -> Not Fully Understood.
		 */
		this.Handles = {
			Lighting: 0x00,
			Background: 0x01,
			Auxiliary: 0x02,
		};
		/** This Object maps device HandleId's to a human readable name string. */
		this.HandleNames = {
			0x00: "Lighting",
			0x01: "Background",
			0x02: "Auxiliary"
		};

		this.FanStates = {
			Disconnected: 0x01,
			Initializing: 0x04,
			Connected: 0x07,
		};

		this.FanTypes = {
			QL: 0x06,
			SpPro: 0x05
		};

		/** This Object maps device Polling Rate Id's to a human readable name string. */
		this.PollingRates = {
			1: "125hz",
			2: "250hz",
			3: "500hz",
			4: "1000hz",
			5: "2000hz",
		};
		/** This Object maps readable Polling Rate Strings to the device's internal Polling Rate Id's. */

		this.PollingRateNames = {
			"125hz": 1,
			"250hz": 2,
			"500hz": 3,
			"1000hz": 4,
			"2000hz": 5,
		};

		this.Layouts = {
			0x01: "ANSI",
			0x02: "ISO",
		};

		this.KeyStates = {
			Disabled: 0,
			0: "Disabled",
			Enabled: 1,
			1: "Enabled",
		};
	}
	/**
	 * This Function sends a device Ping request and returns if the ping was successful.
	 *
	 * This function doesn't seem to affect the devices functionality, but iCUE pings all BRAGI devices every 52 seconds.
	 * @returns {boolean} - Boolean representing Ping Success
	 */
	PingDevice(){
		let packet = [0x00, this.CommandMode, this.pingDevice];
		device.write(packet, this.DeviceBufferSize);
		packet = device.read(packet, this.DeviceBufferSize);

		if(packet[2] !== 0x12){
			return false;
		}

		return true;
	}

	SetKeyStates(Enabled){
		this.KeyCodes = [];

		// Assuming a continuous list of key id's
		for(let iIdx = 0; iIdx < this.KeyCount; iIdx++){
			this.KeyCodes.push(Enabled);
		}

		this.WriteEndpoint(this.Handles.Background, this.Endpoints.Buttons, this.KeyCodes);
	}

	SetSingleKey(KeyID, Enabled){
		this.KeyCodes[KeyID - 1] = Enabled;

		this.WriteEndpoint(this.Handles.Background, this.Endpoints.Buttons, this.KeyCodes);
	}

	/**
	 * This function can be used to manually set the devices buffer length instead of attempting auto detection. This value must be set for any other functions in this Protocol to work.
	 * @param {number} BufferSize Desired buffer size in bytes.
	 */
	SetDeviceBufferSize(BufferSize){
		this.DeviceBufferSize = BufferSize;
	}

	/**
	 * This function finds and sets the device's buffer size for internal use in the Protocol. This should be the first function called when using this CorsairProtocol as all other interactions with the device rely on the buffer size being set properly.

	You can call SetDeviceBufferSize(BufferSize) to manually set this value.

	 */
	FindBufferLength(){
		if(this.DeviceBufferSize === 1280){
			device.log(`CorsairProtocol: No buffer length known. Reading from device!`);

			// Using a proxy Device Ping request to get a packet to read.
			device.write([0x00, this.CommandMode, this.pingDevice], 1024);
			device.read([0x00], 1024);

			this.DeviceBufferSize = device.getLastReadSize();
			device.log(`CorsairProtocol: Buffer length set to ${this.DeviceBufferSize}`);
		}
	}
	/**
	 * Helper function to read and properly format the device's firmware version.
	 */
	FetchFirmware(){
		const data = this.ReadProperty(this.Properties.firmware);

		if(this.CheckError(data, "FetchFirmware")){
			return;
		}

		const firmwareString = `${data[4]}.${data[5]}.${data[6]}`;
		device.log(`Firmware Version: [${firmwareString}]`);
		device.log(`Developed on Firmware [${this.developmentFirmwareVersion}]`);

		return firmwareString;
	}

	/**
	 * Helper function to set the devices current DPI. This will set the X and Y DPI values to the provided value.
	 * @param {number} DPI Desired DPI value to be set.
	 */
	SetDPI(DPI){
		const CurrentDPI = this.FetchProperty("DPI X");

		if(CurrentDPI !== DPI){

			device.log(`Current device DPI is [${CurrentDPI}], Desired value is [${DPI}]. Setting DPI!`);
			this.SetProperty(this.Properties.dpiX, DPI);
			this.SetProperty(this.Properties.dpiY, DPI);

			device.log(`DPI X is now [${this.FetchProperty(this.Properties.dpiX)}]`);
			device.log(`DPI Y is now [${this.FetchProperty(this.Properties.dpiX)}]`);
		}
	}

	/**
	 * Helper function to grab the devices battery level and charge state. Battery Level is on a scale of 0-1000.
	 * @returns An array containing [Battery Level, Charging State]
	 */
	FetchBatteryStatus(){
		const BatteryLevel = this.FetchProperty(this.Properties.batteryLevel);
		const ChargingState = this.FetchProperty(this.Properties.batteryStatus);

		return [BatteryLevel, ChargingState];
	}
	/**
	 *
	 * @param {number[]} Data - Data packet read from the device.
	 * @param {string} Context - String representing the calling location.
	 * @returns {number} - An Error Code if the Data packet contained an error, otherwise 0.
	 */
	CheckError(Data, Context){
		const hasError = Data[3] ?? false;

		if(hasError){
			const caller_line = (new Error).stack.split("\n")[2];
			const caller_function = caller_line.slice(0, caller_line.indexOf("@"));
			const line_number = caller_line.slice(caller_line.lastIndexOf(":")+1);
			const caller_context = `${caller_function}():${line_number}`;

			switch(Data[3]){
			case 1: // Invalid Value
				device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Invalid Value Set!`);
				break;

			case 3: // Endpoint Error
				device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Operation Failed!`);
				break;

			case 5: // Property Not Supported
				device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Property is not supported on this device!`);
				break;

			case 9: // Read only property
				device.log(`${caller_context} CorsairProtocol Error [${hasError}]: Property is read only!`);
				break;
			case 13:
			case 55:
				// Value still gets set properly?
				//device.log(`${caller_context} CorsairProtocol Unknown Error Code [${hasError}]: ${Context}. This may not be an error.`);
				return 0;
			default:
				device.log(`${caller_context} CorsairProtocol Error [${hasError}]: ${Context}`);
			}
		}

		return hasError;
	}
	/**
	 * Helper Function to Read a Property from the device, Check its value, and Set it on the device if they don't match.
	 * 	@param {number|string} PropertyId Property Index to be checked and set on the device. This value can either be the PropertyId, or the readable string version of it.
	 * 	@param {number} Value The Value to be checked against and set if the device's value doesn't match.
	 *  @return {boolean} a Boolean on if the Property value on the device did match, or now matches the value desired.
	 */
	CheckAndSetProperty(PropertyId, Value){
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.PropertyNames, PropertyId);
		}

		const CurrentValue = this.FetchProperty(PropertyId);

		if(CurrentValue != Value){
			device.log(`Device ${this.PropertyNames[PropertyId]} is currently [${CurrentValue}]. Desired Value is [${Value}]. Setting Property!`);

			this.SetProperty(PropertyId, Value);
			device.read([0x00], this.DeviceBufferSize, 5);

			const NewValue = this.FetchProperty(PropertyId);
			device.log(`Device ${this.PropertyNames[PropertyId]} is now [${NewValue}]`);

			return NewValue === Value;
		}

		return true;
	}

	/**
	 * Reads a property from the device and returns the joined value after combining any high/low bytes. This function can return a null value.
	 * @param {number | BragiPropertyNames[number]} PropertyId Property Index to be read from the device. This value can either be the PropertyId, or the readable string version of it.
	 * @returns The joined value, or undefined if the device fetch failed.
	 */
	FetchProperty(PropertyId) {
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.PropertyNames, PropertyId);
		}

		const data = this.ReadProperty(PropertyId);

		// Don't return error codes.
		if(!Array.isArray(data)){
			return -1;
		}

		return Convert_To_16Bit(data.slice(4, 7));
	}

	/**
	 * Sets a property on the device and returns the success state.
	 * @param {number|string} PropertyId Property Index to be written to on the device. This value can either be the PropertyId, or the readable string version of it.
	 * @param {number} Value The Value to be set.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	SetProperty(PropertyId, Value) {
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.PropertyNames, PropertyId);
		}

		let packet = [0x00, this.CommandMode, this.setProperty, PropertyId, 0x00, (Value & 0xFF), (Value >> 8 & 0xFF), (Value >> 16 & 0xFF)];
		device.write(packet, this.DeviceBufferSize);
		packet = device.read(packet, this.DeviceBufferSize);

		const ErrorCode = this.CheckError(packet, `SetProperty`);

		if(ErrorCode === 1){
			device.log(`Failed to set Property [${this.PropertyNames[PropertyId]}, ${decimalToHex(PropertyId, 2)}]. [${Value}] is an Invalid Value`);

			return ErrorCode;
		}

		if(ErrorCode === 3){
			device.log(`Failed to set Property [${this.PropertyNames[PropertyId]}, ${decimalToHex(PropertyId, 2)}]. Are you sure it's supported?`);

			return ErrorCode;
		}

		if(ErrorCode === 9){
			device.log(`Failed to set Property [${this.PropertyNames[PropertyId]}, ${decimalToHex(PropertyId, 2)}]. The device says this is a read only property!`);

			return ErrorCode;
		}

		return 0;
	}

	/**
	 * Reads a property from the device and returns the raw packet.
	 * @param {number} PropertyId Property Index to be read from the device.  This value can either be the PropertyId, or the readable string version of it.
	 * @returns The packet data read from the device.
	 */
	ReadProperty(PropertyId) {
		//Clear read buffer
		do{
			device.read([0x00], 65, 3);
		}while(device.getLastReadSize() > 0);

		let packet = [0x00, this.CommandMode, this.getProperty, PropertyId, 0x00];
		device.write(packet, this.DeviceBufferSize);
		packet = device.read(packet, this.DeviceBufferSize);

		const ErrorCode = this.CheckError(packet, `ReadProperty`);

		if(ErrorCode){
			device.log(`Failed to read Property [${this.PropertyNames[PropertyId]}, ${decimalToHex(PropertyId, 2)}]. Are you sure it's supported?`);

			return ErrorCode;
		}

		return packet;
	}

	/**
	 * Opens a Endpoint on the device. Only one Endpoint can be open on a Handle at a time.
	 * @param {number} Handle The Handle to open the Endpoint on. Default is 0.
	 * @param {number} Endpoint Endpoint Address to be opened.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	OpenHandle(Handle, Endpoint) {
		let packet = [0x00, this.CommandMode, this.openEndpoint, Handle, Endpoint];
		device.write(packet, this.DeviceBufferSize);
		packet = device.read(packet, this.DeviceBufferSize);

		const ErrorCode = this.CheckError(packet, `OpenEndpoint`);

		if(ErrorCode){
			this.CloseHandle(Endpoint);
			device.log(`Failed to open Endpoint [${this.EndpointNames[Endpoint]}, ${decimalToHex(Endpoint, 2)}] on Handle [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}]. Are you sure it's supported and wasn't already open?`);
		}

		return ErrorCode;
	}
	/**
	 * Closes a Handle on the device.
	 * * @param {number} Handle The HandleId to Close.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	CloseHandle(Handle = 0) {
		let packet = [0x00, this.CommandMode, this.closeHandle, 1, Handle];
		device.write(packet, this.DeviceBufferSize);
		packet = device.read(packet, this.DeviceBufferSize);

		const ErrorCode = this.CheckError(packet, `CloseEndpoint`);

		if(ErrorCode){
			device.log(`Failed to close Handle [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}]. was it even open?`);
		}

		return ErrorCode;
	}
	/**
	 * Performs a Check Command on the HandleId given and returns if the handle is open.
	 * @param {number} Handle - HandleId to perform the check on.
	 * @returns {Boolean} Boolean representing if the Handle is already open.
	 */
	IsHandleOpen(Handle){
		let packet = [0x00, this.CommandMode, this.checkHandle, Handle, 0x00];
		device.write(packet, this.DeviceBufferSize);
		packet = device.read(packet, this.DeviceBufferSize);

		const hasError = packet[3] === 0;

		return hasError;
	}
	/**
	 * Performs a Check Command on the HandleId given and returns the packet from the device.
	 * This function will return an Error Code if the Handle is not open.
	 * The Format of the returned packet is currently not understood.
	 * @param {number} Handle - HandleId to perform the check on.
	 * @returns The packet read from the device on success. Otherwise and Error Code.
	 */
	CheckHandle(Handle){
		let packet = [0x00, this.CommandMode, this.checkHandle, Handle, 0x00];
		device.write(packet, this.DeviceBufferSize);
		packet = device.read(packet, this.DeviceBufferSize);

		const ErrorCode = this.CheckError(packet, `CheckHandle`);

		if(ErrorCode){
			this.CloseHandle(Handle);
			device.log(`Failed to check Handle [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}]. Did you open it?`);

			return ErrorCode;
		}

		return packet;
	}
	/**
	 * This Helper Function will Open, Read, and Close a device Handle for the Endpoint given.
	 * If the read packet does not contain the ResponseId given the packet will be reread up to 4 times.
	 * The HandleId given MUST not already be in use elsewhere.
	 * @param {number} Handle - HandleId to be used.
	 * @param {number} Endpoint - EndpointId to be read from
	 * @param {number} Command - CommandId that is contained in the return packet to verify the correct packet was read from the device.
	 * @returns The entire packet read from the device.
	 */
	ReadEndpoint(Handle, Endpoint, Command) {
		const isHandleOpen = this.IsHandleOpen(Handle);

		if(isHandleOpen){
			device.log(`CorsairProtocol: Handle is already open: [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}]. Attemping to close...`);
			this.CloseHandle(Handle);

		}

		const ErrorCode = this.OpenHandle(Handle, Endpoint);

		if(ErrorCode){
			this.CloseHandle(Handle);
			device.log(`CorsairProtocol: Failed to open Device Handle [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}]. Aborting ReadEndpoint operation.`);

			return ErrorCode;
		}

		device.write([0x00, this.CommandMode, this.readEndpoint, Handle], this.DeviceBufferSize);

		let Data = [];
		Data = device.read([0x00], this.DeviceBufferSize);

		let RetryCount = 4;

		do {
			RetryCount--;
			device.write([0x00, this.CommandMode, this.readEndpoint, Handle], this.DeviceBufferSize);
			Data = device.read(Data, this.DeviceBufferSize);

			if(this.ResponseIds[Data[4]] !== this.ResponseIds[Command]) {
				device.log(`Invalid Command Read: Got [${this.ResponseIds[Data[2]]}][${Data[4]}], Wanted [${this.ResponseIds[Command]}][${Command}]`);
			}

		} while(this.ResponseIds[Data[4]] !== this.ResponseIds[Command] && RetryCount > 0);

		this.CloseHandle(Handle);

		return Data;
	}
	/**
	 * This Helper Function will Open, Write to, and Close a device Handle for the Endpoint given.
	 * The HandleId given MUST not already be in use elsewhere.
	 *
	 * This function will handle setting the header data expected by the device. If the Data Array Length provided doesn't match what the device's endpoint is expecting the operation will Error.
	 *
	 * @param {number} Handle - HandleId to be used.
	 * @param {number} Endpoint - EndpointId to be written too.
	 * @param {number[]} Data - Data to be written to the Endpoint.
	 */
	WriteEndpoint(Handle, Endpoint, Data) {
		const isHandleOpen = this.IsHandleOpen(Handle);

		if(isHandleOpen){
			device.log(`CorsairProtocol: Handle is already open: [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}]. Aborting WriteEndpoint operation.`);

			return;
		}

		let ErrorCode = this.OpenHandle(Handle, Endpoint);

		if(ErrorCode){
			device.log(`CorsairProtocol: Failed to open Device Handle [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}]. Aborting WriteEndpoint operation.`);

			return ErrorCode;
		}

		let packet = [0x00, this.CommandMode, this.writeEndpoint, Handle, Data.length & 0xff, (Data.length >> 8) & 0xFF, 0x00, 0x00];
		packet.push(...Data);

		device.write(packet, this.DeviceBufferSize);
		device.read([0x00], this.DeviceBufferSize);

		packet = device.read([0x00], this.DeviceBufferSize);

		ErrorCode = this.CheckError(packet, `WriteEndpoint`);

		if(ErrorCode){
			device.log(`Failed to Write to Handle [${this.HandleNames[Handle]}, ${decimalToHex(Handle, 2)}].`);
		}

		this.CloseHandle(Handle);

		return ErrorCode;
	}
	/**
	 * This Helper Function to write RGB data to the device. This function will split the data into as many packets as needed and do multiple WriteEndpoints(Handle, Endpoint, Data) based on the DeviceBufferSize set.
	 *
	 * This function expects the Lighting HandleId (0x00) to already be open.
	 *
	 * This function will handle setting the header data expected by the device. If the RGBData Array Length provided doesn't match what the devices Lighting Endpoint expects this command will Error.
	 *
	 * @param {number[]} RGBData - RGBData to be written to the device in a RRRGGGBBB(Lighting Endpoint 0x01) or RGBRGBRGB(LightingController Endpoint 0x22) format.
	 */
	SendRGBData(RGBData){
		const InitialHeaderSize = 8;
		const HeaderSize = 4;
		let BytesSent = 0;

		// All packets sent to the LightingController Endpoint have these 2 values added before any other data.
		if(this.IsLightingController){
			RGBData.splice(0, 0, ...[0x12, 0x00]);
		}

		let TotalBytes = RGBData.length;
		const InitialPacketSize = this.DeviceBufferSize - InitialHeaderSize;

		this.WriteLighting(RGBData.length, RGBData.splice(0, InitialPacketSize));

		TotalBytes -= InitialPacketSize;
		BytesSent += InitialPacketSize;

		while(TotalBytes > 0){
			const BytesToSend = Math.min(this.DeviceBufferSize - HeaderSize, TotalBytes);
			this.StreamLighting(RGBData.splice(0, BytesToSend));

			TotalBytes -= BytesToSend;
			BytesSent += BytesToSend;
		}
	}

	WriteLighting(LedCount, RGBData){

		const packet = [];
		packet[0x00] = 0x00;
		packet[0x01] = this.CommandMode;
		packet[0x02] = this.writeEndpoint;
		packet[0x03] = 0x00;
		packet[0x04] = (LedCount) & 0xFF;
		packet[0x05] = (LedCount) >> 8;
		packet[0x06] = 0x00;
		packet[0x07] = 0x00;

		packet.push(...RGBData);

		device.write(packet, this.DeviceBufferSize);

		const response = device.read([0x00], this.DeviceBufferSize);

		this.CheckError(response, "WriteLighting");
	}

	StreamLighting(RGBData) {

		const packet = [];
		packet[0x00] = 0x00;
		packet[0x01] = this.CommandMode;
		packet[0x02] = this.streamEndpoint;
		packet[0x03] = 0x00;
		packet.push(...RGBData);

		device.write(packet, this.DeviceBufferSize);

		const response = device.read([0x00], this.DeviceBufferSize);

		this.CheckError(response, "StreamLighting");
	}

	/**
	 * Helper Function to Fetch and Set the devices HW mode. This function will close all currently open Handles on the device to ensure a clean slate and to prevent issues interacting with the device.
	 * Closing Handles in this function leads to iCUE not being able to function anymore.
	 * @param {number} Mode ModeId to be checks against and set on the device.
	 */
	SetMode(Mode){
		let CurrentMode = this.FetchProperty(this.Properties.mode);

		if(CurrentMode !== Mode) {
			device.log(`Setting Device Mode to ${Mode === this.softwareMode ? "Software" : "Hardware"}`);
			this.SetProperty(this.Properties.mode, Mode);
			CurrentMode = this.FetchProperty(this.Properties.mode);
			device.log(`Mode is Now ${CurrentMode === this.softwareMode ? "Software" : "Hardware"}`);
		}
	}

	/**
	 * Helper function to set the Hardware level device brightness if it is difference then the Brightness Value provided. This property is saved to flash.
	 * * @param {number} Brightness Brightness Value to be set in the range of 0-1000
	 */
	SetHWBrightness(Brightness){
		const HardwareBrightness = this.FetchProperty(this.Properties.brightness);

		if(HardwareBrightness !== Brightness){
			device.log(`Hardware Level Brightness is ${HardwareBrightness/10}%`);

			this.SetProperty(this.Properties.brightness, Brightness);

			// Setting brightness appears to queue 2 packets to be read from the device
			// instead of the expected one.
			this.ReadProperty(this.Properties.brightness);

			device.log(`Hardware Level Brightness is now ${this.FetchProperty(this.Properties.brightness)/10}%`);
		}
	}

	/**
	 * Helper function to set the device's angle snapping if it is difference then the bool provided. This property is saved to flash.
	 * * @param {boolean} AngleSnapping boolean Status to be set for Angle Snapping.
	 */
	SetAngleSnapping(AngleSnapping){
		const HardwareAngleSnap = this.FetchProperty(this.Properties.angleSnap);

		if(HardwareAngleSnap != AngleSnapping){
			device.log(`Device Angle Snapping is set to [${HardwareAngleSnap ? "True" : "False"}]`);

			this.SetProperty(this.Properties.angleSnap, AngleSnapping);

			const NewAngleSnap = this.FetchProperty(this.Properties.angleSnap);
			device.log(`Device Angle Snapping is now [${NewAngleSnap ? "True" : "False"}]`);
		}
	}


	FetchFanRPM() {
		device.log("CorsairProtocol: Reading Fan RPM's.");

		if(device.fanControlDisabled()) {
			device.log("Fan Control is Disabled! Are you sure you want to try this?");

			return [];
		}

		const data = this.ReadEndpoint(this.Handles.Background, this.Endpoints.FanRPM, 0x06);

		if(!data){
			device.log(`CorsairProtocol: Failed To Read Fan RPM's.`);

			return [];
		}

		const FanSpeeds = [];

		if(data[4] !== 6 && data[5] !== 0) {
			device.log("Failed to get Fan RPM's", {toFile: true});
		}
		const fanCount = data[6];
		device.log(`CorsairProtocol: Device Reported [${fanCount}] Fan RPM's`);


		const fanSpeeds = data.slice(7, 7 + 2 * fanCount);

		for(let i = 0; i < fanCount; i++) {
			const fanData = fanSpeeds.splice(0, 2);
			const fanRPM = fanData[0] + (fanData[1] << 8);

			FanSpeeds[i] = fanRPM;
		}

		return FanSpeeds;
	}

	FetchFanStates() {
		device.log("CorsairProtocol: Reading Fan States.");

		// if(device.fanControlDisabled()) {
		// 	device.log("Fan Control is Disabled! Are you sure you want to try this?");

		// 	return [];
		// }

		const data = this.ReadEndpoint(this.Handles.Background, this.Endpoints.FanStates, 0x09);

		if(!data){
			device.log(`CorsairProtocol: Failed To Read Fan States.`);

			return [];
		}

		if(data[4] !== 9 || data[5] !== 0) {
			device.log("Failed to get Fan Settings", {toFile: true});

			return [];
		}

		const FanCount = data[6];
		device.log(`CorsairProtocol: Device Reported [${FanCount}] Fans`);

		const FanData = data.slice(7, 7 + FanCount);

		return FanData;
	}

	SetFanType() {
		// Configure Fan Ports to use QL Fan size grouping. 34 Leds
		const FanSettings = [0x00, 0x08, 0x06, 0x01, 0x11, 0x00, 0x00, 0x00, 0x0D, 0x00, 0x07];
		const offset = 11;

		for(let iIdx = 0; iIdx < 7; iIdx++) {
			FanSettings[offset + iIdx * 2] = 0x01;
			FanSettings[offset + iIdx * 2 + 1] = iIdx === 0 ? 0x01 : this.FanTypes.QL; // 1 for nothing, 0x08 for pump?
		}

		this.OpenHandle(this.Handles.Background, this.Endpoints.LedCount_4Pin);

		device.write(FanSettings, this.DeviceBufferSize);
		device.read([0x00], this.DeviceBufferSize);

		this.CloseHandle(this.Handles.Background);

		//sendPacketString("00 08 15 01", Device_Write_Length); //apply changes
	}

	FetchTemperatures() {
		device.log(`CorsairProtocol: Reading Temp Data.`);

		const data = this.ReadEndpoint(this.Handles.Background, this.Endpoints.TemperatureData, 0x16);

		if(!data){
			device.log(`CorsairProtocol: Failed To Read Temp Data.`);

			return [];
		}

		const ProbeTemps = [];

		if(data[4] === this.ResponseIds.temperatureData && data[5] === 0) {
			const ProbeCount = data[6];
			device.log(`CorsairProtocol: Device Reported [${ProbeCount}] Temperature Probes`);

			const TempValues = data.slice(7, 7 + 3 * ProbeCount);

			for(let i = 0; i < data[6]; i++) {
				const probe = TempValues.slice(i * 3 + 1, i * 3 + 3);
				const temp = Convert_To_16Bit(probe) / 10;

				ProbeTemps[i] = temp;
			}
		}

		return ProbeTemps;
	}
}
