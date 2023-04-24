export default class DpiController{
    private currentStageIdx: number = 1;
    private maxSelectedableStage = 5;
    private maxStageIdx = 5; //Default to 5 as it's most common if not defined
    private sniperStageIdx: number = 6;
    private updateCallback = (dpi) => { this.log("No Set DPI Callback given. DPI Handler cannot function!"); dpi;}
    private logCallback = (message) => {console.log(message)}

    private sniperMode = false;
    private enabled = false;
    private dpiRollover = false;
    private dpiMap = new Map();
    public maxDpi = 18000;
    public minDpi = 200;

    constructor(){

    }

    public addProperties(){
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

   public getCurrentStage(){
        return this.currentStageIdx;
    }

    public getMaxStage(){
        return this.maxStageIdx;
    }
    public getSniperIdx(){ return this.sniperStageIdx; }

    public setRollover(enabled){
        this.dpiRollover = enabled;
    }

    public setMaxStageCount(count){
        this.maxStageIdx = count;
        this.rebuildUserProperties();
    }

    public setMinDpi(minDpi){ this.minDpi = minDpi; this.updateDpiRange();}
    public setMaxDpi(maxDpi){ this.maxDpi = maxDpi; this.updateDpiRange();}

    public setUpdateCallback(callback){
        this.updateCallback = callback;
    }

    public active(){ return this.enabled}

    public setActiveControl(EnableDpiControl) {
		this.enabled = EnableDpiControl;
        if(this.enabled){
			this.update();
		}

	}
	/** GetDpi Value for a given stage.*/
	public getDpiForStage(stage) {
        if(!this.dpiMap.has(stage)){
            this.log("Invalid Stage...")
            return;
        }

		// This is a dict of functions, make sure to call them
		this.log("Current DPI Stage: " + stage);
        let dpiWrapper = this.dpiMap.get(stage);
        let dpi = dpiWrapper();
		this.log("Current DPI: " + dpi);

		return dpi;
	}

	/** Increment DPIStage */
	public increment() {
		this.setStage(this.currentStageIdx + 1);
	}

	/** Decrement DPIStage */
	public decrement() {
		this.setStage(this.currentStageIdx - 1);
	}

	/** Set DPIStage and then set DPI to that stage.*/
	public setStage(stage) {
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
    public update() {
		if (!this.enabled) {
			return;
		}
        
        let stage = this.sniperMode ? this.sniperStageIdx : this.currentStageIdx;
        let dpi = this.getDpiForStage(stage);

        if(dpi){
            this.updateCallback(dpi);
        }

	}

	/** Stage update check to update DPI if current stage values are changed.*/
	public DPIStageUpdated(stage) {
		// if the current stage's value was changed by the user
		// reapply the current stage with the new value
		if (stage === this.currentStageIdx) {
			this.update();
		}
	}

	/** Set Sniper Mode on or off. */
	public setSniperMode(sniperMode) {
		this.sniperMode = sniperMode;
		this.log("Sniper Mode: " + this.sniperMode);
		this.update();
	}

    public rebuildUserProperties(){
        // Remove Stages
        for(const stage in this.dpiMap.keys()){
            if(+stage > this.maxStageIdx){
                this.log(`Removing Stage: ${stage}`)
                device.removeProperty(`dpi${+stage}1`);
                this.dpiMap.delete(stage)
            }
        }

        // Add new Stages
        let stages = Array.from(this.dpiMap.keys());
        for(let i = 1; i <= this.maxStageIdx; i++){
            if(stages.includes(i)){
                continue;
            }

            this.log(`Adding Stage: ${i}`)
            device.addProperty({"property":`dpi${i}`, "group":"mouse", "label":`DPI ${i}`, "step":"50", "type":"number", "min": this.minDpi, "max": this.maxDpi, "default":"400"});
            this.dpiMap.set(i, () => { return eval(`dpi${i}`)});
        }
    }

    private updateDpiRange(){
        for(const stage in this.dpiMap.keys()){
            let prop = device.getProperty(`dpi${+stage}`)// as NumberParameter;
            prop.min = this.minDpi;
            prop.max = this.maxDpi;
            device.addProperty(prop);
        }

    }

    private log(message: string){
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
