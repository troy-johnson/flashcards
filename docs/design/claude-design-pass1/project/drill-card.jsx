// ============================================================
// DRILL CARD — four modes × three states each
// Student-facing · full-screen · locked-down
// ============================================================

const DC_PALETTE = {
  bg:         'oklch(96.5% 0.012 82)',
  surface:    'oklch(98.8% 0.006 78)',
  ink:        'oklch(22% 0.018 62)',
  ink2:       'oklch(43% 0.018 65)',
  ink3:       'oklch(57% 0.012 70)',
  clay:       'oklch(60% 0.09 42)',
  clayLight:  'oklch(93% 0.025 75)',
  slate:      'oklch(50% 0.10 248)',
  slateLight: 'oklch(93% 0.02 240)',
  sage:       'oklch(52% 0.08 158)',
  sageLight:  'oklch(94% 0.02 155)',
  rose:       'oklch(57% 0.09 18)',
  roseLight:  'oklch(94% 0.02 20)',
  border:     'oklch(88% 0.012 75)',
};
window.DC_PALETTE = DC_PALETTE;

// Inject keyframes + base styles
(() => {
  if (document.getElementById('drill-styles')) return;
  const el = document.createElement('style');
  el.id = 'drill-styles';
  el.textContent = `
    @keyframes tileAttention {
      0%,100% { border-color: oklch(88% 0.012 75); background: oklch(98.8% 0.006 78); }
      50%      { border-color: oklch(60% 0.09 42);  background: oklch(93% 0.025 75); }
    }
    @keyframes fadeUp {
      from { opacity:0; transform:translateY(6px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes tileAttention { 0%,100% {} }
      @keyframes fadeUp        { from {} }
    }
    .drill-root *, .drill-root *::before, .drill-root *::after { box-sizing: border-box; }
    .drill-score-btn { transition: background 0.14s; }
    .drill-score-btn:hover { background: oklch(94% 0.01 80) !important; }
    .drill-gear { transition: opacity 0.15s; }
    .drill-gear:hover { opacity: 0.55 !important; }
    .drill-audio-btn { transition: background 0.18s, border-color 0.18s; }
    .drill-audio-btn:hover { opacity: 0.88; }
    .drill-phonics-tile { transition: background 0.18s, border-color 0.18s; }
    .drill-phonics-tile:hover { opacity: 0.88; }
  `;
  document.head.appendChild(el);
})();

