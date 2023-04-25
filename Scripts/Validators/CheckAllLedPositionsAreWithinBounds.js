export function CheckAllLedPositionsAreWithinBounds(Plugin, ReportErrorCallback) {
	if (typeof Plugin.LedPositions === "undefined") {
		return;
	}

	const [width, height] = Plugin.Size();
	const LedPositions = Plugin.LedPositions();

	LedPositions.forEach((Position) => {
		if (Position[0] < 0 || Position[0] >= width) {
			ReportErrorCallback(`Led X coordinate of [${Position}] is out of bounds. [${Position[0]}] is not inside the plugins width [0-${width})`);
		}

		if (Position[1] < 0 || Position[1] >= height) {
			ReportErrorCallback(`Led Y coordinate of [${Position}] is out of bounds. [${Position[1]}] is not inside the plugins height [0-${height})`);
		}
	});
}
