/**
 * 3 index tuple representing the [R, G, B] color value of a specific point on the Effects Canvas.
 */
declare type ColorArray = readonly [number, number, number];
declare type LedPosition =  [number, number];
declare type ChannelId = string;
declare type SubdeviceId = string;
declare type LogOptions = {
	toFile?: boolean
	Hex?: boolean
}

declare type ImageFormat = "JPEG" | "PNG" | "BMP"

declare type DeviceFeature = "battery" | "mouse" | "keyboard" | "udp" | "dtls" | "base64";
declare type hexToRgb = (HexString: string) => ColorArray;

declare type ChannelConfig = [ChannelId, number];
declare type ChannelConfigArray = ChannelConfig[];

declare type AlertPriority = 0 | 1 | 2 | 3;
declare type AlertAction = "Settings" | "Documentation"
declare type AlertId = string;
declare type MessageId = string;
declare type InlineArray = "Inline";
declare type SeparateArray = "Separate";
declare type ArrayOrder = InlineArray | SeparateArray;
declare type ColorOrder = "RGB" | "RBG" | "BGR" | "BRG" | "GBR" | "GRB";
declare type FanId = string;


// Common variable names for user props.
// TS doesn't understand these and we can only declare them inside .ts files
declare let forcedColor: string
declare let LightingMode: string
declare let shutdownColor: string
declare let DpiControl: string
declare let dpi1: number
declare let dpi2: number
declare let dpi3: number
declare let dpi4: number
declare let dpi5: number
declare let dpi6: number

