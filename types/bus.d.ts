declare const bus: Bus;
declare class Bus{
	/** Returns if this bus is a AMD (PIIX4) or Intel (ICH8) bus  */
	public IsSystemBus(): boolean
	public IsIntelBus(): boolean
	public IsAMDBus(): boolean
	public IsNvidiaBus(): boolean
	public IsNuvotonBus(): boolean

	public ReadByte(): number

	public WriteBlock(Address: number, Size: number, Data: number[]): number
	public WriteWord(Address: number): number
	public WriteByte(Address: number): number
	public WriteQuick(Address: number): number

	public log(Data: any, options?: LogOptions): void

	public FetchRamInfo(): string

}