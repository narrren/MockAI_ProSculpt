# Proctoring Features Implementation

## ✅ Implemented Features

### 1. AI Interviewer Avatar
- **Location**: Top of left panel
- **Features**:
  - Video-like interface similar to Zoom/Google Meet
  - Animated speaking indicator when AI is responding
  - Professional gradient background
  - Status indicator (Speaking/Listening)

### 2. Copy-Paste Disabled
- **Implementation**: Multiple layers of protection
- **Blocked Operations**:
  - Ctrl+C / Cmd+C (Copy)
  - Ctrl+V / Cmd+V (Paste)
  - Ctrl+A / Cmd+A (Select All)
  - Ctrl+X / Cmd+X (Cut)
  - Ctrl+Z / Cmd+Z (Undo)
  - Ctrl+S / Cmd+S (Save)
  - Right-click context menu
  - Browser paste events
  - Monaco Editor copy/paste commands

### 3. Head Movement Detection
- **Backend**: Enhanced proctoring module
- **Detection Methods**:
  - MediaPipe (if available): Precise head pose estimation
  - OpenCV Fallback: Face position deviation from center
  - Alerts when head is turned away significantly

### 4. Tab Switching Detection
- **Implementation**: Browser Visibility API
- **Features**:
  - Detects when user switches tabs
  - Detects when window is hidden/minimized
  - Real-time alerts displayed on video feed
  - Violations logged to backend

### 5. Window Focus Detection
- **Implementation**: Window blur/focus events
- **Features**:
  - Detects when window loses focus
  - Alerts if focus lost for more than 1 second
  - Tracks focus/blur count
  - Reports violations to backend

### 6. Keyboard Shortcut Blocking
- **Blocked Shortcuts**:
  - F12 (Developer Tools)
  - Ctrl+Shift+I (DevTools)
  - Ctrl+Shift+J (Console)
  - All copy/paste shortcuts
  - Context menu (right-click)

### 7. Face Detection (Working)
- **Status**: ✅ Active
- **Features**:
  - Real-time face detection via webcam
  - Multiple face detection
  - Face distance monitoring
  - Eye closure detection (with MediaPipe)
  - No face detected alerts

## 🎯 Proctoring Alerts

All violations trigger:
1. **Visual Alert**: Red badge on video feed
2. **Backend Logging**: Violation recorded with timestamp
3. **Real-time Notification**: Immediate feedback to user

## 📊 Violation Types Tracked

1. `keyboard_shortcut` - Copy/paste shortcuts attempted
2. `devtools_access` - Developer tools access attempt
3. `paste_attempt` - Paste operation blocked
4. `copy_attempt` - Copy operation blocked
5. `context_menu` - Right-click menu access
6. `editor_context_menu` - Right-click in code editor
7. `editor_copy` - Copy in editor
8. `editor_paste` - Paste in editor
9. `editor_select_all` - Select all in editor
10. `tab_switch` - Tab switching detected
11. `window_blur` - Window lost focus
12. `no_face` - Face not detected
13. `multiple_faces` - Multiple faces detected
14. `head_turned` - Head turned away
15. `eyes_closed` - Eyes closed detected

## 🔧 Configuration

### Disable Proctoring Features
Edit `frontend/src/components/CodeEditor.js`:
```javascript
<CodeEditor 
  apiUrl={API_URL} 
  onViolation={handleCodeViolation}
  reportToBackend={false}  // Set to false to disable backend reporting
/>
```

### Adjust Alert Sensitivity
Edit `backend/proctoring.py`:
- `alert_cooldown`: Time between alerts (default: 2.0 seconds)
- `deviation > 0.05`: Head turn threshold
- `normalized_size`: Face distance thresholds

## 🚨 Important Notes

1. **Browser Limitations**: Some features can be bypassed by determined users
2. **Privacy**: All violations are logged - ensure compliance with privacy laws
3. **Performance**: Proctoring runs continuously - may impact performance on low-end devices
4. **MediaPipe**: Currently not available for Python 3.13 - using OpenCV fallback

## 🔄 Future Enhancements

- [ ] Audio integrity monitoring
- [ ] Screen recording detection
- [ ] Mouse movement tracking
- [ ] Keystroke timing analysis
- [ ] Browser extension detection
- [ ] Virtual machine detection

