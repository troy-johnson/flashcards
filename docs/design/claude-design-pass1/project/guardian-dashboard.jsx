// ============================================================
// GUARDIAN DASHBOARD — /guardian/:studentId
// Adult-density · mobile + tablet variant
// ============================================================

const GD_P = window.DC_PALETTE || {
  bg:'oklch(96.5% 0.012 82)', surface:'oklch(98.8% 0.006 78)',
  ink:'oklch(22% 0.018 62)', ink2:'oklch(43% 0.018 65)', ink3:'oklch(57% 0.012 70)',
  clay:'oklch(60% 0.09 42)',
  slate:'oklch(50% 0.10 248)',
  sage:'oklch(52% 0.08 158)',
  rose:'oklch(57% 0.09 18)',
  border:'oklch(88% 0.012 75)',
};

const SKILLS = [
  {
    id:'k1', title:'K — Unit 1', subtitle:'Letter sounds & syllable blending', motif:'arch',
    nodes:[
      { id:'n1', label:'Letter M',  state:'mastered' },
      { id:'n2', label:'Letter S',  state:'mastered' },
      { id:'n3', label:'Letter A',  state:'mastered' },
      { id:'n4', label:'Letter T',  state:'active'   },
      { id:'n5', label:'CVC blend', state:'active'   },
      { id:'n6', label:'Syllables', state:'notyet'   },
    ],
  },
  {
    id:'k2', title:'K — Unit 2', subtitle:'Short vowels & decoding', motif:'circle',
    nodes:[
      { id:'n7',  label:'Short /a/', state:'active' },
      { id:'n8',  label:'Short /i/', state:'notyet' },
      { id:'n9',  label:'Short /o/', state:'notyet' },
      { id:'n10', label:'CVC words', state:'notyet' },
    ],
  },
  {
    id:'k3', title:'K — Unit 3', subtitle:'Heart words · Set 1', motif:'heart',
    nodes:[
      { id:'n11', label:'"the"',  state:'mastered' },
      { id:'n12', label:'"a"',    state:'mastered' },
      { id:'n13', label:'"said"', state:'active'   },
      { id:'n14', label:'"was"',  state:'notyet'   },
      { id:'n15', label:'"of"',   state:'notyet'   },
    ],
  },
];

const SESSIONS = [
  { date:'Today',       dur:'8 min', cards:16, done:true  },
  { date:'Thu May 22',  dur:'6 min', cards:14, done:true  },
  { date:'Wed May 21',  dur:'9 min', cards:16, done:true  },
  { date:'Tue May 20',  dur:'4 min', cards:9,  done:false },
  { date:'Mon May 19',  dur:'7 min', cards:16, done:true  },
  { date:'Sat May 17',  dur:'8 min', cards:16, done:true  },
  { date:'Fri May 16',  dur:'5 min', cards:11, done:true  },
];

const NEXT_UP = [
  { label:'Letter T',  state:'active' },
  { label:'"said"',    state:'active' },
  { label:'Short /a/', state:'active' },
];

function nodeColors(state) {
  if (state==='mastered') return { bg:GD_P.sage,  border:'oklch(45% 0.09 158)', text:'#fff' };
  if (state==='active')   return { bg:GD_P.slate, border:'oklch(43% 0.11 248)', text:'#fff' };
  return { bg:'oklch(88% 0.008 75)', border:'oklch(78% 0.01 72)', text:GD_P.ink3 };
}

// Unit cluster motifs — one quiet, non-animating shape per unit
function Motif({ type }) {
  const s = GD_P.ink3;
  const sw = 1.4;
  if (type==='arch')   return (
    <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
      <path d="M1 10C1 5 4 1 8 1s7 4 7 9" stroke={s} strokeWidth={sw} fill="none" strokeLinecap="round"/>
    </svg>
  );
  if (type==='circle') return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke={s} strokeWidth={sw} fill="none"/>
    </svg>
  );
  if (type==='heart')  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      <path d="M7 11S.5 7 .5 4A3 3 0 017 1.5 3 3 0 0113.5 4C13.5 7 7 11 7 11Z"
            stroke={s} strokeWidth={sw} fill="none"/>
    </svg>
  );
  return null;
}

