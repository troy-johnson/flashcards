// ============================================================
// AUTH SCREENS — verify, sign-in form, check-your-email
// Carries forward DC_PALETTE from drill-card.jsx
// ============================================================

const A_P = window.DC_PALETTE || {
  bg:'oklch(96.5% 0.012 82)', surface:'oklch(98.8% 0.006 78)',
  ink:'oklch(22% 0.018 62)', ink2:'oklch(43% 0.018 65)', ink3:'oklch(57% 0.012 70)',
  clay:'oklch(60% 0.09 42)', clayLight:'oklch(93% 0.025 75)',
  slate:'oklch(50% 0.10 248)', sage:'oklch(52% 0.08 158)',
  border:'oklch(88% 0.012 75)',
};
// Dark warm clay — AA with white text (contrast ~6.6:1)
const A_CTA   = 'oklch(38% 0.09 42)';
const A_CTA_T = 'oklch(97% 0.008 80)';

(() => {
  if (document.getElementById('auth-styles')) return;
  const el = document.createElement('style');
  el.id = 'auth-styles';
  el.textContent = `
    @keyframes authSlide {
      0%   { left: -44%; }
      100% { left: 110%; }
    }
    @keyframes authIn {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes authSlide { 0%,100% {} }
      @keyframes authIn    { from {} }
    }
    .auth-root * { box-sizing: border-box; }
    .auth-btn-p:hover  { opacity:0.88 !important; }
    .auth-btn-s:hover  { border-color: oklch(72% 0.015 70) !important; }
    .auth-input:focus  { outline:none; border-color: oklch(60% 0.09 42) !important;
                         box-shadow: 0 0 0 3px oklch(93% 0.025 75); }
    .auth-input:disabled { opacity:0.55; }
  `;
  document.head.appendChild(el);
})();

// ── App wordmark ──────────────────────────────────────────────
function AppWordmark() {
  return (
    <div style={{
      fontFamily:"'Lexend',sans-serif", fontSize:13, fontWeight:600,
      color:A_P.ink, letterSpacing:'0.13em', textTransform:'uppercase',
    }}>readwith</div>
  );
}

