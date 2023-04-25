declare type Parameter = ComboboxParameter | ColorParameter | NumberParameter | TextParameter | BooleanParameter | HueParameter
declare interface ParameterBase{
	property: string
	group?: string
	label: string
	default: string | number
	order?: number
	type: "color" | "combobox" | "number" | "boolean" | "textfield" | "hue"
}

declare interface ColorParameter extends ParameterBase{
	min: string
	max: string
	type: "color"
}
declare interface NumberParameter extends ParameterBase{
	min: string | number
	max: string | number
	step?: string | number
	live?: string | number | boolean
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