function SkillNode({ node, onClick }) {
  const c = nodeColors(node.state);
  return (
    <button onClick={()=>onClick(node)} style={{
      minWidth:52, height:40, padding:'0 8px',
      background:c.bg, border:`1.5px solid ${c.border}`,
      borderRadius:7, cursor:'pointer',
      fontFamily:"'Lexend',sans-serif", fontSize:10.5, fontWeight:500,
      color:c.text, whiteSpace:'nowrap',
      transition:'opacity 0.14s',
    }}
    onMouseEnter={e=>e.currentTarget.style.opacity='0.82'}
    onMouseLeave={e=>e.currentTarget.style.opacity='1'}
    >{node.label}</button>
  );
}

function SkillUnit({ unit, onNodeClick }) {
  return (
    <div style={{
      background:GD_P.surface, border:`1px solid ${GD_P.border}`,
      borderRadius:12, padding:'12px 14px', marginBottom:10,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
        <Motif type={unit.motif}/>
        <div>
          <div style={{
            fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:600, color:GD_P.ink,
          }}>{unit.title}</div>
          <div style={{
            fontFamily:"'Lexend',sans-serif", fontSize:10.5, color:GD_P.ink3, marginTop:1,
          }}>{unit.subtitle}</div>
        </div>
      </div>
      {/* Nodes with connecting lines */}
      <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:5 }}>
        {unit.nodes.map((node,i)=>(
          <React.Fragment key={node.id}>
            {i > 0 && (
              <div style={{ width:8, height:1.5, background:GD_P.border, flexShrink:0 }}/>
            )}
            <SkillNode node={node} onClick={onNodeClick}/>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Popover with skill detail — tapping node opens it
function SkillPopover({ node, onClose }) {
  if (!node) return null;
  const c = nodeColors(node.state);
  const stateLabel = { mastered:'Mastered', active:'In progress', notyet:'Not yet introduced' }[node.state];
  return (
    <div onClick={onClose} style={{
      position:'absolute', inset:0, background:'oklch(0% 0 0 / 0.26)',
      zIndex:300, display:'flex', alignItems:'center', justifyContent:'center',
      padding:'0 20px',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:GD_P.surface, border:`1px solid ${GD_P.border}`,
        borderRadius:16, padding:'20px 20px 16px',
        width:'100%', maxWidth:290,
        boxShadow:'0 8px 28px oklch(0% 0 0 / 0.09)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:c.bg, flexShrink:0 }}/>
          <strong style={{
            fontFamily:"'Lexend',sans-serif", fontSize:15, fontWeight:600,
            color:GD_P.ink, flex:1,
          }}>{node.label}</strong>
          <span style={{
            fontFamily:"'Lexend',sans-serif", fontSize:11, color:GD_P.ink3,
          }}>{stateLabel}</span>
        </div>
        <div style={{ borderTop:`1px solid ${GD_P.border}`, paddingTop:12 }}>
          {[
            ['Last practiced','Today'],
            ['Accuracy this week','82%'],
            ['Cards seen total','24'],
          ].map(([k,v])=>(
            <div key={k} style={{
              display:'flex', justifyContent:'space-between', marginBottom:7,
            }}>
              <span style={{
                fontFamily:"'Lexend',sans-serif", fontSize:13, color:GD_P.ink3,
              }}>{k}</span>
              <span style={{
                fontFamily:"'Lexend',sans-serif", fontSize:13, fontWeight:500, color:GD_P.ink,
              }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{
          marginTop:14, width:'100%', height:38,
          background:'none', border:`1px solid ${GD_P.border}`,
          borderRadius:8, fontFamily:"'Lexend',sans-serif",
          fontSize:13, color:GD_P.ink2, cursor:'pointer',
        }}>Close</button>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily:"'Lexend',sans-serif", fontSize:10.5, fontWeight:600,
      color:GD_P.ink3, textTransform:'uppercase', letterSpacing:'0.07em',
      marginBottom:10,
    }}>{children}</div>
  );
}

function SkillLegend() {
  return (
    <div style={{ display:'flex', gap:12, marginBottom:10 }}>
      {[['mastered','Mastered'],['active','In progress'],['notyet','Not yet']].map(([s,l])=>{
        const c = nodeColors(s);
        return (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:c.bg }}/>
            <span style={{
              fontFamily:"'Lexend',sans-serif", fontSize:10, color:GD_P.ink3,
            }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
}

function SkillMap({ onNodeClick }) {
  return (
    <div style={{ marginBottom:24 }}>
      <SectionLabel>Skill map</SectionLabel>
      <SkillLegend/>
      {SKILLS.map(unit=>(
        <SkillUnit key={unit.id} unit={unit} onNodeClick={onNodeClick}/>
      ))}
    </div>
  );
}

function RecentSessions() {
  return (
    <div style={{ marginBottom:24 }}>
      <SectionLabel>Recent sessions</SectionLabel>
      {SESSIONS.map((s,i)=>(
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:10,
          padding:'9px 0', borderBottom:`1px solid oklch(92% 0.01 75)`,
        }}>
          <span style={{
            fontFamily:"'Lexend',sans-serif", fontSize:13, fontWeight:500,
            color:GD_P.ink, minWidth:90, flexShrink:0,
          }}>{s.date}</span>
          <span style={{
            fontFamily:"'Lexend',sans-serif", fontSize:13,
            color:GD_P.ink2, flex:1,
          }}>{s.dur} · {s.cards} cards</span>
          <span style={{
            fontFamily:"'Lexend',sans-serif", fontSize:10, fontWeight:600,
            padding:'2px 7px', borderRadius:4,
            color:  s.done ? GD_P.sage        : GD_P.clay,
            background: s.done ? 'oklch(94% 0.02 155)' : 'oklch(93% 0.025 75)',
          }}>{s.done ? 'done' : 'partial'}</span>
        </div>
      ))}
    </div>
  );
}

function NextUp() {
  return (
    <div style={{ marginBottom:20 }}>
      <SectionLabel>Next up · tomorrow</SectionLabel>
      <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
        {NEXT_UP.map((s,i)=>{
          const c = nodeColors(s.state);
          return (
            <div key={i} style={{
              padding:'5px 11px',
              background:c.bg, border:`1px solid ${c.border}`,
              borderRadius:6,
              fontFamily:"'Lexend',sans-serif", fontSize:12, fontWeight:500,
              color:c.text,
            }}>{s.label}</div>
          );
        })}
      </div>
    </div>
  );
}

function GuardianDashboard({ variant='mobile', studentName='Mia' }) {
  const [popNode, setPopNode] = React.useState(null);
  const w = variant==='tablet' ? 768 : 390;
  const h = variant==='tablet' ? 1024 : 844;
  const px = variant==='tablet' ? 28 : 18;

  return (
    <div style={{
      width:w, height:h, background:GD_P.bg,
      fontFamily:"'Lexend',sans-serif",
      display:'flex', flexDirection:'column',
      position:'relative', overflow:'hidden',
    }}>
      {/* Persistent header */}
      <div style={{
        background:GD_P.surface, borderBottom:`1px solid ${GD_P.border}`,
        padding:`13px ${px}px`, display:'flex', alignItems:'center',
        flexShrink:0,
      }}>
        <div>
          <div style={{
            fontFamily:"'Lexend',sans-serif", fontSize:17, fontWeight:600,
            color:GD_P.ink, lineHeight:1.2,
          }}>{studentName}</div>
          <div style={{
            fontFamily:"'Lexend',sans-serif", fontSize:11, color:GD_P.ink3, marginTop:1,
          }}>Kindergarten · Grade K</div>
        </div>
        <button style={{
          marginLeft:'auto', width:44, height:44,
          background:'none', border:'none', cursor:'pointer',
          borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
          color:GD_P.ink3,
        }} aria-label="Settings">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="2.5"/>
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2
                     M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42
                     M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/>
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', padding:`20px ${px}px` }}>
        {variant==='tablet' ? (
          /* Tablet: 2-column grid */
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 36px' }}>
            <div>
              <SkillMap onNodeClick={setPopNode}/>
            </div>
            <div>
              <RecentSessions/>
              <NextUp/>
            </div>
          </div>
        ) : (
          /* Mobile: single column */
          <>
            <SkillMap onNodeClick={setPopNode}/>
            <RecentSessions/>
            <NextUp/>
          </>
        )}
      </div>

      {popNode && <SkillPopover node={popNode} onClose={()=>setPopNode(null)}/>}
    </div>
  );
}

Object.assign(window, { GuardianDashboard });
