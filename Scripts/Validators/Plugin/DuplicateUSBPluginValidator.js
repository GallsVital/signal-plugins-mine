export class DuplicateUSBPluginValidator {
	constructor() {
		this.pluginMap = new Map();
	}

	CheckIDPair(Vendor, Product, ReportErrorCallback, PluginPath) {
		const pair = `${Vendor}:${Product}`;

		if (!this.pluginMap.has(pair)) {
			this.pluginMap.set(pair, [PluginPath]);

			return;
		}


		const PluginPaths = this.pluginMap.get(pair);
		let message = `Plugin contains duplicate Vendor:Product id pair!`;

		for (const path of PluginPaths) {
			message += "\n\t\tPrevious File: " + path;
		}

		ReportErrorCallback(message);

		PluginPaths.push(PluginPath);
		this.pluginMap.set(pair, PluginPaths);
	}

	CheckForUSBProductIdDuplicates(Plugin, ReportErrorCallback, PluginPath) {
		if (typeof Plugin.VendorId === "undefined" || typeof Plugin.ProductId === "undefined") {
			return;
		}

		const VendorId = Plugin.VendorId();
		const ProductIds = Plugin.ProductId();

		if (typeof ProductIds === "number") {
			this.CheckIDPair(VendorId, ProductIds, ReportErrorCallback, PluginPath);

			return;
		}

		for (const ProductId of ProductIds) {
			this.CheckIDPair(VendorId, ProductId, ReportErrorCallback, PluginPath);
		}
	}
}
