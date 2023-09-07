export function CheckComponentLEDNameAndPositionLengthsMatch(Component, ReportErrorCallback) {
	if (typeof Component.LedCoordinates === "undefined") {
		ReportErrorCallback(`Component is missing Led Coordinates?!`);

		return;
	}

	if (typeof Component.LedNames === "undefined") {
		ReportErrorCallback(`Component is missing Led Names?!`);

		return;
	}

	const LedNames = Component.LedNames;
	const LedCoordinates = Component.LedCoordinates;

	if (LedNames.length !== LedCoordinates.length) {
		ReportErrorCallback(`Led Name and Position differ in length! Led Painting will not function. Led Names [${LedNames.length}], Led Positions: [${LedCoordinates.length}]`);
	}
}
