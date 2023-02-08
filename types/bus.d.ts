declare const bus: FixedAddressBus;

declare class BusBase{
		/** Returns if this bus is a AMD (PIIX4) or Intel (ICH8) bus  */
		public IsSystemBus(): boolean
		public IsIntelBus(): boolean
		public IsAMDBus(): boolean
		public IsNvidiaBus(): boolean
		public IsNuvotonBus(): boolean
	
		public Name(): string
		public Vendor(): number
		public SubVendor(): number
		public Product(): number
		public SubDevice(): number
		public Port(): number
	
		public log(Data: any, options?: LogOptions): void
	
		public FetchRamInfo(): string
}
declare class FreeAddressBus extends BusBase{
	public ReadByte(Address: number, Register: number): number
	public ReadByteWithoutRegister(Address: number): number
	public ReadBlockBytes(Address: number, Register: number, Size: number, Data: number[]): [number, number[]]
	public ReadBlockWithoutRegister(Size: number): [number, number[]]

	public WriteBlock(Address: number, Register: number, Size: number, Data: number[]): number
	public WriteBlockWithoutRegister(Address: number, Size: number, Data: number[]): number
	public WriteWord(Address: number, Register: number, Word: number): number
	public WriteByte(Address: number, Register: number, Byte: number): number
	public WriteQuick(Address: number): number
}

declare class FixedAddressBus extends BusBase{
	public ReadByte(Register: number): number
	public ReadByteWithoutRegister(): number
	public ReadBlockBytes(Register: number, Size: number): [number, number[]]
	public ReadBlockWithoutRegister(Size: number): [number, number[]]
	public WriteBlock(Register: number, Size: number, Data: number[]): number
	public WriteBlockWithoutRegister(Size: number, Data: number[]): number
	public WriteWord(Register: number, Word: number): number
	public WriteByte(Register: number, Byte: number): number
	public WriteQuick(Address: number): number

	public GetAddress(): number
}