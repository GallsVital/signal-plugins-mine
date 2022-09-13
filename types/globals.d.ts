/**
 * 3 index tuple representing the [R, G, B] color value of a specific point on the Effects Canvas.
 */
declare type ColorArray = readonly [number, number, number];
declare type LedPosition =  [number, number];
declare type ChannelId = string;

declare type NameExport = () => string;
declare type VendorIdExport = () => number;
declare type ProductIdExport = () => number;
declare type DocumentationExport = () => string;
declare type PublisherExport = () => string;
declare type SizeExport = () => [Width: number, Height: number];
declare type DefaultPositionExport = () => [X: number, Y: number];
declare type DefaultScaleExport = () => number;
declare type LedNamesExport = () => string[];
declare type LedPositionsExport = () => LedPosition[];
declare type ConflictingProcessesExport = () => string[];
declare type ControllableParametersExport = () => Parameter[];
declare type ValidateExport = (Endpoint: HidEndpoint) => boolean;

declare interface LogOptions{
	toFile?: boolean
	Hex?: boolean
}

declare type DeviceFeature = "Battery";
declare type hexToRgb = (HexString: string) => ColorArray;


declare type Parameter = ComboboxParameter | ColorParameter | NumberParameter | TextParameter | BooleanParameter | HueParameter
declare interface ParameterBase{
	property: string
	group?: string
	label: string
	default: string
	type: "color" | "combobox" | "number" | "boolean" | "textfield" | "hue"
}

declare interface ColorParameter extends ParameterBase{
	min: string
	max: string
	type: "color"
}
declare interface NumberParameter extends ParameterBase{
	min: string
	max: string
	type: "number"
}
declare interface ComboboxParameter extends ParameterBase{
	values: string[]
	type: "combobox"
}
declare interface BooleanParameter extends ParameterBase{
	type: "boolean"
}
declare interface TextParameter extends ParameterBase{
	filter: string
	type: "textfield"
}
declare interface HueParameter extends ParameterBase{
	min: string
	max: string
	type: "hue"
}

declare interface HidEndpoint{
	interface: number
	usage: number
	usage_page: number
	collection?: number
}

declare type AlertPriority = 0 | 1;
declare type AlertId = string;
declare type MessageId = string;
declare type ArrayOrder = "Inline" | "Separate";
declare type ColorOrder = "RGB" | "RBG" | "BGR" | "BRG" | "GBR" | "GRB";
declare type FanId = string;

declare class ComponentChannel{
	/**
	 * Sets the upper Led Count for this ComponentChannel shown to the user in the Component UI.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#channelsetledlimit SignalRGB Documentation}
	 * @param LedLimit Desired maxLed Limit
	 */
	public SetLedLimit(LedLimit: number): void

	/**
	  * Returns the current total led count of this ComponentChannel.
	  * @see {@link https://docs.signalrgb.com/plugins/device-functions#channelledcount SignalRGB Documentation}
	  * @return The current total Led Count. 
	  */
	public LedCount(): number
	
	/**
	 * This function will return an array of RGB color data for every Component on this ComponentChannel. The return value for this function depends greatly on setting the correct arguments.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#channelgetcolors SignalRGB Documentation}
	 * @remarks ColorOrder only takes effect if the ArrayOrder is "Inline".
	 * @param ArrayOrder The output arrays format.
	 * @param ColorOrder The R,G,B order of the output array.
	 */
	public getColors(ArrayOrder: ArrayOrder, ColorOrder: ColorOrder): number[] | number[][]

	/**
	 * this function returns a boolean on if this device channel should be 'pulsing'. This can be requested due to no Components being selected, or if the onboarding Component Setup UI is being shown.
	 * @remarks {@link device.getChannelPulseColor} can be used to get the expected pulse color.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#channelshouldpulsecolors SignalRGB Documentation}
	 * @returns boolean on if this ComponentChannel should force pulse.
	 */
	public shouldPulseColors(): boolean
}

declare const device: Device;
declare class Device{

