//declare const service: DiscoveryService;

declare class service{

    public static log(Data: String | number | Object, Options?: LogOptions): void
    public static addController(instance: any): void;
    public static updateController(instance: any): void;
    public static hasController(Id: string): void;
    public static getController(Id: string);
    public static getSetting(Id: string, key: string): any;
    public static saveSetting(Id: string, key: string, value: any);
    public static announceController(instance: any);
    //public broadcast(QJSValue xMessage);
}
