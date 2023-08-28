export default class performance{
    /** Starts a performance timer with the given name. If no name is given 'default' will be used.
     * @param Name Name of the performance timer
     * 
     * Calling {@link performance.EndTimer} will return the microseconds elapsed since the timer was started.
     * Calling this function again with the same timer name will restart the timer.
     */
    public static StartTimer(Name?: string): void
    /** Returns the microseconds elapsed since the given timer name was started. If no name is given 'default' will be used.
     * @param Name Name of the performance timer
     * 
     * Returns -1 if the timer name doesn't exist.
     */
    public static EndTimer(Name?: string): number
    /**
     * Logs information about the given performance timer name to the console. If no name is given 'default' will be used.
     * @param Name Name of the performance timer
     * 
     * This information includes the elapsed microseconds since the timer was started, and the longest, shortest, and average microsecond durations between the timer having been started and ended.
     */
    public static LogReport(Name?: string): void
    /** Returns an array of the string name for all currently active performance timers. */
    public static GetTimers(): string[]
    /** Returns the number of active performance timers. */
    public static Size(): number
}

