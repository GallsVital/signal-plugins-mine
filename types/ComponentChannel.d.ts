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

	public getComponentNames(): string[]
}
