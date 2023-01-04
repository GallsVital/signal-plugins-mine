

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
 * @typedef Options
 * @type {Object}
 * @property {string=} developmentFirmwareVersion
 * @property {boolean=} IsLightingController
 * @property {number=} LedChannelSpacing
 * @memberof ModernCorsairProtocol
 */
/**
 * @typedef {0 | 1 | 2 | "Lighting" | "Background" | "Auxiliary"} Handle
 * @memberof ModernCorsairProtocol
 */
/**
 * @class Corsair Bragi Protocol Class
 * Major concepts are {@link ModernCorsairProtocol#Properties|Properties} and {@link ModernCorsairProtocol#Handles|Handles}/{@link ModernCorsairProtocol#Endpoints|Endpoints}.
 *
 */
export class ModernCorsairProtocol{


	/** @constructs
	 * @param {Options} options - Options object containing device specific configuration values
	 */
	constructor(options = {}) {
		/**
		 * Use {@link ModernCorsairProtocol#GetBufferSize} instead
		 * @private
		 * */
		this.DeviceBufferSize = 1280;
		this.ConfiguredDeviceBuffer = false;

		/**
		 * @property {boolean} IsLightingController - Used to determine if lighting data is formated in a RGBRGBRGB format
		 * @property {string} developmentFirmwareVersion - Used to track the firmware version the plugin was developed with to the one on a users device
		 * @property {number} LedChannelSpacing - Used to seperate color channels on non-lighting controller devices.
		 */
		this.config = {
			IsLightingController: typeof options.IsLightingController === "boolean" ? options.IsLightingController : false,
			developmentFirmwareVersion: typeof options.developmentFirmwareVersion === "string" ? options.developmentFirmwareVersion : "Unknown",
			LedChannelSpacing: typeof options.LedChannelSpacing === "number" ? options.LedChannelSpacing : 0,
		};

		this.KeyCodes = [];
		this.KeyCount = 0;

		/**
		 * Connection Types for Wired vs Wireless connection types. This must be set to match the physical device's connection or all commands will be rejected by the device.
		 * @readonly
		 * @enum {number}
		 * @property {0x08} WiredCommand - Used for Commands when the device has a Wired connection
		 * @property {0x09} WirelessCommand - Used for Commands when the device has a Wireless connection
		 */
		this.ConnectionTypes = Object.freeze({
			WiredCommand: 0x08,
			WirelessCommand: 0x09
		});
		this.ConnectionType = this.ConnectionTypes.WiredCommand;

		/**
		 * @readonly
		 * @static
		 * @enum {number}
		 * @property {0x01} setProperty - Used to set a {@link ModernCorsairProtocol#Properties|Property} value on the device
		 * @property {0x02} getProperty - Used to fetch a {@link ModernCorsairProtocol#Properties|Property} value from the device
		 * @property {0x05} closeHandle - Used to close a device {@link ModernCorsairProtocol#Handles|Handle}
		 * @property {0x06} writeEndpoint - Used to write data to an opened device {@link ModernCorsairProtocol#Endpoints|Endpoint}.
		 * @property {0x07} streamEndpoint - Used to stream data to an opened device {@link ModernCorsairProtocol#Endpoints|Endpoint} if the data cannot fit within one packet
		 * @property {0x08} readEndpoint - Used to read data (i.e Fan Speeds) from a device {@link ModernCorsairProtocol#Endpoints|Endpoint}
		 * @property {0x09} checkHandle - Used to check the status of a device {@link ModernCorsairProtocol#Endpoints|Endpoint}. Returned data is currently unknown
		 * @property {0x0D} openEndpoint - Used to open an Endpoint on a device {@link ModernCorsairProtocol#Handles|Handle}
		 * @property {0x12} pingDevice - Used to ping the device for it's current connection status
		 * @property {0x15} confirmChange - Used to apply led count changes to Commander Core [XT]
		 */
		this.CommandIds = Object.freeze({
			setProperty: 0x01,
			getProperty: 0x02,
			closeHandle: 0x05,
			writeEndpoint: 0x06,
			streamEndpoint: 0x07,
			readEndpoint: 0x08,
			checkHandle: 0x09,
			openEndpoint: 0x0D,
			pingDevice: 0x12,
			confirmChange: 0x15
		});
		/**
		 * @enum {number}
		 * @property {0x01} - Hardware Mode
		 * @property {0x02} - Software Mode
		 */
		this.Modes = Object.freeze({
			Hardware: 0x01,
			0x01: "Hardware",
			Software: 0x02,
			0x02: "Software",
		});

		/**
		 * Contains the PropertyId's of all known Properties.
		 * The device values these represent can be read and set using the following commands:
		 * <ul style="list-style: none;">
		 * <li>{@link ModernCorsairProtocol#FetchProperty|FetchProperty(PropertyId)}
		 * <li>{@link ModernCorsairProtocol#ReadProperty|ReadProperty(PropertyId)}
		 * <li>{@link ModernCorsairProtocol#SetProperty|SetProperty(PropertyId, Value)}
		 * <li>{@link ModernCorsairProtocol#CheckAndSetProperty|CheckAndSetProperty(PropertyId, Value)}
		 * </ul>
		 *
		 * Not all Properties are available on all devices and the above functions will throw various errors if they are unsupported, or given invalid values.
		 * Any properties with [READONLY] are constant can only be read from the device and not set by the user.
		 * Properties with [FLASH] are saved to the devices eeprom memory and will persist between power cycles.
		 *
		 * @readonly
		 * @enum {number} Properties
		 * @property {0x01} pollingRate Device's Hardware Polling rate
		 * @property {0x02} brightness Device's Hardware Brightness level in the range 0-1000 [FLASH]
		 * @property {0x03} mode Device Mode [Software/Hardware] PropertyId
		 * @property {0x07} angleSnap Angle Snapping PropertyId. Only used for mice. [FLASH]
		 * @property {0x0D} idleMode Device Idle Mode Toggle PropertyId. Only effects wireless devices.
		 * @property {0x0F} batteryLevel Device Battery Level PropertyID. Uses a 0-1000 Range. [READONLY]
		 * @property {0x10} batteryStatus Device Charging State PropertyID. [READONLY]
		 * @property {0x11} vid Device VendorID PropertyID. [READONLY]
		 * @property {0x12} pid Device ProductID PropertyID. [READONLY]
		 * @property {0x13} firmware Device Firmware PropertyID. [READONLY]
		 * @property {0x14} BootLoaderFirmware Device BootLoader Firmware PropertyID. [READONLY]
		 * @property {0x15} WirelessChipFirmware Device Wireless Chip Firmware PropertyID. [READONLY]
		 * @property {0x1E} dpiProfile Device Current DPI Profile Index PropertyID. Dark Core Pro SE uses a 0-3 Range.
		 * @property {0x1F} dpiMask
		 * @property {0x21} dpiX Device's Current X DPI PropertyID
		 * @property {0x22} dpiY Device's Current Y DPI PropertyID.
		 * @property {0x37} idleModeTimeout Device's Idle Timeout PropertyId. Value is in Milliseconds and has a max of 99 Minutes.
		 * @property {0x41} layout Device's Physical Layout PropertyId. Only applies to Keyboards.
		 * @property {0x44} BrightnessLevel Coarse (0-3) Brightness. Effectively sets brightness in 33.33% increments.
		 * @property {0x45} WinLockState Device's WinKey Lock Status. Only applies to Keyboards.
		 * @property {0x4A} LockedShortcuts Device's WinKey Lock Bit flag. Governs what key combinations are disabled by the devices Lock mode. Only Applies to Keyboards.
		 * @property {0x96} maxPollingRate Device's Max Polling Rate PropertyId. Not supported on all devices.
		 * @property {0xB0} ButtonResponseOptimization
		 */

		this.Properties =  Object.freeze({
			pollingRate: 0x01,
			brightness: 0x02,
			mode: 0x03,
			angleSnap: 0x07,
			idleMode: 0x0d,
			batteryLevel: 0x0F,
			batteryStatus: 0x10,
			vid: 0x11,
			pid: 0x12,
			firmware:0x13,
			BootLoaderFirmware: 0x14,
			WirelessChipFirmware: 0x15,
			dpiProfile: 0x1E,
			dpiMask: 0x1F,
			dpiX: 0x21,
			dpiY: 0x22,
			idleModeTimeout: 0x37,
			layout: 0x41,
			BrightnessLevel: 0x44,
			WinLockState: 0x45,
			LockedShortcuts: 0x4A,
			maxPollingRate: 0x96,
			ButtonResponseOptimization: 0xB0,
		});

		this.PropertyNames = Object.freeze({
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
		});

		/**
		 * Contains the EndpointId's of all known Endpoints. These handle advanced device functions like Lighting and Fan Control.
		 * To manually interact with these you must open a Handle to the Endpoint first using {@link ModernCorsairProtocol#OpenHandle|OpenHandle(HandleId, EndpointId)}.
		 *
		 * Helper Functions to interact with these exist as the following:
		 * <ul style="list-style: none;">
		 * <li> {@link ModernCorsairProtocol#WriteEndpoint|WriteEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#ReadEndpoint|ReadEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#CloseHandle|CloseHandle(HandleId)}
		 * <li> {@link ModernCorsairProtocol#CheckHandle|CheckHandle(HandleId)}
		 * </ul>
		 *
		 * @enum {number} Endpoints
		 * @property {0x01} Lighting
		 * @property {0x02} Buttons
		 * @property {0x05} PairingID
		 * @property {0x17} FanRPM
		 * @property {0x18} FanSpeeds
		 * @property {0x1A} FanStates
		 * @property {0x1D} LedCount_3Pin
		 * @property {0x1E} LedCount_4Pin
		 * @property {0x21} TemperatureData
		 * @property {0x22} LightingController
		 * @property {0x27} ErrorLog
		 */
		this.Endpoints = Object.freeze({
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
		});

		this.EndpointNames = Object.freeze({
			0x01: "Lighting",
			0x02: "Buttons",
			0x17: "Fan RPMs",
			0x08: "Fan Speeds",
			0x1A: "Fan States",
			0x1D: "3Pin Led Count",
			0x1E: "4Pin Led Count",
			0x21: "Temperature Probes",
			0x22: "Lighting Controller",
		});

		this.ChargingStates = Object.freeze({
			1: "Charging",
			2: "Discharging",
			3: "Fully Charged",
		});


		this.ResponseIds = Object.freeze({
			firmware: 0x02,
			command: 0x06,
			openEndpoint: 0x0D,
			closeEndpoint: 0x05,
			getRpm: 0x06,
			fanConfig: 0x09,
			temperatureData: 0x10,
			LedConfig: 0x0F,
		});

		/**
		 * Contains the HandleId's of usable device Handles. These are used to open internal device {@link ModernCorsairProtocol#Endpoints|Endpoint} foradvanced functions like Lighting and Fan Control.
		 * Each Handle can only be open for one {@link ModernCorsairProtocol#Endpoints|Endpoint} at a time, and must be closed before the {@link ModernCorsairProtocol#Endpoints|Endpoint} can be changed.
		 * For best practice all non-lighting Handles should be closed immediately after you are done interacting with it.
		 *
		 * Auxiliary (0x02) Should only be needed in very specific cases.
		 *
		 * Helper Functions to interact with these exist as the following:
		 * <ul style="list-style: none;">
		 * <li> {@link ModernCorsairProtocol#WriteEndpoint|WriteEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#ReadEndpoint|ReadEndpoint(HandleId, EndpointId, CommandId)}
		 * <li> {@link ModernCorsairProtocol#CloseHandle|CloseHandle(HandleId)}
		 * <li> {@link ModernCorsairProtocol#CheckHandle|CheckHandle(HandleId)}
		 * </ul>
		 */
		this.Handles = Object.freeze({
			Lighting: 0x00,
			Background: 0x01,
			Auxiliary: 0x02,
		});

		this.HandleNames = Object.freeze({
			0x00: "Lighting",
			0x01: "Background",
			0x02: "Auxiliary"
		});
		/**
		 * Contains the values of all known Fan States. These are returned by {@link ModernCorsairProtocol#FetchFanStates|FetchFanStates}
		 * @enum {number} Endpoints
		 * @property {0x01} Disconnected - This fan Fan Port is empty and has no connected fan.
		 * @property {0x04} Initializing - The state of this Fan Port is still being determined by the device. You should rescan in a few seconds.
		 * @property {0x07} Connected - A Fan a connected to this Port
		 */
		this.FanStates = Object.freeze({
			Disconnected: 0x01,
			Initializing: 0x04,
			Connected: 0x07,
		});

		this.FanTypes = Object.freeze({
			QL: 0x06,
			SpPro: 0x05
		});

		this.PollingRates = Object.freeze({
			1: "125hz",
			2: "250hz",
			3: "500hz",
			4: "1000hz",
			5: "2000hz",
		});

		this.PollingRateNames = Object.freeze({
			"125hz": 1,
			"250hz": 2,
			"500hz": 3,
			"1000hz": 4,
			"2000hz": 5,
		});

		this.Layouts = Object.freeze({
			0x01: "ANSI",
			"ANSI" : 0x01,
			0x02: "ISO",
			"ISO": 0x02
		});

		this.KeyStates = Object.freeze({
			Disabled: 0,
			0: "Disabled",
			Enabled: 1,
			1: "Enabled",
		});
	}


