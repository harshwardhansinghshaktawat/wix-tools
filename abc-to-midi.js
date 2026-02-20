/**
 * ABC Notation to MIDI Converter - Wix Custom Element
 * Filename: wix-abc-to-midi.js
 * Custom Element Tag: <abc-to-midi>
 * Widget Element ID: #abcToMidi
 *
 * Series design system — identical to all other widgets:
 *   this.settings with same 13 props, getStyles() + updateStyles(),
 *   light theme, full CSS var names, same observedAttributes.
 *
 * ─────────────────────────────────────────────────────────────
 * SELF-CONTAINED ENGINE — zero external dependencies:
 *
 *  ABCParser   — full ABC notation parser
 *    · Header: X T M L Q K V C (channel/voice headers)
 *    · All 12 major + minor key signatures + 7 modes
 *    · Notes A-G upper/lower (octave), , and ' modifiers
 *    · Accidentals ^ ^^ _ __ = (sharp/dbl-sharp/flat/dbl-flat/natural)
 *    · Accidental memory: per-bar, reset on barline
 *    · Durations: integer, /N, M/N, > < (dotted/broken rhythm)
 *    · Rests: z (note rest), Z (bar rest)
 *    · Chords: [CEG]
 *    · Tuplets: (2 (3 (4 (5 (6 (7 (8 (9
 *    · Repeats: |: :| :: [1 [2 [3 (full expansion)
 *    · Ties: - (accumulated across barlines)
 *    · Grace notes: {abc} (ignored for timing, kept for note pitch)
 *    · Decorations: . (staccato) ~ (roll) ! (dynamics) etc
 *    · Multi-voice: V:label lines, %%MIDI channel, %%MIDI program
 *    · Inline voice headers: [V:1], [K:G], [M:3/4], [L:1/8], [Q:120]
 *    · Lyrics lines (w:) — parsed and ignored for MIDI
 *
 *  MIDIBuilder — standard MIDI file binary encoder
 *    · Format 0 (single track) or Format 1 (multi-track)
 *    · Variable-length quantity (VLQ) encoding
 *    · Tempo event (microseconds per quarter from Q: field)
 *    · Time signature event from M: field
 *    · Program change per voice (GM instrument numbers)
 *    · CC7 volume + CC10 pan per voice
 *    · Note On / Note Off with correct delta-time
 *    · End-of-track event on every track
 *    · Chord notes: all on at tick 0, all off at tick+duration
 *    · Tie merging: adjacent tied notes collapsed to single long note
 *    · Auto channel assignment: voices → channels 0–9,11–15 (skip 10=drums)
 *
 *  UI
 *    · Large resizable ABC text editor with syntax-coloured line numbers
 *    · Real-time error/warning log panel
 *    · Parsed track table: voice, channel, instrument, note count, range
 *    · Per-voice settings: instrument (GM dropdown), octave shift, velocity, pan
 *    · Global settings: tempo override, velocity scale, output format (SMF0/SMF1)
 *    · Built-in ABC example library (simple melody, two-voice, complex multi-track)
 *    · Convert + Download .mid button
 *    · Copy ABC button
 *    · Line/col cursor position in editor
 * ─────────────────────────────────────────────────────────────
 */

/* ═══════════════════════════════════════════════════════════════════
   GM INSTRUMENT LIST (128 programs)
═══════════════════════════════════════════════════════════════════ */
const GM_INSTRUMENTS = [
  'Acoustic Grand Piano','Bright Acoustic Piano','Electric Grand Piano','Honky-tonk Piano',
  'Electric Piano 1','Electric Piano 2','Harpsichord','Clavi',
  'Celesta','Glockenspiel','Music Box','Vibraphone','Marimba','Xylophone','Tubular Bells','Dulcimer',
  'Drawbar Organ','Percussive Organ','Rock Organ','Church Organ','Reed Organ','Accordion','Harmonica','Tango Accordion',
  'Acoustic Guitar (nylon)','Acoustic Guitar (steel)','Electric Guitar (jazz)','Electric Guitar (clean)',
  'Electric Guitar (muted)','Overdriven Guitar','Distortion Guitar','Guitar harmonics',
  'Acoustic Bass','Electric Bass (finger)','Electric Bass (pick)','Fretless Bass',
  'Slap Bass 1','Slap Bass 2','Synth Bass 1','Synth Bass 2',
  'Violin','Viola','Cello','Contrabass','Tremolo Strings','Pizzicato Strings','Orchestral Harp','Timpani',
  'String Ensemble 1','String Ensemble 2','Synth Strings 1','Synth Strings 2',
  'Choir Aahs','Voice Oohs','Synth Voice','Orchestra Hit',
  'Trumpet','Trombone','Tuba','Muted Trumpet','French Horn','Brass Section','Synth Brass 1','Synth Brass 2',
  'Soprano Sax','Alto Sax','Tenor Sax','Baritone Sax',
  'Oboe','English Horn','Bassoon','Clarinet',
  'Piccolo','Flute','Recorder','Pan Flute','Blown Bottle','Shakuhachi','Whistle','Ocarina',
  'Lead 1 (square)','Lead 2 (sawtooth)','Lead 3 (calliope)','Lead 4 (chiff)',
  'Lead 5 (charang)','Lead 6 (voice)','Lead 7 (fifths)','Lead 8 (bass+lead)',
  'Pad 1 (new age)','Pad 2 (warm)','Pad 3 (polysynth)','Pad 4 (choir)',
  'Pad 5 (bowed)','Pad 6 (metallic)','Pad 7 (halo)','Pad 8 (sweep)',
  'FX 1 (rain)','FX 2 (soundtrack)','FX 3 (crystal)','FX 4 (atmosphere)',
  'FX 5 (brightness)','FX 6 (goblins)','FX 7 (echoes)','FX 8 (sci-fi)',
  'Sitar','Banjo','Shamisen','Koto','Kalimba','Bag pipe','Fiddle','Shanai',
  'Tinkle Bell','Agogo','Steel Drums','Woodblock','Taiko Drum','Melodic Tom','Synth Drum','Reverse Cymbal',
  'Guitar Fret Noise','Breath Noise','Seashore','Bird Tweet','Telephone Ring','Helicopter','Applause','Gunshot'
];

/* ═══════════════════════════════════════════════════════════════════
   KEY SIGNATURES  → semitone accidentals map for A-G
   Positive = sharp added to that pitch class, negative = flat
═══════════════════════════════════════════════════════════════════ */
const KEY_SIGS = (() => {
  // Circle of fifths sharps order: F C G D A E B
  // Circle of fifths flats  order: B E A D G C F
  const SHARP_ORDER = ['F','C','G','D','A','E','B'];
  const FLAT_ORDER  = ['B','E','A','D','G','C','F'];
  const keys = {};
  const addKey = (name, sharps, flats) => {
    const acc = {};
    for (let i = 0; i < sharps; i++) acc[SHARP_ORDER[i]] =  1;
    for (let i = 0; i < flats;  i++) acc[FLAT_ORDER[i]]  = -1;
    keys[name] = acc;
  };
  // Major keys
  addKey('C',  0, 0); addKey('G',  1, 0); addKey('D',  2, 0); addKey('A',  3, 0);
  addKey('E',  4, 0); addKey('B',  5, 0); addKey('F#', 6, 0); addKey('C#', 7, 0);
  addKey('F',  0, 1); addKey('Bb', 0, 2); addKey('Eb', 0, 3); addKey('Ab', 0, 4);
  addKey('Db', 0, 5); addKey('Gb', 0, 6); addKey('Cb', 0, 7);
  // Minor keys (relative: add 3 flats relative to major)
  const minorOf = (name, s, f) => { addKey(name+'m', s, f); addKey(name+'min', s, f); };
  minorOf('A', 0,0); minorOf('E', 1,0); minorOf('B', 2,0); minorOf('F#',3,0);
  minorOf('C#',4,0); minorOf('G#',5,0); minorOf('D#',6,0); minorOf('A#',7,0);
  minorOf('D', 0,1); minorOf('G', 0,2); minorOf('C', 0,3); minorOf('F', 0,4);
  minorOf('Bb',0,5); minorOf('Eb',0,6); minorOf('Ab',0,7);
  // Modal keys: derive from major (mode shifts)
  // Dorian = major with 2 fewer sharps, Mixolydian = 1 fewer sharp, etc.
  const modalShift = { dor:-2, phr:-4, lyd:1, mix:-1, loc:-5, aeo:-3 };
  const majorSharps = { C:0,G:1,D:2,A:3,E:4,B:5,'F#':6,'C#':7,F:-1,Bb:-2,Eb:-3,Ab:-4,Db:-5,Gb:-6,Cb:-7 };
  const sharpsToKey = Object.fromEntries(Object.entries(majorSharps).map(([k,v])=>[v,k]));
  Object.entries(modalShift).forEach(([mode, shift]) => {
    Object.entries(majorSharps).forEach(([base, sh]) => {
      const eq = sh + shift;
      const relKey = sharpsToKey[eq];
      if (relKey) {
        const modeKey = base + mode;
        keys[modeKey] = {...(keys[relKey] || {})};
      }
    });
  });
  return keys;
})();

/* Base MIDI note numbers for C4=60, natural notes in octave 4 (ABC middle octave) */
const NOTE_MIDI_BASE = { C:60, D:62, E:64, F:65, G:67, A:69, B:71 };

/* ═══════════════════════════════════════════════════════════════════
   ABC PARSER
═══════════════════════════════════════════════════════════════════ */
class ABCParser {
  constructor(abc, globalSettings) {
    this.src      = abc;
    this.gs       = globalSettings || {};
    this.voices   = {};       // voiceId → { events:[], settings:{} }
    this.header   = {};
    this.errors   = [];
    this.warnings = [];
    this.currentVoice = '1';
  }