	/**
 	* Performs a Hid Write on the device. 
	* @remarks Device's using Hid Reports should use {@link device.send_report} instead.
	* @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicewritesend_report SignalRGB Documentation}
 	* @param Data - Data array to be written to the device. Length must be at least one with the first byte being the Endpoints ReportID.
 	* @param Length - Length to be written the the device. If the length is greater then the size of the Data Array it will be zero-padded.
 	*/
	public write(Data: number[], Length: number): void

	/**
	 * Performs a Hid Send Report on the device. 
	 * @remarks Device's using Hid Writes should use {@link device.send_report} instead.
	 * @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicewritesend_report SignalRGB Documentation}
	 * @param Data - Data array to be written to the device. Length must be at least one with the first byte being the Endpoints ReportID.
	 * @param Length - Length to be written the the device. If the length is greater then the size of the Data Array it will be zero-padded.
	 */
	public send_report(Data: number[], Length: number): void

	/**
	 * Performs a Hid Read on the device. 
	 * @remarks Device's using Hid Reports should use {@link device.get_report} instead.
	 * @remarks This function returns a byte array matching the length parameter. If you need the true number of bytes read use the {@link device.getLastReadSize} function. 
	 * @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicereadget_report SignalRGB Documentation}
	 * @param Data - Data array used for the read command Length must be at least one with the first byte being the Endpoints ReportID.
	 * @param Length - Length to be written the the device. If the length is greater then the size of the Data Array it will be zero-padded.
	 * @param Timeout - Timeout period this command will block for. If nothing is read from the device in this time (e.g. No packets to read) the function will return after this period with no data.
	 * @returns  A data array containing the bytes read from the device. This array can be empty. 
	 */
	public read(Data: number[], Length: number, Timeout?: number): number[]

	/**
	 * Performs a Hid Get Report on the device. 
	 * @remarks Device's using Hid Reads should use {@link device.read} instead.
	 * @remarks This function returns a byte array matching the length parameter. If you need the true number of bytes read use the {@link device.getLastReadSize} function. 
	 * @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicereadget_report SignalRGB Documentation}
	 * @param Data - Data array used for the read command Length must be at least one with the first byte being the Endpoints ReportID.
	 * @param Length - Length to be written the the device. If the length is greater then the size of the Data Array it will be zero-padded.
	 * @returns  A data array containing the bytes read from the device. This array can be empty. 
	 */
	public get_report(Data: number[], Length: number): number[]

	public bulk_transfer(Endpoint: number, Data: number[], Length: number): number[]
	public control_transfer(Type: number, Request: number, Value: number, Index: number, Data: number, Length: number, Timeout: number): void

	/**
	 * This function will return the number of bytes read by the last device.read, device.get_report, or device.control_transfer command.
	 * @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicegetlastreadsize SignalRGB Documentation}
	 * @return The number of bytes read.
	 */
	public getLastReadSize(): number

	/**
	 * Changes the currently active USB Endpoint being used for HID commands. These Endpoints must have been already opened by the exported Validate(Endpoint) function.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#deviceset_endpoint SignalRGB Documentation}
	 * @param Interface Desired Endpoint Interface
	 * @param Usage Desired Endpoint Usage
	 * @param UsagePage Desired Endpoint Usage Page
	 * @param Collection Desired Endpoint Collection. 
	 */
	public set_endpoint(Interface: number, Usage: number, UsagePage: number, Collection?: number): void

	/**
	 * Requests a thread sleep for the desired duration in ms. Due to how Windows handles thread sleeps this is not a precise function and may be +- ~10%.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicepause SignalRGB Documentation}
	 * @param Duration 
	 */
	public pause(Duration: number): void

	/**
 	* Logs output to this device's console.
	* @see {@link https://docs.signalrgb.com/plugins/utilities#devicelog SignalRGB Documentation}
 	* @param {String | number | Object} Data - Object to be logged to the console.
	* @param {{toFile: boolean, toHex: boolean}} Options - Optionally allows for modifiers like logging to file to be used.
 	*/
	 public log(Data: String | number | Object, Options?: LogOptions): void

