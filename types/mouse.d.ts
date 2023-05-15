declare type mouseEvent = {
    buttonCode: number,
    released: boolean,
    name: string
}
declare type MouseEventType = "Button Press";
declare type MouseButtonCode = 0x02 | 0x04 | 0x08 | 0x10 | 0x20 | 0x40 | 0x80 | 0x100 | 0x800 | 0x1000;
declare type mouseHidOptions = {
    XButton?: 0x01 | 0x02
    WheelDelta?: number
}

declare class mouse{
    public static sendHid(mouseButtonCode: MouseButtonCode, options?: mouseHidOptions): void
    public static sendEvent(event: mouseEvent, type: MouseEventType): void
}
