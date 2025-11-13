# Touch Controls Implementation

### 1. **Board Navigation**
- **Single Finger Pan**: Touch and drag to move around the board
- **Pinch-to-Zoom**: Use two fingers to zoom in and out
- **Automatic zoom anchoring**: Zoom centers around the pinch point

### 2. **Widget Interaction**
- **Touch Drag**: All widgets (dice, tokens, cards, etc.) can be moved with touch
- **Touch Resize**: Tokens and image widgets can be resized using touch on the resize handle
- **Touch-friendly Close Buttons**: Larger close buttons for easier tapping

### 3. **Token Features**
- **Touch Move**: Drag tokens around the board
- **Touch Resize**: Touch and drag the resize handle to change token size
  - Enhanced with dedicated touch events for better responsiveness
  - Larger resize handles on touch devices (24px vs 16px on desktop)
  - Prevents accidental board panning while resizing
- **Shape Toggle**: Touch the shape button to switch between circle and square
- **Grid Snapping**: All movements snap to the grid on release

### 4. **Image Widget Features**
- **Touch Move**: Drag image widgets around
- **Touch Resize**: Resize images while maintaining aspect ratio on touch
- **Touch Rotate**: Use the rotate button to rotate images 90 degrees

### 5. **Responsive Design**
- **Touch-friendly button sizes**: Minimum 44px touch targets
- **Mobile-optimized layout**: Better spacing and sizing on mobile devices
- **Prevention of unwanted scrolling**: Uses `touch-action: none` to prevent interference