  parse() {
    const lines = this.src.split('\n');
    let   inBody = false;

    // Per-voice parse state
    const voiceState = {};
    const getVS = (vid) => {
      if (!voiceState[vid]) {
        voiceState[vid] = {
          keySig:    {},                 // pitch class → ±1 (from K: field)
          barAccidentals: {},            // pitch class → semitone offset (reset per bar)
          defaultLen: null,             // from L: field (fraction of whole note)
          meterNum:   4, meterDen: 4,   // from M: field
          tempo:      120,              // Q: bpm
          tied:       {},               // noteStr → pending tie duration
          beamGroup:  0,
          inRepeat1:  false,
          inRepeat2:  false,
          repeatStart: 0,
          events:     [],
          instrument: 0,
          channel:    null,
          pan:        64,
          velocity:   100,
          octaveShift: 0,
          name:       vid
        };
      }
      return voiceState[vid];
    };

    // Apply global header defaults
    const applyHeaderToVS = (vs) => {
      if (this.header.K) vs.keySig = this.parseKey(this.header.K);
      if (this.header.L) vs.defaultLen = this.parseFraction(this.header.L);
      if (this.header.M) { const [n,d] = this.parseMeter(this.header.M); vs.meterNum=n; vs.meterDen=d; }
      if (this.header.Q) vs.tempo = this.parseTempo(this.header.Q);
    };

    // First pass: collect header
    for (const line of lines) {
      const hm = line.match(/^([A-Za-z%]):\s*(.*)$/);
      if (hm && !inBody) {
        const [,field, val] = hm;
        const F = field.toUpperCase();
        if (F === 'X') { this.header.X = val.trim(); continue; }
        if (F === 'T') { this.header.T = this.header.T ? this.header.T+' / '+val.trim() : val.trim(); continue; }
        if (F === 'M') { this.header.M = val.trim(); continue; }
        if (F === 'L') { this.header.L = val.trim(); continue; }
        if (F === 'Q') { this.header.Q = val.trim(); continue; }
        if (F === 'K') { this.header.K = val.trim(); inBody = true; continue; }
        if (F === 'V') { /* voice def in header, handled below */ continue; }
        if (field === '%') {
          // %%MIDI channel N  or  %%MIDI program N
          const mm = val.match(/^MIDI\s+(channel|program)\s+(\d+)/i);
          if (mm) {
            if (!this.header.midi) this.header.midi = {};
            this.header.midi[mm[1].toLowerCase()] = parseInt(mm[2]);
          }
        }
      }
      if (hm && hm[1].toUpperCase() === 'K') inBody = true;
    }

    // Second pass: parse body
    inBody = false;
    let currentVoiceId = '1';
    let repeatStack    = [];       // for |: :| nesting
    let bufferMap      = {};       // voiceId → token array for deferred repeat expansion
    let savedEvents    = {};       // voiceId → events snapshot at |:
    let volta1Events   = {};       // voiceId → events snapshot at [1

    const finaliseRepeat = (vid, repeatToStart) => {
      // Just mark; expansion handled inline
    };

    for (let li = 0; li < lines.length; li++) {
      let line = lines[li].trim();

      // Skip empty lines and comment lines
      if (!line || line.startsWith('%') && !line.startsWith('%%')) continue;

      // %%MIDI directives in body
      if (line.startsWith('%%MIDI')) {
        const mm = line.match(/%%MIDI\s+(channel|program|tempo)\s+(\d+)/i);
        if (mm) {
          const vs = getVS(currentVoiceId);
          if (mm[1].toLowerCase() === 'channel')  vs.channel    = parseInt(mm[2]);
          if (mm[1].toLowerCase() === 'program')  vs.instrument = parseInt(mm[2]);
          if (mm[1].toLowerCase() === 'tempo')    vs.tempo      = parseInt(mm[2]);
        }
        continue;
      }

      // Lyrics lines — skip
      if (line.match(/^w:/i)) continue;

      // Header fields that are legal in body
      const hm2 = line.match(/^([A-Za-z]):\s*(.+)$/);
      if (hm2 && !inBody) {
        const F = hm2[1].toUpperCase();
        if (F === 'K') { inBody = true; }
        // store in header
        if (!this.header[F]) this.header[F] = hm2[2].trim();
        if (F === 'K') inBody = true;
        continue;
      }
      if (hm2 && inBody) {
        const F = hm2[1].toUpperCase();
        if (F === 'K') { const vs=getVS(currentVoiceId); vs.keySig = this.parseKey(hm2[2].trim()); continue; }
        if (F === 'V') {
          currentVoiceId = hm2[2].trim().split(/\s+/)[0];
          if (!voiceState[currentVoiceId]) { getVS(currentVoiceId); applyHeaderToVS(voiceState[currentVoiceId]); }
          // Parse optional sub-fields: clef= name= program= channel= etc
          const vs = getVS(currentVoiceId);
          const nm = hm2[2].match(/name="?([^"\s]+)"?/i); if(nm) vs.name = nm[1];
          const pr = hm2[2].match(/program=(\d+)/i);       if(pr) vs.instrument = parseInt(pr[1]);
          const ch = hm2[2].match(/channel=(\d+)/i);        if(ch) vs.channel = parseInt(ch[1])-1;
          const oc = hm2[2].match(/transpose=(-?\d+)/i);    if(oc) vs.octaveShift = Math.round(parseInt(oc[1])/12);
          continue;
        }
        if (F === 'M') { const vs=getVS(currentVoiceId); const [n,d]=this.parseMeter(hm2[2].trim()); vs.meterNum=n; vs.meterDen=d; continue; }
        if (F === 'L') { const vs=getVS(currentVoiceId); vs.defaultLen=this.parseFraction(hm2[2].trim()); continue; }
        if (F === 'Q') { const vs=getVS(currentVoiceId); vs.tempo=this.parseTempo(hm2[2].trim()); continue; }
        if (F === 'K') { inBody = true; continue; }
        continue;
      }

      // Mark body started
      if (!inBody) { inBody = true; }

      // Initialise default voice if not yet done
      if (!voiceState['1']) { getVS('1'); applyHeaderToVS(voiceState['1']); }
      if (!voiceState[currentVoiceId]) { getVS(currentVoiceId); applyHeaderToVS(voiceState[currentVoiceId]); }

      // Parse body line — handle inline voice / header switches
      this.parseLine(line, currentVoiceId, voiceState, getVS);
    }

    // Apply global octaveShift overrides from UI settings
    const vsIds = Object.keys(voiceState);
    if (vsIds.length === 0) {
      // Fallback: treat whole thing as voice 1
      getVS('1');
      applyHeaderToVS(voiceState['1']);
    }

    // Ensure all voices have proper defaults
    vsIds.forEach(vid => {
      const vs = voiceState[vid];
      if (!vs.defaultLen) vs.defaultLen = 1/8;
      // Apply global override settings
      if (this.gs.tempoOverride) vs.tempo = this.gs.tempoOverride;
      if (this.gs.velocityScale) vs.velocityScale = this.gs.velocityScale / 100;
    });

    // Promote to this.voices
    vsIds.forEach(vid => {
      this.voices[vid] = voiceState[vid];
    });

