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
import { ParticleOverlay } from "./components/ParticleOverlay";

const { fontFamily: HEAD } = loadMontserrat();
const { fontFamily: BODY } = loadInter();

// ---------------------------------------------------------------------------
// GoFiixit — 30s vertical (1080x1920) social advert
// Premium home-services brand: navy + amber, real app screenshots in a phone
// mockup, kinetic typography. Audio (voiceover + music) is muxed at render time
// via FFmpeg, but an optional `audioSrc` prop lets the Studio preview play it.
// ---------------------------------------------------------------------------

export interface GoFiixitAdProps {
  navy: string;
  navyDeep: string;
  amber: string;
  audioSrc?: string;
}

const NAVY = "#0F4C81";
const NAVY_DEEP = "#082742";
const AMBER = "#F5B301";

// Animated premium gradient backdrop with a slow-drifting amber glow.
const Backdrop: React.FC<{ navy: string; navyDeep: string; amber: string }> = ({
  navy,
  navyDeep,
  amber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const gx = 50 + Math.sin(t * 0.5) * 18;
  const gy = 32 + Math.cos(t * 0.4) * 12;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${navyDeep} 0%, ${navy} 55%, ${navyDeep} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${gx}% ${gy}%, ${amber}26 0%, transparent 45%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${100 - gx}% ${85 - gy}%, ${amber}14 0%, transparent 40%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// A reusable phone mockup that slowly pans its screen (Ken Burns).
const PhoneMock: React.FC<{
  src: string;
  panFrom: number;
  panTo: number;
  progress: number; // 0..1 across this screen's lifetime
  amber: string;
}> = ({ src, panFrom, panTo, progress, amber }) => {
  const pan = interpolate(progress, [0, 1], [panFrom, panTo]);
  return (
    <div
      style={{
        width: 560,
        height: 1180,
        borderRadius: 56,
        background: "#05121f",
        padding: 16,
        boxShadow: `0 40px 120px rgba(0,0,0,0.55), 0 0 0 2px ${amber}55, 0 0 60px ${amber}22`,
        position: "relative",
      }}
    >
      {/* notch */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: 150,
          height: 26,
          borderRadius: 14,
          background: "#05121f",
          zIndex: 3,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 42,
          overflow: "hidden",
          position: "relative",
          background: "#fff",
        }}
      >
        <Img
          src={src}
          style={{
            position: "absolute",
            top: `${pan}%`,
            left: 0,
            width: "100%",
            transform: "translateY(-0%)",
          }}
        />
      </div>
    </div>
  );
};

// Headline / overlay caption with an amber accent rule that wipes in.
const Caption: React.FC<{
  kicker?: string;
  title: string;
  localFrame: number;
  dur: number;
  amber: string;
  position?: "top" | "bottom";
}> = ({ kicker, title, localFrame, dur, amber, position = "top" }) => {
  const { fps } = useVideoConfig();
  const appear = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 110 } });
  const out = interpolate(localFrame, [dur - 12, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ruleW = interpolate(
    spring({ frame: localFrame - 4, fps, config: { damping: 16, stiffness: 70 } }),
    [0, 1],
    [0, 120]
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        [position]: 150,
        textAlign: "center",
        opacity: appear * out,
        transform: `translateY(${interpolate(appear, [0, 1], [position === "top" ? -28 : 28, 0])}px)`,
        padding: "0 60px",
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: BODY,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: amber,
            marginBottom: 14,
          }}
        >
          {kicker}
        </div>
      )}
      <div
        style={{
          fontFamily: HEAD,
          fontSize: 62,
          fontWeight: 800,
          lineHeight: 1.08,
          color: "#fff",
          textShadow: "0 6px 30px rgba(0,0,0,0.5)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: ruleW,
          height: 6,
          background: amber,
          borderRadius: 3,
          margin: "22px auto 0",
        }}
      />
    </div>
  );
};

