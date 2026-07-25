import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ---------- Theme ---------- */
const INK = "#2B2118";
const PARCHMENT = "#F3ECD9";
const PARCHMENT_DARK = "#E7DCBE";
const RED = "#9E1B32";
const RED_DARK = "#7A1526";
const NAVY = "#1B2A4A";
const NAVY_DARK = "#13203A";
const GOLD = "#B8912F";
const GOLD_LIGHT = "#D9BE6C";

/* ---------- Course placeholder ---------- */
function placeholderHoles() {
  const pars = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4];
  const si = [7, 3, 17, 11, 1, 13, 15, 9, 5, 8, 4, 18, 12, 2, 10, 16, 6, 14];
  return pars.map((par, i) => ({ number: i + 1, par, strokeIndex: si[i] }));
}

/* ---------- Demo players ---------- */


function demoPlayers() {
  const names = [
    ["Ben Smith", "Redcoats", 18.2], ["Stahler McKinney", "Redcoats", 18.1],
    ["Nathan Cook", "Redcoats", 3.2], ["Kevin Miller", "Redcoats", 9.3],
    ["Jake Sipe", "Colonials", 16.8], ["Michael Hannah", "Colonials", 3.8],
    ["Stephen McAdams", "Colonials", 9.6], ["Jared Korver", "Colonials", 19.4],
  ];
  return names.map(([name, team, handicapIndex], i) => ({ id: "p" + (i + 1), name, team, handicapIndex, photo: null, historical: null }));
}

/* Course Handicap from GHIN Handicap Index: round(Index * Slope/113 + (Rating - Par)) */
function courseHandicapFor(index, round) {
  if (index === null || index === undefined || index === "") return 0;
  if (!round.slope || !round.rating) return 0;
  const par = round.holes.reduce((sum, h) => sum + h.par, 0);
  return Math.round(Number(index) * (round.slope / 113) + (round.rating - par));
}

/* default 2v2 groups: pair players 0&1, 2&3, ... within each team (4 redcoats idx 0-3, 4 colonials idx 4-7) */
function default2v2Groups() {
  const g = {};
  for (let i = 0; i < 8; i++) g["p" + (i + 1)] = Math.floor((i % 4) / 2) + 1;
  return g;
}
/* default singles groups: redcoat i vs colonial i */
function defaultSinglesGroups() {
  const g = {};
  for (let i = 0; i < 8; i++) g["p" + (i + 1)] = (i % 4) + 1;
  return g;
}

function demoRounds() {
  return [
    {
      id: 1, label: "Test Round · Live Scoring", course: "Country Club of North Carolina (Cardinal)", tees: "Blue",
      format: "match2v2", countsForIndividual: true, allowancePct: 100, rating: 71.3, slope: 134,
      holes: placeholderHoles(), groups: default2v2Groups(), manualHandicap: {},
    },
  ];
}

const FORMAT_LABEL = {
  match2v2: "Better Ball Match Play",
  stroke2v2: "Better Ball Stroke Play",
  scramble: "Scramble (Stroke Play)",
  singlesMatch: "Individual Match Play",
};

const SETUP_KEY = "chctest:setup:v5";
const groupScoreKey = (roundId, groupId) => `chctest:scores:v1:r${roundId}:g${groupId}`;
const EVENT_LOGO = "data:image/png;base64,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";
const ADMIN_PLAYER_ID = "p1"; // Ben Smith — only this player's link shows the Setup tab


/* ---------- Golf math ---------- */
function strokesOnHole(playingHandicap, strokeIndex) {
  if (!playingHandicap || playingHandicap <= 0) return 0;
  const base = Math.floor(playingHandicap / 18);
  const extra = strokeIndex <= (playingHandicap % 18) ? 1 : 0;
  return base + extra;
}

function netFor(entity, holeNum, holes, scoresByEntity) {
  const gross = scoresByEntity?.[entity.id]?.[holeNum];
  if (gross === undefined || gross === null || gross === "") return null;
  const hole = holes.find((h) => h.number === holeNum);
  const strokes = strokesOnHole(entity.playingHandicap, hole.strokeIndex);
  return { gross: Number(gross), net: Number(gross) - strokes, strokes };
}

/* Running gross-to-par through a given hole number — only counts holes with a score entered. Returns null if nothing entered yet. */
function grossToParThrough(entity, holes, scoresByEntity, uptoNumber) {
  let diff = 0, any = false;
  for (const h of holes) {
    if (h.number > uptoNumber) continue;
    const gross = scoresByEntity?.[entity.id]?.[h.number];
    if (gross === undefined || gross === null || gross === "") continue;
    diff += Number(gross) - h.par;
    any = true;
  }
  return any ? diff : null;
}

