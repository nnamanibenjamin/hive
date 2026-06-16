import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: HEAD } = loadMontserrat();
const { fontFamily: BODY } = loadInter();

// ---------------------------------------------------------------------------
// GoFiixit — "On Demand" brand film. 1080x1920, 30s.
// Logo-only, cinematic. Navy + amber, spinning-gear motif, gold light, kinetic
// typography, logo reveal. Audio muxed at render time; `audioSrc` lets Studio
// preview play it.
// ---------------------------------------------------------------------------

export interface GoFiixitBrandAdProps {
  navy: string;
  navyDeep: string;
  amber: string;
  audioSrc?: string;
}

const NAVY = "#0F4C81";
const NAVY_DEEP = "#06243C";
const AMBER = "#F5B301";
const EASE = Easing.bezier(0.22, 1, 0.36, 1); // smooth premium ease-out

// Build a trapezoidal-tooth gear outline path.
function gearPath(teeth: number, rOuter: number, rInner: number, cx: number, cy: number) {
  const step = (Math.PI * 2) / teeth;
  const pt = (a: number, r: number) => `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const b = i * step;
    const p1 = b + step * 0.06;
    const p2 = b + step * 0.16;
    const p3 = b + step * 0.40;
    const p4 = b + step * 0.50;
    d += `${i === 0 ? "M" : "L"} ${pt(p1, rInner)} L ${pt(p2, rOuter)} L ${pt(p3, rOuter)} L ${pt(p4, rInner)} `;
  }
  return d + "Z";
}

const Gear: React.FC<{
  size: number;
  teeth: number;
  color: string;
  opacity: number;
  speed: number; // deg/sec, sign = direction
  filled?: boolean;
  strokeW?: number;
}> = ({ size, teeth, color, opacity, speed, filled = false, strokeW = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rot = (frame / fps) * speed;
  const c = size / 2;
  const rOuter = size * 0.48;
  const rInner = size * 0.40;
  const hole = size * 0.16;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: `rotate(${rot}deg)`, opacity }}
    >
      <path
        d={gearPath(teeth, rOuter, rInner, c, c)}
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={strokeW}
        strokeLinejoin="round"
      />
      <circle cx={c} cy={c} r={hole} fill="none" stroke={color} strokeWidth={strokeW} />
    </svg>
  );
};

// Slow gold dust / bokeh.
function rnd(s: number) {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
const GoldDust: React.FC<{ amber: string; count?: number }> = ({ amber, count = 28 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeOut = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const x = rnd(i * 3 + 1) * 100;
        const baseY = rnd(i * 7 + 2) * 100;
        const sp = 0.3 + rnd(i * 5 + 3) * 0.7;
        const ph = rnd(i * 11 + 4) * Math.PI * 2;
        const sz = 2 + rnd(i * 13 + 5) * 6;
        const t = frame / fps;
        const yy = (baseY - t * sp * 4 + 200) % 110;
        const xx = x + Math.sin(t * 0.6 + ph) * 3;
        const tw = 0.25 + (Math.sin(t * 2 + ph) * 0.5 + 0.5) * 0.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${xx}%`,
              top: `${yy}%`,
              width: sz,
              height: sz,
              borderRadius: "50%",
              background: amber,
              opacity: tw * 0.55 * fadeOut,
              boxShadow: `0 0 ${sz * 2.5}px ${sz}px ${amber}55`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Backdrop: React.FC<{ navy: string; navyDeep: string; amber: string }> = ({
  navy,
  navyDeep,
  amber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const gy = 38 + Math.sin(t * 0.35) * 10;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% ${gy}%, ${navy} 0%, ${navyDeep} 70%)` }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${amber}1f 0%, transparent 38%)` }} />
      {/* vignette */}
      <AbsoluteFill style={{ boxShadow: "inset 0 0 400px rgba(0,0,0,0.7)" }} />
    </AbsoluteFill>
  );
};

