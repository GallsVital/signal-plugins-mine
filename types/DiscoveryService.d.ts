//declare const service: DiscoveryService;
type serviceObject = {id: string}

declare class service{

    public static log(Data: String | number | Object, Options?: LogOptions): void
    public static addController(instance: serviceObject): void;
    public static removeController(instance: serviceObject): void;
    public static updateController(instance: serviceObject): void;
    public static hasController(Id: string): void;
    public static getController(Id: string);

    public static getSetting(Id: string, key: string): any;
    public static saveSetting(Id: string, key: string, value: any);
    public static removeSetting(Id: string, key: string);

    public static announceController(instance: serviceObject);
    public static suppressController(instance: serviceObject)
    public static resolve(HostName: string, callback: Function): void
    //public broadcast(QJSValue xMessage);
    public static controllers: serviceObject[];
}
