"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ==================== TYPES ====================
type Screen =
  | "intro"
  | "message1"
  | "message2"
  | "propose"
  | "yes"
  | "confirm_no"
  | "unsure_response"
  | "sure_response";

// ==================== PLACEHOLDER MEDIA ====================
const PHOTOS: { src: string; alt: string }[] = [
  { src: "/photos/photo1.jpg", alt: "ความทรงจำที่ 1" },
  { src: "/photos/photo2.jpg", alt: "ความทรงจำที่ 2" },
  { src: "/photos/photo3.jpg", alt: "ความทรงจำที่ 3" },
];
const VIDEO_SRC = "/videos/memory.mp4";

// ==================== CONFETTI ====================
interface Particle {
  id: number;
  x: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  size: number;
  opacity: number;
}

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const COLORS = ["#f9a8d4", "#fb7185", "#fde68a", "#a78bfa", "#6ee7b7", "#93c5fd", "#fca5a5"];

  const spawnBurst = useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: 120 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * window.innerWidth,
      vx: (Math.random() - 0.5) * 6,
      vy: -(Math.random() * 8 + 4),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      size: Math.random() * 8 + 5,
      opacity: 1,
    }));
    particlesRef.current = [...particlesRef.current, ...newParticles];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    spawnBurst();
    // second burst
    const t2 = setTimeout(spawnBurst, 400);
    const t3 = setTimeout(spawnBurst, 800);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.vy += 0.25; // gravity
        const y = (p as Particle & { _y?: number })._y ?? (canvas.height / 2);
        (p as Particle & { _y?: number })._y = y + p.vy;
        p.rotation += p.rotSpeed;
        if ((p as Particle & { _y?: number })._y! > canvas.height * 0.6) p.opacity -= 0.015;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, (p as Particle & { _y?: number })._y!);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(t2);
      clearTimeout(t3);
      particlesRef.current = [];
    };
  }, [active, spawnBurst]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

// ==================== TYPEWRITER ====================
function Typewriter({ text, speed = 40, className = "" }: { text: string; speed?: number; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse text-pink-400">|</span>}
    </span>
  );
}

// ==================== RUNAWAY BUTTON ====================
function RunawayBtn({ children, onCaught }: { children: React.ReactNode; onCaught?: () => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [escaped, setEscaped] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);

  const flee = useCallback(() => {
    if (!btnRef.current) return;
    const btn = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const parentRect = btn.closest(".runaway-container")?.getBoundingClientRect();
    if (!parentRect) return;

    const maxX = parentRect.width - rect.width;
    const maxY = parentRect.height - rect.height;

    const newX = Math.random() * maxX - rect.left + parentRect.left;
    const newY = Math.random() * maxY - rect.top + parentRect.top;

    setPos({ x: Math.max(-rect.left + parentRect.left, Math.min(maxX - rect.left + parentRect.left, newX)), y: Math.max(-rect.top + parentRect.top, Math.min(maxY - rect.top + parentRect.top, newY)) });
    setEscaped((e) => e + 1);
  }, []);

  return (
    <button
      ref={btnRef}
      onMouseEnter={flee}
      onFocus={flee}
      onClick={onCaught}
      className="btn btn-danger transition-all duration-200"
      style={{
        position: "relative",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.15s ease",
      }}
    >
      {escaped > 3 ? "จับไม่ได้หรอก! 😂" : escaped > 1 ? "หนีแล้ว! 🏃💨" : children}
    </button>
  );
}

// ==================== PAGE TRANSITION ====================
function PageTransition({ screen }: { screen: Screen }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, [screen]);

  return (
    <div
      className={`transition-all duration-500 ease-out w-full flex justify-center ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      }`}
    >
      {/* children inserted by parent */}
    </div>
  );
}