// A diagonal sheen that sweeps once across its parent (parent must clip).
const Sheen: React.FC<{ delay: number; dur: number }> = ({ delay, dur }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, dur], [-40, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)`,
        transform: `translateX(${p}%)`,
        pointerEvents: "none",
      }}
    />
  );
};

// Word-by-word reveal with clip + rise.
const KineticLine: React.FC<{
  text: string;
  start: number;
  size: number;
  weight?: number;
  color?: string;
  accentColor?: string;
  accentWords?: number[];
  dur: number;
}> = ({ text, start, size, weight = 800, color = "#fff", accentColor, accentWords = [], dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const out = interpolate(frame - start, [dur - 14, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ textAlign: "center", opacity: out, lineHeight: 1.18 }}>
      {words.map((w, i) => {
        const s = spring({ frame: frame - start - i * 4, fps, config: { damping: 22, stiffness: 110 } });
        return (
          <span
            key={i}
            style={{
              overflow: "hidden",
              display: "inline-block",
              verticalAlign: "top",
              paddingBottom: size * 0.08,
              marginRight: i < words.length - 1 ? size * 0.3 : 0,
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontFamily: HEAD,
                fontWeight: weight,
                fontSize: size,
                lineHeight: 1.1,
                color: accentWords.includes(i) ? accentColor || color : color,
                transform: `translateY(${interpolate(s, [0, 1], [size * 1.1, 0])}px)`,
                opacity: s,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

// A thin gold rule that draws in from center.
const Rule: React.FC<{ start: number; width: number; amber: string }> = ({ start, width, amber }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = interpolate(spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 60 } }), [0, 1], [0, width]);
  return <div style={{ height: 4, width: w, background: amber, borderRadius: 2, margin: "0 auto", boxShadow: `0 0 16px ${amber}aa` }} />;
};

// ---------- Scene 1: atmosphere + promise (0-6s) ----------
const SceneOpen: React.FC<{ amber: string }> = ({ amber }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* large faint background gear */}
      <div style={{ position: "absolute", top: "8%" }}>
        <Gear size={760} teeth={16} color={amber} opacity={interpolate(frame, [0, 40], [0, 0.1], { extrapolateRight: "clamp" })} speed={6} strokeW={5} />
      </div>
      <div style={{ textAlign: "center", padding: "0 80px" }}>
        <KineticLine text="When something breaks," start={14} size={66} dur={150} />
        <div style={{ height: 18 }} />
        <KineticLine text="we make it right." start={50} size={78} weight={900} accentColor={amber} accentWords={[2]} dur={150} />
        <div style={{ marginTop: 34 }}>
          <Rule start={64} width={160} amber={amber} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 2: value + services (6-20s), 4 clean beats of 105f ----------
const ValueBeat: React.FC<{ kicker: string; lines: string[]; amber: string; dur: number }> = ({ kicker, lines, amber, dur }) => {
  const local = useCurrentFrame();
  const inF = interpolate(local, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE });
  const outF = interpolate(local, [dur - 14, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: inF * outF }}>
      <div style={{ textAlign: "center", padding: "0 80px" }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: amber, fontSize: 30, marginBottom: 24, transform: `translateY(${interpolate(inF, [0, 1], [-18, 0])}px)` }}>
          {kicker}
        </div>
        {lines.map((line, li) => (
          <div key={li} style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 72, lineHeight: 1.14, color: "#fff" }}>
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const ServicesBeat: React.FC<{ amber: string }> = ({ amber }) => {
  const local = useCurrentFrame();
  const { fps } = useVideoConfig();
  const services = ["Plumbing", "Electrical", "Air Conditioning", "Appliances", "Cleaning", "Painting"];
  const inF = interpolate(local, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outF = interpolate(local, [92, 105], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: outF }}>
      <div style={{ fontFamily: BODY, fontWeight: 700, letterSpacing: "0.34em", textTransform: "uppercase", color: amber, fontSize: 30, marginBottom: 40, opacity: inF }}>
        Every home service
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "18px 16px", padding: "0 70px", maxWidth: 940 }}>
        {services.map((s, i) => {
          const sp = spring({ frame: local - 8 - i * 7, fps, config: { damping: 20, stiffness: 120 } });
          return (
            <span key={s} style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 38, color: "#fff", border: `1.5px solid ${amber}`, borderRadius: 100, padding: "16px 30px", opacity: sp, transform: `scale(${interpolate(sp, [0, 1], [0.82, 1])})`, boxShadow: `0 0 24px ${amber}22` }}>
              {s}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const SceneValue: React.FC<{ amber: string }> = ({ amber }) => {
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* counter-rotating accent gears */}
      <div style={{ position: "absolute", top: "5%", right: "-14%" }}>
        <Gear size={440} teeth={14} color={amber} opacity={0.13} speed={-8} strokeW={5} />
      </div>
      <div style={{ position: "absolute", bottom: "4%", left: "-14%" }}>
        <Gear size={380} teeth={12} color={amber} opacity={0.1} speed={7} strokeW={5} />
      </div>

      <Sequence from={0} durationInFrames={105}>
        <ValueBeat kicker="Verified" lines={["Background-checked", "professionals you trust"]} amber={amber} dur={105} />
      </Sequence>
      <Sequence from={105} durationInFrames={105}>
        <ValueBeat kicker="Instant" lines={["Book in minutes,", "track in real time"]} amber={amber} dur={105} />
      </Sequence>
      <Sequence from={210} durationInFrames={105}>
        <ValueBeat kicker="Transparent" lines={["Upfront pricing,", "secure payments"]} amber={amber} dur={105} />
      </Sequence>
      <Sequence from={315} durationInFrames={105}>
        <ServicesBeat amber={amber} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------- Scene 3: logo reveal + CTA (20-30s) ----------
const SceneLogo: React.FC<{ amber: string }> = ({ amber }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const blur = interpolate(reveal, [0, 1], [18, 0]);
  const ringR = interpolate(spring({ frame: frame - 6, fps, config: { damping: 20, stiffness: 50 } }), [0, 1], [0, 1]);
  const tagS = spring({ frame: frame - 40, fps, config: { damping: 22 } });
  const ctaS = spring({ frame: frame - 70, fps, config: { damping: 13, stiffness: 120 } });
  const pulse = 1 + Math.sin((frame / fps) * 4) * 0.022;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {/* halo gear behind logo */}
      <div style={{ position: "absolute" }}>
        <Gear size={900} teeth={18} color={amber} opacity={0.08} speed={5} strokeW={4} />
      </div>

      {/* drawing gold ring */}
      <svg width={620} height={620} style={{ position: "absolute" }}>
        <circle
          cx={310}
          cy={310}
          r={290}
          fill="none"
          stroke={amber}
          strokeWidth={3}
          strokeDasharray={2 * Math.PI * 290}
          strokeDashoffset={(1 - ringR) * 2 * Math.PI * 290}
          transform="rotate(-90 310 310)"
          opacity={0.7}
        />
      </svg>

      {/* logo card with sheen */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "rgba(255,255,255,0.98)",
          borderRadius: 40,
          padding: "48px 60px",
          transform: `scale(${interpolate(reveal, [0, 1], [0.78, 1])})`,
          opacity: reveal,
          filter: `blur(${blur}px)`,
          boxShadow: `0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px ${amber}33`,
        }}
      >
        <Img src={staticFile("gofiixit/logo.jpg")} style={{ width: 480, display: "block" }} />
        <Sheen delay={18} dur={26} />
      </div>

      <div style={{ marginTop: 52, textAlign: "center", opacity: tagS, transform: `translateY(${interpolate(tagS, [0, 1], [26, 0])}px)` }}>
        <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 50, color: "#fff", lineHeight: 1.14 }}>
          Trusted Home Services,
          <br />
          <span style={{ color: amber }}>On Demand.</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 50,
          opacity: ctaS,
          transform: `scale(${pulse})`,
          background: amber,
          color: NAVY_DEEP,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 38,
          padding: "24px 58px",
          borderRadius: 100,
          boxShadow: `0 18px 50px ${amber}66`,
        }}
      >
        Download GoFiixit Today
      </div>
    </AbsoluteFill>
  );
};

export const GoFiixitBrandAd: React.FC<GoFiixitBrandAdProps> = ({
  navy = NAVY,
  navyDeep = NAVY_DEEP,
  amber = AMBER,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const endFade = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const introFade = interpolate(frame, [0, 16], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: navyDeep }}>
      <Backdrop navy={navy} navyDeep={navyDeep} amber={amber} />
      <GoldDust amber={amber} />

      <Sequence from={0} durationInFrames={180}>
        <SceneOpen amber={amber} />
      </Sequence>
      <Sequence from={180} durationInFrames={420}>
        <SceneValue amber={amber} />
      </Sequence>
      <Sequence from={600} durationInFrames={300}>
        <SceneLogo amber={amber} />
      </Sequence>

      {audioSrc ? <Audio src={audioSrc} /> : null}

      {/* open from black, close to black */}
      <AbsoluteFill style={{ background: "#000", opacity: introFade, pointerEvents: "none" }} />
      <AbsoluteFill style={{ background: "#000", opacity: endFade, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
