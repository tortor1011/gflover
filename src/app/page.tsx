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
  | "mini_game"
  | "date_picker"
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

// 📌 รูปที่จะลอยอยู่ในหัวใจช่วงหลังกดคืนดีแล้ว (เพิ่ม/เปลี่ยนรูปได้ตามใจเลย)
const FLOATING_HEART_PHOTOS: string[] = [
  "/photos/photo1.jpg",
  "/photos/photo2.jpg",
  "/photos/photo3.jpg",
];

// ==================== MINI GAME DATA (วางรูป 5 รูปไว้ใน /public/minigame/guess1.jpg - guess5.jpg) ====================
const MINI_GAME_MAX_OPENS = 3; // เปิดได้แค่ 3 ช่องต่อรูป
const MINI_GAME_TOTAL_TILES = 18; // บังไว้ทั้งหมด 18 ช่อง (6x3)

interface MiniGameRound {
  id: number;
  image: string; // 📌 วางรูปตรงนี้
  question: string;
  options: string[];
  correctIndex: number; // 0 = ข้อ 1, 1 = ข้อ 2, 2 = ข้อ 3, 3 = ข้อ 4
  sweetNote: string;
}

const MINI_GAME_ROUNDS: MiniGameRound[] = [
  {
    id: 1,
    image: "/minigame/guess1.jpg",
    question: "รูปที่ 1: เปิดได้ 3 ช่อง! ที่นี่ที่ไหนเอ่ย? 📸",
    options: ["ม.บูรพา", "เซ็นทรัลเวิล", "มอลบางกะปิ", "บึงพลาญชัย"],
    correctIndex: 0,
    sweetNote: "ดูปลาว่ายน้ำฟินๆ จนอยากบินไปหาเทอ🐟",
  },
  {
    id: 2,
    image: "/minigame/guess2.jpg",
    question: "รูปที่ 2: เปิดได้ 3 ช่อง! จำได้ไหมตอนไหน? ✨",
    options: ["ที่ๆคุณก็รู้", "ต้นตาล", "เกาะล้าน", "บางแสน"],
    correctIndex: 2,
    sweetNote: "เกาะล้านมีหมา แต่ในใจนี่หนา มีแต่เทอ",
  },
  {
    id: 3,
    image: "/minigame/guess3.jpg",
    question: "รูปที่ 3: เปิดได้ 3 ช่อง! วันนี้เราไปทำอะไรกัน? 🥰",
    options: ["เกษตรมอขอ", "ภูผาม่าน", "บ้านหนองเรือ", "หอโหวต"],
    correctIndex: 0,
    sweetNote: "ไปเดินงานเกษตรแล้วได้ของกินกลับมากินจนอ้วนจ้ำม่ำทั้งคู่ง่ะ",
  },
  {
    id: 4,
    image: "/minigame/guess4.jpg",
    question: "รูปที่ 4: เปิดได้ 3 ช่อง! ลองทายดูซิ 🥺",
    options: ["กรุงเทพ", "เกาะล้าน", "เซ็นทรัลเวิล", "สตรีศึกษา"],
    correctIndex: 3,
    sweetNote: "สมัยน่ารักๆทั้งคู่เยย 💖",
  },
  {
    id: 5,
    image: "/minigame/guess5.jpg",
    question: "รูปที่ 5 (รูปสุดท้าย): เปิดได้ 3 ช่อง! ทายถูกป่าว? 🥹",
    options: ["ร้านคิงคอง", "ร้าน Size L", "ร้านแสนเสน์หา", "ร้านประกายจ้าในตาเทอ"],
    correctIndex: 1,
    sweetNote: "เกี๊ยว Size L ที่อ้วนชอบ อิอิ ",
  },
];

// ==================== DATE PICKER DATA (วางรูปสถานที่ไว้ใน /public/dates/) ====================
interface DateIdea {
  id: string;
  label: string;
  emoji: string;
  image: string;
}

