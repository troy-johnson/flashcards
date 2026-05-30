// ============================================================
// DONE SCREEN — student-facing end-of-session
// "You're done." — calm, clear, no confetti.
// ============================================================

const DS_P = window.DC_PALETTE || {
  bg:'oklch(96.5% 0.012 82)', surface:'oklch(98.8% 0.006 78)',
  ink:'oklch(22% 0.018 62)', ink2:'oklch(43% 0.018 65)', ink3:'oklch(57% 0.012 70)',
  clay:'oklch(60% 0.09 42)', clayLight:'oklch(93% 0.025 75)',
  sage:'oklch(52% 0.08 158)', sageLight:'oklch(94% 0.02 155)',
  border:'oklch(88% 0.012 75)',
};

// Inject chip-in animation if not present
(() => {
  if (document.getElementById('done-styles')) return;
  const el = document.createElement('style');
  el.id = 'done-styles';
  el.textContent = `
    @keyframes chipIn {
      from { opacity:0; transform:scale(0.84) translateY(4px); }
      to   { opacity:1; transform:scale(1) translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes chipIn { from {} }
    }
    .done-bonus:hover { border-color: oklch(70% 0.015 70) !important; }
  `;
  document.head.appendChild(el);
})();

// Single calm leaf illustration — permitted at boundary screen
function LeafIllustration() {
  return (
    <svg width="50" height="64" viewBox="0 0 50 64" fill="none" aria-hidden="true">
      {/* Leaf body */}
      <path
        d="M25 60 C25 60 5 42 5 23 C5 11 14 4 25 4 C36 4 45 11 45 23 C45 42 25 60 25 60Z"
        fill={DS_P.clayLight}
        stroke={DS_P.clay}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Central vein */}
      <line x1="25" y1="4" x2="25" y2="60" stroke={DS_P.clay} strokeWidth="1" opacity="0.32"/>
      {/* Side veins */}
      <path d="M25 22 L15 32" stroke={DS_P.clay} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>
      <path d="M25 33 L35 43" stroke={DS_P.clay} strokeWidth="0.8" opacity="0.3" strokeLinecap="round"/>
    </svg>
  );
}

function DoneScreen({ studentName = 'Mia' }) {
  const mastered = [
    { label:'Letter M', unit:'K · Unit 1' },
    { label:'Short /a/', unit:'K · Unit 2' },
  ];

  return (
    <div style={{
      width:390, height:844, background:DS_P.bg,
      fontFamily:"'Lexend',sans-serif",
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'40px 36px 48px',
    }}>
      <LeafIllustration/>
      <div style={{ height:32 }}/>

      <h1 style={{
        fontFamily:"'Lexend',sans-serif", fontSize:48, fontWeight:600,
        color:DS_P.ink, margin:0, lineHeight:1.1, letterSpacing:'-0.02em',
        textAlign:'center',
      }}>You're done.</h1>

      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:18, fontWeight:400,
        color:DS_P.ink2, margin:'12px 0 0', textAlign:'center', lineHeight:1.5,
      }}>Nice work today.</p>

      <div style={{ height:44 }}/>

      {/* Mastered skills panel */}
      <div style={{
        width:'100%', background:DS_P.surface,
        border:`1px solid ${DS_P.border}`,
        borderRadius:18, padding:'18px 20px',
      }}>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:10, fontWeight:600,
          color:DS_P.ink3, textTransform:'uppercase', letterSpacing:'0.08em',
          margin:'0 0 14px',
        }}>Now mastered</p>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {mastered.map((skill, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px',
              background:DS_P.sageLight,
              borderRadius:10,
              animation:`chipIn 0.45s cubic-bezier(.18,.89,.32,1.2) ${i*0.18}s both`,
            }}>
              {/* Check circle */}
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="7.5" fill={DS_P.sage}/>
                <path d="M4 7.5l3 3 4-5" stroke="white" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{
                fontFamily:"'Lexend',sans-serif", fontSize:15, fontWeight:500,
                color:DS_P.ink,
              }}>{skill.label}</span>
              <span style={{
                fontFamily:"'Lexend',sans-serif", fontSize:11, color:DS_P.ink3,
                marginLeft:2,
              }}>{skill.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height:20 }}/>

      {/* Bonus round — optional, understated */}
      <button className="done-bonus" style={{
        width:'100%', height:56,
        background:'none', border:`2px solid ${DS_P.border}`,
        borderRadius:14, cursor:'pointer',
        fontFamily:"'Lexend',sans-serif", fontSize:15, fontWeight:500,
        color:DS_P.ink2, letterSpacing:'0.01em',
        transition:'border-color 0.2s',
      }}>
        Bonus round
      </button>
    </div>
  );
}

Object.assign(window, { DoneScreen });
