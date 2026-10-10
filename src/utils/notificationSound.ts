// Web Audio API synthesized chime for instant notification alerts
// Compatible with all mobile devices (Android/iOS) and desktop browsers without external audio files

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Play a friendly dual-tone chime (e.g. 587Hz -> 880Hz, D5 to A5)
    const now = ctx.currentTime;
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (higher note)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Tone 3 (triumphant harmonic)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1174.66, now + 0.22); // D6
    gain3.gain.setValueAtTime(0, now + 0.22);
    gain3.gain.linearRampToValueAtTime(0.25, now + 0.27);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.22);
    osc3.stop(now + 0.7);

    // Auto-close audio context after sound finishes to free mobile resources
    setTimeout(() => {
      try { ctx.close(); } catch {}
    }, 1000);
  } catch (err) {
    // Ignore audio autoplay restrictions
  }
}

// Request and trigger browser native notification on mobile or desktop
export async function triggerNativeBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  try {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/badhra-logo.svg',
        badge: '/badhra-logo.svg',
        vibrate: [200, 100, 200],
      } as any);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/badhra-logo.svg',
          badge: '/badhra-logo.svg',
          vibrate: [200, 100, 200],
        } as any);
      }
    }
  } catch (err) {
    // Mobile browsers may reject without user gesture
  }
}