// ── Soft-sun illustration — permitted at boundary moments ─────
function SoftSun({ size=52 }) {
  const r = size / 2;
  const inner = size * 0.18;
  const r0 = size * 0.26;
  const r1 = size * 0.40;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true">
      <circle cx={r} cy={r} r={inner} fill={A_P.clayLight} stroke={A_P.clay} strokeWidth="1.5"/>
      {Array.from({length:8}).map((_,i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        return (
          <line key={i}
            x1={r + r0 * Math.cos(a)} y1={r + r0 * Math.sin(a)}
            x2={r + r1 * Math.cos(a)} y2={r + r1 * Math.sin(a)}
            stroke={A_P.clay} strokeWidth="1.5" strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

// ── Buttons ───────────────────────────────────────────────────
function AuthBtn({ label, variant='primary', disabled=false, style={} }) {
  const p = variant === 'primary';
  return (
    <button
      className={p ? 'auth-btn-p' : 'auth-btn-s'}
      disabled={disabled}
      style={{
        width:'100%', height:54, borderRadius:12, cursor: disabled ? 'default' : 'pointer',
        fontFamily:"'Lexend',sans-serif", fontSize:16, fontWeight:500,
        letterSpacing:'0.01em',
        background: p ? A_CTA : 'none',
        border: `2px solid ${p ? A_CTA : A_P.border}`,
        color: p ? A_CTA_T : A_P.ink2,
        transition:'opacity 0.15s, border-color 0.15s',
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >{label}</button>
  );
}

// ── Email field ───────────────────────────────────────────────
function AuthEmailField({ defaultValue='', error=null, disabled=false }) {
  const [val, setVal] = React.useState(defaultValue);
  return (
    <div style={{ width:'100%' }}>
      <label style={{
        display:'block', marginBottom:6,
        fontFamily:"'Lexend',sans-serif", fontSize:13, fontWeight:500,
        color:A_P.ink3, letterSpacing:'0.02em',
      }}>Email</label>
      <input
        className="auth-input"
        type="email" value={val} disabled={disabled}
        onChange={e => setVal(e.target.value)}
        placeholder="you@example.com"
        style={{
          width:'100%', height:50, borderRadius:10, padding:'0 14px',
          border:`1.5px solid ${error ? A_P.ink2 : A_P.border}`,
          background: disabled ? 'oklch(93% 0.008 78)' : A_P.surface,
          fontFamily:"'Lexend',sans-serif", fontSize:16, color:A_P.ink,
          transition:'border-color 0.2s',
        }}
      />
      {error && (
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:13,
          color:A_P.ink2, margin:'6px 0 0', lineHeight:1.55,
        }}>{error}</p>
      )}
    </div>
  );
}

// ── Auth screen shell ─────────────────────────────────────────
function AuthShell({ children }) {
  return (
    <div className="auth-root" style={{
      width:390, height:844, background:A_P.bg,
      display:'flex', flexDirection:'column',
      fontFamily:"'Lexend',sans-serif", position:'relative', overflow:'hidden',
    }}>
      <div style={{ padding:'28px 32px 0', display:'flex', justifyContent:'center' }}>
        <AppWordmark/>
      </div>
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'0 36px 64px',
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Reusable error layout (C / D / E) ─────────────────────────
function AuthErrorCard({ headline, body }) {
  return (
    <div style={{
      width:'100%', display:'flex', flexDirection:'column', gap:14,
      animation:'authIn 0.3s ease-out',
    }}>
      <h1 style={{
        fontFamily:"'Lexend',sans-serif", fontSize:28, fontWeight:600,
        color:A_P.ink, margin:0, lineHeight:1.2, letterSpacing:'-0.01em',
      }}>{headline}</h1>
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:16, color:A_P.ink2,
        margin:0, lineHeight:1.65,
      }}>{body}</p>
      <div style={{ height:6 }}/>
      <AuthBtn label="Send a new link" variant="primary"/>
      <AuthBtn label="Use a different email" variant="secondary"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 1 — MAGIC-LINK VERIFY (5 states)
// ─────────────────────────────────────────────────────────────
function VerifyScreen({ state='verifying' }) {
  return (
    <AuthShell>
      {state === 'verifying' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24 }}>
          <p style={{
            fontFamily:"'Lexend',sans-serif", fontSize:22, fontWeight:500,
            color:A_P.ink, textAlign:'center', margin:0,
          }}>Signing you in.</p>
          {/* Sliding-bar progress — no spinner-of-doom */}
          <div style={{
            width:130, height:2.5, background:A_P.border, borderRadius:2,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{
              position:'absolute', top:0, height:'100%', width:'44%',
              background:A_P.clay, borderRadius:2,
              animation:'authSlide 1.5s ease-in-out infinite',
            }}/>
          </div>
        </div>
      )}

      {state === 'success' && (
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', gap:28,
          animation:'authIn 0.4s ease-out',
        }}>
          <SoftSun size={54}/>
          <p style={{
            fontFamily:"'Lexend',sans-serif", fontSize:32, fontWeight:600,
            color:A_P.ink, margin:0, lineHeight:1.15, letterSpacing:'-0.01em',
            textAlign:'center',
          }}>Welcome back.</p>
        </div>
      )}

      {state === 'expired' && (
        <AuthErrorCard
          headline="This link has expired."
          body="Sign-in links last 15 minutes. We can send you a new one."
        />
      )}

      {state === 'used' && (
        <AuthErrorCard
          headline="This link was already used."
          body="For your security, each sign-in link works once. Want a new one?"
        />
      )}

      {state === 'invalid' && (
        <AuthErrorCard
          headline="This link doesn't look right."
          body="Try opening the most recent link from your email, or request a new one."
        />
      )}
    </AuthShell>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 2 — SIGN-IN FORM (4 variants)
// ─────────────────────────────────────────────────────────────
function SignInForm({ variant='default' }) {
  const [count, setCount] = React.useState(28);
  React.useEffect(() => {
    if (variant !== 'rate-limited' || count <= 0) return;
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [variant, count]);

  const isRateLimited  = variant === 'rate-limited';
  const isInvalidEmail = variant === 'invalid-email';
  const isExpired      = variant === 'session-expired';

  return (
    <div className="auth-root" style={{
      width:390, height:844, background:A_P.bg,
      display:'flex', flexDirection:'column',
      fontFamily:"'Lexend',sans-serif", position:'relative', overflow:'hidden',
    }}>
      <div style={{ padding:'28px 32px 0', display:'flex', justifyContent:'center' }}>
        <AppWordmark/>
      </div>

      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'0 36px 64px',
      }}>
        <div style={{ width:'100%' }}>
          {/* Session-expired explainer banner */}
          {isExpired && (
            <div style={{
              padding:'12px 14px',
              background:A_P.surface, border:`1px solid ${A_P.border}`,
              borderRadius:10, marginBottom:24,
              animation:'authIn 0.3s ease-out',
            }}>
              <p style={{
                fontFamily:"'Lexend',sans-serif", fontSize:14, color:A_P.ink2,
                margin:0, lineHeight:1.6,
              }}>
                Your session expired — sign in to pick up where you left off.
              </p>
            </div>
          )}

          <h1 style={{
            fontFamily:"'Lexend',sans-serif", fontSize:32, fontWeight:600,
            color:A_P.ink, margin:'0 0 28px', lineHeight:1.1, letterSpacing:'-0.01em',
          }}>Sign in.</h1>

          <AuthEmailField
            defaultValue={isRateLimited ? 'ava@example.com' : isInvalidEmail ? 'ava@badformat' : ''}
            error={isInvalidEmail ? "That doesn't look like an email address." : null}
            disabled={isRateLimited}
          />

          {isRateLimited && (
            <p style={{
              fontFamily:"'Lexend',sans-serif", fontSize:13, color:A_P.ink3,
              margin:'8px 0 0', lineHeight:1.55,
            }}>
              Please wait a moment before requesting another link.{' '}
              <span style={{ fontWeight:500, color:A_P.ink2 }}>
                Try again in {count} s.
              </span>
            </p>
          )}

          <div style={{ height:20 }}/>

          <AuthBtn
            label="Send link"
            variant="primary"
            disabled={isRateLimited}
          />

          <p style={{
            fontFamily:"'Lexend',sans-serif", fontSize:13, color:A_P.ink3,
            textAlign:'center', margin:'16px 0 0', lineHeight:1.55,
          }}>
            We'll send a one-time sign-in link to this address.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCREEN 3 — CHECK YOUR EMAIL (3 states)
// ─────────────────────────────────────────────────────────────
function CheckEmailScreen({ state='sent', email='ava@example.com' }) {
  const [count, setCount] = React.useState(27);
  React.useEffect(() => {
    if (state !== 'cooldown' || count <= 0) return;
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [state, count]);

  const resendNode = () => {
    if (state === 'resent') return (
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:14, color:A_P.sage,
        margin:0, animation:'authIn 0.25s ease-out', lineHeight:1.55,
      }}>
        Sent another link to {email}.
      </p>
    );
    if (state === 'cooldown') return (
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:14, color:A_P.ink3,
        margin:0, lineHeight:1.55,
      }}>
        You can request another link in{' '}
        <span style={{ fontWeight:500, color:A_P.ink2 }}>{count} s.</span>
      </p>
    );
    // sent (default)
    return (
      <button style={{
        background:'none', border:'none', padding:0, cursor:'pointer',
        fontFamily:"'Lexend',sans-serif", fontSize:14, fontWeight:500,
        color:A_P.clay, textDecoration:'underline', textUnderlineOffset:2,
      }}>
        Send another link
      </button>
    );
  };

  return (
    <AuthShell>
      <div style={{
        width:'100%', display:'flex', flexDirection:'column',
        alignItems:'flex-start', animation:'authIn 0.35s ease-out',
      }}>
        <SoftSun size={48}/>
        <div style={{ height:28 }}/>
        <h1 style={{
          fontFamily:"'Lexend',sans-serif", fontSize:32, fontWeight:600,
          color:A_P.ink, margin:0, lineHeight:1.15, letterSpacing:'-0.01em',
        }}>Check your email.</h1>
        <div style={{ height:14 }}/>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:16, color:A_P.ink,
          margin:0, lineHeight:1.65,
        }}>
          We sent a link to <strong>{email}.</strong>
        </p>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:16, color:A_P.ink2,
          margin:'4px 0 0', lineHeight:1.65,
        }}>
          Tap the link to sign in. It expires in 15 minutes.
        </p>
        <div style={{ height:32 }}/>
        {resendNode()}
      </div>
    </AuthShell>
  );
}

Object.assign(window, {
  VerifyScreen, SignInForm, CheckEmailScreen,
  AppWordmark, SoftSun, AuthBtn, AuthShell, A_P, A_CTA, A_CTA_T,
});