// ─── Gear icon (tap-and-hold 1 s) ────────────────────────────
function DrillGear({ onHold }) {
  const [active, setActive] = React.useState(false);
  const timer = React.useRef(null);
  const begin = () => {
    setActive(true);
    timer.current = setTimeout(() => { setActive(false); onHold && onHold(); }, 1000);
  };
  const cancel = () => { setActive(false); clearTimeout(timer.current); };
  return (
    <button
      className="drill-gear"
      onPointerDown={begin} onPointerUp={cancel} onPointerLeave={cancel}
      aria-label="Options — hold 1 second"
      style={{
        position:'absolute', top:16, right:16,
        width:44, height:44,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:'none', border:'none', cursor:'pointer',
        borderRadius:8, padding:0,
        opacity: active ? 0.65 : 0.24,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none"
           stroke={DC_PALETTE.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="2.5"/>
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2
                 M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42
                 M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/>
      </svg>
    </button>
  );
}

// ─── Progress ────────────────────────────────────────────────
function DrillProgress({ current, total }) {
  return (
    <div style={{
      position:'absolute', top:24, left:22,
      display:'flex', alignItems:'center', gap:8,
    }}>
      <span style={{
        fontFamily:"'Lexend',sans-serif", fontSize:11, fontWeight:400,
        color:DC_PALETTE.ink3, letterSpacing:'0.04em',
      }}>{current}&thinsp;/&thinsp;{total}</span>
      <div style={{
        width:56, height:2.5, background:DC_PALETTE.border, borderRadius:2, overflow:'hidden',
      }}>
        <div style={{
          height:'100%', width:`${(current/total)*100}%`,
          background:DC_PALETTE.ink3, borderRadius:2,
        }}/>
      </div>
    </div>
  );
}

// ─── Audio button ─────────────────────────────────────────────
function DrillAudio() {
  const [on, setOn] = React.useState(false);
  return (
    <button
      className="drill-audio-btn"
      onClick={() => setOn(p=>!p)}
      aria-label="Play audio"
      style={{
        width:68, height:68, borderRadius:'50%', flexShrink:0,
        background: on ? DC_PALETTE.clay : DC_PALETTE.surface,
        border:`2px solid ${on ? DC_PALETTE.clay : DC_PALETTE.border}`,
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', marginTop:32,
      }}
    >
      {on
        ? <svg width="19" height="19" viewBox="0 0 20 20" fill={DC_PALETTE.surface}>
            <rect x="4" y="3" width="4" height="14" rx="1.5"/>
            <rect x="12" y="3" width="4" height="14" rx="1.5"/>
          </svg>
        : <svg width="19" height="19" viewBox="0 0 20 20" fill={DC_PALETTE.ink}>
            <path d="M6 4l12 6-12 6V4z"/>
          </svg>
      }
    </button>
  );
}

// ─── Scoring zone ─────────────────────────────────────────────
function DrillScoring({ cardState }) {
  if (cardState === 'tryagain') {
    return (
      <div style={{ borderTop:`1px solid ${DC_PALETTE.border}` }}>
        <button className="drill-score-btn" style={{
          width:'100%', height:76, background:DC_PALETTE.surface, border:'none',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          fontFamily:"'Lexend',sans-serif", fontSize:14, fontWeight:500, color:DC_PALETTE.ink2,
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"
               stroke={DC_PALETTE.ink2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
          Next card
        </button>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'center', padding:'6px 0 2px' }}>
        <button style={{
          background:'none', border:'none', cursor:'pointer',
          fontFamily:"'Lexend',sans-serif", fontSize:12, color:DC_PALETTE.ink3,
          padding:'7px 18px', minHeight:34,
        }}>I need a minute</button>
      </div>
      <div style={{ display:'flex', borderTop:`1px solid ${DC_PALETTE.border}` }}>
        <button className="drill-score-btn" style={{
          flex:1, height:76, background:DC_PALETTE.surface,
          border:'none', borderRight:`1px solid ${DC_PALETTE.border}`,
          cursor:'pointer', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:5,
        }}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none"
               stroke={DC_PALETTE.ink3} strokeWidth="2" strokeLinecap="round">
            <line x1="14" y1="4" x2="4" y2="14"/>
            <line x1="4"  y1="4" x2="14" y2="14"/>
          </svg>
          <span style={{
            fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:500, color:DC_PALETTE.ink2,
          }}>Try again</span>
        </button>
        <button className="drill-score-btn" style={{
          flex:1, height:76, background:DC_PALETTE.surface,
          border:'none', cursor:'pointer', display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:5,
        }}>
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none"
               stroke={DC_PALETTE.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 9 7 13 15 5"/>
          </svg>
          <span style={{
            fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:500, color:DC_PALETTE.sage,
          }}>Got it</span>
        </button>
      </div>
    </div>
  );
}

// ─── Gear options overlay ─────────────────────────────────────
function GearMenu({ onClose }) {
  const items = ['Toggle scaffolding','Skip this card','Mute audio',"Re-roll today's plan"];
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset:0, background:'oklch(0% 0 0 / 0.3)',
      zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'flex-end',
      padding:'62px 12px 0',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:DC_PALETTE.surface,
        border:`1px solid ${DC_PALETTE.border}`,
        borderRadius:12, padding:'6px 0', minWidth:188,
        boxShadow:'0 6px 20px oklch(0% 0 0 / 0.10)',
        animation:'fadeUp 0.18s ease-out',
      }}>
        {items.map(item=>(
          <button key={item} onClick={onClose} style={{
            display:'block', width:'100%', padding:'11px 16px',
            background:'none', border:'none', textAlign:'left',
            fontFamily:"'Lexend',sans-serif", fontSize:14, color:DC_PALETTE.ink,
            cursor:'pointer',
          }}>{item}</button>
        ))}
      </div>
    </div>
  );
}

// ─── PHONEMIC AWARENESS ───────────────────────────────────────
function PhonemicContent({ cardState }) {
  const scaffolding = cardState === 'scaffolding';
  const boxes = [
    { letter:'c', show:true,       isTarget:!scaffolding },
    { letter:'a', show:scaffolding, isTarget:false },
    { letter:'t', show:scaffolding, isTarget:false },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:28 }}>
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:22, fontWeight:500,
        color:DC_PALETTE.ink, textAlign:'center', lineHeight:1.45, margin:0, maxWidth:268,
      }}>
        {scaffolding ? 'Listen to each sound in cat.' : 'Say the first sound in cat.'}
      </p>
      <div style={{ display:'flex', gap:10 }}>
        {boxes.map((box,i)=>(
          <div key={i} style={{
            width:72, height:72, borderRadius:10,
            border:`2px solid ${box.isTarget ? DC_PALETTE.clay : DC_PALETTE.border}`,
            background: box.isTarget ? DC_PALETTE.clayLight : DC_PALETTE.surface,
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: box.isTarget ? 'tileAttention 2.2s ease-in-out infinite' : 'none',
            transition:'border-color 0.35s, background 0.35s',
          }}>
            <span style={{
              fontFamily:"'Lexend',sans-serif", fontSize:34, fontWeight:600,
              color:DC_PALETTE.ink,
              opacity: box.show ? 1 : 0,
              transition:'opacity 0.3s',
            }}>{box.letter}</span>
          </div>
        ))}
      </div>
      {scaffolding && (
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:15,
          color:DC_PALETTE.ink3, margin:0, letterSpacing:'0.05em',
          animation:'fadeUp 0.25s ease-out',
        }}>/k/ · /æ/ · /t/</p>
      )}
    </div>
  );
}