// ---------- Scene 1: Hook (0-5s) ----------
const SceneHook: React.FC<{ amber: string }> = ({ amber }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const problems = ["Leaking pipes", "Broken AC", "Electrical faults"];
  const titleSpring = spring({ frame: frame - 28, fps, config: { damping: 20, stiffness: 90 } });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{ width: "100%", maxWidth: 920 }}>
        {problems.map((p, i) => {
          const s = spring({ frame: frame - i * 14, fps, config: { damping: 16, stiffness: 120 } });
          const fade = interpolate(frame, [80, 120], [1, 0.25], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginBottom: 26,
                opacity: s * fade,
                transform: `translateX(${interpolate(s, [0, 1], [-60, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: amber,
                  boxShadow: `0 0 24px ${amber}`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: HEAD,
                  fontSize: 50,
                  fontWeight: 700,
                  color: "#cfe0ef",
                }}
              >
                {p}
              </span>
            </div>
          );
        })}
        <div
          style={{
            marginTop: 50,
            opacity: titleSpring,
            transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
          }}
        >
          <div
            style={{
              fontFamily: HEAD,
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#fff",
            }}
          >
            Home problems<br />shouldn’t slow<br />your life.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Scene 2: App experience (5-22s) ----------
type Screen = {
  src: string;
  kicker: string;
  title: string;
  panFrom: number;
  panTo: number;
  pos: "top" | "bottom";
};

const SceneApp: React.FC<{ amber: string }> = ({ amber }) => {
  const frame = useCurrentFrame(); // local to this sequence
  const { fps } = useVideoConfig();
  const seg = 102; // ~3.4s per screen * 5 = 17s
  const screens: Screen[] = [
    { src: "gofiixit/home.jpg", kicker: "One app", title: "Every home service,\nin one place", panFrom: 0, panTo: -22, pos: "bottom" },
    { src: "gofiixit/service.jpg", kicker: "Verified professionals", title: "Background-checked\nexperts you can trust", panFrom: -4, panTo: -20, pos: "bottom" },
    { src: "gofiixit/booking.jpg", kicker: "Fast booking", title: "Book in minutes,\nright from your phone", panFrom: 0, panTo: -24, pos: "bottom" },
    { src: "gofiixit/bookings.jpg", kicker: "Real-time tracking", title: "Track every job\nas it happens", panFrom: 0, panTo: -22, pos: "bottom" },
    { src: "gofiixit/profile.jpg", kicker: "Transparent pricing", title: "Upfront prices,\nsecure payments", panFrom: 0, panTo: -18, pos: "bottom" },
  ];

  // brand bar (logo) persistent at top
  return (
    <AbsoluteFill>
      {/* persistent logo chip */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.96)",
          borderRadius: 20,
          padding: "12px 26px",
          display: "flex",
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <Img src={staticFile("gofiixit/logo.jpg")} style={{ height: 56 }} />
      </div>

      {screens.map((sc, i) => {
        const start = i * seg;
        const local = frame - start;
        if (local < -6 || local > seg + 6) return null;
        const inFade = interpolate(local, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const outFade = interpolate(local, [seg - 14, seg], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(
          spring({ frame: local, fps, config: { damping: 22, stiffness: 80 } }),
          [0, 1],
          [0.92, 1]
        );
        const opacity = inFade * outFade;
        return (
          <AbsoluteFill
            key={sc.src}
            style={{ justifyContent: "center", alignItems: "center", opacity }}
          >
            <div style={{ transform: `scale(${scale})`, marginTop: 40 }}>
              <PhoneMock
                src={staticFile(sc.src)}
                panFrom={sc.panFrom}
                panTo={sc.panTo}
                progress={interpolate(local, [0, seg], [0, 1])}
                amber={amber}
              />
            </div>
            <Caption
              kicker={sc.kicker}
              title={sc.title.split("\n").map((l) => l).join("\n")}
              localFrame={local}
              dur={seg}
              amber={amber}
              position={sc.pos}
            />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- Scene 3: Logo + CTA (22-30s) ----------
const SceneClose: React.FC<{ amber: string; navyDeep: string }> = ({ amber }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoS = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const taglineS = spring({ frame: frame - 22, fps, config: { damping: 20 } });
  const ctaS = spring({ frame: frame - 46, fps, config: { damping: 12, stiffness: 120 } });
  const pulse = 1 + Math.sin((frame / fps) * 4) * 0.025;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
      <ParticleOverlay type="sparkles" count={22} color={amber} intensity={0.5} />
      <div
        style={{
          background: "rgba(255,255,255,0.97)",
          borderRadius: 36,
          padding: "44px 56px",
          transform: `scale(${interpolate(logoS, [0, 1], [0.7, 1])})`,
          opacity: logoS,
          boxShadow: `0 30px 90px rgba(0,0,0,0.5), 0 0 0 2px ${amber}44`,
        }}
      >
        <Img src={staticFile("gofiixit/logo.jpg")} style={{ width: 460 }} />
      </div>

      <div
        style={{
          marginTop: 48,
          textAlign: "center",
          opacity: taglineS,
          transform: `translateY(${interpolate(taglineS, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: HEAD,
            fontSize: 52,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.12,
          }}
        >
          Trusted Home Services,
          <br />
          <span style={{ color: amber }}>On Demand.</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 56,
          opacity: ctaS,
          transform: `scale(${pulse})`,
          background: amber,
          color: NAVY_DEEP,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 40,
          padding: "26px 60px",
          borderRadius: 100,
          boxShadow: `0 18px 50px ${amber}66`,
        }}
      >
        Download GoFiixit Today
      </div>
      <div
        style={{
          marginTop: 28,
          fontFamily: BODY,
          fontSize: 26,
          letterSpacing: "0.06em",
          color: "#9fb8cf",
          opacity: ctaS,
        }}
      >
        Book trusted professionals in minutes
      </div>
    </AbsoluteFill>
  );
};

export const GoFiixitAd: React.FC<GoFiixitAdProps> = ({
  navy = NAVY,
  navyDeep = NAVY_DEEP,
  amber = AMBER,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // global fade to black at the very end
  const endFade = interpolate(frame, [durationInFrames - 12, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: navyDeep }}>
      <Backdrop navy={navy} navyDeep={navyDeep} amber={amber} />
      <ParticleOverlay type="light-rays" count={4} color={amber} intensity={0.4} />

      <Sequence from={0} durationInFrames={150}>
        <SceneHook amber={amber} />
      </Sequence>
      <Sequence from={150} durationInFrames={510}>
        <SceneApp amber={amber} />
      </Sequence>
      <Sequence from={660} durationInFrames={240}>
        <SceneClose amber={amber} navyDeep={navyDeep} />
      </Sequence>

      {audioSrc ? <Audio src={audioSrc} /> : null}

      <AbsoluteFill style={{ background: "#000", opacity: endFade, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
