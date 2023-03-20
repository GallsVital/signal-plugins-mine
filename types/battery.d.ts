declare type BatteryState = -1 | 0 | 1 | 2 | 3 | 4 | 5

declare const battery: Battery;
declare class Battery{
	public setBatteryLevel(Level: number): void
	public setBatteryState(State: BatteryState): void

	public disabled: -1
	public Disabled(): -1
	public unknown: 0
	public Unknown(): 0
	public draining: 1
	public Draining(): 1
	public charging: 2
	public Charging(): 2
	public fullCharging: 3
	public FullCharging(): 3
	public full: 4
	public Full(): 4
	public wirelessCharging: 5
	public WirelessCharging(): 5

}