// ============================================================
// EDGE STATES — offline, mic permission, audio failed
// ============================================================

const E_P = window.DC_PALETTE || {
  bg:'oklch(96.5% 0.012 82)', surface:'oklch(98.8% 0.006 78)',
  ink:'oklch(22% 0.018 62)', ink2:'oklch(43% 0.018 65)', ink3:'oklch(57% 0.012 70)',
  clay:'oklch(60% 0.09 42)', clayLight:'oklch(93% 0.025 75)',
  slate:'oklch(50% 0.10 248)', sage:'oklch(52% 0.08 158)',
  border:'oklch(88% 0.012 75)',
};

// ── Icons ─────────────────────────────────────────────────────
function WifiOffIcon({ size=22, color }) {
  const c = color || E_P.ink3;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         aria-label="No network connection" role="img">
      <line x1="1" y1="1" x2="23" y2="23"/>
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/>
      <path d="M5 12.55a10.94 10.94 0 015.17-2.39"/>
      <path d="M10.71 5.05A16 16 0 0122.56 9"/>
      <path d="M1.42 9a15.91 15.91 0 014.7-2.88"/>
      <path d="M8.53 16.11a6 6 0 016.95 0"/>
      <circle cx="12" cy="20" r="1" fill={c} stroke="none"/>
    </svg>
  );
}

function AudioMutedIcon({ size=19, color }) {
  const c = color || E_P.ink3;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
         stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
         aria-label="Audio unavailable" role="img">
      {/* Play triangle (muted) */}
      <path d="M5 4l11 6-11 6V4z" fill={c} stroke="none" opacity="0.45"/>
      {/* Slash */}
      <line x1="3" y1="17" x2="17" y2="3"/>
    </svg>
  );
}

// ── Settings chrome ───────────────────────────────────────────
function SettingsRow({ label, sub, right }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', padding:'13px 0',
      borderBottom:`1px solid ${E_P.border}`, gap:12,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:"'Lexend',sans-serif", fontSize:15, fontWeight:400,
          color:E_P.ink,
        }}>{label}</div>
        {sub && (
          <div style={{
            fontFamily:"'Lexend',sans-serif", fontSize:12, color:E_P.ink3, marginTop:2,
          }}>{sub}</div>
        )}
      </div>
      {right}
    </div>
  );
}

function SettingsSectionHead({ label }) {
  return (
    <div style={{
      fontFamily:"'Lexend',sans-serif", fontSize:11, fontWeight:600,
      color:E_P.ink3, textTransform:'uppercase', letterSpacing:'0.07em',
      paddingTop:20, paddingBottom:6,
    }}>{label}</div>
  );
}

function SettingsToggle({ on=false, disabled=false }) {
  const w=44, h=26, knob=h-6;
  return (
    <div style={{
      width:w, height:h, borderRadius:h/2, position:'relative',
      background: on && !disabled ? E_P.slate : E_P.border,
      opacity: disabled ? 0.4 : 1,
      flexShrink:0, transition:'background 0.2s',
    }}>
      <div style={{
        position:'absolute', top:3,
        left: on ? w-knob-3 : 3,
        width:knob, height:knob, borderRadius:'50%',
        background:'white', transition:'left 0.2s',
        boxShadow:'0 1px 3px oklch(0% 0 0 / 0.15)',
      }}/>
    </div>
  );
}

