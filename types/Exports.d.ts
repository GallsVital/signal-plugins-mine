declare type NameExport = () => string;
declare type VendorIdExport = () => number;
declare type ProductIdExport = () => number;
declare type DocumentationExport = () => string;
declare type PublisherExport = () => string;
declare type SizeExport = () => [Width: number, Height: number];
declare type TypeExport = () => IOMethod;
declare type DefaultPositionExport = () => [X: number, Y: number];
declare type DefaultScaleExport = () => number;
declare type LedNamesExport = () => string[];
declare type LedPositionsExport = () => LedPosition[];
declare type ConflictingProcessesExport = () => string[];
declare type ControllableParametersExport = () => Parameter[];
declare type ValidateExport = (Endpoint: HidEndpoint) => boolean;
declare type ScanExport = (bus: FreeAddressBus) => number[];

declare type SupportsFanControl = () => boolean;
declare type DefaultComponentBrand  = () => string;

declare type IOMethod = "HID" | "RAWUSB" | "SMBUS";
declare interface HidEndpoint{
	interface: number
	usage: number
	usage_page: number
	collection?: number
}