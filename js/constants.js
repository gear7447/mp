/* ============ constantes globales ============ */
const FAMILIES = ['Cull / triage','Comptages / breaks','Levées','Contrôles','Empalmages','Forçages','Faux mélanges','Fioritures','Changes / transferts','Autre'];
const DEFAULT_LEVELS = ['Découverte','En construction','Lente mais propre','Fiable','Automatique'];
const NX = ['','simple','double','triple','quadruple','quintuple','sextuple','septuple','octuple'];
const SUITS = [
  {sym:'♠︎',cls:'black',fr:'de pique'},
  {sym:'♥︎',cls:'red',fr:'de cœur'},
  {sym:'♦︎',cls:'red',fr:'de carreau'},
  {sym:'♣︎',cls:'black',fr:'de trèfle'}
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const MODE_LABEL = { tap:'au tap', interval:'intervalle', fixed:'fixe' };

const _X = {L:24, C:50, R:76};
const LAYOUTS = {
  '2':[['C',0],['C',1]],
  '3':[['C',0],['C',.5],['C',1]],
  '4':[['L',0],['R',0],['L',1],['R',1]],
  '5':[['L',0],['R',0],['C',.5],['L',1],['R',1]],
  '6':[['L',0],['R',0],['L',.5],['R',.5],['L',1],['R',1]],
  '7':[['L',0],['R',0],['C',.25],['L',.5],['R',.5],['L',1],['R',1]],
  '8':[['L',0],['R',0],['C',.25],['L',.5],['R',.5],['C',.75],['L',1],['R',1]],
  '9':[['L',0],['R',0],['L',.34],['R',.34],['C',.5],['L',.66],['R',.66],['L',1],['R',1]],
  '10':[['L',0],['R',0],['C',.17],['L',.34],['R',.34],['L',.66],['R',.66],['C',.83],['L',1],['R',1]]
};

function cardFace(r, s) {
  const rank = RANKS[r], suit = SUITS[s], c = suit.cls, sy = suit.sym;
  let h = '';
  h += `<div class="corner tl ${c}"><span class="r">${rank}</span><span class="s">${sy}</span></div>`;
  h += `<div class="corner br ${c}"><span class="r">${rank}</span><span class="s">${sy}</span></div>`;
  if (rank === 'A') {
    h += `<div class="cbig ${c}">${sy}</div>`;
  } else if (rank === 'J' || rank === 'Q' || rank === 'K') {
    h += `<div class="court ${c}"><div class="l">${rank}</div><div class="cs">${sy}</div></div>`;
  } else {
    let p = '';
    for (const [col, y] of LAYOUTS[rank]) {
      const top = 14 + y * 72;
      p += `<span class="pip ${y > 0.5 ? 'f' : ''} ${c}" style="left:${_X[col]}%;top:${top}%">${sy}</span>`;
    }
    h += `<div class="pips">${p}</div>`;
  }
  return h;
}
