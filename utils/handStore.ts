
// A mutable object to store the latest hand tracking data.
// We use this pattern to allow the R3F loop to read the latest data
// without triggering React rerenders on every frame.

export const handStore = {
  detected: false,
  x: 0, // Normalized 0-1 (MediaPipe coordinates)
  y: 0, // Normalized 0-1
  isPinching: false, // True if thumb and index are close
  gesture: 'NONE' as 'OPEN' | 'CLOSED' | 'NONE', // New gesture state
  lastPinchTime: 0
};