// ─── PHONICS / DECODING ───────────────────────────────────────
function PhonicsContent({ cardState }) {
  const [active, setActive] = React.useState(null);
  const scaffolding = cardState === 'scaffolding';
  const phonemes = [
    { ch:'m', ipa:'/m/' },
    { ch:'a', ipa:'/æ/' },
    { ch:'t', ipa:'/t/' },
  ];
  if (scaffolding) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22 }}>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:18, fontWeight:400,
          color:DC_PALETTE.ink2, margin:0, textAlign:'center',
        }}>
          Tap each sound in{' '}
          <span style={{ fontWeight:600, color:DC_PALETTE.ink }}>mat</span>.
        </p>
        <div style={{ display:'flex', gap:8 }}>
          {phonemes.map((p,i)=>(
            <button key={i} className="drill-phonics-tile"
              onClick={()=>setActive(active===i ? null : i)}
              style={{
                width:76, height:88, borderRadius:12, padding:0,
                background: active===i ? DC_PALETTE.slateLight : DC_PALETTE.surface,
                border:`2px solid ${active===i ? DC_PALETTE.slate : DC_PALETTE.border}`,
                cursor:'pointer', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:6,
              }}>
              <span style={{
                fontFamily:"'Lexend',sans-serif", fontSize:44, fontWeight:600, lineHeight:1,
                color: active===i ? DC_PALETTE.slate : DC_PALETTE.ink,
              }}>{p.ch}</span>
              <span style={{
                fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:400,
                color: active===i ? DC_PALETTE.slate : DC_PALETTE.ink3,
              }}>{p.ipa}</span>
            </button>
          ))}
        </div>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:13,
          color:DC_PALETTE.ink3, margin:0,
        }}>Tap ▶ above to hear each sound</p>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:18, fontWeight:400,
        color:DC_PALETTE.ink2, margin:0,
      }}>Read this word.</p>
      <span style={{
        fontFamily:"'Lexend',sans-serif", fontSize:96, fontWeight:600,
        color:DC_PALETTE.ink, lineHeight:1, letterSpacing:'-0.01em',
      }}>mat</span>
    </div>
  );
}

