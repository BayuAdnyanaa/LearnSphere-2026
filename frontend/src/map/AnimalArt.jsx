// Glassy line-art animals behind the constellations, drawn on the 1440 x 900 frame so their
// key points sit on the quest stars (positions from the hand-off).

function Turtle() {
  return (
    <>
      {/* flippers and tail behind the shell */}
      <path className="ls-body" d="M156,474 C128,456 98,430 70,400 C64,394 72,390 80,394 C110,408 140,430 172,458 Z" />
      <path className="ls-body" d="M284,474 C312,456 342,430 370,400 C376,394 368,390 360,394 C330,408 300,430 268,458 Z" />
      <path className="ls-body" d="M150,612 C130,630 108,650 88,672 C96,676 112,668 126,656 C140,644 154,632 164,624 Z" />
      <path className="ls-body" d="M290,612 C310,630 332,650 352,672 C344,676 328,668 314,656 C300,644 286,632 276,624 Z" />
      <path className="ls-body" d="M210,648 C206,666 200,684 196,702 C206,690 216,672 230,650 Z" />
      <path className="ls-detail" d="M160,466 C130,446 100,422 76,398 M280,466 C310,446 340,422 364,398 M152,622 C132,640 112,656 94,670 M288,622 C308,640 328,656 346,670" />
      {/* head */}
      <path className="ls-body" d="M212,440 C206,420 204,396 208,372 C210,346 220,322 236,314 C248,310 256,322 252,340 C250,364 244,392 236,420 L232,440 Z" />
      <path className="ls-detail" d="M222,338 a2.5,2.5 0 1,0 0.1,0 M242,336 a2.5,2.5 0 1,0 0.1,0" />
      {/* shell */}
      <path className="ls-body ls-shell" d="M220,432 C290,432 334,480 334,540 C334,602 290,650 220,650 C150,650 106,602 106,540 C106,480 150,432 220,432 Z" />
      <path className="ls-detail" d="M220,446 C282,446 320,488 320,540 C320,594 282,636 220,636 C158,636 120,594 120,540 C120,488 158,446 220,446 Z" />
      <path className="ls-detail" d="M200,462 L240,462 L252,488 L240,512 L200,512 L188,488 Z M200,512 L240,512 L254,540 L240,568 L200,568 L186,540 Z M200,568 L240,568 L252,594 L240,620 L200,620 L188,594 Z" />
      <path className="ls-detail" d="M188,488 L130,486 M186,540 L121,548 M188,594 L134,606 M252,488 L310,486 M254,540 L319,548 M252,594 L306,606 M200,462 L178,449 M240,462 L262,449 M200,620 L180,633 M240,620 L260,633" />
    </>
  );
}

function Raven() {
  return (
    <>
      {/* far wing */}
      <path className="ls-body" d="M566,540 C556,510 548,480 546,452 C536,420 520,384 500,346 C514,350 528,362 540,378 C552,396 566,420 578,450 C584,470 586,500 584,528 Z" />
      <path className="ls-detail" d="M508,358 L532,378 M520,380 L544,396 M534,410 L558,424 M548,446 L572,456 M562,484 L580,490" />
      {/* tail fan */}
      <path className="ls-body" d="M498,646 L440,690 C452,700 470,710 484,712 L512,654 Z" />
      <path className="ls-detail" d="M500,650 L452,697 M505,652 L468,707" />
      {/* body, neck and head */}
      <path className="ls-body" d="M494,652 C486,628 520,580 560,548 C578,534 600,524 612,520 C612,540 598,566 578,588 C556,612 524,640 506,656 Z" />
      <path className="ls-body" d="M590,526 C604,500 618,470 632,450 C640,438 650,426 664,424 C676,424 680,436 674,446 C664,462 646,484 616,532 Z" />
      <path className="ls-body" d="M670,424 L706,414 L674,440 Z" />
      <path className="ls-detail" d="M520,628 C548,604 572,580 596,548 M610,500 C622,482 634,466 646,452 M660,428 a2.5,2.5 0 1,0 0.1,0" />
      {/* near wing */}
      <path className="ls-body" d="M586,530 C592,504 598,480 600,458 C602,420 600,382 594,340 C608,350 618,370 624,394 C630,420 628,450 620,480 C612,500 604,516 596,534 Z" />
      <path className="ls-detail" d="M600,372 L620,384 M602,404 L626,414 M604,436 L626,444 M604,466 L622,472 M600,494 L614,498" />
    </>
  );
}