	/**
	 * This function tells if the current user has Fan Control enabled. This being false doesn't prevent the creation of FanControls, but does prevent access to getNormalizedFanLevel and getFanLevel. 
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicefancontroldisabled SignalRGB Documentation}

	 * @remark These functions will always return 50% speed when the user isn't allowed access, or has the Cooling system disabled. Care should be taken to avoid messing with the device's fans if these systems are disabled as HW controlled fans are better then locked fans.
	 * @return a Boolean value representing if the current user has the Cooling System operational.
	 */
	public fanControlDisabled(): boolean

	/**
	 * Creates a new FanController on the device with the provided FanId. These FanId's will be used to interact with the Cooling System and should be stored.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicecreatefancontrol SignalRGB Documentation}
	 * @param FanId FanId to be tied to the created FanController.
	 */
	public createFanControl(FanId: FanId): void

	/**
	 * Removes the FanController for the given FanId.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#deviceremovefancontrol SignalRGB Documentation}
	 * @param FanId FanId to be removed.
	 */
	public removeFanControl(FanId: FanId): void

	/**
	 * Returns the desired fan speed for the given FanId. This value is dependent on the Cooling Sensor and Curve options selected by the user.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicegetnormalizedfanlevel SignalRGB Documentation}
	 * @remarks The value returned is slightly interpolated between the last speed grabbed and the current speed determined by the users curve settings. The value will update each time this function is called for that FanController.
	 * @param FanId FanId to get the desired speed from.
	 * @returns a normalized 0-1 value for the desired fan speed %.
	 */
	public getNormalizedFanlevel(FanId: FanId): number

	/**
	 * Returns the desired fan speed for the given FanId. This value is dependent on the Cooling Sensor and Curve options selected by the user.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicegetfanlevel SignalRGB Documentation}
	 * @remarks The value returned is slightly interpolated between the last speed grabbed and the current speed determined by the users curve settings. The value will update each time this function is called for that FanController.
	 * @param FanId FanId to get the desired speed from.
	 * @returns a 0-100 value for the desired fan speed %.
	 */
	public getFanlevel(FanId: FanId): number

	/**
	 * Sets the FanController's RPM in the Cooling UI.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicesetrpm SignalRGB Documentation}
	 * @remarks Each update of this value is used to determine the physical fans stall and start speeds during initial auto detection. This value must be regularly polled to prevent hardlocking during that process.
	 * @param FanId FanController to be updated
	 * @param RPM New RPM value to be set.
	 */
	public setRPM(FanId: FanId, RPM: number): void

	public createSubdevice(SubdeviceId: string): void
	public removeSubdevice(SubdeviceId: string): void
	public setSubdeviceName(SubdeviceId: string, NewName: string): void
	public setSubdeviceImage(SubdeviceId: string, Image: string): void
	public setSubdeviceSize(SubdeviceId: string, Width: number, Height: number): void
	public setSubdeviceLeds(SubdeviceId: string, LedNames: string[], LedPositions: LedPosition[]): void
	public setSubdeviceLedMap(SubdeviceId: string, LedMapping): void
	public subdeviceColor(SubdeviceId: string, X: number, Y: number): void

	public GetComponentData(ComponentId: string): void
	public AvailableComponents(): void
	public getCurrentSubdevices(): void

	/**
	 * Sets the upper Led Count shown to the user in the Component UI. Has no effect if there are no configured Component Channels.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicesetledlimit SignalRGB Documentation}
	 * @param LedLimit Desired maxLed Limit
	 */
	 public SetLedLimit(LedLimit: number): void

	 /**
	  * Returns the current total led count across all component channels on the device.
	  * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicegetledcount SignalRGB Documentation}
	  * @return The current total Led Count. 
	  */
	 public getLedCount(): number

	/**
	 * Creates a new Component Channel on the device. The Component UI will appear for the User after a Channel is added. 
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#deviceaddchannel SignalRGB Documentation}
	 * @param ChannelId Desired ChannelId name as a string.
	 * @param LedLimit Sets the max Led Count of the Channel.
	 */
	public addChannel(ChannelId: ChannelId, LedLimit?: number): void

