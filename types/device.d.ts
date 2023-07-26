//declare const device: Device;

declare interface ImageBufferOptions{
	/** 
	 * @default 72
	*/
	outputWidth?: number
	/** 
	* @default 72
	*/
	outputHeight?: number
	/** 
	* @default "JPEG"
	*/
	format?: ImageFormat
	/** 
	* @default false
	*/
	flipH?: boolean
	/** 
	* @default false
	*/
	flipV?: boolean
}
declare interface HidInfo{
	featureLength: number,
	readLength: number,
	writeLength: number,
}

declare type ImageResource = "default/aio" |		 
"default/case" |
"default/gpu" |
"default/keyboard" |
"default/keyboard60" |
"default/keyboard80" |
"default/motherboard" |
"default/mouse"	|
"default/mousepad" |
"default/mousepadXL" |
"default/ram"


declare class device{
	/**
	 * returns the devices USB Vendor ID
	 */
	public static vendorId(): number

	/**
	 * returns the devices USB Product ID
	 */
	public static productId(): number
	/**
 	* Performs a Hid Write on the device. 
	* @remarks Device's using Hid Reports should use {@link device.send_report} instead.
	* @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicewritesend_report SignalRGB Documentation}
 	* @param Data - Data array to be written to the device. Length must be at least one with the first byte being the Endpoints ReportID.
 	* @param Length - Length to be written the the device. If the length is greater then the size of the Data Array it will be zero-padded.
 	*/
	public static write(Data: number[], Length: number): void

	/**
	 * Performs a Hid Send Report on the device. 
	 * @remarks Device's using Hid Writes should use {@link device.send_report} instead.
	 * @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicewritesend_report SignalRGB Documentation}
	 * @param Data - Data array to be written to the device. Length must be at least one with the first byte being the Endpoints ReportID.
	 * @param Length - Length to be written the the device. If the length is greater then the size of the Data Array it will be zero-padded.
	 */
	public static send_report(Data: number[], Length: number): void

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
	public static read(Data: number[], Length: number, Timeout?: number): number[]

	/**
	 * Performs a Hid Get Report on the device. 
	 * @remarks Device's using Hid Reads should use {@link device.read} instead.
	 * @remarks This function returns a byte array matching the length parameter. If you need the true number of bytes read use the {@link device.getLastReadSize} function. 
	 * @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicereadget_report SignalRGB Documentation}
	 * @param Data - Data array used for the read command Length must be at least one with the first byte being the Endpoints ReportID.
	 * @param Length - Length to be written the the device. If the length is greater then the size of the Data Array it will be zero-padded.
	 * @returns  A data array containing the bytes read from the device. This array can be empty. 
	 */
	public static get_report(Data: number[], Length: number): number[]

	public static bulk_transfer(Endpoint: number, Data: number[], Length: number): number[]
	public static control_transfer(Type: number, Request: number, Value: number, Index: number, Data: number, Length: number, Timeout: number): void

	/**
	 * This function will return the number of bytes read by the last device.read, device.get_report, or device.control_transfer command.
	 * @see {@link https://docs.signalrgb.com/plugins/writes-and-reads#devicegetlastreadsize SignalRGB Documentation}
	 * @return The number of bytes read.
	 */
	public static getLastReadSize(): number
	/**
	 * Sets the device to a non-blocking read mode and quickly discards all queued Hid packets.
	 * 
	 * This should be done before every important read operation where you need to get data back from the device to prevent a stale packet from being read instead.
	 * 
	 * Only works for HID type devices that use Write/Read calls. 
	 */
	public static clearReadBuffer(): void
	/**
	 * Changes the currently active USB Endpoint being used for HID commands. These Endpoints must have been already opened by the exported Validate(Endpoint) function.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#deviceset_endpoint SignalRGB Documentation}
	 * @param Interface Desired Endpoint Interface
	 * @param Usage Desired Endpoint Usage
	 * @param UsagePage Desired Endpoint Usage Page
	 * @param Collection Desired Endpoint Collection. 
	 */
	public static set_endpoint(Interface: number, Usage: number, UsagePage: number, Collection?: number): void