// ==================== PHOTO SLOT ====================
function PhotoSlot({ src, alt, index }: { src: string; alt: string; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden bg-pink-50 border border-pink-100">
      {(!loaded || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-pink-300 text-xs text-center px-1">
          📷
          <span className="text-[9px] opacity-60 mt-1">photo{index + 1}.jpg</span>
        </div>
      )}
      {!error && (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

// ==================== FLOATING HEARTS ====================
function FloatingHearts() {
  const items = ["🌸", "💕", "🩷", "🌸", "💕", "🩷", "🌸", "💕", "🩷", "🌸", "💕", "🩷"];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((emoji, i) => (
        <span
          key={i}
          className="absolute select-none animate-float"
          style={{
            left: `${(i * 8.3) % 100}%`,
            bottom: "-40px",
            animationDelay: `${i * 0.6}s`,
            animationDuration: `${6 + (i % 4)}s`,
            fontSize: `${14 + (i % 3) * 6}px`,
            opacity: 0.35,
          }}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}

// ==================== CARD ====================
function Card({ children, key: _key }: { children: React.ReactNode; key?: string | number }) {
  return (
    <div className="card-glass relative z-10 max-w-lg w-full mx-auto animate-slideIn">
      {children}
    </div>
  );
}

// ==================== BUTTON ====================
function Btn({
  onClick,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
  };
  return (
    <button onClick={onClick} className={`btn ${styles[variant]}`}>
      {children}
    </button>
  );
}

// ==================== SCREENS ====================

function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <div className="text-center space-y-6">
        <div className="text-7xl animate-heartbeat">💌</div>
        <h1 className="text-2xl font-bold text-pink-600">
          <Typewriter text="มีบางอย่างอยากบอก..." speed={60} />
        </h1>
        <p className="text-gray-400 text-sm">กดปุ่มด้านล่างเพื่ออ่านนะ</p>
        <Btn onClick={onNext}>ลองกดปุ่มอ่านดูก่อนสิ 👀</Btn>
      </div>
    </Card>
  );
}

function Message1Screen({ onNext }: { onNext: () => void }) {
  const lines = [
    "คิดถึงมากเลยนะ ไม่ได้คุยกันตั้งนาน ประมาณ 3 ปีแล้ว 😮‍💨",
    "อ้วนเป็นยังไงบ้าง สบายดีมุ้ย อากาศหนาวนะ ห่มผ้าหนาๆ ด้วยนะ 🧣",
    "บ้านป๊าหนาวเป็นบางวัน แต่ส่วนใหญ่ก็ร้อนนิดๆ อยู่ 🌤️",
  ];
  const [lineIdx, setLineIdx] = useState(0);
  const [doneLines, setDoneLines] = useState<string[]>([]);

  const handleLineDone = useCallback(() => {
    if (lineIdx < lines.length - 1) {
      setTimeout(() => {
        setDoneLines((d) => [...d, lines[lineIdx]]);
        setLineIdx((i) => i + 1);
      }, 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIdx]);

  return (
    <Card>
      <div className="space-y-5">
        <div className="text-center text-5xl animate-spin-slow">🌸</div>
        <div className="bubble space-y-3 text-gray-700 leading-relaxed min-h-[120px]">
          {doneLines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          <p>
            <TypewriterLine text={lines[lineIdx]} speed={35} onDone={handleLineDone} />
          </p>
        </div>
        <Btn onClick={onNext}>ถัดไป →</Btn>
      </div>
    </Card>
  );
}

function TypewriterLine({ text, speed, onDone }: { text: string; speed: number; onDone: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    calledRef.current = false;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        setDone(true);
        if (!calledRef.current) {
          calledRef.current = true;
          onDone();
        }
      }
    }, speed);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="animate-pulse text-pink-400">|</span>}
    </span>
  );
}

function Message2Screen({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <div className="space-y-5 text-center">
        <div className="text-6xl animate-heartbeat">🫶</div>
        <p className="text-xl font-semibold text-pink-600">
          <Typewriter text="ป๊ามีอะไรจะบอกนะ" speed={55} />
        </p>
        <p className="text-gray-400">ลองดูหน้าถัดไปสิ... 🙈</p>
        <Btn onClick={onNext}>ดูเลย 💬</Btn>
      </div>
    </Card>
  );
}

function ProposeScreen({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <Card>
      <div className="space-y-6 text-center">
        <div className="text-6xl animate-heartbeat">🥺</div>
        <h2 className="text-2xl font-bold text-pink-600">
          <Typewriter text="ง้อนะอ้วน" speed={80} />
        </h2>
        <p className="text-gray-600 text-lg">คืนดีกันเถอะ 💕</p>
        <div className="space-y-3 pt-2 runaway-container relative" style={{ minHeight: "120px" }}>
          <Btn onClick={onYes} variant="primary">ได้ 🩷</Btn>
          <RunawayBtn onCaught={onNo}>ไม่...ไม่มีทางหรอก ฝันไปเถอะ 😤</RunawayBtn>
        </div>
      </div>
    </Card>
  );
}

function YesScreen() {
  return (
    <Card>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-pink-600">
            <Typewriter text="ดีใจมากเลยนะอ้วน 🥹" speed={50} />
          </h2>
          <p className="text-gray-400 text-sm">ความทรงจำดีๆ ที่เคยมีด้วยกัน 🩷</p>
        </div>

        {/* Video */}
        <div className="rounded-2xl overflow-hidden bg-pink-50 border border-pink-100">
          <video className="w-full" controls playsInline>
            <source src={VIDEO_SRC} type="video/mp4" />
          </video>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-3 gap-2">
          {PHOTOS.map((photo, i) => (
            <PhotoSlot key={i} src={photo.src} alt={photo.alt} index={i} />
          ))}
        </div>

        <p className="text-center text-pink-400 text-sm animate-pulse">
          ขอบคุณที่ให้โอกาสป๊านะ 🌸
        </p>
      </div>
    </Card>
  );
}

function ConfirmNoScreen({ onUnsure, onSure }: { onUnsure: () => void; onSure: () => void }) {
  return (
    <Card>
      <div className="space-y-6 text-center">
        <div className="text-6xl animate-wobble">🤔</div>
        <h2 className="text-2xl font-bold text-pink-600">
          <Typewriter text="แน่ใจหรอ?" speed={70} />
        </h2>
        <p className="text-gray-400">ลองคิดดูอีกทีนะ 👉👈</p>
        <div className="space-y-3">
          <Btn onClick={onUnsure} variant="primary">ไม่แน่ใจ... 🥺</Btn>
          <Btn onClick={onSure} variant="secondary">แน่ใจ ไม่เอาจริงๆ 😤</Btn>
        </div>
      </div>
    </Card>
  );
}

function UnsureResponseScreen({ onMakeUp, onStillUnsure }: { onMakeUp: () => void; onStillUnsure: () => void }) {
  return (
    <Card>
      <div className="space-y-5 text-center">
        <div className="text-6xl animate-heartbeat">🥺💕</div>
        <h2 className="text-xl font-bold text-pink-600">
          <Typewriter text="รู้เลยว่ายังรักกันอยู่นะ" speed={50} />
        </h2>
        <div className="bubble text-gray-600 leading-relaxed text-sm space-y-2">
          <p>ไม่แน่ใจก็ดีกว่าไม่นะ 🌸</p>
          <p>ค่อยๆ คิดดู ป๊ายังรอนะ 💕</p>
        </div>
        <div className="space-y-3">
          <Btn onClick={onMakeUp} variant="primary">คืนดี 🩷</Btn>
          <Btn onClick={onStillUnsure} variant="secondary">ยังไม่แน่ใจอยู่ดี...</Btn>
        </div>
      </div>
    </Card>
  );
}

function SureResponseScreen({ count, onReconsider, onMakeUp }: { count: number; onReconsider: () => void; onMakeUp: () => void }) {
  return (
    <Card>
      <div className="space-y-5 text-center">
        <div className="text-6xl animate-wobble">🫠</div>
        <h2 className="text-xl font-bold text-pink-600">
          <Typewriter text="ลองคิดอีกทีสิ..." speed={60} />
        </h2>
        <div className="bubble text-gray-600 leading-relaxed text-sm space-y-2">
          <p>ป๊ายังรอนะ ไม่ไปไหนหรอก 🌸</p>
          <p>ค่อยๆ คิดดู ไม่ต้องรีบ 💕</p>
          {count > 1 && (
            <p className="text-pink-400 text-xs mt-1">
              (ป๊ารออยู่นะ ครั้งที่ {count} แล้ว 😅)
            </p>
          )}
        </div>
        <div className="space-y-3">
          <Btn onClick={onReconsider} variant="primary">คิดดีแล้ว... ลองอีกที? 🤔</Btn>
          <Btn onClick={onMakeUp} variant="secondary">คืนดี 🩷</Btn>
        </div>
      </div>
    </Card>
  );
}

// ==================== MAIN PAGE ====================

export default function Home() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [sureCount, setSureCount] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [screenKey, setScreenKey] = useState(0);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    setScreenKey((k) => k + 1);
    if (s === "yes") {
      setConfetti(false);
      setTimeout(() => setConfetti(true), 50);
    }
  }, []);

  const handleSureReconsider = useCallback(() => {
    setSureCount((c) => c + 1);
    go("confirm_no");
  }, [go]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 flex items-center justify-center p-4 relative">
      <FloatingHearts />
      <Confetti active={confetti} />

      {sureCount > 0 && screen === "confirm_no" && (
        <div className="fixed top-4 right-4 z-50 bg-pink-200 text-pink-700 text-xs px-3 py-1 rounded-full shadow animate-slideIn">
          ลองครั้งที่ {sureCount + 1} 😅
        </div>
      )}

      <div key={screenKey} className="w-full flex justify-center animate-slideIn">
        {screen === "intro" && <IntroScreen onNext={() => go("message1")} />}
        {screen === "message1" && <Message1Screen onNext={() => go("message2")} />}
        {screen === "message2" && <Message2Screen onNext={() => go("propose")} />}
        {screen === "propose" && <ProposeScreen onYes={() => go("yes")} onNo={() => go("confirm_no")} />}
        {screen === "yes" && <YesScreen />}
        {screen === "confirm_no" && (
          <ConfirmNoScreen onUnsure={() => go("unsure_response")} onSure={() => go("sure_response")} />
        )}
        {screen === "unsure_response" && (
          <UnsureResponseScreen onMakeUp={() => go("yes")} onStillUnsure={() => go("confirm_no")} />
        )}
        {screen === "sure_response" && (
          <SureResponseScreen count={sureCount} onReconsider={handleSureReconsider} onMakeUp={() => go("yes")} />
        )}
      </div>
    </main>
  );
}