function formatToPar(diff) {
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

/* Build the pairings ("groups") for a round from player list + round.groups map */
function buildPairings(round, players) {
  const byGroup = {};
  players.forEach((p) => {
    const g = round.groups?.[p.id];
    if (g == null) return;
    byGroup[g] = byGroup[g] || { id: g, Redcoats: [], Colonials: [] };
    byGroup[g][p.team].push(p);
  });
  const groups = Object.values(byGroup).sort((a, b) => a.id - b.id);
  const isSingles = round.format === "singlesMatch";
  const isScramble = round.format === "scramble";
  const valid = groups.filter((g) =>
    isSingles ? g.Redcoats.length === 1 && g.Colonials.length === 1 : g.Redcoats.length === 2 && g.Colonials.length === 2
  );
  return valid.map((g) => {
    const withCH = (p) => ({ ...p, courseHandicap: isScramble ? 0 : courseHandicapFor(p.handicapIndex, round) });
    const gRed = g.Redcoats.map(withCH);
    const gCol = g.Colonials.map(withCH);
    const withPh = isScramble
      ? (p) => ({ ...p, playingHandicap: 0 })
      : (p) => ({ ...p, playingHandicap: Math.max(0, Math.round(p.courseHandicap * (round.allowancePct / 100))) });
    const built = { ...g, Redcoats: gRed.map(withPh), Colonials: gCol.map(withPh) };
    if (isScramble) {
      const mh = round.manualHandicap?.[g.id] || { Redcoats: 0, Colonials: 0 };
      built.virtualRed = { id: `team:${round.id}:${g.id}:Redcoats`, playingHandicap: Number(mh.Redcoats) || 0 };
      built.virtualCol = { id: `team:${round.id}:${g.id}:Colonials`, playingHandicap: Number(mh.Colonials) || 0 };
    }
    return built;
  });
}

/* Unified evaluator: works for match-style (hole by hole) and medal-style (running totals) formats.
   entitiesFor(side) returns the array of scoreable entities representing that side for a given pairing
   (2 players for better-ball, 1 player for singles, 1 virtual team entity for scramble). */
function entitiesForSide(round, pairing, side) {
  if (round.format === "scramble") return [side === "Redcoats" ? pairing.virtualRed : pairing.virtualCol];
  return pairing[side];
}

function evaluatePairing(round, pairing, scoresByEntity) {
  const holes = round.holes;
  const isMatchStyle = round.format === "match2v2" || round.format === "singlesMatch";
  const redEntities = entitiesForSide(round, pairing, "Redcoats");
  const colEntities = entitiesForSide(round, pairing, "Colonials");

  let thru = 0, redUp = 0, redGross = 0, redNet = 0, colGross = 0, colNet = 0;
  const perHole = holes.map((h) => {
    const redNets = redEntities.map((p) => netFor(p, h.number, holes, scoresByEntity)).filter(Boolean);
    const colNets = colEntities.map((p) => netFor(p, h.number, holes, scoresByEntity)).filter(Boolean);
    if (redNets.length === 0 || colNets.length === 0) return { hole: h.number, status: "pending" };
    const redBest = redNets.reduce((a, b) => (b.net < a.net ? b : a));
    const colBest = colNets.reduce((a, b) => (b.net < a.net ? b : a));
    thru = h.number;
    redGross += redBest.gross; redNet += redBest.net;
    colGross += colBest.gross; colNet += colBest.net;
    const status = redBest.net < colBest.net ? "red" : colBest.net < redBest.net ? "col" : "half";
    if (isMatchStyle) {
      if (status === "red") redUp++;
      if (status === "col") redUp--;
    }
    return { hole: h.number, status };
  });

  const holesLeft = 18 - thru;
  let label, points;

  if (isMatchStyle) {
    const closed = thru > 0 && thru < 18 && Math.abs(redUp) > holesLeft;
    if (thru === 0) { label = "Not started"; points = { Redcoats: null, Colonials: null }; }
    else if (closed || thru === 18) {
      if (redUp === 0) { label = "Halved · AS"; points = { Redcoats: 0.5, Colonials: 0.5 }; }
      else {
        const winner = redUp > 0 ? "Redcoats" : "Colonials";
        label = closed ? `${Math.abs(redUp)}&${holesLeft} · ${winner} win` : `${Math.abs(redUp)} UP · ${winner} win`;
        points = redUp > 0 ? { Redcoats: 1, Colonials: 0 } : { Redcoats: 0, Colonials: 1 };
      }
    } else {
      label = redUp === 0 ? `All square · thru ${thru}` : `${redUp > 0 ? "Redcoats" : "Colonials"} ${Math.abs(redUp)} UP · thru ${thru}`;
      points = { Redcoats: null, Colonials: null };
    }
  } else {
    const diff = redNet - colNet;
    if (thru === 0) { label = "Not started"; points = { Redcoats: null, Colonials: null }; }
    else {
      const leadTxt = diff === 0 ? "Tied" : `${diff < 0 ? "Redcoats" : "Colonials"} by ${Math.abs(diff)}`;
      label = `${thru === 18 ? "Final" : "Thru " + thru} · ${leadTxt} (${redNet} - ${colNet})`;
      points = thru === 18 ? (diff === 0 ? { Redcoats: 0.5, Colonials: 0.5 } : diff < 0 ? { Redcoats: 1, Colonials: 0 } : { Redcoats: 0, Colonials: 1 }) : { Redcoats: null, Colonials: null };
    }
  }

  return { perHole, thru, redUp, redGross, redNet, colGross, colNet, label, points, isMatchStyle };
}

/* ---------- Storage ---------- */
async function loadSetup() {
  try {
    const res = await window.storage.get(SETUP_KEY, true);
    return JSON.parse(res.value);
  } catch {
    const setup = { players: demoPlayers(), rounds: demoRounds() };
    try { await window.storage.set(SETUP_KEY, JSON.stringify(setup), true); } catch {}
    return setup;
  }
}

async function loadScoresForRound(round, players) {
  const pairings = buildPairings(round, players);
  const out = {};
  await Promise.all(
    pairings.map(async (g) => {
      try {
        const res = await window.storage.get(groupScoreKey(round.id, g.id), true);
        Object.assign(out, JSON.parse(res.value));
      } catch {
        // no scores saved for this group yet — leave it out, treated as empty
      }
    })
  );
  return out;
}

/* ---------- UI atoms ---------- */
function TeamBadge({ team }) {
  const color = team === "Redcoats" ? RED : NAVY;
  return (
    <span style={{ background: color }} className="inline-block px-2 py-0.5 rounded-sm text-[10px] tracking-widest uppercase text-white font-semibold">
      {team === "Redcoats" ? "RC" : "CO"}
    </span>
  );
}

function Avatar({ player, size = 28 }) {
  const color = player.team === "Redcoats" ? RED : NAVY;
  const initials = player.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const style = { width: size, height: size, borderRadius: "50%", border: `2px solid ${GOLD_LIGHT}`, flexShrink: 0 };
  if (player.photo) {
    return <img src={player.photo} alt={player.name} style={{ ...style, objectFit: "cover" }} />;
  }
  return (
    <div style={{ ...style, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: size * 0.4, fontWeight: 700 }}>
      {initials}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    red: { bg: RED }, col: { bg: NAVY }, half: { bg: GOLD }, pending: { bg: "#D8CBA6" },
  };
  const s = map[status.status];
  return <div title={`Hole ${status.hole}`} style={{ background: s.bg }} className="w-4 h-4 sm:w-5 sm:h-5 rounded-[3px] shrink-0" />;
}

function RoundPicker({ rounds, roundId, setRoundId }) {
  return (
    <select
      value={roundId}
      onChange={(e) => setRoundId(Number(e.target.value))}
      className="text-xs rounded-md px-2 py-1"
      style={{ background: "rgba(255,255,255,0.12)", color: "white", border: `1px solid ${GOLD_LIGHT}` }}
    >
      {rounds.map((r) => <option key={r.id} value={r.id} style={{ color: INK }}>{r.label}</option>)}
    </select>
  );
}

function RoundInfoBar({ round }) {
  return (
    <div className="px-3 pt-3">
      <div className="rounded-lg px-3 py-2 text-center" style={{ background: PARCHMENT_DARK, color: INK }}>
        <div className="font-serif font-semibold text-sm">{round.course} · {round.tees} tees</div>
        <div className="text-xs opacity-70 mt-0.5">{FORMAT_LABEL[round.format]}{!round.countsForIndividual && " · doesn't count for the jacket"}</div>
      </div>
    </div>
  );
}

/* ---------- Scorecard ---------- */
function Scorecard({ round, me, pairing, scores, onScore }) {
  const evalResult = evaluatePairing(round, pairing, scores);
  const isScramble = round.format === "scramble";
  const redSide = entitiesForSide(round, pairing, "Redcoats");
  const colSide = entitiesForSide(round, pairing, "Colonials");
  const myTeamSide = me.team === "Redcoats" ? "Redcoats" : "Colonials";
  const myEditableEntity = isScramble
    ? (myTeamSide === "Redcoats" ? pairing.virtualRed : pairing.virtualCol)
    : [...redSide, ...colSide].find((p) => p.id === me.id);

  const rows = isScramble
    ? [{ ...pairing.virtualRed, team: "Redcoats", name: `${pairing.Redcoats.map((p) => p.name.split(" ")[0]).join(" & ")} (team)` },
       { ...pairing.virtualCol, team: "Colonials", name: `${pairing.Colonials.map((p) => p.name.split(" ")[0]).join(" & ")} (team)` }]
    : [...redSide.map((p) => ({ ...p, team: "Redcoats" })), ...colSide.map((p) => ({ ...p, team: "Colonials" }))];

  return (
    <div className="pb-6">
      <RoundInfoBar round={round} />
      <div className="sticky top-[128px] z-10 mx-3 mt-3 rounded-lg overflow-hidden shadow-sm border" style={{ borderColor: GOLD_LIGHT }}>
        <div className="flex">
          <div style={{ background: RED }} className="flex-1 py-2 text-center">
            <div className="text-white text-[10px] tracking-widest uppercase opacity-80">Redcoats</div>
            <div className="text-white text-xs font-medium truncate px-1">{pairing.Redcoats.map((p) => p.name.split(" ")[0]).join(" & ")}</div>
          </div>
          <div style={{ background: NAVY }} className="flex-1 py-2 text-center">
            <div className="text-white text-[10px] tracking-widest uppercase opacity-80">Colonials</div>
            <div className="text-white text-xs font-medium truncate px-1">{pairing.Colonials.map((p) => p.name.split(" ")[0]).join(" & ")}</div>
          </div>
        </div>
        <div style={{ background: PARCHMENT_DARK, color: INK }} className="text-center py-1.5 text-sm font-semibold tracking-wide">{evalResult.label}</div>
      </div>

      {!isScramble && (
        <div className="px-3 mt-3">
          <div className="rounded-lg border bg-white/60 px-3 py-2" style={{ borderColor: "#DDD0AC" }}>
            <div className="text-[9px] uppercase tracking-widest opacity-50 mb-1.5" style={{ color: INK }}>Handicaps & allowance this match</div>
            <div className="space-y-1">
              {rows.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: INK }}><Avatar player={p} size={20} /> <TeamBadge team={p.team} /> {p.name}</span>
                  <span style={{ color: INK }}><span className="opacity-60">Index {p.handicapIndex} → CH {p.courseHandicap}</span> <span className="font-semibold" style={{ color: RED_DARK }}>· gets {p.playingHandicap}</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-3 mt-4 space-y-2.5">
        {round.holes.map((h) => {
          const result = evalResult.perHole.find((r) => r.hole === h.number);
          return (
            <div key={h.number} className="rounded-lg border overflow-hidden bg-white/60" style={{ borderColor: "#DDD0AC" }}>
              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: PARCHMENT_DARK }}>
                <div className="font-serif font-semibold" style={{ color: INK }}>
                  Hole {h.number} <span className="font-normal text-sm opacity-70">· Par {h.par} · SI {h.strokeIndex}</span>
                </div>
                <StatusPill status={result} />
              </div>
              <div className="divide-y" style={{ borderColor: "#EEE4C8" }}>
                {rows.map((p) => {
                  const isMine = p.id === myEditableEntity?.id;
                  const n = netFor(p, h.number, round.holes, scores);
                  const strokes = strokesOnHole(p.playingHandicap, h.strokeIndex);
                  const toPar = grossToParThrough(p, round.holes, scores, h.number);
                  return (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2" style={{ background: isMine ? "#FBF6E8" : "transparent" }}>
                      <TeamBadge team={p.team} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: INK }}>
                          <span className="truncate">{p.name}</span>
                          {toPar !== null && (
                            <span className="text-[11px] font-semibold shrink-0" style={{ color: toPar > 0 ? RED_DARK : toPar < 0 ? "#2F6B4F" : "inherit", opacity: toPar === 0 ? 0.6 : 1 }}>
                              {formatToPar(toPar)}
                            </span>
                          )}
                          {isMine && <span className="text-[10px] opacity-60 shrink-0">({isScramble ? "your team" : "you"})</span>}
                        </div>
                        {strokes > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {Array.from({ length: strokes }).map((_, i) => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />)}
                          </div>
                        )}
                      </div>
                      {isMine ? (
                        <input
                          type="number" inputMode="numeric" min={1} max={15} placeholder="—"
                          value={scores?.[p.id]?.[h.number] ?? ""}
                          onChange={(e) => onScore(p.id, h.number, e.target.value, pairing.id)}
                          className="w-14 text-center text-lg font-semibold rounded-md border py-1"
                          style={{ borderColor: GOLD, color: INK }}
                        />
                      ) : (
                        <div className="w-14 text-center text-lg font-semibold" style={{ color: INK, opacity: n ? 1 : 0.3 }}>{n ? n.gross : "—"}</div>
                      )}
                      <div className="w-10 text-center text-sm">{n ? <span className="font-semibold" style={{ color: RED_DARK }}>{n.net}</span> : ""}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 mt-4">
        <div className="rounded-lg border overflow-hidden bg-white/60" style={{ borderColor: "#DDD0AC" }}>
          <div className="px-3 py-1.5 font-serif font-semibold text-sm" style={{ background: PARCHMENT_DARK, color: INK }}>Final Scores</div>
          <div className="divide-y" style={{ borderColor: "#EEE4C8" }}>
            {rows.map((p) => {
              let gross = 0, net = 0, thru = 0;
              round.holes.forEach((h) => {
                const n = netFor(p, h.number, round.holes, scores);
                if (n) { gross += n.gross; net += n.net; thru++; }
              });
              const isMine = p.id === myEditableEntity?.id;
              const wonRound = evalResult.points[p.team] === 1;
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2" style={{ background: isMine ? "#FBF6E8" : "transparent" }}>
                  <TeamBadge team={p.team} />
                  <div className="flex-1 min-w-0 text-sm font-medium truncate flex items-center gap-1.5" style={{ color: INK }}>
                    <span className="truncate">{p.name}{isMine && <span className="text-[10px] ml-1 opacity-60">({isScramble ? "your team" : "you"})</span>}</span>
                    {wonRound && (
                      <span title="Won this round" className="inline-flex items-center justify-center rounded-full shrink-0" style={{ width: 16, height: 16, background: "#2F6B4F" }}>
                        <svg viewBox="0 0 16 16" width="10" height="10" fill="none"><path d="M3 8.5L6.2 11.5L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    )}
                  </div>
                  {thru === 18 ? (
                    <div className="text-sm">
                      <span className="font-semibold" style={{ color: INK }}>{gross}</span>
                      <span className="opacity-50"> gross · </span>
                      <span className="font-semibold" style={{ color: RED_DARK }}>{net}</span>
                      <span className="opacity-50"> net</span>
                    </div>
                  ) : thru > 0 ? (
                    <div className="text-xs opacity-60" style={{ color: INK }}>Thru {thru} · {gross}/{net}</div>
                  ) : (
                    <div className="text-xs opacity-30" style={{ color: INK }}>—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- All Matches ---------- */
function AllMatches({ round, pairings, scores }) {
  return (
    <div className="px-3 py-4 space-y-3">
      <RoundInfoBar round={round} />
      <div className="pt-1" />
      {pairings.map((g) => {
        const ev = evaluatePairing(round, g, scores);
        return (
          <div key={g.id} className="rounded-lg border bg-white/60 overflow-hidden" style={{ borderColor: "#DDD0AC" }}>
            <div className="flex items-center justify-between px-3 py-2" style={{ background: PARCHMENT_DARK }}>
              <div className="text-sm font-serif" style={{ color: INK }}>
                <span style={{ color: RED_DARK }} className="font-semibold">{g.Redcoats.map((p) => p.name).join(" & ")}</span>
                <span className="opacity-50 mx-1">vs</span>
                <span style={{ color: NAVY }} className="font-semibold">{g.Colonials.map((p) => p.name).join(" & ")}</span>
              </div>
            </div>
            <div className="px-3 py-2 text-sm font-semibold" style={{ color: INK }}>{ev.label}</div>
            <div className="px-3 pb-3 flex gap-1 flex-wrap">{ev.perHole.map((r) => <StatusPill key={r.hole} status={r} />)}</div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 justify-center text-[11px] pt-1 opacity-70 flex-wrap" style={{ color: INK }}>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-[3px]" style={{ background: RED }} /> Redcoats hole</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-[3px]" style={{ background: NAVY }} /> Colonials hole</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-[3px]" style={{ background: GOLD }} /> Halved</span>
      </div>
    </div>
  );
}

/* ---------- Leaderboard ---------- */
function Leaderboard({ setup, allScores }) {
  const [sortBy, setSortBy] = useState("overall");
  const countingRounds = setup.rounds.filter((r) => r.countsForIndividual);

  const rows = setup.players.map((player) => {
    const perRound = {};
    countingRounds.forEach((round) => {
      const inRound = round.groups?.[player.id] != null;
      if (!inRound) { perRound[round.id] = null; return; }
      const entity = { id: player.id, playingHandicap: Math.max(0, Math.round(courseHandicapFor(player.handicapIndex, round) * (round.allowancePct / 100))) };
      const scores = allScores[round.id] || {};
      let gross = 0, net = 0, thru = 0;
      round.holes.forEach((h) => {
        const n = netFor(entity, h.number, round.holes, scores);
        if (n) { gross += n.gross; net += n.net; thru++; }
      });
      perRound[round.id] = thru > 0 ? { gross, net, thru } : null;
    });
    const overall = countingRounds.reduce((acc, r) => {
      const v = perRound[r.id];
      if (!v) return acc;
      return { net: acc.net + v.net, gross: acc.gross + v.gross, thru: acc.thru + v.thru };
    }, { net: 0, gross: 0, thru: 0 });
    return { player, perRound, overall: overall.thru > 0 ? overall : null };
  });

  const sorted = [...rows].sort((a, b) => {
    const key = sortBy === "overall" ? "overall" : sortBy;
    const av = sortBy === "overall" ? a.overall : a.perRound[Number(sortBy)];
    const bv = sortBy === "overall" ? b.overall : b.perRound[Number(sortBy)];
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    return av.net - bv.net;
  });

  return (
    <div className="px-3 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif text-sm tracking-widest uppercase" style={{ color: INK }}>Individual Leaderboard</div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs rounded-md px-2 py-1 border" style={{ borderColor: "#DDD0AC", background: "white", color: INK }}>
          <option value="overall">Sort: Overall</option>
          {countingRounds.map((r) => <option key={r.id} value={r.id}>Sort: {r.label.split(" · ")[0]}</option>)}
        </select>
      </div>
      <div className="rounded-lg border overflow-hidden bg-white/60" style={{ borderColor: "#DDD0AC" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: PARCHMENT_DARK, color: INK }}>
                <th className="text-left px-2 py-1.5 sticky left-0" style={{ background: PARCHMENT_DARK }}>Player</th>
                <th className="px-2 py-1.5 whitespace-nowrap">Index</th>
                {countingRounds.map((r) => <th key={r.id} className="px-2 py-1.5 whitespace-nowrap">{r.label.split(" · ")[0]}</th>)}
                <th className="px-2 py-1.5 whitespace-nowrap font-bold">Overall</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ player, perRound, overall }, idx) => (
                <tr key={player.id} className="border-t" style={{ borderColor: "#EEE4C8" }}>
                  <td className="px-2 py-1.5 sticky left-0 bg-white/95">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] opacity-50">{idx + 1}</span>
                      <Avatar player={player} size={22} />
                      <TeamBadge team={player.team} /> <span className="font-medium whitespace-nowrap" style={{ color: INK }}>{player.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center opacity-70">{player.handicapIndex}</td>
                  {countingRounds.map((r) => {
                    const v = perRound[r.id];
                    return (
                      <td key={r.id} className="px-2 py-1.5 text-center">
                        {v ? <><span style={{ color: INK }}>{v.gross}</span><span className="opacity-50"> / </span><span className="font-semibold" style={{ color: RED_DARK }}>{v.net}</span></> : <span className="opacity-30">—</span>}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 text-center font-bold">
                    {overall ? <><span style={{ color: INK }}>{overall.gross}</span><span className="opacity-50"> / </span><span style={{ color: RED_DARK }}>{overall.net}</span></> : <span className="opacity-30">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] opacity-60 mt-2" style={{ color: INK }}>Gross / net shown per round. Overall excludes Round 3 (scramble). Lowest net sorts first.</p>
    </div>
  );
}

/* ---------- Team Score ---------- */
function TeamScore({ setup, allScores }) {
  const roundResults = setup.rounds.map((round) => {
    const pairings = buildPairings(round, setup.players);
    const evals = pairings.map((g) => ({ pairing: g, ev: evaluatePairing(round, g, allScores[round.id] || {}) }));
    const totals = evals.reduce((acc, { ev }) => ({
      Redcoats: acc.Redcoats + (ev.points.Redcoats ?? 0),
      Colonials: acc.Colonials + (ev.points.Colonials ?? 0),
    }), { Redcoats: 0, Colonials: 0 });
    return { round, evals, totals };
  });
  const grand = roundResults.reduce((acc, r) => ({
    Redcoats: acc.Redcoats + r.totals.Redcoats,
    Colonials: acc.Colonials + r.totals.Colonials,
  }), { Redcoats: 0, Colonials: 0 });

  return (
    <div className="px-3 py-4 space-y-4">
      <div className="rounded-lg overflow-hidden shadow-sm border" style={{ borderColor: GOLD_LIGHT }}>
        <div className="flex">
          <div style={{ background: RED }} className="flex-1 py-3 text-center">
            <div className="text-white text-[10px] tracking-widest uppercase opacity-80">Redcoats</div>
            <div className="text-white text-3xl font-serif font-bold">{grand.Redcoats}</div>
          </div>
          <div style={{ background: NAVY }} className="flex-1 py-3 text-center">
            <div className="text-white text-[10px] tracking-widest uppercase opacity-80">Colonials</div>
            <div className="text-white text-3xl font-serif font-bold">{grand.Colonials}</div>
          </div>
        </div>
      </div>

      {roundResults.map(({ round, evals, totals }) => (
        <div key={round.id} className="rounded-lg border bg-white/60 overflow-hidden" style={{ borderColor: "#DDD0AC" }}>
          <div className="px-3 py-2 flex items-center justify-between" style={{ background: PARCHMENT_DARK }}>
            <div className="font-serif font-semibold text-sm" style={{ color: INK }}>{round.label}</div>
            <div className="text-sm font-bold" style={{ color: INK }}>
              <span style={{ color: RED_DARK }}>{totals.Redcoats}</span> – <span style={{ color: NAVY }}>{totals.Colonials}</span>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "#EEE4C8" }}>
            {evals.map(({ pairing, ev }) => (
              <div key={pairing.id} className="px-3 py-2 flex items-center justify-between gap-2">
                <div className="text-xs min-w-0" style={{ color: INK }}>
                  <span style={{ color: RED_DARK }}>{pairing.Redcoats.map((p) => p.name.split(" ")[0]).join("/")}</span>
                  <span className="opacity-40"> vs </span>
                  <span style={{ color: NAVY }}>{pairing.Colonials.map((p) => p.name.split(" ")[0]).join("/")}</span>
                </div>
                <div className="text-xs font-medium text-right shrink-0" style={{ color: INK }}>
                  {ev.points.Redcoats == null ? <span className="opacity-50">in progress</span> : `${ev.points.Redcoats} – ${ev.points.Colonials}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Setup ---------- */
function Setup({ setup, setSetup, saveSetup, roundId, setRoundId }) {
  const [copiedId, setCopiedId] = useState(null);
  const round = setup.rounds.find((r) => r.id === roundId);
  const baseUrl = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";
  const [manualLink, setManualLink] = useState(null);
  const copyLink = async (id) => {
    const url = `${baseUrl}?me=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard blocked (some mobile browsers) — show it so it can be copied by hand.
      setManualLink(url);
    }
  };
  const updatePlayer = (id, field, value) => setSetup((s) => ({ ...s, players: s.players.map((p) => (p.id === id ? { ...p, [field]: value } : p)) }));
  const updateRound = (field, value) => setSetup((s) => ({ ...s, rounds: s.rounds.map((r) => (r.id === roundId ? { ...r, [field]: value } : r)) }));
  const updateGroup = (playerId, value) => setSetup((s) => ({ ...s, rounds: s.rounds.map((r) => (r.id === roundId ? { ...r, groups: { ...r.groups, [playerId]: value === "" ? null : Number(value) } } : r)) }));
  const updateHole = (number, field, value) => setSetup((s) => ({ ...s, rounds: s.rounds.map((r) => (r.id === roundId ? { ...r, holes: r.holes.map((h) => (h.number === number ? { ...h, [field]: value } : h)) } : r)) }));
  const updateManualHcp = (groupId, side, value) => setSetup((s) => ({ ...s, rounds: s.rounds.map((r) => (r.id === roundId ? { ...r, manualHandicap: { ...r.manualHandicap, [groupId]: { ...(r.manualHandicap?.[groupId] || {}), [side]: Number(value) } } } : r)) }));

  const groupIdsForRound = [...new Set(Object.values(round.groups || {}).filter((v) => v != null))].sort((a, b) => a - b);

  return (
    <div className="px-3 py-4 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-widest opacity-60" style={{ color: INK }}>Editing:</span>
        <select value={roundId} onChange={(e) => setRoundId(Number(e.target.value))} className="text-sm rounded-md px-2 py-1 border" style={{ borderColor: "#DDD0AC", color: INK }}>
          {setup.rounds.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>

      <div>
        <h3 className="font-serif text-sm tracking-widest uppercase mb-2" style={{ color: INK }}>Round details</h3>
        <div className="rounded-lg border bg-white/60 p-3 space-y-2" style={{ borderColor: "#DDD0AC" }}>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs" style={{ color: INK }}>Course
              <input value={round.course} onChange={(e) => updateRound("course", e.target.value)} className="w-full text-sm px-2 py-1 mt-0.5 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
            </label>
            <label className="text-xs" style={{ color: INK }}>Tees
              <input value={round.tees} onChange={(e) => updateRound("tees", e.target.value)} className="w-full text-sm px-2 py-1 mt-0.5 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 items-end">
            <div className="text-xs" style={{ color: INK }}>Format
              <div className="text-sm font-medium mt-0.5">{FORMAT_LABEL[round.format]}</div>
            </div>
            <label className="text-xs" style={{ color: INK }}>Stroke allowance %
              <input type="number" value={round.allowancePct} onChange={(e) => updateRound("allowancePct", Number(e.target.value))} className="w-full text-sm px-2 py-1 mt-0.5 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} disabled={round.format === "scramble"} />
            </label>
          </div>
          {round.format !== "scramble" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs" style={{ color: INK }}>Course rating
                <input type="number" step="0.1" value={round.rating} onChange={(e) => updateRound("rating", Number(e.target.value))} className="w-full text-sm px-2 py-1 mt-0.5 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
              </label>
              <label className="text-xs" style={{ color: INK }}>Slope
                <input type="number" value={round.slope} onChange={(e) => updateRound("slope", Number(e.target.value))} className="w-full text-sm px-2 py-1 mt-0.5 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
              </label>
            </div>
          )}
          <label className="text-xs flex items-center gap-2 pt-1" style={{ color: INK }}>
            <input type="checkbox" checked={round.countsForIndividual} onChange={(e) => updateRound("countsForIndividual", e.target.checked)} />
            Counts toward individual leaderboard (the jacket)
          </label>
        </div>
        {round.format !== "scramble" && (
          <p className="text-[11px] opacity-60 mt-1" style={{ color: INK }}>Course Handicap is calculated from each player's Index using this rating/slope: round(Index × Slope/113 + (Rating − Par)). Par comes from the hole table below.</p>
        )}
      </div>

      <div>
        <h3 className="font-serif text-sm tracking-widest uppercase mb-2" style={{ color: INK }}>Players, handicaps & this round's groups</h3>
        <div className="rounded-lg border bg-white/60 p-2.5 mb-2 text-xs" style={{ borderColor: "#DDD0AC", color: INK }}>
          <strong>Personal links:</strong> tap Copy next to a player to grab their private scoring link, then text it to them. Opening it locks the app to that player's scorecard. Your own link keeps admin access.
          {manualLink && (
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">Copy this manually:</div>
              <input readOnly value={manualLink} onFocus={(e) => e.target.select()} className="w-full text-xs px-1 py-1.5 rounded border bg-white font-mono" style={{ borderColor: "#DDD0AC", color: INK }} />
            </div>
          )}
        </div>
        <div className="rounded-lg border overflow-hidden bg-white/60 divide-y" style={{ borderColor: "#DDD0AC" }}>
          {setup.players.map((p) => (
            <div key={p.id} className="px-2 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Avatar player={p} size={26} />
                <input value={p.name} onChange={(e) => updatePlayer(p.id, "name", e.target.value)} className="text-sm font-medium px-1.5 py-1 rounded border bg-transparent flex-1 min-w-0" style={{ borderColor: "#DDD0AC", color: INK }} />
                <select value={p.team} onChange={(e) => updatePlayer(p.id, "team", e.target.value)} className="text-xs px-1 py-1 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }}>
                  <option>Redcoats</option><option>Colonials</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[9px] uppercase tracking-wide opacity-50 mb-0.5" style={{ color: INK }}>Index</label>
                  <input type="number" step="0.1" value={p.handicapIndex} onChange={(e) => updatePlayer(p.id, "handicapIndex", Number(e.target.value))} className="w-full text-sm px-1 py-1 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wide opacity-50 mb-0.5" style={{ color: INK }}>Group</label>
                  <input type="number" value={round.groups?.[p.id] ?? ""} onChange={(e) => updateGroup(p.id, e.target.value)} className="w-full text-sm px-1 py-1 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wide opacity-50 mb-0.5" style={{ color: INK }}>Link</label>
                  <button onClick={() => copyLink(p.id)} className="w-full text-[10px] px-1 py-1.5 rounded" style={{ background: copiedId === p.id ? GOLD : PARCHMENT_DARK, color: INK }}>{copiedId === p.id ? "Copied" : "Copy"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] opacity-60 mt-1" style={{ color: INK }}>
          {round.format === "singlesMatch" ? "For singles, one Redcoat + one Colonial sharing a group number form a 1v1 match." : "Two Redcoats + two Colonials sharing a group number form a 2v2 pairing."} Groups can be reset independently for each round.
        </p>
      </div>

      {round.format === "scramble" && (
        <div>
          <h3 className="font-serif text-sm tracking-widest uppercase mb-2" style={{ color: INK }}>Manual team handicaps</h3>
          <div className="rounded-lg border overflow-hidden bg-white/60 divide-y" style={{ borderColor: "#DDD0AC" }}>
            {groupIdsForRound.map((gid) => (
              <div key={gid} className="grid grid-cols-[40px_1fr_1fr] gap-2 px-2 py-1.5 items-center">
                <div className="text-sm" style={{ color: INK }}>#{gid}</div>
                <label className="text-xs" style={{ color: RED_DARK }}>Redcoats team hcp
                  <input type="number" value={round.manualHandicap?.[gid]?.Redcoats ?? 0} onChange={(e) => updateManualHcp(gid, "Redcoats", e.target.value)} className="w-full text-sm px-1 py-0.5 mt-0.5 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
                </label>
                <label className="text-xs" style={{ color: NAVY }}>Colonials team hcp
                  <input type="number" value={round.manualHandicap?.[gid]?.Colonials ?? 0} onChange={(e) => updateManualHcp(gid, "Colonials", e.target.value)} className="w-full text-sm px-1 py-0.5 mt-0.5 rounded border bg-transparent" style={{ borderColor: "#DDD0AC" }} />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-serif text-sm tracking-widest uppercase mb-2" style={{ color: INK }}>Course — {round.course}</h3>
        <div className="rounded-lg border overflow-hidden bg-white/60" style={{ borderColor: "#DDD0AC" }}>
          <div className="grid grid-cols-[40px_1fr_1fr] gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wide opacity-60" style={{ color: INK }}>
            <div>Hole</div><div>Par</div><div>Stroke index</div>
          </div>
          {round.holes.map((h) => (
            <div key={h.number} className="grid grid-cols-[40px_1fr_1fr] gap-1 px-2 py-1 items-center border-t" style={{ borderColor: "#EEE4C8" }}>
              <div className="text-sm">{h.number}</div>
              <input type="number" value={h.par} onChange={(e) => updateHole(h.number, "par", Number(e.target.value))} className="text-sm px-1 py-0.5 rounded border bg-transparent w-16" style={{ borderColor: "#DDD0AC" }} />
              <input type="number" value={h.strokeIndex} onChange={(e) => updateHole(h.number, "strokeIndex", Number(e.target.value))} className="text-sm px-1 py-0.5 rounded border bg-transparent w-16" style={{ borderColor: "#DDD0AC" }} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveSetup} className="w-full py-2.5 rounded-md text-white font-semibold text-sm tracking-wide" style={{ background: NAVY }}>Save setup</button>
    </div>
  );
}

/* ---------- App ---------- */
export default function App() {
  const [setup, setSetup] = useState(null);
  const [scoresByRound, setScoresByRound] = useState({});
  const [tab, setTab] = useState("card");
  const [roundId, setRoundId] = useState(1);
  const [meId, setMeId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [editPlayerId, setEditPlayerId] = useState(null);
  const [locked, setLocked] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const refreshRoundScores = useCallback(async (s, rid) => {
    const round = s.rounds.find((r) => r.id === rid);
    if (!round) return;
    try {
      const sc = await loadScoresForRound(round, s.players);
      setScoresByRound((prev) => ({ ...prev, [rid]: sc }));
    } catch (e) {
      console.error("Failed to load scores for round", rid, e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoadError(null);
    try {
      const s = await loadSetup();
      setSetup(s);
      await Promise.all(s.rounds.map((r) => refreshRoundScores(s, r.id)));
      const params = new URLSearchParams(window.location.search);
      const meParam = params.get("me");
      if (meParam && s.players.some((p) => p.id === meParam)) { setMeId(meParam); setLocked(true); }
      else setMeId((cur) => cur || s.players[0]?.id);
    } catch (e) {
      console.error("Failed to load app data", e);
      setLoadError("Couldn't reach live storage. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [refreshRoundScores]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  useEffect(() => {
    const id = setInterval(async () => {
      if (setup) setup.rounds.forEach((r) => refreshRoundScores(setup, r.id));
      if (setup && tab !== "setup") {
        try {
          const freshSetup = await loadSetup();
          setSetup(freshSetup);
        } catch (e) {
          console.error("Failed to refresh setup", e);
        }
      }
    }, 7000);
    return () => clearInterval(id);
  }, [setup, refreshRoundScores, tab]);

  const round = setup?.rounds.find((r) => r.id === roundId);
  const me = setup?.players.find((p) => p.id === meId);
  const pairings = useMemo(() => (setup && round ? buildPairings(round, setup.players) : []), [setup, round]);
  const myPairing = pairings.find((g) => [...g.Redcoats, ...g.Colonials].some((p) => p.id === meId));
  const editPlayer = setup?.players.find((p) => p.id === (editPlayerId || setup?.players[0]?.id));
  const editPairing = pairings.find((g) => [...g.Redcoats, ...g.Colonials].some((p) => p.id === editPlayer?.id));

  const onScore = async (entityId, hole, value, groupId) => {
    setScoresByRound((prev) => ({ ...prev, [roundId]: { ...(prev[roundId] || {}), [entityId]: { ...((prev[roundId] || {})[entityId] || {}), [hole]: value } } }));
    const pairing = pairings.find((g) => g.id === groupId);
    if (!pairing) return;
    const groupEntityIds = round.format === "scramble"
      ? [pairing.virtualRed.id, pairing.virtualCol.id]
      : [...pairing.Redcoats.map((p) => p.id), ...pairing.Colonials.map((p) => p.id)];
    const currentRoundScores = scoresByRound[roundId] || {};
    const payload = {};
    groupEntityIds.forEach((id) => { payload[id] = { ...(currentRoundScores[id] || {}) }; });
    payload[entityId] = { ...(payload[entityId] || {}), [hole]: value };
    try {
      await window.storage.set(groupScoreKey(roundId, groupId), JSON.stringify(payload), true);
      setSavedFlash(true); setTimeout(() => setSavedFlash(false), 900);
    } catch (e) {
      console.error("Failed to save score", e);
    }
  };

  const saveSetup = async () => {
    try {
      await window.storage.set(SETUP_KEY, JSON.stringify(setup), true);
      setSavedFlash(true); setTimeout(() => setSavedFlash(false), 900);
    } catch (e) {
      console.error("Failed to save setup", e);
    }
  };

  if (loading) {
    return <div style={{ background: PARCHMENT }} className="min-h-screen flex items-center justify-center"><div className="font-serif text-lg" style={{ color: INK }}>Loading the field…</div></div>;
  }

  if (loadError || !setup || !round) {
    return (
      <div style={{ background: PARCHMENT }} className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="font-serif text-lg" style={{ color: INK }}>{loadError || "Something didn't load correctly."}</div>
        <button onClick={() => { setLoading(true); refreshAll(); }} className="px-4 py-2 rounded-md text-white text-sm font-semibold" style={{ background: NAVY }}>Try again</button>
      </div>
    );
  }

  const handleTitleTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1500);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowPinEntry(true);
      setPinError(false);
    }
  };

  const submitPin = () => {
    if (pinInput === "1781") {
      setAdminUnlocked(true);
      setShowPinEntry(false);
      setPinInput("");
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const isAdmin = adminUnlocked || (locked && meId === ADMIN_PLAYER_ID);
  const tabsAvailable = [["card", "My Scorecard"], ["all", "All Matches"], ["leaderboard", "Leaderboard"], ["team", "Team Score"]];
  if (isAdmin) tabsAvailable.push(["edit", "Edit Scores"], ["setup", "Setup"]);
  const showRoundPicker = tab === "card" || tab === "all" || tab === "setup" || tab === "edit";

  return (
    <div style={{ background: PARCHMENT, minHeight: "100vh" }} className="font-sans">
      <div style={{ background: "#B8912F" }} className="sticky top-0 z-30 text-center py-1 text-[11px] font-bold uppercase tracking-widest">
        Test Version — Not the Live Event App
      </div>
      <div style={{ background: NAVY, top: 26 }} className="sticky z-20 px-4 pt-3 pb-2 shadow relative">
        <img src={EVENT_LOGO} alt="" className="absolute top-2 right-3 pointer-events-none select-none" style={{ height: 88, width: "auto" }} />
        <div className="flex items-center justify-between pr-16">
          <div onClick={handleTitleTap} className="select-none cursor-pointer">
            <div className="font-serif text-white text-lg tracking-wide leading-tight">Colonial Heater Classic</div>
            <div className="text-[11px] uppercase tracking-widest" style={{ color: GOLD_LIGHT }}>{round.label}</div>
          </div>
          {savedFlash && <div className="text-[10px] px-2 py-1 rounded" style={{ background: GOLD, color: NAVY_DARK }}>Saved</div>}
        </div>
        {showPinEntry && !adminUnlocked && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="password" inputMode="numeric" placeholder="Admin PIN" value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitPin(); }}
              autoFocus
              className="text-xs rounded-md px-2 py-1 w-28"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: `1px solid ${pinError ? RED : GOLD_LIGHT}` }}
            />
            <button onClick={submitPin} className="text-xs px-2 py-1 rounded-md font-medium" style={{ background: GOLD, color: NAVY_DARK }}>Unlock</button>
            <button onClick={() => { setShowPinEntry(false); setPinInput(""); setPinError(false); }} className="text-xs px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>Cancel</button>
            {pinError && <span className="text-[10px]" style={{ color: GOLD_LIGHT }}>Wrong PIN</span>}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {locked && (
            <div className="text-xs px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.12)", color: "white", border: `1px solid ${GOLD_LIGHT}` }}>You: <span className="font-semibold">{me?.name}</span></div>
          )}
          {!locked && (
            <select value={meId || ""} onChange={(e) => setMeId(e.target.value)} className="text-xs rounded-md px-2 py-1" style={{ background: "rgba(255,255,255,0.12)", color: "white", border: `1px solid ${GOLD_LIGHT}` }}>
              {setup.players.map((p) => <option key={p.id} value={p.id} style={{ color: INK }}>You: {p.name}</option>)}
            </select>
          )}
          {showRoundPicker && <RoundPicker rounds={setup.rounds} roundId={roundId} setRoundId={setRoundId} />}
        </div>
        <div className="flex mt-2 gap-1 flex-wrap">
          {tabsAvailable.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className="text-xs py-1.5 px-2 rounded-md font-medium tracking-wide" style={tab === key ? { background: GOLD, color: NAVY_DARK } : { background: "rgba(255,255,255,0.08)", color: "white" }}>{label}</button>
          ))}
        </div>
      </div>

      {tab === "card" && me && myPairing && (
        <Scorecard round={round} me={me} pairing={myPairing} scores={scoresByRound[roundId] || {}} onScore={onScore} />
      )}
      {tab === "card" && !myPairing && (
        <div className="p-6 text-center text-sm opacity-70" style={{ color: INK }}>This player isn't assigned to a complete pairing for {round.label} yet — check Setup.</div>
      )}
      {tab === "all" && <AllMatches round={round} pairings={pairings} scores={scoresByRound[roundId] || {}} />}
      {tab === "leaderboard" && <Leaderboard setup={setup} allScores={scoresByRound} />}
      {tab === "team" && <TeamScore setup={setup} allScores={scoresByRound} />}
      {tab === "edit" && isAdmin && editPlayer && (
        <div>
          <div className="px-3 pt-3">
            <div className="rounded-lg border bg-white/60 p-2 flex items-center gap-2" style={{ borderColor: "#DDD0AC" }}>
              <span className="text-[10px] uppercase tracking-widest opacity-60 shrink-0" style={{ color: INK }}>Editing scores for</span>
              <select value={editPlayer.id} onChange={(e) => setEditPlayerId(e.target.value)} className="text-sm rounded-md px-2 py-1 border flex-1" style={{ borderColor: "#DDD0AC", color: INK }}>
                {setup.players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {editPairing ? (
            <Scorecard round={round} me={editPlayer} pairing={editPairing} scores={scoresByRound[roundId] || {}} onScore={onScore} />
          ) : (
            <div className="p-6 text-center text-sm opacity-70" style={{ color: INK }}>{editPlayer.name} isn't assigned to a complete pairing for {round.label} yet — check Setup.</div>
          )}
        </div>
      )}
      {tab === "setup" && isAdmin && <Setup setup={setup} setSetup={setSetup} saveSetup={saveSetup} roundId={roundId} setRoundId={setRoundId} />}
    </div>
  );
}