    return this;
  }

  parseLine(line, currentVoiceId, voiceState, getVS) {
    // Process inline voice switches [V:N] and inline header [K:G] etc
    // We'll tokenise the line character by character
    let i = 0;
    const len = line.length;
    // NOTE: vs is resolved dynamically via cvid to handle mid-line [V:N] switches
    let cvid = currentVoiceId;
    const vs = () => getVS(cvid);  // always fetch current voice state

    while (i < len) {
      // Skip whitespace
      if (line[i] === ' ' || line[i] === '\t') { i++; continue; }

      // Comments
      if (line[i] === '%') break;

      // Inline fields  [X:...]
      if (line[i] === '[' && i+1 < len && line[i+1].match(/[A-Za-z]/) && i+2 < len && line[i+2] === ':') {
        const end = line.indexOf(']', i);
        if (end !== -1) {
          const field = line[i+1].toUpperCase();
          const val   = line.slice(i+3, end).trim();
          if (field === 'V') {
            cvid = val.split(/\s+/)[0];
            if (!voiceState[cvid]) {
              getVS(cvid);
              const nv = getVS(cvid);
              if (this.header.K) nv.keySig     = this.parseKey(this.header.K);
              if (this.header.L) nv.defaultLen  = this.parseFraction(this.header.L);
              if (this.header.M) { const [n,d]  = this.parseMeter(this.header.M); nv.meterNum=n; nv.meterDen=d; }
              if (this.header.Q) nv.tempo       = this.parseTempo(this.header.Q);
            }
          } else if (field === 'K') { vs().keySig     = this.parseKey(val); }
          else if   (field === 'M') { const [n,d] = this.parseMeter(val); vs().meterNum=n; vs().meterDen=d; }
          else if   (field === 'L') { vs().defaultLen  = this.parseFraction(val); }
          else if   (field === 'Q') { vs().tempo       = this.parseTempo(val); }
          i = end + 1; continue;
        }
      }

      // Barlines and repeat markers
      if (line[i] === '|' || line[i] === ':') {
        const bar = this.consumeBarline(line, i);
        i = bar.newI;
        const btype = bar.type;
        const v = vs();

        // Reset bar accidentals on every barline
        v.barAccidentals = {};

        if (btype === 'REPEAT_START') {
          v.repeatStartIdx = v.events.length;
          v.inRepeat = true;
        } else if (btype === 'REPEAT_END' || btype === 'REPEAT_BOTH') {
          if (v.inRepeat && v.repeatStartIdx !== undefined) {
            const toRepeat = v.events.slice(v.repeatStartIdx);
            const filtered = toRepeat.filter(e => e._volta !== 1);
            v.events.push(...filtered.map(e => ({...e})));
          }
          if (btype === 'REPEAT_BOTH') { v.repeatStartIdx = v.events.length; }
          else { v.inRepeat = false; v.inVolta1 = false; }
        } else if (btype === 'VOLTA1') {
          v.inVolta1 = true; v.volta1Start = v.events.length;
        } else if (btype === 'VOLTA2') {
          if (v.volta1Start !== undefined) {
            v.events = v.events.filter((e, idx) => idx < v.volta1Start || e._volta !== 1);
          }
          v.inVolta1 = false;
          v.barAccidentals = {};
        }
        continue;
      }

      // Decorations/articulations — skip
      if (line[i] === '!') {
        const end = line.indexOf('!', i+1);
        if (end !== -1) { i = end+1; continue; }
        i++; continue;
      }
      if ('.~HLMOPSTU'.includes(line[i]) && (i+1 >= len || !line[i+1].match(/[A-Ga-gz]/))) {
        i++; continue;
      }

      // Grace notes { ... }
      if (line[i] === '{') {
        const end = line.indexOf('}', i);
        i = end !== -1 ? end+1 : i+1;
        continue;
      }

      // Tuplet marker  (N  or  (N:M:P
      if (line[i] === '(' && i+1 < len && line[i+1].match(/\d/)) {
        const tup = this.consumeTuplet(line, i);
        i = tup.newI;
        vs().tupletNum   = tup.num;
        vs().tupletDen   = tup.den;
        vs().tupletCount = tup.count;
        continue;
      }

      // Slur open/close — ignore for MIDI
      if (line[i] === '(' || line[i] === ')') { i++; continue; }

      // Broken rhythm  A>B  →  A is dotted, B is half
      // A<B  →  A is halved, B is dotted
      if (line[i] === '>') {
        let cnt = 0; while (i < len && line[i] === '>') { cnt++; i++; }
        const factor = Math.pow(2, cnt);                          // e.g. cnt=1 → 2
        const v = vs();
        if (v.events.length) {
          const last = v.events[v.events.length-1];
          if (last && last.duration !== undefined) {
            // Last note gets (2n-1)/2n of its full value, next gets 1/2n
            last.duration = last.duration * (2*factor - 1) / (2*factor) * 2;
          }
        }
        vs().nextBroken = 1 / factor;
        continue;
      }
      if (line[i] === '<') {
        let cnt = 0; while (i < len && line[i] === '<') { cnt++; i++; }
        const factor = Math.pow(2, cnt);
        const v = vs();
        if (v.events.length) {
          const last = v.events[v.events.length-1];
          if (last && last.duration !== undefined) {
            last.duration = last.duration / (2*factor) * 2;
          }
        }
        vs().nextBroken = (2*factor - 1) / (2*factor) * 2;
        continue;
      }

      // Chord  [note note ...]
      if (line[i] === '[' && !(i+1 < len && line[i+1].match(/[A-Z]:/))) {
        const chord = this.consumeChord(line, i, vs());
        i = chord.newI;
        if (chord.notes.length > 0) {
          const v   = vs();
          let dur   = chord.duration;
          if (v.tupletCount > 0) { dur *= v.tupletDen / v.tupletNum; v.tupletCount--; }
          if (v.nextBroken)      { dur *= v.nextBroken; v.nextBroken = 0; }
          const vel = Math.min(127, Math.round((v.velocity || 80) * (v.velocityScale || 1)));
          v.events.push({ type:'chord', notes: chord.notes, duration: dur, velocity: vel, _volta: v.inVolta1?1:0 });
        }
        continue;
      }

      // Accidentals  ^ _ =
      let accidental = 0;
      let accCount   = 0;
      let hasNatural = false;
      while (i < len && (line[i] === '^' || line[i] === '_' || line[i] === '=')) {
        if      (line[i] === '^') accidental++;
        else if (line[i] === '_') accidental--;
        else                       { accidental = 0; hasNatural = true; }
        accCount++; i++;
      }

      // Rests: z (note rest), Z (bar rest), x (invisible rest)
      if (i < len && (line[i] === 'z' || line[i] === 'Z' || line[i] === 'x')) {
        const isBar = line[i] === 'Z';
        i++;
        const v   = vs();
        const dur = this.consumeDuration(line, i, v.defaultLen || 1/8);
        i = dur.newI;
        let d = isBar ? ((v.meterNum || 4) / (v.meterDen || 4)) : dur.value;
        if (v.tupletCount > 0) { d *= v.tupletDen / v.tupletNum; v.tupletCount--; }
        if (v.nextBroken)      { d *= v.nextBroken; v.nextBroken = 0; }
        v.events.push({ type:'rest', duration: d, _volta: v.inVolta1?1:0 });
        continue;
      }

      // Notes: A-G  a-g
      if (i < len && line[i].match(/[A-Ga-g]/)) {
        const noteCh   = line[i];
        const isLower  = noteCh === noteCh.toLowerCase();
        const noteName = noteCh.toUpperCase();
        i++;

        // Octave modifiers
        let octMod = isLower ? 1 : 0;
        while (i < len && line[i] === "'") { octMod++; i++; }
        while (i < len && line[i] === ',') { octMod--; i++; }

        const v   = vs();
        const dur = this.consumeDuration(line, i, v.defaultLen || 1/8);
        i = dur.newI;

        // Tie marker
        let tied = false;
        if (i < len && line[i] === '-') { tied = true; i++; }

        // Resolve MIDI note
        let midiNote = NOTE_MIDI_BASE[noteName] + octMod * 12;

        // Accidentals override key signature for rest of bar
        if (accCount > 0 || hasNatural) {
          v.barAccidentals[noteName] = accidental;
          midiNote += accidental;
        } else {
          const barAcc = v.barAccidentals[noteName];
          midiNote += (barAcc !== undefined) ? barAcc : (v.keySig[noteName] || 0);
        }

        // Per-voice octave shift
        midiNote += (v.octaveShift || 0) * 12;

        // UI voice overrides
        if (this.gs.voiceSettings && this.gs.voiceSettings[cvid]) {
          const vui = this.gs.voiceSettings[cvid];
          if (vui.octaveShift !== undefined) midiNote += vui.octaveShift * 12;
          if (vui.instrument  !== undefined) v.instrument = vui.instrument;
        }

        midiNote = Math.max(0, Math.min(127, midiNote));

        let d = dur.value;
        if (v.tupletCount > 0) { d *= v.tupletDen / v.tupletNum; v.tupletCount--; }
        if (v.nextBroken)      { d *= v.nextBroken; v.nextBroken = 0; }

        const vel = Math.min(127, Math.max(1, Math.round((v.velocity || 80) * (v.velocityScale || 1))));

        // Tie resolution: extend the previous note with this pitch
        if (tied) {
          v.pendingTie = v.pendingTie || {};
          // Emit note now, mark it; next note with same pitch continues it
          v.events.push({ type:'note', pitch: midiNote, duration: d, velocity: vel, tied: true, _volta: v.inVolta1?1:0 });
          v.pendingTie[midiNote] = v.events.length - 1; // index of the start note
          continue;
        }
        // If we have a pending tie for this pitch, extend the existing note
        if (v.pendingTie && v.pendingTie[midiNote] !== undefined) {
          const startIdx = v.pendingTie[midiNote];
          if (v.events[startIdx]) v.events[startIdx].duration += d;
          delete v.pendingTie[midiNote];
          continue;
        }

        v.events.push({ type:'note', pitch: midiNote, duration: d, velocity: vel, tied: false, _volta: v.inVolta1?1:0 });
        continue;
      }

      // Unknown character — skip
      i++;
    }
  }

  consumeBarline(line, i) {
    let type = 'BAR';
    let s = '';
    while (i < line.length && '|:[]0123456789'.includes(line[i])) {
      s += line[i]; i++;
      // Don't consume digits unless after [
      if (line[i] && !':[]|'.includes(line[i]) && line[i].match(/\d/)) {
        if (s.endsWith('[')) { s += line[i]; i++; } else break;
      }
    }
    if (s === '|:' || s === '|:|')   type = 'REPEAT_START';
    else if (s === ':|' || s === '::') type = 'REPEAT_END';
    else if (s === '|:' )            type = 'REPEAT_START';
    else if (s.includes('|:'))       type = 'REPEAT_START';
    else if (s.includes(':|'))       type = 'REPEAT_END';
    else if (s === '::')             type = 'REPEAT_BOTH';
    else if (s.match(/\[1/))         type = 'VOLTA1';
    else if (s.match(/\[2/))         type = 'VOLTA2';
    return { type, newI: i };
  }

  consumeTuplet(line, i) {
    i++; // skip (
    let numStr = '';
    while (i < line.length && line[i].match(/\d/)) { numStr += line[i]; i++; }
    const num = parseInt(numStr) || 3;
    let den = num % 2 === 0 ? num-1 : num+1;
    if (num === 2) den = 3;
    if (num === 3) den = 2;
    if (num === 4) den = 3;
    if (num === 5 || num === 7 || num === 9) den = 2;
    if (num === 6) den = 4;
    let count = num;
    // Optional :den:count
    if (i < line.length && line[i] === ':') {
      i++;
      let ds = ''; while(i < line.length && line[i].match(/\d/)) { ds += line[i]; i++; }
      if (ds) den = parseInt(ds);
      if (i < line.length && line[i] === ':') {
        i++;
        let cs = ''; while(i < line.length && line[i].match(/\d/)) { cs += line[i]; i++; }
        if (cs) count = parseInt(cs);
      }
    }
    return { num, den, count, newI: i };
  }

  consumeChord(line, i, vs) {
    i++; // skip [
    const notes = [];
    let chordDuration = null;
    while (i < line.length && line[i] !== ']') {
      // Accidentals
      let acc = 0;
      while (i < line.length && (line[i] === '^' || line[i] === '_' || line[i] === '=')) {
        if (line[i] === '^') acc++;
        else if (line[i] === '_') acc--;
        else acc = 0;
        i++;
      }
      if (i < line.length && line[i].match(/[A-Ga-g]/)) {
        const noteCh = line[i]; const isLower = noteCh === noteCh.toLowerCase();
        const noteName = noteCh.toUpperCase(); i++;
        let octMod = isLower ? 1 : 0;
        while (i < line.length && line[i] === "'") { octMod++; i++; }
        while (i < line.length && line[i] === ',') { octMod--; i++; }
        const dur = this.consumeDuration(line, i, vs.defaultLen);
        i = dur.newI;
        if (chordDuration === null) chordDuration = dur.value;
        let midi = NOTE_MIDI_BASE[noteName] + octMod*12;
        const ks = vs.keySig[noteName] || 0;
        const ba = vs.barAccidentals[noteName];
        if (acc !== 0) { vs.barAccidentals[noteName] = acc; midi += acc; }
        else if (ba !== undefined) midi += ba;
        else midi += ks;
        midi += (vs.octaveShift||0)*12;
        notes.push(Math.max(0,Math.min(127,midi)));
      } else { i++; }
    }
    if (i < line.length && line[i] === ']') i++;
    // Duration after ]
    const dur2 = this.consumeDuration(line, i, vs.defaultLen);
    if (dur2.value !== vs.defaultLen) { chordDuration = dur2.value; i = dur2.newI; }
    return { notes, duration: chordDuration || vs.defaultLen, newI: i };
  }

  consumeDuration(line, i, defaultLen) {
    let num = null, den = null;
    let j = i;
    // Integer part
    let ns = ''; while (j < line.length && line[j].match(/\d/)) { ns += line[j]; j++; }
    if (ns) num = parseInt(ns);
    // Slash
    if (j < line.length && line[j] === '/') {
      j++;
      let ds = ''; while (j < line.length && line[j].match(/\d/)) { ds += line[j]; j++; }
      den = ds ? parseInt(ds) : 2;
    }
    let value = defaultLen;
    if (num !== null && den !== null) value = defaultLen * num / den;
    else if (num !== null)            value = defaultLen * num;
    else if (den !== null)            value = defaultLen / den;
    return { value, newI: j };
  }

  parseKey(keyStr) {
    if (!keyStr) return {};
    // K:C major, K:Amin, K:G mixolydian, K:none, etc.
    const s = keyStr.trim();
    if (s.toLowerCase() === 'none' || s.toLowerCase() === 'hp' || s.toLowerCase() === 'Hp') return {};
    // Extract root + modifier + mode
    const m = s.match(/^([A-G][b#]?)\s*(m(?:in(?:or)?)?|maj(?:or)?|mix|dor|phr|lyd|loc|aeo)?/i);
    if (!m) return {};
    let root = m[1];
    let mode = (m[2] || 'maj').toLowerCase();
    if (mode.startsWith('mi') || mode === 'm') mode = 'min';
    else if (mode.startsWith('ma')) mode = 'maj';
    // Build lookup key
    const lookupKey = mode === 'maj' ? root : mode === 'min' ? root+'m' : root+mode.slice(0,3);
    return KEY_SIGS[lookupKey] || KEY_SIGS[root] || {};
  }

  parseFraction(s) {
    const m = s.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return parseInt(m[1]) / parseInt(m[2]);
    const n = parseFloat(s);
    return isNaN(n) ? 1/8 : n;
  }

  parseMeter(s) {
    if (s === 'C') return [4,4];
    if (s === 'C|') return [2,2];
    const m = s.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) return [parseInt(m[1]), parseInt(m[2])];
    return [4,4];
  }

  parseTempo(s) {
    // Q:120  or  Q:1/4=120  or  Q:"Allegro" 120
    const m = s.match(/(\d+)\s*=\s*(\d+)/);
    if (m) return parseInt(m[2]);
    const n = s.match(/(\d+)/);
    if (n) return parseInt(n[1]);
    return 120;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   MIDI BUILDER — standard MIDI file format binary encoder
═══════════════════════════════════════════════════════════════════ */
class MIDIBuilder {
  constructor(voices, options) {
    this.voices  = voices;   // { voiceId: { events, tempo, meterNum, meterDen, instrument, channel, ... } }
    this.opts    = options || {};
    this.TPQN    = 480;      // ticks per quarter note (resolution)
  }

  build() {
    const vids = Object.keys(this.voices);
    if (vids.length === 0) throw new Error('No voices to encode');

    // Assign channels: avoid channel 9 (percussion)
    const usedChannels = new Set();
    vids.forEach((vid, idx) => {
      const vs = this.voices[vid];
      if (vs.channel !== null && vs.channel !== undefined) {
        usedChannels.add(vs.channel);
      }
    });
    let autoChannel = 0;
    vids.forEach(vid => {
      const vs = this.voices[vid];
      if (vs.channel === null || vs.channel === undefined) {
        while (usedChannels.has(autoChannel) || autoChannel === 9) autoChannel++;
        vs.channel = autoChannel;
        usedChannels.add(autoChannel);
        autoChannel++;
      }
    });

    // Determine format
    const format = vids.length === 1 || this.opts.format === 0 ? 0 : 1;
    const nTracks = format === 0 ? 1 : vids.length + 1;

    const tracks = [];

    if (format === 1) {
      // Tempo/time-sig track (track 0)
      const firstVs = this.voices[vids[0]];
      tracks.push(this.buildTempoTrack(firstVs));
      vids.forEach(vid => tracks.push(this.buildNoteTrack(this.voices[vid], format)));
    } else {
      // Single track: merge all voices
      tracks.push(this.buildMergedTrack(vids));
    }

    return this.assembleMIDI(format, tracks);
  }

  buildTempoTrack(vs) {
    const events = [];
    const bpm    = vs.tempo || 120;
    const uspqn  = Math.round(60000000 / bpm);
    // Time signature
    events.push({ tick:0, data: [0xFF, 0x58, 0x04, vs.meterNum||4, this.log2(vs.meterDen||4), 24, 8] });
    // Tempo
    events.push({ tick:0, data: [0xFF, 0x51, 0x03, (uspqn>>16)&0xFF, (uspqn>>8)&0xFF, uspqn&0xFF] });
    // End of track
    events.push({ tick:0, data: [0xFF, 0x2F, 0x00] });
    return this.eventsToTrackBytes(events);
  }

  buildNoteTrack(vs, format) {
    const events = this.voiceToTickEvents(vs);
    return this.eventsToTrackBytes(events);
  }

  buildMergedTrack(vids) {
    const allEvents = [];
    const firstVs   = this.voices[vids[0]];
    const bpm        = firstVs.tempo || 120;
    const uspqn      = Math.round(60000000 / bpm);
    allEvents.push({ tick:0, data:[0xFF,0x58,0x04,firstVs.meterNum||4,this.log2(firstVs.meterDen||4),24,8] });
    allEvents.push({ tick:0, data:[0xFF,0x51,0x03,(uspqn>>16)&0xFF,(uspqn>>8)&0xFF,uspqn&0xFF] });

    vids.forEach(vid => {
      const tickEvents = this.voiceToTickEvents(this.voices[vid]);
      allEvents.push(...tickEvents.filter(e => e.data[0] !== 0xFF)); // skip end-of-track per voice
    });
    allEvents.push({ tick: Math.max(0, ...allEvents.map(e => e.tick)), data:[0xFF,0x2F,0x00] });
    return this.eventsToTrackBytes(allEvents);
  }

  voiceToTickEvents(vs) {
    const events  = [];
    const ch      = (vs.channel || 0) & 0x0F;
    const prog    = (vs.instrument || 0) & 0x7F;
    const vel0    = Math.min(127, Math.max(1, Math.round((vs.velocity || 80) * (vs.velocityScale || 1))));
    const pan     = Math.min(127, Math.max(0, vs.pan || 64));

    // Emit setup events at tick 0
    events.push({ tick:0, data:[0xB0|ch, 0x07, 100] });        // CC7 volume
    events.push({ tick:0, data:[0xB0|ch, 0x0A, pan] });        // CC10 pan
    events.push({ tick:0, data:[0xC0|ch, prog] });              // Program change

    let tick = 0;
    for (const ev of (vs.events || [])) {
      if (ev.type === 'rest') {
        tick += this.durToTicks(ev.duration);
        continue;
      }
      if (ev.type === 'note') {
        const dur   = this.durToTicks(ev.duration);
        const pitch = Math.max(0, Math.min(127, ev.pitch));
        const vel   = Math.min(127, Math.max(1, ev.velocity || vel0));
        events.push({ tick,       data:[0x90|ch, pitch, vel] });
        events.push({ tick:tick+dur-1, data:[0x80|ch, pitch, 0] });
        tick += dur;
      } else if (ev.type === 'chord') {
        const dur = this.durToTicks(ev.duration);
        const vel = Math.min(127, Math.max(1, ev.velocity || vel0));
        ev.notes.forEach(pitch => {
          pitch = Math.max(0, Math.min(127, pitch));
          events.push({ tick,         data:[0x90|ch, pitch, vel] });
          events.push({ tick:tick+dur-1, data:[0x80|ch, pitch, 0]  });
        });
        tick += dur;
      }
    }

    events.push({ tick, data:[0xFF, 0x2F, 0x00] }); // End of track
    return events;
  }

  eventsToTrackBytes(events) {
    // Sort: by tick, then NoteOff (0x80) before NoteOn (0x90) at same tick, then meta last
    events.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      const typeA = (a.data[0] & 0xF0);
      const typeB = (b.data[0] & 0xF0);
      // NoteOff before NoteOn at same tick (cleaner voice leading)
      if (typeA === 0x80 && typeB === 0x90) return -1;
      if (typeA === 0x90 && typeB === 0x80) return  1;
      // Meta events (0xFF) last
      if (a.data[0] === 0xFF && b.data[0] !== 0xFF) return  1;
      if (a.data[0] !== 0xFF && b.data[0] === 0xFF) return -1;
      return 0;
    });
    const bytes = [];
    let currentTick = 0;
    for (const ev of events) {
      const delta = Math.max(0, ev.tick - currentTick);
      currentTick = ev.tick;   // advance even when delta === 0
      bytes.push(...this.vlq(delta));
      bytes.push(...ev.data);
    }
    return bytes;
  }

  assembleMIDI(format, tracks) {
    const bytes = [];
    // MThd chunk
    bytes.push(...[0x4D,0x54,0x68,0x64]);        // 'MThd'
    bytes.push(...[0x00,0x00,0x00,0x06]);          // chunk length = 6
    bytes.push(0x00, format);                       // format 0 or 1
    bytes.push(...this.uint16(tracks.length));      // number of tracks
    bytes.push(...this.uint16(this.TPQN));          // ticks per quarter note

    // MTrk chunks
    for (const trk of tracks) {
      bytes.push(...[0x4D,0x54,0x72,0x6B]);       // 'MTrk'
      bytes.push(...this.uint32(trk.length));       // chunk length
      bytes.push(...trk);
    }

    return new Uint8Array(bytes);
  }

  durToTicks(dur) {
    // dur is in whole notes (1.0 = whole note, 0.25 = quarter note)
    return Math.max(1, Math.round(dur * this.TPQN * 4));
  }

  vlq(value) {
    if (value < 0) value = 0;
    const bytes = [value & 0x7F];
    value >>= 7;
    while (value > 0) { bytes.unshift(0x80 | (value & 0x7F)); value >>= 7; }
    return bytes;
  }

  uint16(v) { return [(v>>8)&0xFF, v&0xFF]; }
  uint32(v) { return [(v>>24)&0xFF,(v>>16)&0xFF,(v>>8)&0xFF,v&0xFF]; }
  log2(v)   { return Math.round(Math.log2(v)); }
}

/* ═══════════════════════════════════════════════════════════════════
   EXAMPLE LIBRARY
═══════════════════════════════════════════════════════════════════ */
const EXAMPLES = {
  'Simple Melody': `X:1
T:Simple Melody
M:4/4
L:1/8
Q:120
K:C
|: CDEF GAAG | FEDC DEED | CDEF GAAG | FEDC C4 :|`,

  'Twinkle Twinkle': `X:1
T:Twinkle Twinkle Little Star
M:4/4
L:1/4
Q:110
K:C
C C G G | A A G2 | F F E E | D D C2 |
G G F F | E E D2 | G G F F | E E D2 |
C C G G | A A G2 | F F E E | D D C2 |`,

  'Two-Voice Canon': `X:1
T:Two-Voice Canon
M:4/4
L:1/8
Q:120
K:G

V:1 name="Melody" program=40
|: DGFG ABcA | BGBd gdBG | FGAB cBAF | GFED C4 :|

V:2 name="Bass" program=32
|: G,2D,2 G,2B,2 | G,2D,2 G,4 | F,2C,2 F,2A,2 | G,4 C,4 :|`,

  'Three-Voice (Strings)': `X:1
T:String Trio
M:3/4
L:1/8
Q:84
K:D

V:1 name="Violin I" program=40
|: F2A2d2 | cBAGFE | D6 | A4A2 | d2f2a2 | gfedcB | A6 :|

V:2 name="Violin II" program=40
|: D2F2A2 | AGFEDC | D6 | F4F2 | F2A2d2 | edcBAG | F6 :|

V:3 name="Cello" program=42
|: D,4D,2 | A,,4A,,2 | D,6 | D,4D,2 | D,4D,2 | A,,4A,,2 | D,6 :|`,

  'Jazz Chord Voicing': `X:1
T:Jazz Comping
M:4/4
L:1/8
Q:160
K:C

V:1 name="Piano" program=0
[CEGc]4 [FAce]4 | [GBdf]4 [CEGc]4 |
[_EG_Bc]4 [FAce]4 | [CEGc]8 |
[_EG_Bc]4 [DFAd]4 | [GBdf]4 [CEGc]4 |
[FAce]4 [GBdf]4 | [CEGc]8 |

V:2 name="Bass" program=33
C,4 F,4 | G,4 C,4 | _E,4 F,4 | C,8 |
_E,4 D,4 | G,4 C,4 | F,4 G,4 | C,8 |`,

  'Waltz (Multi-Channel)': `X:1
T:Country Waltz
M:3/4
L:1/8
Q:138
K:G

V:1 name="Flute" program=73
|: D2 | G3 AGA | B6 | d3 Bcd | g6 |
   f3 def | e6 | d3 BAG | A6 |
   G3 AGA | B6 | d3 Bcd | g6 |
   gfe dcB | AGA BAG | G6 :|

V:2 name="Accordion" program=21
|: D,2 | G,3 B,D G | G,6 | G,3 B,D G | G,6 |
   F,3 A,C F | F,6 | G,3 B,D G | A,6 |
   G,3 B,D G | G,6 | G,3 B,D G | G,6 |
   D3 D3 | G,3 G,3 | G,6 :|

V:3 name="Bass Guitar" program=33
|: D,2 | G,,4G,,2 | G,,6 | G,,4G,,2 | G,,6 |
   F,,4F,,2 | F,,6 | G,,4G,,2 | A,,6 |
   G,,4G,,2 | G,,6 | G,,4G,,2 | G,,6 |
   D,,4D,,2 | G,,4G,,2 | G,,6 :|`,

  'Bach-Style (Complex)': `X:1
T:Invention in C (after Bach)
M:4/4
L:1/16
Q:96
K:C

V:1 name="Right Hand" program=0
|: cdef edcB | AGFE DCBA, | G,4 G,ABC | DEFG ABCD |
   EFGA Bcde | fgfe dcBA | GABC DEFG | c8 :|

V:2 name="Left Hand" program=0
|: C,4 CDEF | EFED CBAG, | C,8 | G,,4 G,,ABC |
   CDEF GABC | dede dcBA | G,4 G,ABc | C8 :|`
};

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM ELEMENT
═══════════════════════════════════════════════════════════════════ */
class AbcToMidi extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode:'open' });

    this.settings = {
      primaryBg:     '#ffffff',
      secondaryBg:   '#f8f9fa',
      borderColor:   '#dddddd',
      secondaryText: '#666666',
      mainAccent:    '#3498db',
      hoverAccent:   '#2980b9',
      headingColor:  '#2c3e50',
      paragraphColor:'#333333',
      fontFamily:    'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      fontSize:      14,
      headingSize:   24,
      borderRadius:  8,
      buttonPadding: 8
    };

    this.uiState = {
      format:        1,     // 0=SMF0, 1=SMF1
      tempoOverride: 0,     // 0 = use ABC Q: field
      velocityScale: 100,
      voiceSettings: {},    // vid → { instrument, octaveShift, velocity, pan }
      lastParsed:    null,
      lastError:     null
    };
  }

  static get observedAttributes() {
    return ['primary-bg','secondary-bg','border-color','secondary-text',
            'main-accent','hover-accent','heading-color','paragraph-color',
            'font-family','font-size','heading-size','border-radius','button-padding'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue && newValue !== oldValue) {
      const map = {
        'primary-bg':'primaryBg','secondary-bg':'secondaryBg','border-color':'borderColor',
        'secondary-text':'secondaryText','main-accent':'mainAccent','hover-accent':'hoverAccent',
        'heading-color':'headingColor','paragraph-color':'paragraphColor','font-family':'fontFamily',
        'font-size':'fontSize','heading-size':'headingSize','border-radius':'borderRadius',
        'button-padding':'buttonPadding'
      };
      const key = map[name];
      if (key) { this.settings[key] = newValue; this.updateStyles(); }
    }
  }

  connectedCallback()    { this.render(); this.initEvents(); }
  disconnectedCallback() { /* cleanup */ }

  /* ── Styles ── */
  getStyles() {
    const s = this.settings;
    return `
      :host {
        --primary-bg:     ${s.primaryBg};
        --secondary-bg:   ${s.secondaryBg};
        --border-color:   ${s.borderColor};
        --secondary-text: ${s.secondaryText};
        --main-accent:    ${s.mainAccent};
        --hover-accent:   ${s.hoverAccent};
        --heading-color:  ${s.headingColor};
        --paragraph-color:${s.paragraphColor};
        --font-family:    ${s.fontFamily};
        --font-size:      ${s.fontSize}px;
        --heading-size:   ${s.headingSize}px;
        --border-radius:  ${s.borderRadius}px;
        --button-padding: ${s.buttonPadding}px;
        display:block; width:100%; font-family:var(--font-family); color:var(--paragraph-color);
      }
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

      .container {
        display:flex; flex-direction:column; width:100%; min-height:700px;
        background:var(--primary-bg); border:1px solid var(--border-color);
        border-radius:var(--border-radius); box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;
      }

      /* Toolbar */
      .toolbar {
        display:flex; align-items:center; gap:5px; flex-wrap:wrap;
        padding:10px 14px; background:var(--primary-bg);
        border-bottom:1px solid var(--border-color); flex-shrink:0;
      }
      .toolbar-title {
        font-size:var(--heading-size); font-weight:700; color:var(--heading-color);
        font-family:var(--font-family); margin-right:6px; white-space:nowrap;
      }
      .tb-sep    { width:1px; height:22px; background:var(--border-color); margin:0 2px; }
      .tb-spacer { flex:1; }
      .tb-btn {
        display:inline-flex; align-items:center; gap:5px;
        padding:var(--button-padding) 12px;
        border:1px solid var(--border-color); border-radius:var(--border-radius);
        background:var(--primary-bg); color:var(--paragraph-color);
        font-family:var(--font-family); font-size:var(--font-size); font-weight:500;
        cursor:pointer; transition:all 0.2s; white-space:nowrap;
      }
      .tb-btn:hover  { background:var(--secondary-bg); border-color:var(--secondary-text); }
      .tb-btn.active { background:var(--main-accent); border-color:var(--main-accent); color:var(--primary-bg); }
      .tb-btn.primary{ background:var(--main-accent); border-color:var(--main-accent); color:var(--primary-bg); }
      .tb-btn.primary:hover { background:var(--hover-accent); border-color:var(--hover-accent); }
      .tb-btn:disabled { opacity:0.4; cursor:not-allowed; }
      .tb-btn svg { width:14px; height:14px; flex-shrink:0; }

      /* Example dropdown */
      .example-select {
        padding:var(--button-padding) 10px; border:1px solid var(--border-color);
        border-radius:var(--border-radius); background:var(--secondary-bg);
        color:var(--paragraph-color); font-family:var(--font-family);
        font-size:var(--font-size); cursor:pointer; outline:none;
      }

      /* Body */
      .editor-body { display:flex; flex:1; overflow:hidden; min-height:0; }

      /* Left: editor + log */
      .left-pane {
        flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0;
      }

      /* ABC editor wrapper */
      .editor-wrap {
        flex:1; position:relative; display:flex; overflow:hidden; min-height:300px;
        border-bottom:1px solid var(--border-color);
      }
      .line-nums {
        width:44px; flex-shrink:0; overflow:hidden; text-align:right;
        padding:10px 8px 10px 0;
        background:var(--secondary-bg); border-right:1px solid var(--border-color);
        font-family:'Courier New',monospace; font-size:calc(var(--font-size) - 1px);
        color:var(--secondary-text); line-height:1.6; user-select:none;
        white-space:pre;
      }
      .abc-editor {
        flex:1; resize:none; border:none; outline:none;
        padding:10px; background:var(--primary-bg); color:var(--paragraph-color);
        font-family:'Courier New',monospace; font-size:calc(var(--font-size) - 1px);
        line-height:1.6; overflow-y:auto; tab-size:2; white-space:pre; overflow-wrap:normal;
        overflow-x:auto;
      }
      .abc-editor:focus { background:var(--primary-bg); }
      .editor-footer {
        display:flex; align-items:center; gap:10px; padding:4px 10px;
        background:var(--secondary-bg); border-top:1px solid var(--border-color);
        font-family:var(--font-family); font-size:calc(var(--font-size)-2px);
        color:var(--secondary-text); flex-shrink:0;
      }
      .cursor-pos { font-weight:600; color:var(--paragraph-color); }
      .char-count { margin-left:auto; }

      /* Log panel */
      .log-panel {
        height:130px; flex-shrink:0; overflow-y:auto;
        background:var(--secondary-bg); border-top:1px solid var(--border-color);
        padding:8px 10px; font-family:'Courier New',monospace;
        font-size:calc(var(--font-size)-2px); line-height:1.7;
        scrollbar-width:thin; scrollbar-color:var(--border-color) transparent;
      }
      .log-panel::-webkit-scrollbar { width:4px; }
      .log-panel::-webkit-scrollbar-thumb { background:var(--border-color); border-radius:2px; }
      .log-ok   { color:#27ae60; }
      .log-warn { color:#e67e22; }
      .log-err  { color:#e74c3c; }
      .log-info { color:var(--secondary-text); }

      /* Right panel */
      .right-panel {
        width:268px; background:var(--primary-bg);
        border-left:1px solid var(--border-color);
        display:flex; flex-direction:column; overflow:hidden; flex-shrink:0;
      }
      .panel-tabs { display:flex; border-bottom:1px solid var(--border-color); flex-shrink:0; }
      .p-tab {
        flex:1; padding:10px 4px; text-align:center; cursor:pointer;
        font-family:var(--font-family); font-size:calc(var(--font-size)-2px); font-weight:600;
        letter-spacing:.05em; text-transform:uppercase; color:var(--secondary-text);
        border-bottom:2px solid transparent; transition:all 0.2s;
      }
      .p-tab:hover  { color:var(--paragraph-color); }
      .p-tab.active { color:var(--main-accent); border-bottom-color:var(--main-accent); }
      .panel-scroll {
        flex:1; overflow-y:auto; padding:14px 12px;
        scrollbar-width:thin; scrollbar-color:var(--border-color) transparent;
      }
      .panel-scroll::-webkit-scrollbar { width:4px; }
      .panel-scroll::-webkit-scrollbar-thumb { background:var(--border-color); border-radius:2px; }
      .tab-content { display:none; } .tab-content.active { display:block; }
      .p-section { margin-bottom:18px; }
      .p-section-title {
        font-family:var(--font-family); font-size:calc(var(--font-size)-2px); font-weight:700;
        letter-spacing:.1em; text-transform:uppercase; color:var(--secondary-text);
        margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid var(--border-color);
      }
      .p-sep { height:1px; background:var(--border-color); margin:14px 0; }

      /* Form elements */
      .sl-row { margin-bottom:9px; }
      .sl-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
      .sl-label { font-family:var(--font-family); font-size:var(--font-size); color:var(--paragraph-color); font-weight:500; }
      .sl-val { font-family:var(--font-family); font-size:calc(var(--font-size)-1px); color:var(--main-accent); font-weight:600; min-width:42px; text-align:right; }
      input[type=range] {
        -webkit-appearance:none; width:100%; height:5px;
        background:var(--border-color); border-radius:5px; outline:none; cursor:pointer;
      }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%; background:var(--main-accent); cursor:pointer; transition:background 0.2s; }
      input[type=range]::-webkit-slider-thumb:hover { background:var(--hover-accent); }
      input[type=range]::-moz-range-thumb { width:16px; height:16px; border-radius:50%; background:var(--main-accent); border:none; cursor:pointer; }
      select, input[type=number] {
        width:100%; background:var(--secondary-bg); border:1px solid var(--border-color);
        border-radius:var(--border-radius); color:var(--paragraph-color);
        font-family:var(--font-family); font-size:var(--font-size);
        padding:5px 8px; outline:none; cursor:pointer;
      }
      input[type=number]:focus, select:focus { border-color:var(--main-accent); }
      .fg { margin-bottom:9px; }
      .fg label { display:block; font-family:var(--font-family); font-size:calc(var(--font-size)-1px); font-weight:600; color:var(--secondary-text); margin-bottom:4px; }

      /* Format buttons */
      .fmt-row { display:flex; gap:6px; margin-bottom:10px; }
      .fmt-btn {
        flex:1; padding:var(--button-padding) 4px; border:1px solid var(--border-color);
        border-radius:var(--border-radius); background:var(--secondary-bg); color:var(--secondary-text);
        font-family:var(--font-family); font-size:calc(var(--font-size)-1px); font-weight:600;
        text-align:center; cursor:pointer; transition:all 0.2s;
      }
      .fmt-btn:hover { border-color:var(--secondary-text); color:var(--paragraph-color); }
      .fmt-btn.active { border-color:var(--main-accent); background:var(--main-accent); color:var(--primary-bg); }

      /* Voice table */
      .voice-table { width:100%; border-collapse:collapse; font-family:var(--font-family); font-size:calc(var(--font-size)-2px); }
      .voice-table th {
        text-align:left; padding:5px 6px; border-bottom:1px solid var(--border-color);
        color:var(--secondary-text); font-weight:700; letter-spacing:.05em; text-transform:uppercase; font-size:11px;
      }
      .voice-table td { padding:5px 6px; border-bottom:1px solid var(--border-color); vertical-align:middle; color:var(--paragraph-color); }
      .voice-table tr:last-child td { border-bottom:none; }
      .voice-table tr:hover td { background:var(--secondary-bg); }
      .ch-pill {
        display:inline-block; min-width:22px; padding:2px 6px; border-radius:10px; text-align:center;
        background:var(--main-accent); color:var(--primary-bg); font-weight:700; font-size:11px;
      }

      /* Per-voice settings */
      .voice-settings-panel { display:none; }
      .voice-settings-panel.open { display:block; }
      .vs-row { display:flex; align-items:center; gap:6px; margin-bottom:7px; }
      .vs-lbl { font-family:var(--font-family); font-size:calc(var(--font-size)-1px); color:var(--secondary-text); font-weight:600; width:80px; flex-shrink:0; }
      .vs-control { flex:1; }
      .vs-select {
        width:100%; background:var(--secondary-bg); border:1px solid var(--border-color);
        border-radius:var(--border-radius); color:var(--paragraph-color);
        font-family:var(--font-family); font-size:calc(var(--font-size)-2px);
        padding:4px 6px; outline:none; cursor:pointer;
      }
      .vs-num {
        width:100%; background:var(--secondary-bg); border:1px solid var(--border-color);
        border-radius:var(--border-radius); color:var(--paragraph-color);
        font-family:var(--font-family); font-size:calc(var(--font-size)-2px);
        padding:4px 6px; outline:none; text-align:center;
      }

      /* Summary stats */
      .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
      .stat-card {
        background:var(--secondary-bg); border:1px solid var(--border-color);
        border-radius:var(--border-radius); padding:8px 10px; text-align:center;
      }
      .stat-val { font-size:calc(var(--heading-size)*0.7); font-weight:800; color:var(--main-accent); font-family:var(--font-family); line-height:1; }
      .stat-lbl { font-size:calc(var(--font-size)-2px); color:var(--secondary-text); margin-top:3px; font-family:var(--font-family); }

      /* Info card */
      .info-card {
        background:var(--secondary-bg); border:1px solid var(--border-color);
        border-radius:var(--border-radius); padding:10px 12px;
        font-family:var(--font-family); font-size:calc(var(--font-size)-1px);
        line-height:1.9; color:var(--paragraph-color);
      }
      .info-row { display:flex; justify-content:space-between; gap:6px; }
      .info-key { color:var(--secondary-text); font-weight:500; }
      .info-val { font-weight:600; color:var(--paragraph-color); text-align:right; }

      /* Convert button */
      .convert-btn {
        width:100%; padding:calc(var(--button-padding) + 2px); background:var(--main-accent); color:var(--primary-bg);
        border:none; border-radius:var(--border-radius); font-family:var(--font-family);
        font-size:var(--font-size); font-weight:700;
        display:flex; align-items:center; justify-content:center; gap:8px;
        cursor:pointer; transition:all 0.2s; margin-top:10px; letter-spacing:.03em;
      }
      .convert-btn:hover { background:var(--hover-accent); transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.15); }
      .convert-btn:active { transform:none; box-shadow:none; }
      .convert-btn svg { width:16px; height:16px; }

      /* Hint */
      .hint { font-family:var(--font-family); font-size:calc(var(--font-size)-2px); color:var(--secondary-text); line-height:1.6; margin-top:6px; }

      /* Toast */
      .toast {
        position:fixed; bottom:20px; left:50%; transform:translateX(-50%) translateY(10px);
        background:var(--heading-color); color:var(--primary-bg);
        font-family:var(--font-family); font-size:var(--font-size); font-weight:600;
        padding:9px 18px; border-radius:var(--border-radius);
        opacity:0; pointer-events:none; transition:all 0.25s; z-index:9999;
        box-shadow:0 4px 16px rgba(0,0,0,0.2);
      }
      .toast.show { opacity:1; transform:translateX(-50%) translateY(0); }
    `;
  }

  updateStyles() {
    const el = this.shadowRoot.getElementById('dynamic-styles');
    if (el) el.textContent = this.getStyles();
  }

  /* ── Render ── */
  render() {
    const gmOpts = GM_INSTRUMENTS.map((n,i) =>
      `<option value="${i}">${i}: ${n}</option>`).join('');

    this.shadowRoot.innerHTML = `
<style id="dynamic-styles">${this.getStyles()}</style>
<div class="toast" id="toast"></div>

<div class="container">

  <!-- Toolbar -->
  <div class="toolbar">
    <span class="toolbar-title">ABC → MIDI</span>
    <div class="tb-sep"></div>
    <select class="example-select" id="exampleSel">
      <option value="">── Examples ──</option>
      ${Object.keys(EXAMPLES).map(k=>`<option value="${k}">${k}</option>`).join('')}
    </select>
    <div class="tb-sep"></div>
    <button class="tb-btn" id="clearBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Clear
    </button>
    <button class="tb-btn" id="copyBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy
    </button>
    <div class="tb-spacer"></div>
    <button class="tb-btn primary" id="convertBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Convert &amp; Download MIDI
    </button>
  </div>

  <!-- Body -->
  <div class="editor-body">

    <!-- Left pane: editor + log -->
    <div class="left-pane">
      <div class="editor-wrap">
        <div class="line-nums" id="lineNums">1</div>
        <textarea class="abc-editor" id="abcEditor" spellcheck="false" placeholder="Paste or type ABC notation here…

X:1
T:My Tune
M:4/4
L:1/8
Q:120
K:C
| CDEF GAAG | FEDC C4 |"></textarea>
      </div>
      <div class="editor-footer">
        <span class="cursor-pos" id="cursorPos">Ln 1, Col 1</span>
        <span class="char-count" id="charCount">0 chars</span>
      </div>
      <div class="log-panel" id="logPanel">
        <div class="log-info">Ready. Paste ABC notation and press Convert.</div>
      </div>
    </div>

    <!-- Right panel -->
    <div class="right-panel">
      <div class="panel-tabs">
        <div class="p-tab active" data-pt="output">Output</div>
        <div class="p-tab" data-pt="voices">Voices</div>
        <div class="p-tab" data-pt="settings">Settings</div>
      </div>
      <div class="panel-scroll">

        <!-- OUTPUT tab -->
        <div class="tab-content active" data-pc="output">
          <div class="p-section">
            <div class="p-section-title">Parsed Summary</div>
            <div class="stat-grid" id="statGrid">
              <div class="stat-card"><div class="stat-val" id="statVoices">—</div><div class="stat-lbl">Voices</div></div>
              <div class="stat-card"><div class="stat-val" id="statNotes">—</div><div class="stat-lbl">Notes</div></div>
              <div class="stat-card"><div class="stat-val" id="statTempo">—</div><div class="stat-lbl">BPM</div></div>
              <div class="stat-card"><div class="stat-val" id="statMeter">—</div><div class="stat-lbl">Meter</div></div>
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">Song Info</div>
            <div class="info-card" id="songInfo">
              <div class="log-info" style="font-family:var(--font-family);font-size:var(--font-size);color:var(--secondary-text);">Convert to see details.</div>
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">MIDI Format</div>
            <div class="fmt-row">
              <button class="fmt-btn" data-fmt="0">SMF 0<br><small>Single Track</small></button>
              <button class="fmt-btn active" data-fmt="1">SMF 1<br><small>Multi Track</small></button>
            </div>
            <p class="hint">SMF 1 preserves separate tracks per voice. SMF 0 merges all into one track.</p>
          </div>
          <button class="convert-btn" id="convertBtn2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Convert &amp; Download MIDI
          </button>
        </div>

        <!-- VOICES tab -->
        <div class="tab-content" data-pc="voices">
          <div class="p-section">
            <div class="p-section-title">Channel Map</div>
            <div id="voiceTableWrap">
              <p class="hint">Convert to see voice/channel map.</p>
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section" id="voiceSettingsWrap">
            <div class="p-section-title">Per-Voice Settings</div>
            <p class="hint" id="vsHint">Select a voice above to configure.</p>
            <div id="vsPanel" class="voice-settings-panel">
              <div class="vs-row"><span class="vs-lbl">Instrument</span>
                <div class="vs-control"><select class="vs-select" id="vsInstr">${gmOpts}</select></div>
              </div>
              <div class="vs-row"><span class="vs-lbl">Octave</span>
                <div class="vs-control"><input type="number" class="vs-num" id="vsOct" value="0" min="-4" max="4"></div>
              </div>
              <div class="vs-row"><span class="vs-lbl">Velocity</span>
                <div class="vs-control"><input type="number" class="vs-num" id="vsVel" value="80" min="1" max="127"></div>
              </div>
              <div class="vs-row"><span class="vs-lbl">Pan</span>
                <div class="vs-control"><input type="number" class="vs-num" id="vsPan" value="64" min="0" max="127"></div>
              </div>
              <button class="tb-btn" id="vsApplyBtn" style="width:100%;justify-content:center;margin-top:6px;">Apply to Voice</button>
            </div>
          </div>
        </div>

        <!-- SETTINGS tab -->
        <div class="tab-content" data-pc="settings">
          <div class="p-section">
            <div class="p-section-title">Global</div>
            <div class="sl-row">
              <div class="sl-header"><span class="sl-label">Tempo Override</span><span class="sl-val" id="tempoVal">Off</span></div>
              <input type="range" id="tempoSlider" min="0" max="300" step="1" value="0">
            </div>
            <p class="hint" style="margin-bottom:10px;">0 = use Q: field from ABC. Any other value overrides it.</p>
            <div class="sl-row">
              <div class="sl-header"><span class="sl-label">Velocity Scale</span><span class="sl-val" id="velScaleVal">100%</span></div>
              <input type="range" id="velScaleSlider" min="10" max="200" step="5" value="100">
            </div>
          </div>
          <div class="p-sep"></div>
          <div class="p-section">
            <div class="p-section-title">ABC Reference</div>
            <div class="info-card">
              <div class="info-row"><span class="info-key">X:</span><span class="info-val">Index number</span></div>
              <div class="info-row"><span class="info-key">T:</span><span class="info-val">Title</span></div>
              <div class="info-row"><span class="info-key">M:</span><span class="info-val">Time signature</span></div>
              <div class="info-row"><span class="info-key">L:</span><span class="info-val">Default note length</span></div>
              <div class="info-row"><span class="info-key">Q:</span><span class="info-val">Tempo (BPM)</span></div>
              <div class="info-row"><span class="info-key">K:</span><span class="info-val">Key signature</span></div>
              <div class="info-row"><span class="info-key">V:</span><span class="info-val">Voice / channel</span></div>
              <div class="info-row"><span class="info-key">^ _ =</span><span class="info-val">Sharp / flat / natural</span></div>
              <div class="info-row"><span class="info-key">z / Z</span><span class="info-val">Rest / bar rest</span></div>
              <div class="info-row"><span class="info-key">[CEG]</span><span class="info-val">Chord notation</span></div>
              <div class="info-row"><span class="info-key">(3</span><span class="info-val">Tuplet (triplet)</span></div>
              <div class="info-row"><span class="info-key">|: :|</span><span class="info-val">Repeat section</span></div>
              <div class="info-row"><span class="info-key">[1 [2</span><span class="info-val">First/second ending</span></div>
              <div class="info-row"><span class="info-key">' ,</span><span class="info-val">Octave up / down</span></div>
              <div class="info-row"><span class="info-key">&gt; &lt;</span><span class="info-val">Broken / dotted rhythm</span></div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</div>`;
  }

  /* ── Events ── */
  initEvents() {
    const sr = this.shadowRoot;
    const ed = sr.getElementById('abcEditor');

    // Example selector
    sr.getElementById('exampleSel').addEventListener('change', e => {
      if (!e.target.value) return;
      ed.value = EXAMPLES[e.target.value] || '';
      e.target.value = '';
      this.updateLineNums();
      this.updateCursor();
      this.log('info', `Loaded example: ${Object.keys(EXAMPLES).find(k => EXAMPLES[k] === ed.value) || 'unknown'}`);
    });

    // Clear
    sr.getElementById('clearBtn').addEventListener('click', () => {
      ed.value = ''; this.updateLineNums(); this.updateCursor();
      this.clearStats(); this.log('info','Editor cleared.');
    });

    // Copy
    sr.getElementById('copyBtn').addEventListener('click', () => {
      navigator.clipboard?.writeText(ed.value).then(()=>this.toast('ABC copied!'))
        .catch(()=>{ed.select();document.execCommand('copy');this.toast('Copied!');});
    });

    // Convert buttons
    const doConvert = () => this.convert();
    sr.getElementById('convertBtn').addEventListener('click', doConvert);
    sr.getElementById('convertBtn2').addEventListener('click', doConvert);

    // Editor sync: line numbers + cursor
    ed.addEventListener('input', () => { this.updateLineNums(); this.updateCursor(); });
    ed.addEventListener('scroll', () => { sr.getElementById('lineNums').scrollTop = ed.scrollTop; });
    ed.addEventListener('keydown', e => {
      // Tab → insert 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ed.selectionStart, end = ed.selectionEnd;
        ed.value = ed.value.slice(0,s) + '  ' + ed.value.slice(end);
        ed.selectionStart = ed.selectionEnd = s+2;
        this.updateLineNums();
      }
    });
    ed.addEventListener('click', () => this.updateCursor());
    ed.addEventListener('keyup', () => this.updateCursor());

    // Panel tabs
    sr.querySelectorAll('.p-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        sr.querySelectorAll('.p-tab').forEach(t=>t.classList.remove('active'));
        sr.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
        tab.classList.add('active');
        sr.querySelector(`.tab-content[data-pc="${tab.dataset.pt}"]`)?.classList.add('active');
      });
    });

    // MIDI format buttons
    sr.querySelectorAll('.fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sr.querySelectorAll('.fmt-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.uiState.format = parseInt(btn.dataset.fmt);
      });
    });

    // Tempo slider
    sr.getElementById('tempoSlider').addEventListener('input', e => {
      const v = parseInt(e.target.value);
      this.uiState.tempoOverride = v;
      sr.getElementById('tempoVal').textContent = v === 0 ? 'Off' : v + ' BPM';
    });

    // Velocity scale
    sr.getElementById('velScaleSlider').addEventListener('input', e => {
      const v = parseInt(e.target.value);
      this.uiState.velocityScale = v;
      sr.getElementById('velScaleVal').textContent = v + '%';
    });

    // Voice settings apply
    sr.getElementById('vsApplyBtn').addEventListener('click', () => {
      if (!this.selectedVoiceId) return;
      const vid = this.selectedVoiceId;
      if (!this.uiState.voiceSettings[vid]) this.uiState.voiceSettings[vid] = {};
      this.uiState.voiceSettings[vid].instrument  = parseInt(sr.getElementById('vsInstr').value);
      this.uiState.voiceSettings[vid].octaveShift = parseInt(sr.getElementById('vsOct').value);
      this.uiState.voiceSettings[vid].velocity    = parseInt(sr.getElementById('vsVel').value);
      this.uiState.voiceSettings[vid].pan         = parseInt(sr.getElementById('vsPan').value);
      this.toast(`Settings saved for Voice ${vid}`);
    });

    // Load default example
    ed.value = EXAMPLES['Simple Melody'];
    this.updateLineNums();
    this.updateCursor();
  }

  /* ── Convert ── */
  convert() {
    const sr  = this.shadowRoot;
    const abc = sr.getElementById('abcEditor').value.trim();
    if (!abc) { this.log('err','No ABC notation to convert.'); this.toast('Paste ABC notation first.'); return; }

    this.log('info', '─── Starting conversion ───');

    try {
      // Parse
      const gs = {
        tempoOverride: this.uiState.tempoOverride || 0,
        velocityScale: this.uiState.velocityScale / 100,
        voiceSettings: this.uiState.voiceSettings
      };
      const parser = new ABCParser(abc, gs);
      parser.parse();

      const voices = parser.voices;
      const vids   = Object.keys(voices);

      if (vids.length === 0) {
        this.log('err','No parseable voices found. Check your ABC notation.');
        this.toast('Parse failed. See log.');
        return;
      }

      // Apply UI voice settings
      vids.forEach(vid => {
        const ui = this.uiState.voiceSettings[vid];
        if (!ui) return;
        if (ui.instrument  !== undefined) voices[vid].instrument  = ui.instrument;
        if (ui.octaveShift !== undefined) voices[vid].octaveShift = ui.octaveShift;
        if (ui.velocity    !== undefined) voices[vid].velocity    = ui.velocity;
        if (ui.pan         !== undefined) voices[vid].pan         = ui.pan;
        if (gs.velocityScale)            voices[vid].velocityScale = gs.velocityScale;
      });

      // Log parse results
      let totalNotes = 0;
      vids.forEach(vid => {
        const vs = voices[vid];
        const noteCount = (vs.events||[]).filter(e=>e.type==='note'||e.type==='chord').length;
        totalNotes += noteCount;
        this.log('ok', `Voice "${vid}" (${vs.name||vid}) → Ch ${(vs.channel||0)+1} | ${GM_INSTRUMENTS[vs.instrument||0]} | ${noteCount} events`);
      });

      if (parser.errors.length)   parser.errors.forEach(e   => this.log('err',  e));
      if (parser.warnings.length) parser.warnings.forEach(w => this.log('warn', w));

      // Build MIDI
      const builder = new MIDIBuilder(voices, { format: this.uiState.format });
      const midiBytes = builder.build();
      this.log('ok', `MIDI built: ${midiBytes.length} bytes, Format ${this.uiState.format}, ${vids.length} voice(s)`);

      // Download
      const title = (parser.header.T || 'output').replace(/[^a-z0-9_\-\s]/gi,'').trim().replace(/\s+/g,'_') || 'output';
      const blob  = new Blob([midiBytes], { type:'audio/midi' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href = url; a.download = `${title}.mid`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      this.log('ok', `Downloaded: ${title}.mid`);
      this.toast(`✓ Downloaded ${title}.mid`);

      // Update UI stats
      const firstVs = voices[vids[0]];
      sr.getElementById('statVoices').textContent = vids.length;
      sr.getElementById('statNotes').textContent  = totalNotes;
      sr.getElementById('statTempo').textContent  = gs.tempoOverride || firstVs.tempo || 120;
      sr.getElementById('statMeter').textContent  = `${firstVs.meterNum||4}/${firstVs.meterDen||4}`;
      sr.getElementById('songInfo').innerHTML = `
        <div class="info-row"><span class="info-key">Title</span><span class="info-val">${parser.header.T||'—'}</span></div>
        <div class="info-row"><span class="info-key">Key</span><span class="info-val">${parser.header.K||'C'}</span></div>
        <div class="info-row"><span class="info-key">Meter</span><span class="info-val">${firstVs.meterNum||4}/${firstVs.meterDen||4}</span></div>
        <div class="info-row"><span class="info-key">Default L</span><span class="info-val">${firstVs.defaultLen ? '1/'+Math.round(1/firstVs.defaultLen) : '—'}</span></div>
        <div class="info-row"><span class="info-key">Tempo</span><span class="info-val">${gs.tempoOverride || firstVs.tempo || 120} BPM</span></div>
        <div class="info-row"><span class="info-key">Format</span><span class="info-val">SMF ${this.uiState.format}</span></div>
        <div class="info-row"><span class="info-key">File size</span><span class="info-val">${midiBytes.length} bytes</span></div>
      `;

      // Build voice table
      const rows = vids.map((vid,i) => {
        const vs = voices[vid];
        const noteCount = (vs.events||[]).filter(e=>e.type==='note'||e.type==='chord').length;
        const restCount = (vs.events||[]).filter(e=>e.type==='rest').length;
        return `<tr data-vid="${vid}" style="cursor:pointer;">
          <td><span class="ch-pill">${(vs.channel||0)+1}</span></td>
          <td>${vs.name||vid}</td>
          <td>${GM_INSTRUMENTS[vs.instrument||0].split(' ').slice(0,2).join(' ')}</td>
          <td>${noteCount}</td>
        </tr>`;
      }).join('');
      sr.getElementById('voiceTableWrap').innerHTML = `
        <table class="voice-table">
          <thead><tr><th>Ch</th><th>Name</th><th>Instrument</th><th>Events</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="hint" style="margin-top:6px;">Click a row to configure per-voice settings.</p>
      `;

      // Voice row click → populate settings panel
      sr.querySelectorAll('#voiceTableWrap tr[data-vid]').forEach(row => {
        row.addEventListener('click', () => {
          const vid = row.dataset.vid;
          this.selectedVoiceId = vid;
          const vs  = voices[vid];
          const ui  = this.uiState.voiceSettings[vid] || {};
          sr.getElementById('vsInstr').value = ui.instrument  ?? (vs.instrument||0);
          sr.getElementById('vsOct').value   = ui.octaveShift ?? 0;
          sr.getElementById('vsVel').value   = ui.velocity    ?? (vs.velocity||80);
          sr.getElementById('vsPan').value   = ui.pan         ?? (vs.pan||64);
          sr.getElementById('vsPanel').classList.add('open');
          sr.getElementById('vsHint').style.display = 'none';
          sr.querySelectorAll('#voiceTableWrap tr[data-vid]').forEach(r => r.style.background='');
          row.style.background = 'var(--secondary-bg)';
        });
      });

      // Store for reference
      this.uiState.lastParsed = { voices, header: parser.header };

    } catch (err) {
      this.log('err', `ERROR: ${err.message}`);
      console.error(err);
      this.toast('Conversion failed. See log.');
    }
  }

  /* ── Helpers ── */
  updateLineNums() {
    const ed  = this.shadowRoot.getElementById('abcEditor');
    const ln  = this.shadowRoot.getElementById('lineNums');
    const cnt = ed.value.split('\n').length;
    ln.textContent = Array.from({length: cnt}, (_,i) => i+1).join('\n');
    this.shadowRoot.getElementById('charCount').textContent = `${ed.value.length} chars`;
  }

  updateCursor() {
    const ed  = this.shadowRoot.getElementById('abcEditor');
    const txt = ed.value.substring(0, ed.selectionStart);
    const lines = txt.split('\n');
    const ln  = lines.length;
    const col = lines[lines.length-1].length + 1;
    this.shadowRoot.getElementById('cursorPos').textContent = `Ln ${ln}, Col ${col}`;
  }

  log(type, msg) {
    const panel = this.shadowRoot.getElementById('logPanel');
    const div   = document.createElement('div');
    div.className = `log-${type}`;
    const ts = new Date().toLocaleTimeString('en',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
    div.textContent = `[${ts}] ${msg}`;
    panel.appendChild(div);
    panel.scrollTop = panel.scrollHeight;
    // Keep log manageable
    while (panel.children.length > 80) panel.removeChild(panel.firstChild);
  }

  clearStats() {
    const sr = this.shadowRoot;
    ['statVoices','statNotes','statTempo','statMeter'].forEach(id => { const el=sr.getElementById(id); if(el) el.textContent='—'; });
    const si = sr.getElementById('songInfo');
    if (si) si.innerHTML = '<div style="color:var(--secondary-text);font-family:var(--font-family);font-size:var(--font-size);">Convert to see details.</div>';
  }

  toast(msg) {
    const el = this.shadowRoot.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => el.classList.remove('show'), 2800);
  }
}

customElements.define('abc-to-midi', AbcToMidi);
