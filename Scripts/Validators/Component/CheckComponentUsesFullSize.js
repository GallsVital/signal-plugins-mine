export function CheckComponentUsesFullSize(Component, ReportErrorCallback) {
	if (typeof Component.LedCoordinates === "undefined") {
		ReportErrorCallback(`Component is missing Led Coordinates?!`);

		return;
	}

	if (typeof Component.Width === "undefined") {
		ReportErrorCallback(`Component is missing Width?!`);

		return;
	}

	if (typeof Component.Height === "undefined") {
		ReportErrorCallback(`Component is missing Height?!`);

		return;
	}

	const width = Component.Width;
	const height = Component.Height;
	const LedCoordinates = Component.LedCoordinates;

	let maxWidth = 0;
	let maxHeight = 0;
	let minWidth = Number.MAX_SAFE_INTEGER;
	let minHeight = Number.MAX_SAFE_INTEGER;

	LedCoordinates.forEach((Position) => {
		maxWidth = Math.max(maxWidth, Position[0]);
		maxHeight = Math.max(maxHeight, Position[1]);
		minWidth = Math.min(minWidth, Position[0]);
		minHeight = Math.min(minHeight, Position[1]);
	});

	if(minWidth !== 0){
		ReportErrorCallback(`Component has a minimum X coordinate of [${minWidth}]. This is not 0, Why does this component not use the full width?`);
	}

	if(maxWidth !== width - 1){
		ReportErrorCallback(`Component has a maximum X coordinate of [${maxWidth}]. This is not width - 1 (${width - 1}), Why does this component not use the full width?`);
	}

	if(minHeight !== 0){
		ReportErrorCallback(`Component has a minimum Y coordinate of [${minHeight}]. This is not 0, Why does this component not use the full height?`);
	}

	if(maxHeight !== height - 1){
		ReportErrorCallback(`Component has a maximum Y coordinate of [${maxHeight}]. This is not height - 1 (${height - 1}), Why does this component not use the full height?`);
	}

}