// Settings page shell — wraps mic row in realistic chrome
function SettingsShell({ children, title='Settings' }) {
  return (
    <div style={{
      width:390, height:844, background:E_P.bg,
      fontFamily:"'Lexend',sans-serif", display:'flex', flexDirection:'column',
      overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{
        background:E_P.surface, borderBottom:`1px solid ${E_P.border}`,
        padding:'14px 20px', display:'flex', alignItems:'center', gap:8,
        flexShrink:0,
      }}>
        <button style={{
          background:'none', border:'none', cursor:'pointer', padding:'4px 0',
          fontFamily:"'Lexend',sans-serif", fontSize:14, fontWeight:500,
          color:E_P.clay, display:'flex', alignItems:'center', gap:4,
        }}>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none"
               stroke={E_P.clay} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 1L1 6l5 5"/>
          </svg>
          Back
        </button>
        <span style={{
          fontFamily:"'Lexend',sans-serif", fontSize:16, fontWeight:600,
          color:E_P.ink, flex:1, textAlign:'center', marginRight:40,
        }}>{title}</span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', padding:'0 20px 40px' }}>
        {/* Context rows above */}
        <SettingsSectionHead label="Practice"/>
        <SettingsRow label="Student name" right={
          <span style={{ fontFamily:"'Lexend',sans-serif", fontSize:14, color:E_P.ink3 }}>Mia</span>
        }/>
        <SettingsRow label="Grade" right={
          <span style={{ fontFamily:"'Lexend',sans-serif", fontSize:14, color:E_P.ink3 }}>Kindergarten</span>
        }/>
        <SettingsRow label="Session length" right={
          <span style={{ fontFamily:"'Lexend',sans-serif", fontSize:14, color:E_P.ink3 }}>16 cards</span>
        }/>

        {/* Microphone section — this is the focus */}
        <SettingsSectionHead label="Microphone"/>
        {children}

        {/* Context rows below */}
        <SettingsSectionHead label="About"/>
        <SettingsRow label="Privacy policy"/>
        <SettingsRow label="Version" right={
          <span style={{ fontFamily:"'Lexend',sans-serif", fontSize:14, color:E_P.ink3 }}>1.0.0</span>
        }/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OFFLINE — LAUNCH (no cached content)
// ─────────────────────────────────────────────────────────────
function OfflineLaunchScreen() {
  return (
    <div style={{
      width:390, height:844, background:E_P.bg,
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'0 48px 80px',
      fontFamily:"'Lexend',sans-serif",
    }}>
      <WifiOffIcon size={36} color={E_P.ink3}/>
      <div style={{ height:24 }}/>
      <h1 style={{
        fontFamily:"'Lexend',sans-serif", fontSize:28, fontWeight:600,
        color:E_P.ink, margin:0, textAlign:'center', lineHeight:1.2,
        letterSpacing:'-0.01em',
      }}>You're offline.</h1>
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:16, color:E_P.ink2,
        textAlign:'center', margin:'12px 0 0', lineHeight:1.65,
      }}>
        Connect to the internet to load today's practice.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OFFLINE — MID-DRILL BANNER (drill continues)
// ─────────────────────────────────────────────────────────────
function DrillOfflineBanner() {
  // Renders DrillCard (from window) with a muted banner pinned at top
  const DC = window.DrillCard;
  return (
    <div style={{ width:390, height:844, position:'relative', overflow:'hidden' }}>
      {/* Offline banner — muted, never red */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:50,
        background:E_P.surface,
        borderBottom:`1px solid ${E_P.border}`,
        padding:'9px 16px',
        display:'flex', alignItems:'center', gap:8,
      }}>
        <WifiOffIcon size={14} color={E_P.ink3}/>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:12, color:E_P.ink3,
          margin:0, lineHeight:1.4,
        }}>
          Offline — your child's progress will sync when you reconnect.
        </p>
      </div>
      {/* Full drill card underneath */}
      {DC
        ? <DC mode="phonics" cardState="idle" totalCards={16}/>
        : <div style={{ width:390, height:844, background:E_P.bg }}/>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MIC PERMISSION DENIED
// ─────────────────────────────────────────────────────────────
function MicDeniedSettings() {
  return (
    <SettingsShell>
      {/* Mic row — toggle forced off and disabled */}
      <SettingsRow
        label="Mic-based scoring"
        sub="Score attempts by voice"
        right={<SettingsToggle on={false} disabled={true}/>}
      />
      {/* Explainer below the row */}
      <div style={{
        padding:'12px 0 4px',
        borderBottom:`1px solid ${E_P.border}`,
      }}>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:13, color:E_P.ink2,
          margin:'0 0 6px', lineHeight:1.65,
        }}>
          Your browser blocked microphone access for this site. To use
          mic-based scoring, allow microphone access in your browser settings.
        </p>
        <button style={{
          background:'none', border:'none', padding:0, cursor:'pointer',
          fontFamily:"'Lexend',sans-serif", fontSize:13, fontWeight:500,
          color:E_P.clay, textDecoration:'underline', textUnderlineOffset:2,
        }}>
          How do I do this?
        </button>
      </div>
    </SettingsShell>
  );
}

// ─────────────────────────────────────────────────────────────
// BROWSER UNSUPPORTED (mic feature — iOS Safari / Firefox)
// ─────────────────────────────────────────────────────────────
function MicUnsupportedSettings() {
  return (
    <SettingsShell>
      {/* Toggle hidden entirely — replaced with calm message */}
      <div style={{
        padding:'14px 0',
        borderBottom:`1px solid ${E_P.border}`,
      }}>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:15, fontWeight:400,
          color:E_P.ink, margin:'0 0 6px',
        }}>Mic-based scoring</p>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:13, color:E_P.ink2,
          margin:0, lineHeight:1.65,
        }}>
          Mic-based scoring isn't available in this browser. Your child can
          still practice — you'll tap to score each attempt.
        </p>
      </div>
    </SettingsShell>
  );
}

