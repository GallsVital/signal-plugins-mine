export function Name() { return "Asus Zephyrus M15"; }
export function VendorId() { return 0x0B05; }
export function Documentation(){ return "troubleshooting/asus"; }
export function ProductId() { return 0x1866; }
export function Publisher() { return "WhirlwindFX"; }
export function Size() { return [2, 2]; }
export function DefaultPosition(){return [240, 120];}
export function DefaultScale(){return 8.0;}

const vLedNames = [
	"Single Zone Keyboard"
];

const vLedPositions = [[0, 0]];

/*
export function ControllableParameters()
{
    return [
        {"property":"fan1", "label":"Fan 1 Type", "type":"combobox", "values":["ll120","lt44"], "default":"ll120"},
        {"property":"fan2", "label":"Fan 2 Type", "type":"combobox", "values":["ll120","lt44"], "default":"ll120"},
        {"property":"fan3", "label":"Fan 3 Type", "type":"combobox", "values":["ll120","lt44"], "default":"ll120"},
        {"property":"fan4", "label":"Fan 4 Type", "type":"combobox", "values":["ll120","lt44"], "default":"ll120"},
        {"property":"fan5", "label":"Fan 5 Type", "type":"combobox", "values":["ll120","lt44"], "default":"ll120"},
        {"property":"fan6", "label":"Fan 6 Type", "type":"combobox", "values":["ll120","lt44"], "default":"ll120"}
    ];
}
*/

export function Initialize() {

	// Qck doesn't require a setup packet.
	return "Hello, there!";
}

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Shutdown() {

}

export function Validate(endpoint) {
	// Qck has two interfaces - return 'true' if the endpoint is at interface
	// zero.
	return endpoint.usage === 0x0079;
}

export function Render() {
	const packet = [];

	packet[0] = 0x5D;
	packet[1] = 0xB3;
	packet[2] = 0x00;
	packet[3] = 0x00;

	const col = device.color(0, 0);
	packet[4] = col[0];
	packet[5] = col[1];
	packet[6] = col[2];

	packet[7] = 0xE1;

	device.write(packet, 64);

	//var commit = [];
	//commit[0] = 0x5D;
	//commit[1] = 0xB4;
	//device.write(commit, 64);
}