	/**
	 * Requests a thread sleep for the desired duration in ms. Due to how Windows handles thread sleeps this is not a precise function and may be +- ~10%.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicepause SignalRGB Documentation}
	 * @param Duration 
	 */
	public static pause(Duration: number): void

	/**
 	* Logs output to this device's console.
	* @see {@link https://docs.signalrgb.com/plugins/utilities#devicelog SignalRGB Documentation}
 	* @param {String | number | Object} Data - Object to be logged to the console.
	* @param {{toFile: boolean, toHex: boolean}} Options - Optionally allows for modifiers like logging to file to be used.
 	*/
	 public static log(Data: String | number | Object, Options?: LogOptions): void

	/**
	 * This function tells if the current user has Fan Control enabled. This being false doesn't prevent the creation of FanControls, but does prevent access to getNormalizedFanLevel and getFanLevel. 
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicefancontroldisabled SignalRGB Documentation}

	 * @remark These functions will always return 50% speed when the user isn't allowed access, or has the Cooling system disabled. Care should be taken to avoid messing with the device's fans if these systems are disabled as HW controlled fans are better then locked fans.
	 * @return a Boolean value representing if the current user has the Cooling System operational.
	 */
	public static fanControlDisabled(): boolean

	/**
	 * Creates a new FanController on the device with the provided FanId. These FanId's will be used to interact with the Cooling System and should be stored.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicecreatefancontrol SignalRGB Documentation}
	 * @param FanId FanId to be tied to the created FanController.
	 */
	public static createFanControl(FanId: FanId): void

	/**
	 * Removes the FanController for the given FanId.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#deviceremovefancontrol SignalRGB Documentation}
	 * @param FanId FanId to be removed.
	 */
	public static removeFanControl(FanId: FanId): void

	/**
	 * Returns the desired fan speed for the given FanId. This value is dependent on the Cooling Sensor and Curve options selected by the user.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicegetnormalizedfanlevel SignalRGB Documentation}
	 * @remarks The value returned is slightly interpolated between the last speed grabbed and the current speed determined by the users curve settings. The value will update each time this function is called for that FanController.
	 * @param FanId FanId to get the desired speed from.
	 * @returns a normalized 0-1 value for the desired fan speed %.
	 */
	public static getNormalizedFanlevel(FanId: FanId): number

	/**
	 * Returns the desired fan speed for the given FanId. This value is dependent on the Cooling Sensor and Curve options selected by the user.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicegetfanlevel SignalRGB Documentation}
	 * @remarks The value returned is slightly interpolated between the last speed grabbed and the current speed determined by the users curve settings. The value will update each time this function is called for that FanController.
	 * @param FanId FanId to get the desired speed from.
	 * @returns a 0-100 value for the desired fan speed %.
	 */
	public static getFanlevel(FanId: FanId): number

	/**
	 * Sets the FanController's RPM in the Cooling UI.
	 * @see {@link https://docs.signalrgb.com/plugins/fan-control#devicesetrpm SignalRGB Documentation}
	 * @remarks Each update of this value is used to determine the physical fans stall and start speeds during initial auto detection. This value must be regularly polled to prevent hardlocking during that process.
	 * @param FanId FanController to be updated
	 * @param RPM New RPM value to be set.
	 */
	public static setRPM(FanId: FanId, RPM: number): void

	public static createSubdevice(SubdeviceId: string): void
	public static removeSubdevice(SubdeviceId: string): void
	public static setSubdeviceName(SubdeviceId: string, NewName: string): void
	public static setSubdeviceImage(SubdeviceId: string, Image: string): void
	public static setSubdeviceSize(SubdeviceId: string, Width: number, Height: number): void
	public static setSubdeviceLeds(SubdeviceId: string, LedNames: string[], LedPositions: LedPosition[]): void
	public static setSubdeviceLedMap(SubdeviceId: string, LedMapping): void
	public static subdeviceColor(SubdeviceId: string, X: number, Y: number): void

