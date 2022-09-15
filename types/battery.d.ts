declare type BatteryState = -1 | 0 | 1 | 2 | 3 | 4 | 5

declare const battery: Battery;
declare class Battery{
	public setBatteryLevel(Level: number): void
	public setBatteryState(State: BatteryState): void

	public Disabled(): number
	public Unknown(): number
	public Draining(): number
	public Charging(): number
	public FullCharging(): number
	public Full(): number
	public WirelessCharging(): number

}