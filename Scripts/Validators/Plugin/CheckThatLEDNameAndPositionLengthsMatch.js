export function CheckThatLEDNameAndPositionLengthsMatch(Plugin, ReportErrorCallback) {
	if (typeof Plugin.LedPositions === "undefined") {
		return;
	}
	const LedNames = Plugin.LedNames();
	const LedPositions = Plugin.LedPositions();

	if (LedNames.length !== LedPositions.length) {
		ReportErrorCallback(`Led Name and Position differ in length! Led Painting and key press effects will not function. Led Names [${LedNames.length}], Led Positions: [${LedPositions.length}]`);
	}
}