	public static GetComponentData(ComponentId: string): void
	public static AvailableComponents(): void
	public static getCurrentSubdevices(): string[]

	/**
	 * Sets the upper Led Count shown to the user in the Component UI. Has no effect if there are no configured Component Channels.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicesetledlimit SignalRGB Documentation}
	 * @param LedLimit Desired maxLed Limit
	 */
	 public static SetLedLimit(LedLimit: number): void

	 /**
	  * Returns the current total led count across all component channels on the device.
	  * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicegetledcount SignalRGB Documentation}
	  * @return The current total Led Count. 
	  */
	 public static getLedCount(): number

	/**
	 * Creates a new Component Channel on the device. The Component UI will appear for the User after a Channel is added. 
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#deviceaddchannel SignalRGB Documentation}
	 * @param ChannelId Desired ChannelId name as a string.
	 * @param LedLimit Sets the max Led Count of the Channel.
	 */
	public static addChannel(ChannelId: ChannelId, LedLimit?: number): void

	/**
	 * Removes a Component Channel on the device. The Component UI will disappear for the User if the last Channel is removed.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#deviceremovechannel SignalRGB Documentation}
	 * @param ChannelId ChannelId to be removed.
	 */
	public static removeChannel(ChannelId: ChannelId): void

	/**
	 * Returns a list of all ChannelId's currently active on the device. 
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicegetchannelnames SignalRGB Documentation}
	 * @returns A list of all active ChannelId's
	 */
	public static getChannelNames(): ChannelId[]
	 
	/**
	 * Returns a ComponentChannel Object related to the ChannelId given.
	 * @see {@link https://docs.signalrgb.com/plugins/device-functions#devicechannel SignalRGB Documentation}
	 * @param ChannelId Id of the Channel to be fetched
	 * @return A ComponentChannel Object if it exists, else null.
	 */
	public static channel(ChannelId: ChannelId): ComponentChannel | null


	public static getChannelPulseColor(ChannelId: string): string

	/**
	 * Returns an array of [R,G,B] values based on the parameters given.
	 * @remarks This will default to an Inline-RGB [R,G,B,R,G,B] array if no ArrayOrder or Color Order is given. ColorOrder is only used if the ArrayOrder is "Inline"
	 * @param HexColor Color to be used.
	 * @param LedCount Number of times to repeat the colors RGB values.
	 * @param ArrayOrder The output arrays format
	 * @param ColorOrder The R,G,B order of the output array
	 * @returns An array containing the given Color repeated the requested times.
	 */
	public static createColorArray(HexColor: string, LedCount: number, ArrayOrder?: InlineArray, ColorOrder?: ColorOrder): number[]
	public static createColorArray(HexColor: string, LedCount: number, ArrayOrder?: SeparateArray, ColorOrder?: ColorOrder): number[][]

	/**
	 * Creates a new alert to relay an issue to the user. The returned AlertId should be stored in order to remove the alert when the issue is fixed.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicenotify SignalRGB Documentation}
	 * @param Title The Alerts Title.
	 * @param Description The Alerts description text.
	 * @param Priority The Alerts priority level. Valid values are 0 (Info) and 1 (Critical)
	 * @param Action (Optional) Determines what action the "details" button performs in the alert. Current options are to open the "Settings" page, or open the devices "Documentation" URL.
	 * @returns The created alertId string.
	 */
	public static notify(Title: string, Description: string, Priority: AlertPriority, Action?: AlertAction): AlertId

	/**
	 * Removes an alert with the given Id if one exists.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicedenotify SignalRGB Documentation}
	 * @param AlertId AlertId to be removed.
	 */
	public static denotify(AlertId: AlertId): void
	
