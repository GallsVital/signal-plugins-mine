export default class DpiController{
	constructor(){
		this.currentStageIdx = 1;
		this.maxSelectedableStage = 5;
		this.maxStageIdx = 5;
		this.sniperStageIdx = 6;

		this.updateCallback = (dpi) => { this.log("No Set DPI Callback given. DPI Handler cannot function!"); dpi;};

		this.logCallback = (message) => {console.log(message);};

		this.sniperMode = false;
		this.enabled = false;
		this.dpiRollover = false;
		this.dpiMap = new Map();
		this.maxDpi = 18000;
		this.minDpi = 200;
	}

	addProperties(){
		device.addProperty({"property":"settingControl", "group":"mouse", "label":"Enable Setting Control", "type":"boolean", "default":"true"});
		device.addProperty({"property":"dpiStages", "group":"mouse", "label":"Number of DPI Stages", "step":"1", "type":"number", "min":"1", "max": this.maxSelectedableStage, "default": this.maxStageIdx});
		device.addProperty({"property":"dpiRollover", "group":"mouse", "label":"DPI Stage Rollover", "type":"boolean", "default": "false"});

		try{
			// @ts-ignore
			this.maxStageIdx = dpiStages;
		}catch(e){
			this.log("Skipping setting of user selected max stage count. Property is undefined");
		}

		this.rebuildUserProperties();
		device.addProperty({"property":`dpi${this.sniperStageIdx}`, "group":"mouse", "label":"Sniper Button DPI", "step":"50", "type":"number", "min": this.minDpi, "max": this.maxDpi, "default":"400"});
	}

	getCurrentStage(){
		return this.currentStageIdx;
	}

	getMaxStage(){
		return this.maxStageIdx;
	}
	getSniperIdx(){ return this.sniperStageIdx; }

	setRollover(enabled){
		this.dpiRollover = enabled;
	}

	setMaxStageCount(count){
		this.maxStageIdx = count;
		this.rebuildUserProperties();
	}

	setMinDpi(minDpi){ this.minDpi = minDpi; this.updateDpiRange();}
	setMaxDpi(maxDpi){ this.maxDpi = maxDpi; this.updateDpiRange();}

	setUpdateCallback(callback){
		this.updateCallback = callback;
	}

	active(){ return this.enabled;}

	setActiveControl(EnableDpiControl) {
		this.enabled = EnableDpiControl;

		if(this.enabled){
			this.update();
		}

	}
	/** GetDpi Value for a given stage.*/
	getDpiForStage(stage) {
		if(!this.dpiMap.has(stage)){
			this.log("Invalid Stage...");

			return;
		}

		// This is a dict of functions, make sure to call them
		this.log("Current DPI Stage: " + stage);

		const dpiWrapper = this.dpiMap.get(stage);
		const dpi = dpiWrapper();
		this.log("Current DPI: " + dpi);

		return dpi;
	}

	/** Increment DPIStage */
	increment() {
		this.setStage(this.currentStageIdx + 1);
	}

	/** Decrement DPIStage */
	decrement() {
		this.setStage(this.currentStageIdx - 1);
	}

	/** Set DPIStage and then set DPI to that stage.*/
	setStage(stage) {
		if (stage > this.maxStageIdx) {
			this.currentStageIdx = this.dpiRollover ? 1 : this.maxStageIdx;
		} else if (stage < 1) {
			this.currentStageIdx = this.dpiRollover ? this.maxStageIdx : 1;
		} else {
			this.currentStageIdx = stage;
		}

		this.update();
	}

	/** SetDpi Using Callback. Bypasses setStage.*/
	update() {
		if (!this.enabled) {
			return;
		}

		const stage = this.sniperMode ? this.sniperStageIdx : this.currentStageIdx;
		const dpi = this.getDpiForStage(stage);

		if(dpi){
			this.updateCallback(dpi);
		}

	}

	/** Stage update check to update DPI if current stage values are changed.*/
	DPIStageUpdated(stage) {
		// if the current stage's value was changed by the user
		// reapply the current stage with the new value
		if (stage === this.currentStageIdx) {
			this.update();
		}
	}

	/** Set Sniper Mode on or off. */
	setSniperMode(sniperMode) {
		this.sniperMode = sniperMode;
		this.log("Sniper Mode: " + this.sniperMode);
		this.update();
	}

	rebuildUserProperties(){
		// Remove Stages
		for (const stage of Array.from(this.dpiMap.keys())) {

			if (+stage > this.maxStageIdx) {
				this.log(`Removing Stage: ${stage}`);
				device.removeProperty(`dpi${+stage}`);
				this.dpiMap.delete(stage);
			}
		}

		// Add new Stages
		const stages = Array.from(this.dpiMap.keys());

		for(let i = 1; i <= this.maxStageIdx; i++){
			if(stages.includes(i)){
				continue;
			}

			this.log(`Adding Stage: ${i}`);
			device.addProperty({"property":`dpi${i}`, "group":"mouse", "label":`DPI ${i}`, "step":"50", "type":"number", "min": this.minDpi, "max": this.maxDpi, "default":"400"});
			this.dpiMap.set(i, () => { return eval(`dpi${i}`);});
		}
	}

	updateDpiRange(){
		for(const stage in this.dpiMap.keys()){
			const prop = /** @type {NumberParameter}*/ (device.getProperty(`dpi${+stage}`));
			prop.min = this.minDpi;
			prop.max = this.maxDpi;
			device.addProperty(prop);
		}

	}

	log(message){
		if(this.logCallback){
			this.logCallback(message);
		}
	}
}

// const DPIConfig =
// {
// 	stages:
// 	{
// 		1: function () { return dpi1; },
// 		2: function () { return dpi2; },
// 		3: function () { return dpi3; },
// 		4: function () { return dpi4; },
// 		5: function () { return dpi5; },
// 		6: function () { return dpi6; }
// 	},
// 	callback: function (dpi) { return LogitechMouse.setDpi(dpi); }
// };