// ─── HEART WORDS ─────────────────────────────────────────────
function HeartWordContent({ cardState }) {
  const explainer = cardState === 'explainer';
  const SaidWord = ({ size=88 }) => {
    const hs = Math.round(size * 0.17);
    return (
      <div style={{
        display:'inline-flex', alignItems:'baseline',
        paddingBottom: hs + 6,
        position:'relative',
      }}>
        <span style={{
          fontFamily:"'Lexend',sans-serif", fontSize:size, fontWeight:600,
          color:DC_PALETTE.ink, lineHeight:1,
        }}>s</span>
        <span style={{
          fontFamily:"'Lexend',sans-serif", fontSize:size, fontWeight:600,
          color:DC_PALETTE.rose, lineHeight:1, position:'relative',
        }}>
          ai
          <svg
            width={hs} height={Math.round(hs*0.88)}
            viewBox="0 0 20 18"
            fill={DC_PALETTE.rose}
            style={{
              position:'absolute',
              bottom: -(hs + 5),
              left:'50%', transform:'translateX(-50%)',
              display:'block',
            }}
          >
            <path d="M10 17C10 17 1 11 1 5A4.5 4.5 0 0110 2.5 4.5 4.5 0 0119 5C19 11 10 17 10 17Z"/>
          </svg>
        </span>
        <span style={{
          fontFamily:"'Lexend',sans-serif", fontSize:size, fontWeight:600,
          color:DC_PALETTE.ink, lineHeight:1,
        }}>d</span>
      </div>
    );
  };
  if (explainer) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22, maxWidth:310 }}>
        <p style={{
          fontFamily:"'Lexend',sans-serif", fontSize:18, fontWeight:400,
          color:DC_PALETTE.ink2, margin:0,
        }}>A heart word.</p>
        <SaidWord size={80}/>
        <div style={{
          background:DC_PALETTE.surface, border:`1px solid ${DC_PALETTE.border}`,
          borderRadius:14, padding:'16px 20px', width:'100%',
          animation:'fadeUp 0.25s ease-out',
        }}>
          <p style={{
            fontFamily:"'Lexend',sans-serif", fontSize:16, lineHeight:1.65,
            color:DC_PALETTE.ink, margin:'0 0 8px',
          }}>
            The <strong>s</strong> and <strong>d</strong> say their usual sounds.
          </p>
          <p style={{
            fontFamily:"'Lexend',sans-serif", fontSize:16, lineHeight:1.65,
            color:DC_PALETTE.rose, margin:0,
          }}>
            The <strong>ai</strong> is the heart — it says /ɛ/.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:18, fontWeight:400,
        color:DC_PALETTE.ink2, margin:0,
      }}>Read this word.</p>
      <SaidWord size={88}/>
    </div>
  );
}

// ─── FLUENCY ─────────────────────────────────────────────────
function FluencyContent() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, maxWidth:320 }}>
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:18, fontWeight:400,
        color:DC_PALETTE.ink2, margin:0,
      }}>Read this sentence.</p>
      <p style={{
        fontFamily:"'Lexend',sans-serif", fontSize:34, fontWeight:500,
        color:DC_PALETTE.ink, textAlign:'center', lineHeight:1.5, margin:0,
      }}>
        The cat sat on the mat.
      </p>
    </div>
  );
}

// ─── Main DrillCard ───────────────────────────────────────────
function DrillCard({ mode='phonemic', cardState='idle', totalCards=16 }) {
  const [gearOpen, setGearOpen] = React.useState(false);
  const cardNums = { phonemic:3, phonics:5, heartword:8, fluency:12 };
  const cardNum  = cardNums[mode] || 3;

  const contentMap = {
    phonemic:  <PhonemicContent  cardState={cardState}/>,
    phonics:   <PhonicsContent   cardState={cardState}/>,
    heartword: <HeartWordContent cardState={cardState}/>,
    fluency:   <FluencyContent/>,
  };

  return (
    <div className="drill-root" style={{
      width:390, height:844, background:DC_PALETTE.bg,
      display:'flex', flexDirection:'column',
      fontFamily:"'Lexend',sans-serif", position:'relative', overflow:'hidden',
    }}>
      <DrillGear onHold={()=>setGearOpen(true)}/>
      <DrillProgress current={cardNum} total={totalCards}/>

      {/* Main content */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'72px 28px 20px',
      }}>
        {contentMap[mode]}
        <DrillAudio/>
        {cardState === 'tryagain' && (
          <p style={{
            fontFamily:"'Lexend',sans-serif", fontSize:16,
            color:DC_PALETTE.ink2, textAlign:'center',
            margin:'24px 0 0', lineHeight:1.55,
            animation:'fadeUp 0.25s ease-out',
          }}>
            Let's try this one again later.
          </p>
        )}
      </div>

      {gearOpen && <GearMenu onClose={()=>setGearOpen(false)}/>}
      <DrillScoring cardState={cardState}/>
    </div>
  );
}

Object.assign(window, {
  DrillCard, DC_PALETTE,
  PhonemicContent, PhonicsContent, HeartWordContent, FluencyContent,
});