	/** @deprecated */
	public static repollName(): void
	/** @deprecated*/
	public static repollLeds(): void
	/** @deprecated*/
	public static repollSize(): void

	public static setName(Name: string): void
	public static setControllableLeds(LedNames: string[], LedPositions: LedPosition[]): void
	public static setSize(Size: number[]): void
	public static setImageFromBase64(base64Image: string): void
	public static setImageFromResource(resourceUrl: ImageResource): void
	public static setImageFromUrl(imageUrl: string): void


	/**
	 * Creates a device message for the user.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#deviceaddmessage SignalRGB Documentation}
	 * @param MessageId MessageId to be tied to the created message.
	 * @param Message String text to be displayed to the user.
	 * @param Tooltip Addition text to be displayed on hover.
	 */
	public static addMessage(MessageId: MessageId, Message: string, Tooltip: string): void

	/**
	 * Removes the message with the given MessageId if one exists.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#deviceremovemessage SignalRGB Documentation}
	 * @param MessageId MessageId to be removed.
	 */
	public static removeMessage(MessageId: MessageId): void

	/**
	 * Returns the RGB color value within the devices Pixel Buffer on the Effect Canvas
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicecolor SignalRGB Documentation}
	 * @param {number} X  - X coordinate within the devices Pixel Buffer
	 * @param {number} Y  - Y coordinate within the devices Pixel Buffer
	 * @returns {ColorArray} ColorArray[R, G, B]
	 */
	public static color(X: number, Y: number): ColorArray

	/**
	 * Returns the devices current brightness level in SignalRGB. This value is already applied to device.color() and similar functions.
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicegetbrightness SignalRGB Documentation}
	 * @return Current Software Brightness in the range 0-100
	 */
	public static getBrightness(): number
	
	/**
	 * Enables use of a backend SignalRGB feature. This is the entry point to adding the global interaction object.
	 * @param FeatureName String name of the feature to be enabled.
	 */
	public static addFeature(FeatureName: DeviceFeature): void
	
	/**
	 * Returns the WMI name of the System's motherboard. 
	 * @see {@link https://docs.signalrgb.com/plugins/utilities#devicegetbrightness SignalRGB Documentation}
	 * @returns The Systems motherboard name.
	 */
	public static getMotherboardName(): string

	/**
	 * This function will take a section of the devices Pixel Buffer and convert it into an image format. 
	 * @param X X coordinate within the devices Pixel Buffer to be used as the top left corner of the captured area.
	 * @param Y Y coordinate within the devices Pixel Buffer to be used as the top left corner of the captured area.
	 * @param Width Width of the area to be captured. This must fit between the X coordinate and the device's max width
	 * @param Height Height of the area to be captured. This must fit between the Y coordinate and the device's max Height
	 * @param options optional {@link ImageBufferOptions ImageBufferOptions} settings object
	 * @returns The Image's data saved into an array
	 */
	public static getImageBuffer(X: number, Y: number, Width: number, Height: number, options?: ImageBufferOptions): number[]

	/**
	 * Takes a Hex String color and returns a image buffer.
	 * @param HexString Hex String Color to be used.
	 * @param ImageWidth Width of the output Image
	 * @param ImageHeight Height of the output Image
	 * @param ImageFormat Image Format to be output
	 * @returns The Image's data saved into an array
	 */
	public static ConvertColorToImageBuffer(HexString: string, ImageWidth: number, ImageHeight: number, ImageFormat: ImageFormat): number[]

	public static getHidEndpoints(): HidEndpoint[]
	public static getHidInfo(): HidInfo

	public static createTemperatureSensor(Name: String);
	public static removeTemperatureSensor(Name: String);
	public static SetTemperature(Name: String, CelsiusTemperature: number);

	public static addProperty(object: Parameter): void
	public static getProperty(propertyName: string): Parameter
	public static removeProperty(propertyName: string): void
	public static getPropertyNames(): string[]
	public static hasProperty(propertyName: string): boolean
}
