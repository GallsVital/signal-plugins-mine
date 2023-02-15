declare const console: Console
declare class Console{
    	/**
 	* Logs output to this device's console.
	* @see {@link https://docs.signalrgb.com/plugins/utilities#devicelog SignalRGB Documentation}
 	* @param {any} Data - item to be logged to the console.
	* @param {{toFile: boolean, toHex: boolean}} Options - Optionally allows for modifiers like logging to file to be used.
 	*/
	public log(Data: any, Options?: LogOptions): void
}