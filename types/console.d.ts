declare class console{
    	/**
 	* Logs output to this device's console.
	* @see {@link https://docs.signalrgb.com/plugins/utilities#devicelog SignalRGB Documentation}
 	* @param {any} Data - item to be logged to the console.
	* @param {{toFile: boolean, toHex: boolean}} Options - Optionally allows for modifiers like logging to file to be used.
 	*/
	public static log(Data: any, Options?: LogOptions): void

	public static info(Data: any, Options?: LogOptions): void
	public static warn(Data: any, Options?: LogOptions): void
	public static error(Data: any, Options?: LogOptions): void
}