	GetNameOfHandle(Handle){
		if(this.HandleNames.hasOwnProperty(Handle)){
			return this.HandleNames[Handle];
		}

		return "Unknown Handle";
	}
	/** Logging wrapper to prepend the proper context to anything logged within this class. */
	log(Message){
	//device.log(`CorsairProtocol:` + Message);
		device.log(Message);
	}
	/**
	 * This Function sends a device Ping request and returns if the ping was successful.
	 *
	 * This function doesn't seem to affect the devices functionality, but iCUE pings all BRAGI devices every 52 seconds.
	 * @returns {boolean} - Boolean representing Ping Success
	 */
	PingDevice(){
		let packet = [0x00, this.ConnectionType, this.CommandIds.pingDevice];
		device.write(packet, this.GetBufferSize());
		packet = device.read(packet, this.GetBufferSize());

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

		this.WriteEndpoint("Background", this.Endpoints.Buttons, this.KeyCodes);
	}

	SetSingleKey(KeyID, Enabled){
		this.KeyCodes[KeyID - 1] = Enabled;

		this.WriteEndpoint("Background", this.Endpoints.Buttons, this.KeyCodes);
	}

	/**
	 * This function can be used to manually set the devices buffer length instead of attempting auto detection. This value must be set for any other functions in this Protocol to work.
	 * @param {number} BufferSize Desired buffer size in bytes.
	 */
	SetDeviceBufferSize(BufferSize){
		this.DeviceBufferSize = BufferSize;
		this.ConfiguredDeviceBuffer = true;
	}
	/** Calling this function to get the write/read length will auto detect it the first time its needed if it hasn't been detected yet.*/
	GetBufferSize(){
		if(!this.ConfiguredDeviceBuffer){
			this.FindBufferLength();
		}

		return this.DeviceBufferSize;
	}
	/**
	 * Finds and sets the device's buffer size for internal use within the Protocol. This should be the first function called when using this Protocol class as all other interactions with the device rely on the buffer size being set properly.
	 *
	 * This is automatically called on the first write operation, or can be set manually by {@link ModernCorsairProtocol#SetDeviceBufferSize|SetDeviceBufferSize(BufferSize)}.
	 */
	FindBufferLength(){
		if(this.DeviceBufferSize === 1280 || !this.ConfiguredDeviceBuffer){
			this.log(`Device Buffer Length Unknown. Attempting to read it from device!`);

			// Using a proxy Device Ping request to get a packet to read. Write length is a placeholder value as we're relying on HidAPI
			// to sort out the proper write length.
			device.write([0x00, this.ConnectionType, this.CommandIds.pingDevice], 1024);
			device.read([0x00], 1024);

			const ReadLength = device.getLastReadSize();

			if(ReadLength !== 0){
				this.DeviceBufferSize = ReadLength;
				this.log(`Buffer length set to ${this.DeviceBufferSize}`);
				this.ConfiguredDeviceBuffer = true;

				return;
			}

			this.log(`Failed to read from the device. We'll attempt to refetch write/read lengths later...`);
		}
	}
	/**
	 * Helper function to read and properly format the device's firmware version.
	 */
	FetchFirmware(){
		const data = this.ReadProperty(this.Properties.firmware);

		if(this.CheckError(data, "FetchFirmware")){
			return "Unknown";
		}

		const firmwareString = `${data[4]}.${data[5]}.${data[6]}`;
		device.log(`Firmware Version: [${firmwareString}]`, {toFile: true});

		if(this.config.developmentFirmwareVersion !== "Unknown"){
			device.log(`Developed on Firmware [${this.config.developmentFirmwareVersion}]`, {toFile: true});
		}

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
	 * @returns [number, number] An array containing [Battery Level, Charging State]
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
	 * @returns {number} An Error Code if the Data packet contained an error, otherwise 0.
	 */
	CheckError(Data, Context){
		const hasError = Data[3] ?? false;

		if(!hasError){
			return hasError;
		}

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


		return hasError;
	}
	/**
	 * Helper Function to Read a Property from the device, Check its value, and Set it on the device if they don't match.
	 * 	@param {number|string} PropertyId Property Index to be checked and set on the device. This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
	 * 	@param {number} Value The Value to be checked against and set if the device's value doesn't match.
	 *  @return {boolean} a Boolean on if the Property value on the device did match, or now matches the value desired.
	 */
	CheckAndSetProperty(PropertyId, Value){
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.PropertyNames, PropertyId);
		}

