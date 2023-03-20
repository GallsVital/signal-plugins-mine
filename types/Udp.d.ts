declare const udp: Udp;

declare class Udp{
    public send(Host: String, Port: number, avData: number[], meEndianness?: boolean);
}