const DATE_IDEAS: DateIdea[] = [
  { id: "shabu", label: "ชาบู", emoji: "🍲", image: "/dates/shabu.jpg" },
  { id: "mookrata", label: "หมูกระทะ", emoji: "🥓", image: "/dates/mookrata.jpg" },
  { id: "rice", label: "ข้าว", emoji: "🍚", image: "/dates/rice.jpg" },
  { id: "noodle", label: "ก๋วยเตี๋ยว", emoji: "🍜", image: "/dates/noodle.jpg" },
  { id: "steak", label: "สเต๊ก", emoji: "🥩", image: "/dates/steak.jpg" },
  { id: "icecream", label: "ไอติม", emoji: "🍦", image: "/dates/icecream.jpg" },
  { id: "movie", label: "ดูหนัง", emoji: "🎬", image: "/dates/movie.jpg" },
  { id: "series", label: "ดูซีรีส์", emoji: "📺", image: "/dates/series.jpg" },
  { id: "game", label: "เล่นเกม", emoji: "🎮", image: "/dates/game.jpg" },
  { id: "anime", label: "ดูอนิเมะ", emoji: "✨", image: "/dates/anime.jpg" },
  { id: "hug", label: "กอด", emoji: "🫂", image: "/dates/hug.jpg" },
  { id: "cheek_kiss", label: "หอมแก้ม", emoji: "😘", image: "/dates/cheek_kiss.jpg" },
  { id: "kiss", label: "จุ๊บ", emoji: "💋", image: "/dates/kiss.jpg" },
  { id: "travel", label: "เที่ยว", emoji: "✈️", image: "/dates/travel.jpg" },
  { id: "photo", label: "ถ่ายรูป", emoji: "📸", image: "/dates/photo.jpg" },
  { id: "swim", label: "ว่ายน้ำ", emoji: "🏊", image: "/dates/swim.jpg" },
  { id: "workout", label: "ออกกำลังกาย", emoji: "🏃", image: "/dates/workout.jpg" },
];

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
      className={`transition-all duration-500 ease-out w-full flex justify-center ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
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
function HeartPhoto({ src, size }: { src: string; size: number }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      style={{ width: size, height: size }}
      className="relative drop-shadow-[0_6px_14px_rgba(244,114,182,0.35)]"
    >
      <svg viewBox="0 0 100 90" className="w-full h-full overflow-visible">
        <defs>
          <clipPath id="floating-heart-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.92 C0.5,0.92 0.04,0.62 0.04,0.31 C0.04,0.13 0.18,0.03 0.33,0.03 C0.42,0.03 0.48,0.09 0.5,0.16 C0.52,0.09 0.58,0.03 0.67,0.03 C0.82,0.03 0.96,0.13 0.96,0.31 C0.96,0.62 0.5,0.92 0.5,0.92 Z" />
          </clipPath>
        </defs>
        <path
          d="M50,83 C50,83 4,56 4,28 C4,12 18,3 33,3 C42,3 48,8 50,14 C52,8 58,3 67,3 C82,3 96,12 96,28 C96,56 50,83 50,83 Z"
          fill="#fbcfe8"
          stroke="#f9a8d4"
          strokeWidth="3"
        />
      </svg>

      {!imgFailed ? (
        <img
          src={src}
          alt=""
          onError={() => setImgFailed(true)}
          style={{ clipPath: "url(#floating-heart-clip)" }}
          className="absolute inset-[4%] w-[92%] h-[92%] object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-2xl">
          🩷
        </span>
      )}
    </div>
  );
}

function FloatingHearts({ withPhotos = false }: { withPhotos?: boolean }) {
  const items = ["🌸", "💕", "🩷", "🌸", "💕", "🩷", "🌸", "💕", "🩷", "🌸", "💕", "🩷"];

  if (withPhotos && FLOATING_HEART_PHOTOS.length > 0) {
    const photoSlots = Array.from({ length: 10 }, (_, i) => ({
      src: FLOATING_HEART_PHOTOS[i % FLOATING_HEART_PHOTOS.length],
      left: (i * 10.5 + 3) % 92,
      size: 64 + (i % 3) * 14, // หัวใจดวงใหญ่ขึ้น (64px - 92px) เห็นรูปชัด
      delay: i * 1.1,
      duration: 9 + (i % 4) * 1.5,
    }));

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {photoSlots.map((slot, i) => (
          <div
            key={`photo-heart-${i}`}
            className="absolute select-none animate-float-photo"
            style={{
              left: `${slot.left}%`,
              bottom: "-100px",
              animationDelay: `${slot.delay}s`,
              animationDuration: `${slot.duration}s`,
            }}
          >
            <HeartPhoto src={slot.src} size={slot.size} />
          </div>
        ))}
        {items.slice(0, 6).map((emoji, i) => (
          <span
            key={`emoji-${i}`}
            className="absolute select-none animate-float"
            style={{
              left: `${(i * 17 + 7) % 95}%`,
              bottom: "-40px",
              animationDelay: `${i * 1.2}s`,
              animationDuration: `${7 + (i % 3)}s`,
              fontSize: `${22 + (i % 2) * 8}px`,
              opacity: 0.45,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
    );
  }

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
          <Typewriter text="อย่าพึ่งปิดนะ มีอะไรจะบอก..." speed={60} />
        </h1>
        <p className="text-gray-400 text-sm">กดปุ่มด้านล่างเพื่ออ่านนะ</p>
        <Btn onClick={onNext}>ลองกดปุ่มอ่านดูก่อนสิ 👀</Btn>
      </div>
    </Card>
  );
}

function Message1Screen({ onNext }: { onNext: () => void }) {
  const lines = [
    "คิดถึงมากเลยนะ ไม่ได้คุยกันตั้งนาน ประมาณ 3 ปีแล้ว (3 อาทิตย์) 😮‍💨",
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

function MediaThumb({
  src,
  alt,
  emoji,
  className = "aspect-square",
}: {
  src?: string;
  alt: string;
  emoji: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-100 ${className}`}>
      {(!src || !loaded || error) && (
        <div className="absolute inset-0 flex items-center justify-center text-3xl select-none">
          {emoji}
        </div>
      )}
      {src && !error && (
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

function YesScreen({
  onOpenMiniGame,
  onOpenDatePicker,
}: {
  onOpenMiniGame: () => void;
  onOpenDatePicker: () => void;
}) {
  return (
    <Card>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-pink-600">
            <Typewriter text="ดีใจมากเลยนะอ้วน 🥹" speed={50} />
          </h2>
          <p className="text-gray-400 text-sm">ป๊าอยากคืนดีนะ ไอ้อ้วนของป๊า</p>
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

        {/* Post-reconciliation Thumbnail Cards */}
        <div className="pt-2 border-t border-pink-100 space-y-3">
          <p className="text-center text-pink-500 font-semibold text-sm">
            มีอะไรให้เล่นต่ออีกนิสนุง 💌
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenMiniGame}
              className="group text-left rounded-2xl p-3.5 bg-gradient-to-br from-pink-50 to-rose-100/80 border border-pink-200 hover:border-pink-400 hover:shadow-md transition-all active:scale-95"
            >
              <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🎮</div>
              <div className="font-bold text-pink-600 text-sm">มินิเกมคู่รัก</div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                ทายความทรงจำของเรา
              </div>
            </button>

            <button
              onClick={onOpenDatePicker}
              className="group text-left rounded-2xl p-3.5 bg-gradient-to-br from-rose-50 to-fuchsia-100/70 border border-pink-200 hover:border-pink-400 hover:shadow-md transition-all active:scale-95"
            >
              <div className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">📍</div>
              <div className="font-bold text-pink-600 text-sm">เลือกเดตที่อยากทำ</div>
              <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                อยากทำอะไรดี ไม่รีบนะ 🤍
              </div>
            </button>
          </div>
        </div>

        <p className="text-center text-pink-400 text-sm animate-pulse">
          ขอบคุณที่ให้โอกาสป๊านะ 🌸
        </p>
      </div>
    </Card>
  );
}

function MiniGameScreen({
  onBack,
  onGoDatePicker,
}: {
  onBack: () => void;
  onGoDatePicker: () => void;
}) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [openedTiles, setOpenedTiles] = useState<number[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [revealAll, setRevealAll] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = MINI_GAME_ROUNDS[roundIdx];
  const remaining = MINI_GAME_MAX_OPENS - openedTiles.length;
  const answered = selectedChoice !== null;
  const isCorrect = selectedChoice === current.correctIndex;

  const handleOpenTile = (id: number) => {
    if (openedTiles.includes(id)) return;
    if (openedTiles.length >= MINI_GAME_MAX_OPENS && !revealAll) return;
    hapticLight();
    setOpenedTiles((prev) => [...prev, id]);
  };

  const handleSelectChoice = (idx: number) => {
    if (answered) return;
    setSelectedChoice(idx);
    if (idx === current.correctIndex) {
      setScore((s) => s + 1);
      hapticHeartbeat();
    } else {
      hapticLight();
    }
  };

  const handleNextRound = () => {
    hapticLight();
    if (roundIdx + 1 < MINI_GAME_ROUNDS.length) {
      setRoundIdx((r) => r + 1);
      setOpenedTiles([]);
      setSelectedChoice(null);
      setRevealAll(false);
      setImgError(false);
    } else {
      setFinished(true);
      hapticHeartbeat();
    }
  };

  const handleReset = () => {
    hapticLight();
    setRoundIdx(0);
    setOpenedTiles([]);
    setSelectedChoice(null);
    setRevealAll(false);
    setImgError(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <Card>
        <div className="text-center space-y-5">
          <div className="text-6xl animate-heartbeat">🥹🩷</div>
          <h2 className="text-2xl font-bold text-pink-600">
            ทายถูก {score} / {MINI_GAME_ROUNDS.length} รูป!
          </h2>
          <div className="bubble text-gray-700 text-sm leading-relaxed space-y-2">
            <p>
              ไม่ว่าจะจำได้กี่รูป ความทรงจำทุกช่วงเวลาที่มีอ้วนอยู่ด้วยก็ดีที่สุดสำหรับป๊าเสมอนะ 🌸
            </p>
            <p className="text-pink-500 font-medium">
              ต่อจากนี้เรามาถ่ายรูปสร้างความทรงจำใหม่ๆ ด้วยกันอีกเยอะๆ เลยนะ 💕
            </p>
          </div>
          <div className="space-y-2.5 pt-1">
            <Btn onClick={onGoDatePicker} variant="primary">
              ไปเลือกเดตที่อยากทำต่อ 📍
            </Btn>
            <Btn onClick={handleReset} variant="secondary">
              เล่นใหม่อีกรอบ 🔄
            </Btn>
            <button
              onClick={onBack}
              className="w-full text-center text-xs text-gray-400 hover:text-pink-500 pt-1"
            >
              ← กลับหน้าความทรงจำ
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-pink-500">
            🎮 รูปที่ {roundIdx + 1} / {MINI_GAME_ROUNDS.length}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full ${remaining > 0
              ? "bg-pink-100 text-pink-600"
              : "bg-rose-100 text-rose-500"
              }`}
          >
            เปิดแล้ว {openedTiles.length} / {MINI_GAME_MAX_OPENS} ช่อง
          </span>
        </div>

        {/* Single Image covered by 18-tile grid (6x3) — fits natural aspect ratio */}
        <div className="flex justify-center">
          <div className="relative w-fit max-w-full rounded-2xl overflow-hidden border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-100 select-none">
            {/* Underlying single photo */}
            {!imgError ? (
              <Image
                key={current.image}
                src={current.image}
                alt={`รูปทายความทรงจำที่ ${current.id}`}
                width={1000}
                height={1000}
                className="block w-auto h-auto max-w-full max-h-[52vh]"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-[300px] sm:w-[380px] h-52 flex flex-col items-center justify-center text-pink-400 text-xs text-center px-4">
                <span className="text-4xl mb-1">🖼️</span>
                <span>วางรูปที่ {current.id} ไว้ที่</span>
                <code className="text-[11px] bg-white/70 px-2 py-0.5 rounded mt-1">
                  /public{current.image}
                </code>
              </div>
            )}

            {/* 18-tile cover overlay (6 cols x 3 rows) */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-3">
              {Array.from({ length: MINI_GAME_TOTAL_TILES }, (_, i) => i + 1).map((id) => {
                const isOpen = revealAll || openedTiles.includes(id);
                const canOpen = !isOpen && remaining > 0;
                return (
                  <button
                    key={id}
                    onClick={() => handleOpenTile(id)}
                    disabled={!canOpen}
                    aria-label={`เปิดช่องที่ ${id}`}
                    className={`flex items-center justify-center transition-opacity duration-300 border border-white/60 ${isOpen
                      ? "opacity-0 pointer-events-none bg-pink-300"
                      : canOpen
                        ? "opacity-100 bg-pink-300 hover:bg-pink-400 text-white active:scale-95 cursor-pointer"
                        : "opacity-100 bg-pink-200 text-white/90 cursor-not-allowed"
                      }`}
                  >
                    <span className="text-xs font-bold drop-shadow-sm">
                      {canOpen ? id : "🔒"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          {remaining > 0
            ? `แตะเปิดช่องได้อีก ${remaining} ช่อง เพื่อแอบดูรูปด้านล่าง 👆`
            : "เปิดครบ 3 ช่องแล้ว! ลองทายคำตอบด้านล่างดูเลย 💕"}
        </p>

        {/* Question & Choices */}
        <div className="pt-2 border-t border-pink-100 space-y-2.5">
          <h3 className="text-sm font-bold text-pink-600 text-center">
            {current.question}
          </h3>

          <div className="space-y-2">
            {
              current.options.map((opt, idx) => {
                const isPicked = selectedChoice === idx;
                const isAnswer = idx === current.correctIndex;
                let style =
                  "bg-white border-pink-200 text-gray-700 hover:bg-pink-50";
                if (answered) {
                  if (isAnswer) {
                    style = "bg-pink-100 border-pink-400 text-pink-700 font-semibold";
                  } else if (isPicked) {
                    style = "bg-gray-100 border-gray-300 text-gray-400";
                  } else {
                    style = "bg-white/60 border-pink-100 text-gray-400";
                  }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectChoice(idx)}
                    disabled={answered}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all ${style}`}
                  >
                    {opt}
                    {answered && isAnswer && " ✓"}
                  </button>
                );
              })
            }
          </div>
        </div>

        {/* Result & Next Round */}
        {answered && (
          <div className="bubble text-center space-y-3 animate-slideIn">
            <div className="text-3xl">{isCorrect ? "🥹" : "🫣"}</div>
            <div className="font-bold text-pink-600 text-base">
              {isCorrect ? "เก่งมาก" : "เกือบถูกแล้วนะอ้วน~ "}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{current.sweetNote}</p>

            <div className="space-y-2 pt-1">
              {!revealAll && (
                <Btn onClick={() => setRevealAll(true)} variant="secondary">
                  เปิดดูรูปเต็มๆ 👀
                </Btn>
              )}
              <Btn onClick={handleNextRound} variant="primary">
                {roundIdx + 1 < MINI_GAME_ROUNDS.length
                  ? `ไปรูปถัดไป (${roundIdx + 2}/${MINI_GAME_ROUNDS.length}) →`
                  : "ดูสรุปคะแนน 🩷"}
              </Btn>
            </div>
          </div>
        )}

        <button
          onClick={onBack}
          className="w-full text-center text-xs text-gray-400 hover:text-pink-500 pt-1"
        >
          ← กลับหน้าความทรงจำ
        </button>
      </div>
    </Card>
  );
}

