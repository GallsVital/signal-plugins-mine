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
export class ModernCorsairProtocol {
    /** @constructs
     * @param {Options} options - Options object containing device specific configuration values
     */
    constructor(options?: Options);
    DeviceBufferSize: number;
    ConfiguredDeviceBuffer: boolean;
    /**
     * @property {boolean} IsLightingController - Used to determine if lighting data is formated in a RGBRGBRGB format
     * @property {string} developmentFirmwareVersion - Used to track the firmware version the plugin was developed with to the one on a users device
     * @property {number} LedChannelSpacing - Used to seperate color channels on non-lighting controller devices.
     */
    config: {
        IsLightingController: boolean;
        developmentFirmwareVersion: string;
        LedChannelSpacing: number;
    };
    KeyCodes: any[];
    KeyCount: number;
    /**
     * Connection Types for Wired vs Wireless connection types. This must be set to match the physical device's connection or all commands will be rejected by the device.
     * @readonly
     * @enum {number}
     * @property {0x08} WiredCommand - Used for Commands when the device has a Wired connection
     * @property {0x09} WirelessCommand - Used for Commands when the device has a Wireless connection
     */
    readonly ConnectionTypes: Readonly<{
        WiredCommand: 8;
        WirelessCommand: 9;
    }>;
    ConnectionType: 8;
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
    readonly CommandIds: Readonly<{
        setProperty: 1;
        getProperty: 2;
        closeHandle: 5;
        writeEndpoint: 6;
        streamEndpoint: 7;
        readEndpoint: 8;
        checkHandle: 9;
        openEndpoint: 13;
        pingDevice: 18;
        confirmChange: 21;
    }>;
    /**
     * @enum {number}
     * @property {0x01} - Hardware Mode
     * @property {0x02} - Software Mode
     */
    Modes: Readonly<{
        Hardware: 1;
        1: "Hardware";
        Software: 2;
        2: "Software";
    }>;
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
    readonly Properties: Readonly<{
        pollingRate: 1;
        brightness: 2;
        mode: 3;
        angleSnap: 7;
        idleMode: 13;
        batteryLevel: 15;
        batteryStatus: 16;
        vid: 17;
        pid: 18;
        firmware: 19;
        BootLoaderFirmware: 20;
        WirelessChipFirmware: 21;
        dpiProfile: 30;
        dpiMask: 31;
        dpiX: 33;
        dpiY: 34;
        idleModeTimeout: 55;
        layout: 65;
        BrightnessLevel: 68;
        WinLockState: 69;
        LockedShortcuts: 74;
        maxPollingRate: 150;
        ButtonResponseOptimization: 176;
    }>;
    PropertyNames: Readonly<{
        1: "Polling Rate";
        2: "HW Brightness";
        3: "Mode";
        7: "Angle Snapping";
        13: "Idle Mode";
        15: "Battery Level";
        16: "Battery Status";
        17: "Vendor Id";
        18: "Product Id";
        19: "Firmware Version";
        30: "DPI Profile";
        31: "DPI Mask";
        33: "DPI X";
        34: "DPI Y";
        55: "Idle Mode Timeout";
        65: "HW Layout";
        150: "Max Polling Rate";
    }>;
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
    Endpoints: Readonly<{
        Lighting: 1;
        Buttons: 2;
        PairingID: 5;
        FanRPM: 23;
        FanSpeeds: 24;
        FanStates: 26;
        LedCount_3Pin: 29;
        LedCount_4Pin: 30;
        TemperatureData: 33;
        LightingController: 34;
        ErrorLog: 39;
    }>;
    EndpointNames: Readonly<{
        1: "Lighting";
        2: "Buttons";
        23: "Fan RPMs";
        8: "Fan Speeds";
        26: "Fan States";
        29: "3Pin Led Count";
        30: "4Pin Led Count";
        33: "Temperature Probes";
        34: "Lighting Controller";
    }>;
    ChargingStates: Readonly<{
        1: "Charging";
        2: "Discharging";
        3: "Fully Charged";
    }>;
    ResponseIds: Readonly<{
        firmware: 2;
        command: 6;
        openEndpoint: 13;
        closeEndpoint: 5;
        getRpm: 6;
        fanConfig: 9;
        temperatureData: 16;
        LedConfig: 15;
    }>;
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
    Handles: Readonly<{
        Lighting: 0;
        Background: 1;
        Auxiliary: 2;
    }>;
    HandleNames: Readonly<{
        0: "Lighting";
        1: "Background";
        2: "Auxiliary";
    }>;
    /**
     * Contains the values of all known Fan States. These are returned by {@link ModernCorsairProtocol#FetchFanStates|FetchFanStates}
     * @enum {number} Endpoints
     * @property {0x01} Disconnected - This fan Fan Port is empty and has no connected fan.
     * @property {0x04} Initializing - The state of this Fan Port is still being determined by the device. You should rescan in a few seconds.
     * @property {0x07} Connected - A Fan a connected to this Port
     */
    FanStates: Readonly<{
        Disconnected: 1;
        Initializing: 4;
        Connected: 7;
    }>;
    FanTypes: Readonly<{
        QL: 6;
        SpPro: 5;
    }>;
    PollingRates: Readonly<{
        1: "125hz";
        2: "250hz";
        3: "500hz";
        4: "1000hz";
        5: "2000hz";
    }>;
    PollingRateNames: Readonly<{
        "125hz": 1;
        "250hz": 2;
        "500hz": 3;
        "1000hz": 4;
        "2000hz": 5;
    }>;
    Layouts: Readonly<{
        1: "ANSI";
        ANSI: 1;
        2: "ISO";
        ISO: 2;
    }>;
    KeyStates: Readonly<{
        Disabled: 0;
        0: "Disabled";
        Enabled: 1;
        1: "Enabled";
    }>;
    GetNameOfHandle(Handle: any): any;
    /** Logging wrapper to prepend the proper context to anything logged within this class. */
    log(Message: any): void;
    /**
     * This Function sends a device Ping request and returns if the ping was successful.
     *
     * This function doesn't seem to affect the devices functionality, but iCUE pings all BRAGI devices every 52 seconds.
     * @returns {boolean} - Boolean representing Ping Success
     */
    PingDevice(): boolean;
    SetKeyStates(Enabled: any): void;
    SetSingleKey(KeyID: any, Enabled: any): void;
    /**
     * This function can be used to manually set the devices buffer length instead of attempting auto detection. This value must be set for any other functions in this Protocol to work.
     * @param {number} BufferSize Desired buffer size in bytes.
     */
    SetDeviceBufferSize(BufferSize: number): void;
    /** Calling this function to get the write/read length will auto detect it the first time its needed if it hasn't been detected yet.*/
    GetBufferSize(): number;
    /**
     * Finds and sets the device's buffer size for internal use within the Protocol. This should be the first function called when using this Protocol class as all other interactions with the device rely on the buffer size being set properly.
     *
     * This is automatically called on the first write operation, or can be set manually by {@link ModernCorsairProtocol#SetDeviceBufferSize|SetDeviceBufferSize(BufferSize)}.
     */
    FindBufferLength(): void;
    /**
     * Helper function to read and properly format the device's firmware version.
     */
    FetchFirmware(): string;
    /**
     * Helper function to set the devices current DPI. This will set the X and Y DPI values to the provided value.
     * @param {number} DPI Desired DPI value to be set.
     */
    SetDPI(DPI: number): void;
    /**
     * Helper function to grab the devices battery level and charge state. Battery Level is on a scale of 0-1000.
     * @returns [number, number] An array containing [Battery Level, Charging State]
     */
    FetchBatteryStatus(): number[];
    /**
     *
     * @param {number[]} Data - Data packet read from the device.
     * @param {string} Context - String representing the calling location.
     * @returns {number} An Error Code if the Data packet contained an error, otherwise 0.
     */
    CheckError(Data: number[], Context: string): number;
    /**
     * Helper Function to Read a Property from the device, Check its value, and Set it on the device if they don't match.
     * 	@param {number|string} PropertyId Property Index to be checked and set on the device. This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
     * 	@param {number} Value The Value to be checked against and set if the device's value doesn't match.
     *  @return {boolean} a Boolean on if the Property value on the device did match, or now matches the value desired.
     */
    CheckAndSetProperty(PropertyId: number | string, Value: number): boolean;
    /**
     * Reads a property from the device and returns the joined value after combining any high/low bytes. This function can return a null value if it's unable to read the property; i.e. it's unavailable on this device.
     * @param {number | string } PropertyId Property Index to be read from the device. This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
     * @returns The joined value, or undefined if the device fetch failed.
     */
    FetchProperty(PropertyId: number | string): number;
    /**
     * Attempts to sets a property on the device and returns if the operation was a success.
     * @param {number|string} PropertyId Property Index to be written to on the device. This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
     * @param {number} Value The Value to be set.
     * @returns 0 on success, otherwise an error code from the device.
     */
    SetProperty(PropertyId: number | string, Value: number): 0 | 1 | 3 | 9;
    /**
     * Reads a property from the device and returns the raw packet.
     * @param {number} PropertyId Property Index to be read from the device.  This value can either be the {@link ModernCorsairProtocol#Properties|PropertyId}, or the readable string version of it.
     * @returns The packet data read from the device.
     */
    ReadProperty(PropertyId: number): number[];
    /**
     * Opens a Endpoint on the device. Only one Endpoint can be open on a Handle at a time so if the handle is already open this function will fail.
     * @param {Handle} Handle The Handle to open the Endpoint on. Default is 0.
     * @param {number} Endpoint Endpoint Address to be opened.
     * @returns 0 on success, otherwise an error code from the device.
     */
    OpenHandle(Handle: Handle, Endpoint: number): number;
    /**
     * Closes a Handle on the device.
     * @param {Handle} Handle The HandleId to Close.
     * @returns 0 on success, otherwise an error code from the device.
     */
    CloseHandle(Handle: Handle): number;
    /**
     * Helper function to Check the Handle is currently open and closes it if it is.
     * @param {Handle} Handle - HandleId to perform the check on.
     */
    CloseHandleIfOpen(Handle: Handle): void;
    /**
     * Performs a Check Command on the HandleId given and returns whether the handle is open.
     * @param {Handle} Handle - HandleId to perform the check on.
     * @returns {Boolean} Boolean representing if the Handle is already open.
     */
    IsHandleOpen(Handle: Handle): boolean;
    /**
     * Performs a Check Command on the HandleId given and returns the packet from the device.
     * This function will return an Error Code if the Handle is not open.
     * The Format of the returned packet is currently not understood.
     * @param {Handle} Handle - HandleId to perform the check on.
     * @returns The packet read from the device on success. Otherwise and Error Code.
     * @Deprecated IsHandleOpen should be used in place of this function.
     */
    CheckHandle(Handle: Handle): number | number[];
    /**
     * This Helper Function will Open, Read, and Close a device Handle for the Endpoint given.
     * If the read packet does not contain the ResponseId given the packet will be reread up to 4 times before giving up and returning the last packet read.
     * If the Handle given is currently open this function will close it and then re-attempt opening it.
     * @param {Handle} Handle - Handle to be used.
     * @param {number} Endpoint - Endpoint to be read from
     * @param {number} Command - CommandId that is contained in the return packet to verify the correct packet was read from the device.
     * @returns The entire packet read from the device.
     */
    ReadEndpoint(Handle: Handle, Endpoint: number, Command: number): any;
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
    WriteEndpoint(Handle: Handle, Endpoint: number, Data: number[]): number;
    /**
     * This Helper Function to write RGB data to the device. This function will split the data into as many packets as needed and do multiple WriteEndpoints(Handle, Endpoint, Data) based on the DeviceBufferSize set.
     *
     * This function expects the Lighting HandleId (0x00) to already be open.
     *
     * This function will handle setting the header data expected by the device. If the RGBData Array Length provided doesn't match what the devices Lighting Endpoint expects this command will Error.
     *
     * @param {number[]} RGBData - RGBData to be written to the device in a RRRGGGBBB(Lighting Endpoint 0x01) or RGBRGBRGB(LightingController Endpoint 0x22) format.
     */
    SendRGBData(RGBData: number[]): void;
    /** @private */
    private WriteLighting;
    /** @private */
    private StreamLighting;
    /**
     * Helper Function to Fetch and Set the devices mode. This function will close all currently open Handles on the device to ensure a clean slate and to prevent issues interacting with the device.
     * Closing Handles in this function leads to iCUE not being able to function anymore, but solves issues with us not being able to find an open handle when trying to access non-lighting endpoints.
     * @param {number | "Hardware" | "Software"} Mode ModeId to be checks against and set on the device.
     */
    SetMode(Mode: number | "Hardware" | "Software"): void;
    /**
     * Helper function to set the Hardware level device brightness if it is different then the Brightness value provided. This property is saved to flash.
     * @param {number} Brightness Brightness Value to be set in the range of 0-1000
     */
    SetHWBrightness(Brightness: number): void;
    /**
     * Helper function to set the device's angle snapping if it is difference then the bool provided. This property is saved to flash.
     * @param {boolean} AngleSnapping boolean Status to be set for Angle Snapping.
     */
    SetAngleSnapping(AngleSnapping: boolean): void;
    /** */
    FetchFanRPM(): any[];
    /** */
    FetchFanStates(): any;
    /** */
    SetFanType(): void;
    /** */
    FetchTemperatures(): number[];
}
export type Options = {
    developmentFirmwareVersion?: string | undefined;
    IsLightingController?: boolean | undefined;
    LedChannelSpacing?: number | undefined;
};
export type Handle = 0 | 1 | 2 | "Lighting" | "Background" | "Auxiliary";
