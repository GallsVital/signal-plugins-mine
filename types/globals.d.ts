/**
 * 3 index tuple representing the [R, G, B] color value of a specific point on the Effects Canvas.
 */
declare type ColorArray = readonly [number, number, number];
declare type LedPosition =  [number, number];
declare type ChannelId = string;
declare type SubdeviceId = string;

declare interface LogOptions{
	toFile?: boolean
	Hex?: boolean
}
declare type ImageFormat = "JPEG" | "PNG" | "BMP"

declare type DeviceFeature = "battery" | "mouse";
declare type hexToRgb = (HexString: string) => ColorArray;

declare type ChannelConfig = {0: ChannelId, 1: number};
declare type ChannelConfigArray = ChannelConfig[];

declare type AlertPriority = 0 | 1;
declare type AlertId = string;
declare type MessageId = string;
declare type InlineArray = "Inline";
declare type SeparateArray = "Separate";
declare type ArrayOrder = InlineArray | SeparateArray;
declare type ColorOrder = "RGB" | "RBG" | "BGR" | "BRG" | "GBR" | "GRB";
declare type FanId = string;