function DatePickerScreen({ onBack }: { onBack: () => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"picking" | "confirmed" | "later">("picking");

  const toggle = (id: string) => {
    hapticLight();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedIdeas = DATE_IDEAS.filter((d) => selectedIds.includes(d.id));

  if (status === "confirmed") {
    return (
      <Card>
        <div className="space-y-5 text-center">
          <div className="text-5xl animate-bounce">🥰</div>
          <h2 className="text-xl font-bold text-pink-600">
            ป๊าจดไว้ให้หมดแล้วนะ! 📝💕
          </h2>
          <p className="text-xs text-gray-500">
            สิ่งที่อ้วนอยากทำด้วยกัน ({selectedIdeas.length} อย่าง)
          </p>

          <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {selectedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-xl p-1.5 bg-pink-50 border border-pink-200 space-y-1"
              >
                <MediaThumb
                  src={idea.image}
                  alt={idea.label}
                  emoji={idea.emoji}
                  className="aspect-square"
                />
                <div className="text-xs font-semibold text-pink-600 truncate">
                  {idea.emoji} {idea.label}
                </div>
              </div>
            ))}
          </div>

          <div className="bubble text-sm text-gray-700 leading-relaxed">
            พร้อมเมื่อไหร่บอกป๊าได้เลยนะ เดี๋ยวพาไปทำตามใจทุกอย่างเลย 🩷
          </div>

          <div className="space-y-2">
            <Btn onClick={() => setStatus("picking")} variant="secondary">
              เลือกเพิ่ม / แก้ไข ✏️
            </Btn>
            <Btn onClick={onBack} variant="primary">
              ← กลับหน้าความทรงจำ
            </Btn>
          </div>
        </div>
      </Card>
    );
  }

  if (status === "later") {
    return (
      <Card>
        <div className="space-y-5 text-center">
          <div className="text-5xl animate-heartbeat">🤍</div>
          <h2 className="text-xl font-bold text-pink-600">
            ไม่รีบเลยนะ ค่อยๆ คิดก็ได้ 🌸
          </h2>
          <div className="bubble text-sm text-gray-600 leading-relaxed space-y-2">
            <p>อยากไปไหนหรืออยากทำอะไรเมื่อไหร่</p>
            <p>ทักมาบอกป๊าได้ตลอดเลยนะ ป๊ารอตามใจอ้วนเสมอ 💕</p>
          </div>
          <div className="space-y-2">
            <Btn onClick={() => setStatus("picking")} variant="secondary">
              กลับไปดูตัวเลือกอีกครั้ง
            </Btn>
            <Btn onClick={onBack} variant="primary">
              ← กลับหน้าความทรงจำ
            </Btn>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <div className="text-4xl">📍💕</div>
          <h2 className="text-xl font-bold text-pink-600">เลือกเดตที่อยากทำ</h2>
          <p className="text-xs text-gray-400">
            จิ้มเลือกได้หลายอย่างเลยนะ หรือยังไม่รีบตอบก็ได้ 🤍
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1 py-1">
          {DATE_IDEAS.map((idea) => {
            const active = selectedIds.includes(idea.id);
            return (
              <button
                key={idea.id}
                onClick={() => toggle(idea.id)}
                className={`relative rounded-xl p-1.5 border-2 transition-all active:scale-95 text-center ${active
                  ? "border-pink-400 bg-pink-50 shadow-sm"
                  : "border-pink-100 bg-white/80 hover:border-pink-200"
                  }`}
              >
                {active && (
                  <span className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center shadow">
                    ✓
                  </span>
                )}
                <MediaThumb
                  src={idea.image}
                  alt={idea.label}
                  emoji={idea.emoji}
                  className="aspect-square mb-1"
                />
                <div className="text-[11px] font-semibold text-gray-700 truncate">
                  {idea.label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              if (selectedIds.length === 0) return;
              hapticHeartbeat();
              setStatus("confirmed");
            }}
            disabled={selectedIds.length === 0}
            className={`btn ${selectedIds.length > 0
              ? "btn-primary"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {selectedIds.length > 0
              ? `เลือก ${selectedIds.length} อย่างนี้เลย 💕`
              : "จิ้มเลือกสิ่งที่อยากทำก่อนนะ 👆"}
          </button>

          <Btn
            onClick={() => {
              hapticLight();
              setStatus("later");
            }}
            variant="secondary"
          >
            ยังไม่รีบเลือกก็ได้ ค่อยบอกทีหลัง 🤍
          </Btn>

          <button
            onClick={onBack}
            className="w-full text-center text-xs text-gray-400 hover:text-pink-500 pt-1"
          >
            ← กลับหน้าความทรงจำ
          </button>
        </div>
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
          <Btn onClick={onReconsider} variant="primary">คิดดีแล้ว 🤔</Btn>
          <Btn onClick={onMakeUp} variant="secondary">คืนดี 🩷</Btn>
        </div>
      </div>
    </Card>
  );
}

// ==================== TOUCH RIPPLE HEARTS ====================
interface RippleHeart {
  id: number;
  x: number;
  y: number;
}

function TouchRippleHearts() {
  const [hearts, setHearts] = useState<RippleHeart[]>([]);

  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // ignore clicks on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("video") || target.closest("a")) return;

    const point = "touches" in e ? e.touches[0] : e;
    const x = point.clientX;
    const y = point.clientY;
    const id = Date.now() + Math.random();

    setHearts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1200);
  }, []);

  const emojis = ["💕", "🩷", "💗", "💓", "🌸", "💖"];

  return (
    <>
      {/* invisible overlay to capture touches without blocking UI */}
      <div
        className="fixed inset-0 z-20 pointer-events-none"
        onTouchStart={handleTouch}
        onMouseDown={handleTouch}
        style={{ pointerEvents: "none" }}
      />
      {hearts.map((h) => (
        <span
          key={h.id}
          className="fixed pointer-events-none select-none animate-ripple-heart z-30"
          style={{ left: h.x - 12, top: h.y - 12, fontSize: "24px" }}
        >
          {emojis[Math.floor(Math.random() * emojis.length)]}
        </span>
      ))}
    </>
  );
}

// ==================== SHAKE TO REVEAL ====================
const SHAKE_MESSAGES = [
  { emoji: "😏", text: "ป๊าก็รู้ว่าอยากคืนดี~" },
  { emoji: "🥹", text: "ชอบนะที่เขย่าโทรศัพท์ 555" },
  { emoji: "💕", text: "ป๊ารอนะ ไม่ไปไหนหรอก" },
  { emoji: "🌸", text: "เขย่าอีกได้นะ ป๊าไม่เบื่อ" },
];

function ShakeReveal() {
  const [show, setShow] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const lastShake = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastZ = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const { x = 0, y = 0, z = 0 } = acc;

      const dx = Math.abs((x ?? 0) - lastX.current);
      const dy = Math.abs((y ?? 0) - lastY.current);
      const dz = Math.abs((z ?? 0) - lastZ.current);
      lastX.current = x ?? 0;
      lastY.current = y ?? 0;
      lastZ.current = z ?? 0;

      const totalForce = dx + dy + dz;
      const now = Date.now();

      if (totalForce > 30 && now - lastShake.current > 1500) {
        lastShake.current = now;
        setMsgIdx((i) => (i + 1) % SHAKE_MESSAGES.length);
        setShow(true);
        // haptic
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
        setTimeout(() => setShow(false), 2500);
      }
    };

    // iOS 13+ requires permission
    const requestAndListen = async () => {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        // @ts-expect-error iOS non-standard
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        try {
          // @ts-expect-error iOS non-standard
          const perm = await DeviceMotionEvent.requestPermission();
          if (perm === "granted") {
            window.addEventListener("devicemotion", handleMotion);
          }
        } catch {
          // silently fail on desktop
        }
      } else {
        window.addEventListener("devicemotion", handleMotion);
      }
    };

    requestAndListen();
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  if (!show) return null;
  const msg = SHAKE_MESSAGES[msgIdx];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md border border-pink-200 rounded-3xl px-8 py-6 shadow-2xl text-center animate-shake-pop mx-6">
        <div className="text-5xl mb-2">{msg.emoji}</div>
        <p className="text-pink-600 font-semibold text-lg">{msg.text}</p>
      </div>
    </div>
  );
}

// ==================== HAPTIC HELPERS ====================
function hapticHeartbeat() {
  if (!navigator.vibrate) return;
  // thump-thump pattern like a heartbeat ♥
  navigator.vibrate([120, 80, 120, 300, 120, 80, 120]);
}

function hapticLight() {
  if (!navigator.vibrate) return;
  navigator.vibrate(40);
}

// ==================== MAIN PAGE ====================

export default function Home() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [sureCount, setSureCount] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [screenKey, setScreenKey] = useState(0);
  // touch ripple — capture at root level
  const [hearts, setHearts] = useState<RippleHeart[]>([]);
  const emojis = ["💕", "🩷", "💗", "💓", "🌸", "💖"];

  const handleTouch = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("video") || target.closest("a")) return;
    const point = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    if (!point) return;
    const x = point.clientX;
    const y = point.clientY;
    const id = Date.now() + Math.random();
    setHearts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1200);
  }, []);

  const go = useCallback((s: Screen) => {
    hapticLight();
    setScreen(s);
    setScreenKey((k) => k + 1);
    if (s === "yes") {
      setConfetti(false);
      setTimeout(() => setConfetti(true), 50);
      hapticHeartbeat();
    }
  }, []);

  const handleSureReconsider = useCallback(() => {
    setSureCount((c) => c + 1);
    go("confirm_no");
  }, [go]);

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-fuchsia-100 flex items-center justify-center p-4 relative select-none"
      onTouchStart={handleTouch}
      onMouseDown={handleTouch}
    >
      <FloatingHearts
        withPhotos={
          screen === "yes" || screen === "mini_game" || screen === "date_picker"
        }
      />
      <Confetti active={confetti} />
      <ShakeReveal />

      {/* Touch ripple hearts rendered at root so they appear over everything */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="fixed pointer-events-none select-none animate-ripple-heart z-40"
          style={{ left: h.x - 12, top: h.y - 12, fontSize: "24px" }}
        >
          {emojis[Math.floor(h.id * 9301 + 49297) % emojis.length]}
        </span>
      ))}

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
        {screen === "yes" && (
          <YesScreen
            onOpenMiniGame={() => go("mini_game")}
            onOpenDatePicker={() => go("date_picker")}
          />
        )}
        {screen === "mini_game" && (
          <MiniGameScreen
            onBack={() => go("yes")}
            onGoDatePicker={() => go("date_picker")}
          />
        )}
        {screen === "date_picker" && <DatePickerScreen onBack={() => go("yes")} />}
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
