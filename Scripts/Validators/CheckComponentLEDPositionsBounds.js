export function CheckComponentLedPositionsBounds(Component, ReportErrorCallback) {
	if (typeof Component.LedCoordinates === "undefined") {
		return;
	}

	const width = Component.Width;
	const height = Component.Height;
	const LedCoordinates = Component.LedCoordinates;

	LedCoordinates.forEach((Position) => {
		if (Position[0] < 0 || Position[0] >= width) {
			ReportErrorCallback(`Led X coordinate of [${Position}] is out of bounds. [${Position[0]}] is not inside the plugins width [0-${width})`);
		}

		if (Position[1] < 0 || Position[1] >= height) {
			ReportErrorCallback(`Led Y coordinate of [${Position}] is out of bounds. [${Position[1]}] is not inside the plugins height [0-${height})`);
		}
	});
}
