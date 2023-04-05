declare type KeyboardEvent = {
    key: string,
    keyCode: number,
    released: boolean,
}

declare type KeyboardEventType = "Key Press";
declare type KeyboardHidOptions = {
    released?: boolean
}
declare class keyboard{
    public static sendHid(keyboardVKCode: number, options?: KeyboardHidOptions): void
    public static sendEvent(event: KeyboardEvent, type: KeyboardEventType): void
}