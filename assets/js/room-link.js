import { supportsDesktopRoom } from './room-device.js';
if (supportsDesktopRoom()) {
  for (const link of document.querySelectorAll('[data-room-link]')) link.hidden = false;
}