	/**
	 * Removes a Component Channel on the device. The Component UI will disappear for the User if the last Channel is removed.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#deviceremovechannel SignalRGB Documentation}
	 * @param ChannelId ChannelId to be removed.
	 */
	public removeChannel(ChannelId: ChannelId): void

	/**
	 * Returns a list of all ChannelId's currently active on the device. 
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicegetchannelnames SignalRGB Documentation}
	 * @returns A list of all active ChannelId's
	 */
	public getChannelNames(): ChannelId[]

	/**
	 * Returns a ComponentChannel Object related to the ChannelId given.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicechannel SignalRGB Documentation}
	 * @param ChannelId Id of the Channel to be fetched
	 * @return A ComponentChannel Object if it exists, else null.
	 */
	public channel(ChannelId: ChannelId): ComponentChannel | null


	public getChannelPulseColor(ChannelId: string): string

	/**
	 * Returns an array of [R,G,B] values based on the parameters given.
	 * @remarks This will default to an Inline-RGB [R,G,B,R,G,B] array if no ArrayOrder or Color Order is given. ColorOrder is only used if the ArrayOrder is "Inline"
	 * @param HexColor Color to be used.
	 * @param LedCount Number of times to repeat the colors RGB values.
	 * @param ArrayOrder The output arrays format
	 * @param ColorOrder The R,G,B order of the output array
	 * @returns An array containing the given Color repeated the requested times.
	 */
	public createColorArray(HexColor: string, LedCount: number, ArrayOrder?: ArrayOrder, ColorOrder?: ColorOrder): number[]
	
	/**
	 * Creates a new alert to relay an issue to the user. The returned AlertId should be stored in order to remove the alert when the issue is fixed.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicenotify SignalRGB Documentation}
	 * @param Title The Alerts Title.
	 * @param Description The Alerts description text.
	 * @param Priority The Alerts priority level. Valid values are 0 (Info) and 1 (Critical)
	 * @returns The created alertId string.
	 */
	public notify(Title: string, Description: string, Priority: AlertPriority): AlertId

	/**
	 * Removes an alert with the given Id if one exists.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicedenotify SignalRGB Documentation}
	 * @param AlertId AlertId to be removed.
	 */
	public denotify(AlertId: AlertId): void

	public repollName(): void
	public setName(Name: string): void
	public repollLeds(): void
	public repollSize(): void
	public setSize(Size: number[]): void

	/**
	 * Creates a device message for the user.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#deviceaddmessage SignalRGB Documentation}
	 * @param MessageId MessageId to be tied to the created message.
	 * @param Message String text to be displayed to the user.
	 * @param Tooltip Addition text to be displayed on hover.
	 */
	public addMessage(MessageId: MessageId, Message: string, Tooltip: string): void

	/**
	 * Removes the message with the given MessageId if one exists.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#deviceremovemessage SignalRGB Documentation}
	 * @param MessageId MessageId to be removed.
	 */
	public removeMessage(MessageId: MessageId): void

	/**
	 * Returns the RGB color value within the devices Pixel Buffer on the Effect Canvas
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicecolor SignalRGB Documentation}
	 * @param {number} X  - X coordinate within the devices Pixel Buffer
	 * @param {number} Y  - Y coordinate within the devices Pixel Buffer
	 * @returns {ColorArray} ColorArray[R, G, B]
	 */
	public color(X: number, Y: number): ColorArray

	/**
	 * Returns the devices current brightness level in SignalRGB. This value is already applied to device.color() and similar functions.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicegetbrightness SignalRGB Documentation}
	 * @return Current Software Brightness in the range 0-100
	 */
	public getBrightness(): number
	
	public addFeature(FeatureName: DeviceFeature): void
	
	/**
	 * Returns the WMI name of the System's motherboard. 
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicegetbrightness SignalRGB Documentation}
	 * @returns The Systems motherboard name.
	 */
	public getMotherboardName(): string
}