function Phoenix() {
  return (
    <>
      {/* wings */}
      <path className="ls-body" d="M884,396 C860,392 836,386 820,376 C800,360 784,334 776,302 C770,280 776,258 790,240 C790,262 796,280 806,296 C800,276 802,258 812,244 C812,268 820,290 832,306 C830,288 834,272 844,262 C846,290 856,320 872,346 C880,360 886,374 890,390 Z" />
      <path className="ls-body" d="M926,396 C950,392 974,386 990,376 C1010,360 1026,334 1034,302 C1040,280 1034,258 1020,240 C1020,262 1014,280 1004,296 C1010,276 1008,258 998,244 C998,268 990,290 978,306 C980,288 976,272 966,262 C964,290 954,320 938,346 C930,360 924,374 920,390 Z" />
      <path className="ls-detail" d="M884,388 C850,370 820,340 800,300 M886,376 C862,350 842,322 830,292 M926,388 C960,370 990,340 1010,300 M924,376 C948,350 968,322 980,292" />
      {/* tail plumes */}
      <path className="ls-body" d="M898,520 C880,560 850,600 822,628 C800,648 780,656 766,660 C776,668 794,668 810,660 C840,644 870,610 892,566 C900,550 906,536 908,524 Z" />
      <path className="ls-body" d="M900,522 C898,570 900,620 905,676 C910,620 912,570 910,522 Z" />
      <path className="ls-body" d="M912,520 C930,560 960,600 988,628 C1010,648 1030,656 1044,660 C1034,668 1016,668 1000,660 C970,644 940,610 918,566 C910,550 904,536 902,524 Z" />
      <path className="ls-detail" d="M790,656 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M905,662 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0 M1020,656 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0" />
      <path className="ls-detail" d="M900,540 C884,580 860,612 830,636 M905,540 L905,640 M910,540 C926,580 950,612 980,636" />
      {/* body, head and crest */}
      <path className="ls-body" d="M893,344 C886,370 880,400 880,430 C880,470 890,505 905,525 C920,505 930,470 930,430 C930,400 924,370 917,344 Z" />
      <circle className="ls-body" cx="905" cy="332" r="15" />
      <path className="ls-body" d="M918,326 L938,322 L918,336 Z" />
      <path className="ls-detail" d="M896,318 C890,300 896,286 908,280 M906,317 C904,298 912,286 922,282 M914,320 C916,304 926,296 936,296 M910,328 a2,2 0 1,0 0.1,0 M893,380 C900,420 900,460 905,500" />
    </>
  );
}

const FIGURES = { icp: Turtle, ai: Raven, web3: Phoenix };

// tracks: from buildModel; each sets its figure's opacity and glow
export default function AnimalArt({ tracks }) {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0" width="1440" height="900" viewBox="0 0 1440 900" style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="ls-glass-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.07" />
        </linearGradient>
        <filter id="ls-art-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ls-art-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <style>{`
        .ls-body { fill: url(#ls-glass-fill); stroke: var(--ls-art-line); stroke-width: 1.6; stroke-linejoin: round; }
        .ls-shell { fill-opacity: .8; }
        .ls-detail { fill: none; stroke: var(--ls-art-line); stroke-opacity: .55; stroke-width: 1; stroke-linecap: round; }
      `}</style>
      {tracks.map((t) => {
        const Figure = FIGURES[t.key];
        return (
          <g
            key={t.key}
            opacity={t.artOpacity}
            filter={t.full ? "url(#ls-art-glow)" : "url(#ls-art-soft)"}
            style={{ "--ls-art-line": `oklch(0.93 0.05 ${t.hue} / .85)` }}
          >
            <Figure />
          </g>
        );
      })}
    </svg>
  );
}