		const CurrentValue = this.FetchProperty(PropertyId);

		if(CurrentValue !== Value){
			device.log(`Device ${this.PropertyNames[PropertyId]} is currently [${CurrentValue}]. Desired Value is [${Value}]. Setting Property!`);

			this.SetProperty(PropertyId, Value);
			device.read([0x00], this.GetBufferSize(), 5);

			const NewValue = this.FetchProperty(PropertyId);
			device.log(`Device ${this.PropertyNames[PropertyId]} is now [${NewValue}]`);

			return NewValue === Value;
		}

		return true;
	}

	/**
	 * Reads a property from the device and returns the joined value after combining any high/low bytes. This function can return a null value if it's unable to read the property; i.e. it's unavailable on this device.
	 * @param {number | string } PropertyId Property Index to be read from the device. This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
	 * @returns The joined value, or undefined if the device fetch failed.
	 */
	FetchProperty(PropertyId) {
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.PropertyNames, PropertyId);
		}

		const data = this.ReadProperty(PropertyId);

		// Don't return error codes.
		if(data.length === 0){
			return -1;
		}

		return Convert_To_16Bit(data.slice(4, 7));
	}

	/**
	 * Attempts to sets a property on the device and returns if the operation was a success.
	 * @param {number|string} PropertyId Property Index to be written to on the device. This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
	 * @param {number} Value The Value to be set.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	SetProperty(PropertyId, Value) {
		if(typeof PropertyId === "string"){
			PropertyId = getKeyByValue(this.PropertyNames, PropertyId);
		}

		let packet = [0x00, this.ConnectionType, this.CommandIds.setProperty, PropertyId, 0x00, (Value & 0xFF), (Value >> 8 & 0xFF), (Value >> 16 & 0xFF)];
		device.write(packet, this.GetBufferSize());
		packet = device.read(packet, this.GetBufferSize());

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
	 * @param {number} PropertyId Property Index to be read from the device.  This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
	 * @returns The packet data read from the device.
	 */
	ReadProperty(PropertyId) {
	//Clear read buffer
		do{
			device.read([0x00], 65, 3);
		}while(device.getLastReadSize() > 0);

		let packet = [0x00, this.ConnectionType, this.CommandIds.getProperty, PropertyId, 0x00];
		device.write(packet, this.GetBufferSize());
		packet = device.read(packet, this.GetBufferSize());

		const ErrorCode = this.CheckError(packet, `ReadProperty`);

		if(ErrorCode){
			device.log(`Failed to read Property [${this.PropertyNames[PropertyId]}, ${decimalToHex(PropertyId, 2)}]. Are you sure it's supported?`);

			return [];
		}

		return packet;
	}

	/**
	 * Opens a Endpoint on the device. Only one Endpoint can be open on a Handle at a time so if the handle is already open this function will fail.
	 * @param {Handle} Handle The Handle to open the Endpoint on. Default is 0.
	 * @param {number} Endpoint Endpoint Address to be opened.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	OpenHandle(Handle, Endpoint) {
		if(typeof Handle === "string"){
			Handle = this.Handles[Handle];
		}
		let packet = [0x00, this.ConnectionType, this.CommandIds.openEndpoint, Handle, Endpoint];
		device.write(packet, this.GetBufferSize());
		packet = device.read(packet, this.GetBufferSize());

		const ErrorCode = this.CheckError(packet, `OpenEndpoint`);

		if(ErrorCode){
			device.log(`Failed to open Endpoint [${this.EndpointNames[Endpoint]}, ${decimalToHex(Endpoint, 2)}] on Handle [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}]. Are you sure it's supported and wasn't already open?`);
		}

		return ErrorCode;
	}
	/**
	 * Closes a Handle on the device.
	 * @param {Handle} Handle The HandleId to Close.
	 * @returns 0 on success, otherwise an error code from the device.
	 */
	CloseHandle(Handle) {
		if(typeof Handle === "string"){
			Handle = this.Handles[Handle];
		}
		let packet = [0x00, this.ConnectionType, this.CommandIds.closeHandle, 1, Handle];
		device.write(packet, this.GetBufferSize());
		packet = device.read(packet, this.GetBufferSize());

		const ErrorCode = this.CheckError(packet, `CloseEndpoint`);

		if(ErrorCode){
			device.log(`Failed to close Handle [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}]. was it even open?`);
		}

		return ErrorCode;
	}
	/**
	 * Helper function to Check the Handle is currently open and closes it if it is.
	 * @param {Handle} Handle - HandleId to perform the check on.
	 */
	CloseHandleIfOpen(Handle){
		if(typeof Handle === "string"){
			Handle = this.Handles[Handle];
		}

		if(this.IsHandleOpen(Handle)){
			device.log(`${this.GetNameOfHandle(Handle)} Handle is open. Closing...`);
			this.CloseHandle(Handle);
		}
	}

	/**
	 * Performs a Check Command on the HandleId given and returns whether the handle is open.
	 * @param {Handle} Handle - HandleId to perform the check on.
	 * @returns {Boolean} Boolean representing if the Handle is already open.
	 */
	IsHandleOpen(Handle){
		if(typeof Handle === "string"){
			Handle = this.Handles[Handle];
		}
		let packet = [0x00, this.ConnectionType, this.CommandIds.checkHandle, Handle, 0x00];
		device.read(packet, this.GetBufferSize());
		device.write(packet, this.GetBufferSize());
		packet = device.read(packet, this.GetBufferSize());

		const isOpen = packet[3] !== 3;

		return isOpen;

	}
	/**
	 * Performs a Check Command on the HandleId given and returns the packet from the device.
	 * This function will return an Error Code if the Handle is not open.
	 * The Format of the returned packet is currently not understood.
	 * @param {Handle} Handle - HandleId to perform the check on.
	 * @returns The packet read from the device on success. Otherwise and Error Code.
	 * @Deprecated IsHandleOpen should be used in place of this function.
	 */
	CheckHandle(Handle){
		if(typeof Handle === "string"){
			Handle = this.Handles[Handle];
		}
		let packet = [0x00, this.ConnectionType, this.CommandIds.checkHandle, Handle, 0x00];
		device.write(packet, this.GetBufferSize());
		packet = device.read(packet, this.GetBufferSize());

		const ErrorCode = this.CheckError(packet, `CheckHandle`);

		if(ErrorCode){
			this.CloseHandle(Handle);
			device.log(`Failed to check Handle [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}]. Did you open it?`);

			return ErrorCode;
		}

		return packet;
	}
	/**
	 * This Helper Function will Open, Read, and Close a device Handle for the Endpoint given.
	 * If the read packet does not contain the ResponseId given the packet will be reread up to 4 times before giving up and returning the last packet read.
	 * If the Handle given is currently open this function will close it and then re-attempt opening it.
	 * @param {Handle} Handle - Handle to be used.
	 * @param {number} Endpoint - Endpoint to be read from
	 * @param {number} Command - CommandId that is contained in the return packet to verify the correct packet was read from the device.
	 * @returns The entire packet read from the device.
	 */
	ReadEndpoint(Handle, Endpoint, Command) {
		if(typeof Handle === "string"){
			Handle = this.Handles[Handle];
		}

		if(this.IsHandleOpen(Handle)){
			device.log(`CorsairProtocol: Handle is already open: [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}]. Attemping to close...`);
			this.CloseHandle(Handle);
		}

		const ErrorCode = this.OpenHandle(Handle, Endpoint);

		if(ErrorCode){
			this.CloseHandle(Handle);
			device.log(`CorsairProtocol: Failed to open Device Handle [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}]. Aborting ReadEndpoint operation.`);

			return [];
		}

		device.write([0x00, this.ConnectionType, this.CommandIds.readEndpoint, Handle], this.GetBufferSize());

		let Data = [];
		Data = device.read([0x00], this.GetBufferSize());

		let RetryCount = 4;

		do {
			RetryCount--;
			device.write([0x00, this.ConnectionType, this.CommandIds.readEndpoint, Handle], this.GetBufferSize());
			Data = device.read(Data, this.GetBufferSize());

			if(this.ResponseIds[Data[4]] !== this.ResponseIds[Command]) {
				device.log(`Invalid Command Read: Got [${this.ResponseIds[Data[2]]}][${Data[4]}], Wanted [${this.ResponseIds[Command]}][${Command}]`);
			}

		} while(this.ResponseIds[Data[4]] !== this.ResponseIds[Command] && RetryCount > 0);

		this.CloseHandle(Handle);

		return Data;
	}
	/**
	 * This Helper Function will Open, Write to, and Close a device Handle for the Endpoint given.
	 *
	 * This function will handle setting the header data expected by the device. If the Data Array Length provided doesn't match what the device's endpoint is expecting the operation will Error.
	 *
	 * If the Handle given is currently open this function will close it and then re-attempt opening it.
	 * @param {Handle} Handle - HandleId to be used.
	 * @param {number} Endpoint - EndpointId to be written too.
	 * @param {number[]} Data - Data to be written to the Endpoint.
	 * @returns {number} 0 on success, otherwise an error code value.
	 */
	WriteEndpoint(Handle, Endpoint, Data) {
		if(typeof Handle === "string"){
			Handle = this.Handles[Handle];
		}

		if(this.IsHandleOpen(Handle)){
			device.log(`CorsairProtocol: Handle is already open: [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}]. Attemping to close...`);

			this.CloseHandle(Handle);
		}

		let ErrorCode = this.OpenHandle(Handle, Endpoint);

		if(ErrorCode){
			device.log(`CorsairProtocol: Failed to open Device Handle [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}]. Aborting WriteEndpoint operation.`);

			return ErrorCode;
		}

		let packet = [0x00, this.ConnectionType, this.CommandIds.writeEndpoint, Handle, Data.length & 0xff, (Data.length >> 8) & 0xFF, 0x00, 0x00];
		packet.push(...Data);

		device.write(packet, this.GetBufferSize());
		// Extra read to skip an empty packet.
		device.read([0x00], this.GetBufferSize());

		packet = device.read([0x00], this.GetBufferSize());

		ErrorCode = this.CheckError(packet, `WriteEndpoint`);

		if(ErrorCode){
			device.log(`Failed to Write to Handle [${this.GetNameOfHandle(Handle)}, ${decimalToHex(Handle, 2)}].`);
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
		if(this.config.IsLightingController){
			RGBData.splice(0, 0, ...[0x12, 0x00]);
		}

		let TotalBytes = RGBData.length;
		const InitialPacketSize = this.GetBufferSize() - InitialHeaderSize;

		this.WriteLighting(RGBData.length, RGBData.splice(0, InitialPacketSize));

		TotalBytes -= InitialPacketSize;
		BytesSent += InitialPacketSize;

		while(TotalBytes > 0){
			const BytesToSend = Math.min(this.GetBufferSize() - HeaderSize, TotalBytes);
			this.StreamLighting(RGBData.splice(0, BytesToSend));

			TotalBytes -= BytesToSend;
			BytesSent += BytesToSend;
		}
	}
	/**
	 * @private
	 */
	WriteLighting(LedCount, RGBData){

		const packet = [];
		packet[0x00] = 0x00;
		packet[0x01] = this.ConnectionType;
		packet[0x02] = this.CommandIds.writeEndpoint;
		packet[0x03] = 0x00;
		packet[0x04] = (LedCount) & 0xFF;
		packet[0x05] = (LedCount) >> 8;
		packet[0x06] = 0x00;
		packet[0x07] = 0x00;

		packet.push(...RGBData);

		device.write(packet, this.GetBufferSize());

		const response = device.read([0x00], this.GetBufferSize());

		this.CheckError(response, "WriteLighting");
	}

	/**
	 * @private
	 */
	StreamLighting(RGBData) {

		const packet = [];
		packet[0x00] = 0x00;
		packet[0x01] = this.ConnectionType;
		packet[0x02] = this.CommandIds.streamEndpoint;
		packet[0x03] = 0x00;
		packet.push(...RGBData);

		device.write(packet, this.GetBufferSize());

		const response = device.read([0x00], this.GetBufferSize());

		this.CheckError(response, "StreamLighting");
	}

	/**
	 * Helper Function to Fetch and Set the devices mode. This function will close all currently open Handles on the device to ensure a clean slate and to prevent issues interacting with the device.
	 * Closing Handles in this function leads to iCUE not being able to function anymore, but solves issues with us not being able to find an open handle when trying to access non-lighting endpoints.
	 * @param {number | "Hardware" | "Software"} Mode ModeId to be checks against and set on the device.
	 */
	SetMode(Mode){
		if(typeof Mode === "string"){
			Mode = this.Modes[Mode];
		}

		let CurrentMode = this.FetchProperty(this.Properties.mode);

		// if going into hardware mode we want to close all handles.
		// if going into software mode we don't want any handles stuck open from Icue or the file watchdog trigger.
		this.CloseHandleIfOpen("Lighting");
		this.CloseHandleIfOpen("Background");
		this.CloseHandleIfOpen("Auxiliary");

		if(CurrentMode !== Mode) {
			device.log(`Setting Device Mode to ${this.Modes[Mode]}`);
			this.SetProperty(this.Properties.mode, Mode);
			CurrentMode = this.FetchProperty(this.Properties.mode);
			device.log(`Mode is now ${this.Modes[CurrentMode]}`);
		}
	}

	/**
	 * Helper function to set the Hardware level device brightness if it is different then the Brightness value provided. This property is saved to flash.
	 * @param {number} Brightness Brightness Value to be set in the range of 0-1000
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
	 * @param {boolean} AngleSnapping boolean Status to be set for Angle Snapping.
	 */
	SetAngleSnapping(AngleSnapping){
		const HardwareAngleSnap =  this.FetchProperty(this.Properties.angleSnap);

		if(HardwareAngleSnap !== AngleSnapping){
			device.log(`Device Angle Snapping is set to [${HardwareAngleSnap ? "True" : "False"}]`);

			this.SetProperty(this.Properties.angleSnap, AngleSnapping);

			const NewAngleSnap = this.FetchProperty(this.Properties.angleSnap);
			device.log(`Device Angle Snapping is now [${NewAngleSnap ? "True" : "False"}]`);
		}
	}

	/** */
	FetchFanRPM() {
	//device.log("CorsairProtocol: Reading Fan RPM's.");

		if(device.fanControlDisabled()) {
			device.log("Fan Control is Disabled! Are you sure you want to try this?");

			return [];
		}

		const data = this.ReadEndpoint("Background", this.Endpoints.FanRPM, 0x06);

		if(data.length === 0){
			device.log(`CorsairProtocol: Failed To Read Fan RPM's.`);

			return [];
		}

		const FanSpeeds = [];

		if(data[4] !== 6 && data[5] !== 0) {
			device.log("Failed to get Fan RPM's");
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
	/** */
	FetchFanStates() {
	//device.log("CorsairProtocol: Reading Fan States.");

		// if(device.fanControlDisabled()) {
		// 	device.log("Fan Control is Disabled! Are you sure you want to try this?");

		// 	return [];
		// }

		const data = this.ReadEndpoint("Background", this.Endpoints.FanStates, 0x09);

		if(data.length === 0){
			device.log(`CorsairProtocol: Failed To Read Fan States.`);

			return [];
		}

		if(data[4] !== 9 || data[5] !== 0) {
			device.log("Failed to get Fan Settings", {toFile: true});

			return [];
		}

		const FanCount = data[6];
		//device.log(`CorsairProtocol: Device Reported [${FanCount}] Fans`);

		const FanData = data.slice(7, 7 + FanCount);

		return FanData;
	}
	/** */
	SetFanType() {
	// Configure Fan Ports to use QL Fan size grouping. 34 Leds
		const FanSettings = [0x00, 0x08, 0x06, 0x01, 0x11, 0x00, 0x00, 0x00, 0x0D, 0x00, 0x07];
		const offset = 11;

		for(let iIdx = 0; iIdx < 7; iIdx++) {
			FanSettings[offset + iIdx * 2] = 0x01;
			FanSettings[offset + iIdx * 2 + 1] = iIdx === 0 ? 0x01 : this.FanTypes.QL; // 1 for nothing, 0x08 for pump?
		}

		this.OpenHandle("Background", this.Endpoints.LedCount_4Pin);

		device.write(FanSettings, this.GetBufferSize());
		device.read([0x00], this.GetBufferSize());

		this.CloseHandle("Background");

	//sendPacketString("00 08 15 01", Device_Write_Length); //apply changes
	}
	/** */
	FetchTemperatures() {
	//device.log(`CorsairProtocol: Reading Temp Data.`);

		const data = this.ReadEndpoint("Background", this.Endpoints.TemperatureData, 0x16);

		if(data.length === 0){
			device.log(`CorsairProtocol: Failed To Read Temp Data.`);

			return [];
		}

		const ProbeTemps = [];

		if(data[4] === this.ResponseIds.temperatureData && data[5] === 0) {
			const ProbeCount = data[6];
			//device.log(`CorsairProtocol: Device Reported [${ProbeCount}] Temperature Probes`);

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
