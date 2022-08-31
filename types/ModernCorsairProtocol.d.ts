/**
 * Protocol Library for Corsair's Modern Protocol. (BRAGI)
 * @class ModernCorsairProtocol
 *
 */
export class ModernCorsairProtocol {
    DeviceBufferSize: number;
    IsLightingController: boolean;
    KeyCodes: any[];
    KeyCount: number;
    WiredCommand: number;
    WirelessCommand: number;
    CommandMode: number;
    setProperty: number;
    getProperty: number;
    closeHandle: number;
    writeEndpoint: number;
    streamEndpoint: number;
    readEndpoint: number;
    checkHandle: number;
    openEndpoint: number;
    pingDevice: number;
    confirmChange: number;
    hardwareMode: number;
    softwareMode: number;
    /**
     * Contains the PropertyId's of all known Properties.
     * The device values these represent can be read and set using the following commands:
     * - FetchProperty(PropertyId)
     * - ReadProperty(PropertyId)
     * - SetProperty(PropertyId, Value)
     * - CheckAndSetProperty(PropertyId, Value)
     */
    Properties: {
        /** Device Polling Rate PropertyId */
        pollingRate: number;
        /** Device Hardware Brightness PropertyId */
        brightness: number;
        /** Device Mode [Software/Hardware] PropertyId. Uses a 0-1000 Range.  */
        mode: number;
        /** Device Angle Snapping State PropertyId */
        angleSnap: number;
        /** Device Idle Mode Toggle PropertyId. Only effects wireless devices. */
        idleMode: number;
        /** Device Battery Level PropertyID. Uses a 0-1000 Range. [READONLY] */
        batteryLevel: number;
        /** Device Charging State PropertyID. [READONLY] */
        batteryStatus: number;
        /** Device VendorID PropertyID. [READONLY] */
        vid: number;
        /** Device ProductID PropertyID. [READONLY] */
        pid: number;
        /** Device Firmware PropertyID. [READONLY] */
        firmware: number;
        /** Device BootLoader Firmware PropertyID. [READONLY] */
        BootLoaderFirmware: number;
        /** Device Wireless Chip Firmware PropertyID. [READONLY]
         * @readonly
        */
        readonly WirelessChipFirmware: number;
        /** Device Current DPI Profile Index PropertyID. Dark Core Pro SE uses a 0-3 Range.*/
        dpiProfile: number;
        dpiMask: number;
        /** Device's Current X DPI PropertyID. */
        dpiX: number;
        /** Device's Current Y DPI PropertyID. */
        dpiY: number;
        /** Device's Idle Timeout PropertyId. Value is in Milliseconds and has a max of 99 Minutes. */
        idleModeTimeout: number;
        /** Device's Physical Layout PropertyId. Only applies to Keyboards. */
        layout: number;
        BrightnessLevel: number;
        /** Device's WinKey Lock Status. Only applies to Keyboards. */
        WinLockState: number;
        /** Device's WinKey Lock Bit flag. Governs what key combinations are disabled by the devices Lock mode. Only Applies to Keyboards. */
        LockedShortcuts: number;
        /** Device's Max Polling Rate PropertyId. Not supported on all devices. */
        maxPollingRate: number;
        ButtonResponseOptimization: number;
    };
    /** This Object maps PropertyId's to a human readable name string. */
    PropertyNames: {
        1: string;
        2: string;
        3: string;
        7: string;
        13: string;
        15: string;
        16: string;
        17: string;
        18: string;
        19: string;
        30: string;
        31: string;
        33: string;
        34: string;
        55: string;
        65: string;
        150: string;
    };
    /**
     * Contains the EndpointId's of all known Endpoints. These handle advanced device functions like Lighting and Fan Control.
     * To manually interact with these you must open a Handle to the Endpoint first using OpenHandle(HandleId, EndpointId).
     *
     * Helper Functions to interact with these exist as the following:
     * - WriteEndpoint(HandleId, EndpointId, CommandId)
     * - ReadEndpoint(HandleId, EndpointId, CommandId)
     */
    Endpoints: {
        Lighting: number;
        Buttons: number;
        PairingID: number;
        FanRPM: number;
        FanSpeeds: number;
        FanStates: number;
        LedCount_3Pin: number;
        LedCount_4Pin: number;
        TemperatureData: number;
        LightingController: number;
        ErrorLog: number;
    };
    /** This Object maps EndpointId's to a human readable name string. */
    EndpointNames: {
        1: string;
        2: string;
        23: string;
        8: string;
        26: string;
        29: string;
        30: string;
        33: string;
        34: string;
    };
    /** This Object maps device ChargingStateId's to a human readable name string. */
    ChargingStates: {
        1: string;
        2: string;
        3: string;
    };
    Modes: {
        Hardware: number;
        Software: number;
    };
    /** This Object maps device ModeId's to a human readable name string. */
    ModeNames: {
        1: string;
        2: string;
    };
    ResponseIds: {
        firmware: number;
        command: number;
        openEndpoint: number;
        closeEndpoint: number;
        getRpm: number;
        fanConfig: number;
        temperatureData: number;
        LedConfig: number;
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
    Handles: {
        Lighting: number;
        Background: number;
        Auxiliary: number;
    };
    /** This Object maps device HandleId's to a human readable name string. */
    HandleNames: {
        0: string;
        1: string;
        2: string;
    };
    FanStates: {
        Disconnected: number;
        Initializing: number;
        Connected: number;
    };
    FanTypes: {
        QL: number;
        SpPro: number;
    };
    /** This Object maps device Polling Rate Id's to a human readable name string. */
    PollingRates: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
    };
    /** This Object maps readable Polling Rate Strings to the device's internal Polling Rate Id's. */
    PollingRateNames: {
        "125hz": number;
        "250hz": number;
        "500hz": number;
        "1000hz": number;
        "2000hz": number;
    };
    Layouts: {
        1: string;
        2: string;
    };
    KeyStates: {
        Disabled: number;
        0: string;
        Enabled: number;
        1: string;
    };
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
    /**
     * This function finds and sets the device's buffer size for internal use in the Protocol. This should be the first function called when using this CorsairProtocol as all other interactions with the device rely on the buffer size being set properly.

    You can call SetDeviceBufferSize(BufferSize) to manually set this value.

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
     * @returns An array containing [Battery Level, Charging State]
     */
    FetchBatteryStatus(): number[];
    /**
     *
     * @param {number[]} Data - Data packet read from the device.
     * @param {string} Context - String representing the calling location.
     * @returns {number} - An Error Code if the Data packet contained an error, otherwise 0.
     */
    CheckError(Data: number[], Context: string): number;
    /**
     * Helper Function to Read a Property from the device, Check its value, and Set it on the device if they don't match.
     * 	@param {number|string} PropertyId Property Index to be checked and set on the device. This value can either be the PropertyId, or the readable string version of it.
     * 	@param {number} Value The Value to be checked against and set if the device's value doesn't match.
     *  @return {boolean} a Boolean on if the Property value on the device did match, or now matches the value desired.
     */
    CheckAndSetProperty(PropertyId: number | string, Value: number): boolean;
    /**
     * Reads a property from the device and returns the joined value after combining any high/low bytes. This function can return a null value.
     * @param {number} PropertyId Property Index to be read from the device. This value can either be the PropertyId, or the readable string version of it.
     * @returns The joined value, or undefined if the device fetch failed.
     */
    FetchProperty(PropertyId: number | (readonly ["Polling Rate", "HW Brightness", "Mode", "Angle Snapping", "Idle Mode", "Battery Level", "Battery Status", "Vendor Id", "Product Id", "Firmware Version", "DPI Profile", "DPI Mask", "DPI X", "DPI Y", "Idle Mode Timeout", "HW Layout", "Max Polling Rate"])[number]): number;
    /**
     * Sets a property on the device and returns the success state.
     * @param {number|string} PropertyId Property Index to be written to on the device. This value can either be the PropertyId, or the readable string version of it.
     * @param {number} Value The Value to be set.
     * @returns 0 on success, otherwise an error code from the device.
     */
    SetProperty(PropertyId: number | string, Value: number): 0 | 9 | 1 | 3;
    /**
     * Reads a property from the device and returns the raw packet.
     * @param {number} PropertyId Property Index to be read from the device.  This value can either be the PropertyId, or the readable string version of it.
     * @returns The packet data read from the device.
     */
    ReadProperty(PropertyId: number): number | number[];
    /**
     * Opens a Endpoint on the device. Only one Endpoint can be open on a Handle at a time.
     * @param {number} Handle The Handle to open the Endpoint on. Default is 0.
     * @param {number} Endpoint Endpoint Address to be opened.
     * @returns 0 on success, otherwise an error code from the device.
     */
    OpenHandle(Handle: number, Endpoint: number): number;
    /**
     * Closes a Handle on the device.
     * * @param {number} Handle The HandleId to Close.
     * @returns 0 on success, otherwise an error code from the device.
     */
    CloseHandle(Handle?: number): number;
    /**
     * Performs a Check Command on the HandleId given and returns if the handle is open.
     * @param {number} Handle - HandleId to perform the check on.
     * @returns {Boolean} Boolean representing if the Handle is already open.
     */
    IsHandleOpen(Handle: number): boolean;
    /**
     * Performs a Check Command on the HandleId given and returns the packet from the device.
     * This function will return an Error Code if the Handle is not open.
     * The Format of the returned packet is currently not understood.
     * @param {number} Handle - HandleId to perform the check on.
     * @returns The packet read from the device on success. Otherwise and Error Code.
     */
    CheckHandle(Handle: number): number | number[];
    /**
     * This Helper Function will Open, Read, and Close a device Handle for the Endpoint given.
     * If the read packet does not contain the ResponseId given the packet will be reread up to 4 times.
     * The HandleId given MUST not already be in use elsewhere.
     * @param {number} Handle - HandleId to be used.
     * @param {number} Endpoint - EndpointId to be read from
     * @param {number} Command - CommandId that is contained in the return packet to verify the correct packet was read from the device.
     * @returns The entire packet read from the device.
     */
    ReadEndpoint(Handle: number, Endpoint: number, Command: number): any;
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
    WriteEndpoint(Handle: number, Endpoint: number, Data: number[]): number;
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
    WriteLighting(LedCount: any, RGBData: any): void;
    StreamLighting(RGBData: any): void;
    /**
     * Helper Function to Fetch and Set the devices HW mode. This function will close all currently open Handles on the device to ensure a clean slate and to prevent issues interacting with the device.
     * Closing Handles in this function leads to iCUE not being able to function anymore.
     * @param {number} Mode ModeId to be checks against and set on the device.
     */
    SetMode(Mode: number): void;
    /**
     * Helper function to set the Hardware level device brightness if it is difference then the Brightness Value provided. This property is saved to flash.
     * * @param {number} Brightness Brightness Value to be set in the range of 0-1000
     */
    SetHWBrightness(Brightness: any): void;
    /**
     * Helper function to set the device's angle snapping if it is difference then the bool provided. This property is saved to flash.
     * * @param {boolean} AngleSnapping boolean Status to be set for Angle Snapping.
     */
    SetAngleSnapping(AngleSnapping: any): void;
    FetchFanRPM(): any[];
    FetchFanStates(): any;
    SetFanType(): void;
    FetchTemperatures(): number[];
}
export type PropertyId = number;
export type PropertyName = string;
