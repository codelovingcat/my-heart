# My Heart

A cinematic front-end visual experiment centered around a large, luminous heart that feels alive through synchronized motion, light, sound, and interaction.

My Heart is intentionally minimal in its interface and focused on atmosphere. The experience combines a responsive SVG illustration with lightweight CSS animation and browser-native audio to create a calm but expressive heartbeat scene.

## Experience

The heart is designed to remain the visual focal point while the surrounding environment subtly responds to its rhythm.

### Visual system

- Full-screen, responsive SVG heart illustration
- Layered gradients, highlights, shadows, and soft glow
- Animated surface highlight moving across the heart
- Heartbeat-synchronized brightness and scale changes
- Ambient background glow that gently breathes with the heartbeat
- Subtle halo surrounding the heart
- Sparse floating light particles for depth and atmosphere
- Cinematic opening reveal on initial load
- Pointer-reactive lighting with subtle 3D perspective movement
- Concentric heartbeat shockwaves behind the heart

### Interaction

- Click or tap the heart for an additional heartbeat response
- Keyboard activation with Enter or Space
- Interactive shockwave burst on activation
- Responsive pointer lighting on supported devices
- Sound can be enabled or disabled from the interface

### Audio

The heartbeat sound is generated in the browser with the Web Audio API rather than loaded from an external audio file.

The audio system uses layered low-frequency tones and filtered noise to create a soft double-beat character that follows the visual heartbeat rhythm. Audio is activated only through a user interaction and is suspended while the page is hidden.

## Accessibility

- Semantic button control for sound
- Keyboard-accessible heart interaction
- Accessible labels for the interactive heart
- `prefers-reduced-motion` support for decorative motion
- Decorative visual layers are hidden from assistive technologies where appropriate

## Technology

My Heart is deliberately lightweight and dependency-free.

- HTML5
- CSS3
- SVG
- Vanilla JavaScript
- Web Audio API
- Browser-native animation APIs

No frameworks, build step, external UI library, or third-party runtime dependency is required.

## Run locally

Clone the repository and open `index.html` in a modern browser.

For a local development server, any static file server can be used. For example:

```bash
python -m http.server
```

Then open the local server URL in your browser.

## Project structure

```text
my-heart/
├── index.html    # Semantic page structure and SVG illustration
├── styles.css    # Visual system, animation, responsive behavior
├── app.js        # Interaction and Web Audio behavior
└── README.md     # Project documentation
```

## Design principles

My Heart follows a few simple principles:

1. **The heart stays dominant.** Effects support the illustration rather than compete with it.
2. **Motion is synchronized.** Light, glow, halo, waves, and sound follow the same heartbeat rhythm.
3. **Interaction feels physical.** Pointer movement and activation add small spatial and tactile responses.
4. **The implementation stays simple.** The experience is built with browser-native technologies instead of a heavy application stack.
5. **Accessibility is part of the experience.** Motion preferences and keyboard interaction are supported alongside the visual presentation.

## Status

The core visual experience is considered feature-complete. Future experiments can live as separate visual projects rather than continuing to add complexity to My Heart.
