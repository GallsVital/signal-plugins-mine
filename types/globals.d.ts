/**
 * 3 index tuple representing the [R, G, B] color value of a specific point on the Effects Canvas.
 */
declare type ColorArray = readonly [number, number, number];
declare type LedPosition =  [number, number];
declare type ChannelId = string;


declare interface LogOptions{
	toFile?: boolean
	Hex?: boolean
}
declare type ImageFormat = "JPEG" | "PNG" | "BMP"

declare type DeviceFeature = "Battery" | "mouse";
declare type hexToRgb = (HexString: string) => ColorArray;


declare type AlertPriority = 0 | 1;
declare type AlertId = string;
declare type MessageId = string;
declare type ArrayOrder = "Inline" | "Separate";
declare type ColorOrder = "RGB" | "RBG" | "BGR" | "BRG" | "GBR" | "GRB";
declare type FanId = string;

