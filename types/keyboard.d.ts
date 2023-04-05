declare type KeyboardEvent = {
    name: string,
    keyCode: number,
    released: boolean,
}

declare type KeyboardEventType = "Key Press";
declare type KeyboardHidOptions = {}
declare class keyboard{
    public static sendHid(keyboardVKCode: number, options: KeyboardHidOptions): void
    public static sendEvent(event: KeyboardEvent, type: KeyboardEventType): void
}