// ─────────────────────────────────────────────────────────────
// AUDIO FAILED — drill card with failed audio state
// ─────────────────────────────────────────────────────────────
function AudioFailedDrillCard() {
  const [tapped, setTapped] = React.useState(true); // show post-tap state
  return (
    <div style={{
      width:390, height:844, background:E_P.bg,
      display:'flex', flexDirection:'column',
      fontFamily:"'Lexend',sans-serif", position:'relative', overflow:'hidden',
    }}>
      {/* Progress */}
      <div style={{ position:'absolute', top:24, left:22, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:"'Lexend',sans-serif", fontSize:11, color:E_P.ink3 }}>5 / 16</span>
        <div style={{ width:56, height:2.5, background:E_P.border, borderRadius:2 }}>
          <div style={{ width:'31%', height:'100%', background:E_P.ink3, borderRadius:2 }}/>
        </div>
      </div>

      {/* Card content */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'72px 28px 20px', gap:0,
      }}>
        {/* Word */}
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:18, fontWeight:400,
          color:E_P.ink2, margin:'0 0 14px',
        }}>Read this word.</p>
        <span style={{
          fontFamily:"'Lexend',sans-serif", fontSize:96, fontWeight:600,
          color:E_P.ink, lineHeight:1, letterSpacing:'-0.01em',
        }}>mat</span>

        {/* Audio button — failed state */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:32 }}>
          <button
            onClick={() => setTapped(true)}
            style={{
              width:68, height:68, borderRadius:'50%',
              background:'oklch(92% 0.008 75)',
              border:`2px dashed ${E_P.border}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', flexShrink:0,
            }}
          >
            <AudioMutedIcon size={22} color={E_P.ink3}/>
          </button>
          {tapped && (
            <p style={{
              fontFamily:"'Lexend',sans-serif", fontSize:12, color:E_P.ink3,
              margin:0, textAlign:'center', lineHeight:1.5,
            }}>
              Couldn't load audio — try again
            </p>
          )}
        </div>
      </div>

      {/* Scoring zone */}
      <div>
        <div style={{ display:'flex', justifyContent:'center', padding:'6px 0 2px' }}>
          <button style={{
            background:'none', border:'none', cursor:'pointer',
            fontFamily:"'Lexend',sans-serif", fontSize:12, color:E_P.ink3, padding:'7px 18px',
          }}>I need a minute</button>
        </div>
        <div style={{ display:'flex', borderTop:`1px solid ${E_P.border}` }}>
          <button style={{
            flex:1, height:76, background:E_P.surface, border:'none',
            borderRight:`1px solid ${E_P.border}`, cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', gap:5,
          }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none"
                 stroke={E_P.ink3} strokeWidth="2" strokeLinecap="round">
              <line x1="14" y1="4" x2="4" y2="14"/>
              <line x1="4"  y1="4" x2="14" y2="14"/>
            </svg>
            <span style={{
              fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:500, color:E_P.ink2,
            }}>Try again</span>
          </button>
          <button style={{
            flex:1, height:76, background:E_P.surface, border:'none',
            cursor:'pointer', display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:5,
          }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none"
                 stroke={E_P.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 9 7 13 15 5"/>
            </svg>
            <span style={{
              fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:500, color:E_P.sage,
            }}>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  OfflineLaunchScreen, DrillOfflineBanner,
  MicDeniedSettings, MicUnsupportedSettings,
  AudioFailedDrillCard,
});
