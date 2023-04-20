declare const udp: Udp;

declare class Udp{
    public send(Host: String, Port: number, avData: number[] | string | object, meEndianness?: boolean);
}

declare class dtls{
    public static createConnection(hostAddress: string, port: number, identity: string, key: string): void;
    public static hasEncryptedConnection(): boolean;
    public static send(data: number[]): number;
    public static CloseConnection(): void;
    public static onConnectionEstablished(callback: Function): void
    public static onConnectionClosed(callback: Function): void
    public static onConnectionError(callback: Function): void

}