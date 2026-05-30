// ============================================================
// MAGIC-LINK EMAIL — 600 px transactional template
// Email-safe: web-safe font fallbacks, inline-ready styles
// Note: oklch() used for design preview; production build
// should substitute hex equivalents for Outlook compatibility
// ============================================================

// Hex equivalents for email-safe rendering
const EM = {
  bg:      '#f5f0ea',
  surface: '#faf8f5',
  ink:     '#2d2318',
  ink2:    '#6b5e50',
  ink3:    '#8e8075',
  ctaBg:   '#7a3a24',   // oklch(38% 0.09 42) → dark terracotta
  ctaText: '#faf7f3',
  border:  '#e5ddd3',
  font:    '"Lexend", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
};

function MagicLinkEmail() {
  const url = 'https://readwith.app/auth/verify?token=a1b2c3d4e5f6';

  return (
    // Outer wrapper — full width background
    <div style={{
      width:600, background:EM.bg, fontFamily:EM.font,
      padding:'48px 0 40px',
    }}>
      {/* Inner card */}
      <div style={{
        maxWidth:520, margin:'0 auto',
        background:EM.surface, borderRadius:12,
        border:`1px solid ${EM.border}`,
        overflow:'hidden',
      }}>
        {/* Top area */}
        <div style={{ padding:'32px 40px 0' }}>

          {/* Wordmark */}
          <div style={{
            fontFamily:EM.font, fontSize:12, fontWeight:600,
            color:EM.ink, letterSpacing:'0.13em', textTransform:'uppercase',
            marginBottom:32,
          }}>readwith</div>

          {/* Headline */}
          <h1 style={{
            fontFamily:EM.font, fontSize:28, fontWeight:600,
            color:EM.ink, margin:'0 0 16px', lineHeight:1.2,
            letterSpacing:'-0.01em',
          }}>Your sign-in link.</h1>

          {/* Body */}
          <p style={{
            fontFamily:EM.font, fontSize:15, color:EM.ink2,
            margin:'0 0 28px', lineHeight:1.7,
          }}>
            Tap the button below to sign in. This link works once and
            expires in 15 minutes.
          </p>

          {/* CTA button */}
          <div style={{ marginBottom:24 }}>
            <a
              href={url}
              style={{
                display:'inline-block',
                padding:'14px 28px',
                background:EM.ctaBg, color:EM.ctaText,
                borderRadius:10, textDecoration:'none',
                fontFamily:EM.font, fontSize:15, fontWeight:500,
                letterSpacing:'0.01em',
              }}
            >
              Sign in
            </a>
          </div>

          {/* Raw URL fallback */}
          <p style={{
            fontFamily:EM.font, fontSize:12, color:EM.ink3,
            margin:'0 0 28px', lineHeight:1.6,
          }}>
            Or paste this into your browser:<br/>
            <span style={{
              fontFamily:'Menlo, Consolas, "Courier New", monospace',
              fontSize:11, color:EM.ink2,
              wordBreak:'break-all',
            }}>{url}</span>
          </p>
        </div>

        {/* Divider */}
        <div style={{
          margin:'0 40px',
          borderTop:`1px solid ${EM.border}`,
        }}/>

        {/* Footer */}
        <div style={{ padding:'20px 40px 28px' }}>
          <p style={{
            fontFamily:EM.font, fontSize:12, color:EM.ink3,
            margin:'0 0 12px', lineHeight:1.7,
          }}>
            If you didn't request this, you can ignore this email. No one
            can sign in without clicking the link.
          </p>
          <p style={{
            fontFamily:EM.font, fontSize:11, color:EM.ink3,
            margin:0, letterSpacing:'0.01em',
          }}>
            readwith — daily literacy practice.
          </p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MagicLinkEmail });
