import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView, useMotionValue } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Globe, Eye } from 'lucide-react';
import { Project } from './types';
import { useContent } from './useContent';
import { PROJECTS } from './constants';

const DebugLabel = ({ text }: { text: string }) => (
  <div className="absolute left-4 top-4 z-[90] rounded-lg bg-black/75 text-white px-3 py-2 font-mono text-[10px] uppercase tracking-widest pointer-events-none max-w-[85vw]">
    {text}
  </div>
);

// --- Magnetic Button Effect ---
const MagneticButton = ({ children, className = "", strength = 0.3 }: { children: React.ReactNode; className?: string; strength?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
};



// --- Character Stagger Animation ---
const StaggerText = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const chars = text.split('');

  return (
    <span ref={ref} className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 100, rotateX: -90 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.03,
            ease: [0.215, 0.61, 0.355, 1]
          }}
          style={{ display: 'inline-block', transformOrigin: 'bottom' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};



// --- Image with Distortion Hover (Simplified) ---
const DistortionImage = ({ src, alt, className = "" }: { src: string; alt: string; className?: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div
      className={`relative overflow-hidden bg-slate-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Simple placeholder - no infinite animation */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 z-[1]" />
      )}
      
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        animate={{
          scale: isHovered ? 1.1 : 1,
          opacity: isLoaded ? 1 : 0
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-400 ${isHovered ? 'opacity-60' : 'opacity-5'}`}
      />
    </div>
  );
};

// --- Improved Dual-Layer Cursor ---
const CustomCursor = () => {
  const [enabled, setEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [cursorText, setCursorText] = useState("");

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const dotX = useSpring(x, { damping: 35, stiffness: 900, mass: 0.15 });
  const dotY = useSpring(y, { damping: 35, stiffness: 900, mass: 0.15 });
  const ringX = useSpring(x, { damping: 28, stiffness: 360, mass: 0.55 });
  const ringY = useSpring(y, { damping: 28, stiffness: 360, mass: 0.55 });

  useEffect(() => {
    const mqFine = window.matchMedia?.('(pointer: fine)');
    const mqReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)');

    const computeEnabled = () => {
      const fine = mqFine?.matches ?? false;
      const reduce = mqReduce?.matches ?? false;
      setEnabled(fine && !reduce);
    };

    computeEnabled();

    const onChange = () => computeEnabled();
    mqFine?.addEventListener?.('change', onChange);
    mqReduce?.addEventListener?.('change', onChange);
    return () => {
      mqFine?.removeEventListener?.('change', onChange);
      mqReduce?.removeEventListener?.('change', onChange);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.body.classList.remove('cursor-custom');
      return;
    }

    document.body.classList.add('cursor-custom');

    const handlePointerMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      const target = e.target as HTMLElement | null;
      const hoverData = target?.closest?.('[data-cursor]') as HTMLElement | null;
      const nextText = hoverData?.getAttribute('data-cursor') || "";
      const nextHovering = Boolean(hoverData);

      setIsHovering((prev) => (prev === nextHovering ? prev : nextHovering));
      setCursorText((prev) => (prev === nextText ? prev : nextText));
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) setIsClicked(true);
    };
    const handlePointerUp = () => setIsClicked(false);

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.classList.remove('cursor-custom');
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Hermès-style H cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center"
        style={{ 
          x: ringX, 
          y: ringY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          width: isHovering ? 88 : 48,
          height: isHovering ? 88 : 48,
          scale: isClicked ? 0.85 : 1,
        }}
        transition={{ type: 'spring', damping: 26, stiffness: 300, mass: 0.5 }}
      >
        {/* Outer ring (larger) */}
        <motion.div
          className="absolute inset-0 rounded-full border"
          animate={{
            borderColor: isHovering ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)',
            borderWidth: 1,
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Inner ring (smaller) */}
        <motion.div
          className="absolute rounded-full border"
          animate={{
            width: isHovering ? 72 : 38,
            height: isHovering ? 72 : 38,
            borderColor: isHovering ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
            borderWidth: isHovering ? 1.5 : 1,
          }}
          transition={{ type: 'spring', damping: 26, stiffness: 300, mass: 0.5 }}
        />
        
        {/* H Letter - Hermès style */}
        <AnimatePresence mode="wait">
          {isHovering && cursorText ? (
            <motion.span 
              key="text"
              initial={{ opacity: 0, scale: 0.6 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-sans font-bold uppercase tracking-[0.15em] text-black/80"
            >
              {cursorText}
            </motion.span>
          ) : (
            <motion.svg
              key="h"
              viewBox="0 0 24 24"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5"
            >
              <motion.path
                d="M4 4 L4 20 M4 12 L20 12 M20 4 L20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                className="text-black/70"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Small trailing dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-black/50 rounded-full pointer-events-none z-[9998]"
        style={{ 
          x: dotX, 
          y: dotY,
          translateX: '-50%',
          translateY: '-50%'
        }}
        animate={{
          scale: isClicked ? 1.5 : 1,
          opacity: isHovering ? 0 : 1
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      />
    </>
  );
};

// --- Parallax Image (Simplified) ---
const ParallaxImage = ({ src, alt, className = "" }: { src: string; alt: string; className?: string }) => {
  const ref = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-slate-200 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 z-[1]" />
      )}
      
      <motion.img 
        style={{ y }} 
        src={src} 
        alt={alt} 
        className={`absolute inset-0 w-full h-[120%] object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};

// --- Featured Work Grid (Replaces Horizontal Scroll for better UX) ---
const FeaturedWorkGrid = ({ projects }: { projects: Project[] }) => {
  return (
    <section className="py-24 px-8 lg:px-16 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-slate-400 block mb-4">精選</span>
          <h2 className="font-sans font-black text-4xl lg:text-5xl tracking-tighter">Featured Works</h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.slice(0, 1).map((project, idx) => (
            <motion.div
              key={project.id}
              className={`relative overflow-hidden group cursor-pointer md:col-span-2 aspect-[21/9]`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 0.98 }}
            >
              <img 
                src={project.imageUrl} 
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60 block mb-2">
                  {project.category}
                </span>
                <h3 className="font-sans font-bold text-2xl lg:text-3xl text-white tracking-tight">
                  {project.title}
                </h3>
              </div>
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight size={18} className="text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Interactive Project List (Redesigned: Clean & Luxurious) ---
const InteractivePortfolioList = ({
  projects,
  onSelect,
  archiveStartYear,
  archiveEndYear
}: {
  projects: Project[];
  onSelect: (p: Project) => void;
  archiveStartYear: number;
  archiveEndYear: number;
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <section id="work" className="relative bg-[#F5F5F3]">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left: Project List */}
        <div className="lg:col-span-7 py-24 px-8 lg:px-16 lg:pr-12">
          <div className="mb-16 border-b border-black/10 pb-8">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="font-mono text-[10px] uppercase tracking-[0.5em] text-slate-400 block mb-4"
            >
              精選作品
            </motion.span>
            <div className="flex items-end justify-between gap-6">
              <h2 className="font-sans font-black text-5xl lg:text-7xl uppercase tracking-tighter">
                <StaggerText text="作品集" />
              </h2>
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-[0.3em] pb-2">
                {archiveStartYear}—{archiveEndYear}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            {projects.map((project, idx) => (
              <motion.div 
                key={project.id}
                className="group relative border-b border-black/5 py-6 flex items-center justify-between cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelect(project)}
                data-cursor="查看"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-[10px] text-slate-300 w-6">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className={`font-sans font-bold text-xl lg:text-2xl tracking-tight transition-all duration-300 ${
                    hoveredIdx === idx ? 'text-black' : hoveredIdx !== null ? 'text-black/30' : 'text-black/80'
                  }`}>
                    {project.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-[10px] uppercase tracking-widest transition-all duration-300 ${
                    hoveredIdx === idx ? 'text-black/60' : 'text-black/30'
                  }`}>
                    {project.category}
                  </span>
                  <motion.div
                    animate={{ x: hoveredIdx === idx ? 0 : -8, opacity: hoveredIdx === idx ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowUpRight size={16} className="text-black/60" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Fixed Preview Panel */}
        <div className="hidden lg:block lg:col-span-5 sticky top-0 h-screen">
          <div className="h-full p-8 flex items-center justify-center bg-[#EBEBEA]">
            <AnimatePresence mode="wait">
              {hoveredIdx !== null && projects[hoveredIdx] ? (
                <motion.div
                  key={projects[hoveredIdx].id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative w-full max-w-md aspect-[3/4] overflow-hidden"
                >
                  <img 
                    src={projects[hoveredIdx].imageUrl} 
                    alt={projects[hoveredIdx].title}
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/70 block mb-2">
                      {projects[hoveredIdx].category}
                    </span>
                    <h4 className="font-sans font-bold text-2xl text-white tracking-tight">
                      {projects[hoveredIdx].title}
                    </h4>
                    {projects[hoveredIdx].metadata?.date && (
                      <span className="font-mono text-[10px] text-white/50 mt-2 block">
                        {projects[hoveredIdx].metadata.date}
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full border border-black/10 flex items-center justify-center">
                    <Eye size={24} className="text-black/20" />
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/30">
                    Hover to preview
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Project Detail ---
const ProjectCaseStudy = ({ project, onBack }: { project: Project; onBack: () => void }) => {
  // Scroll lock: prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // History API: allow back button to close modal
  useEffect(() => {
    // Push a state when modal opens
    window.history.pushState({ modal: 'project', projectId: project.id }, '');
    
    const handlePopState = (e: PopStateEvent) => {
      // When user presses back, close the modal
      onBack();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [project.id, onBack]);

  // Dynamic SEO title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${project.title} | Harry Heng Studio`;
    return () => {
      document.title = originalTitle;
    };
  }, [project.title]);

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 35, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-[#F5F5F3] overflow-y-auto no-scrollbar"
    >
      <nav className="sticky top-0 w-full flex justify-between items-center p-8 z-50 bg-[#F5F5F3]/80 backdrop-blur-md">
        <MagneticButton>
          <button onClick={onBack} data-cursor="返回" className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-black/60 transition-colors">
            <ArrowLeft size={14} /> 關閉
          </button>
        </MagneticButton>
        <span className="font-sans font-black text-sm uppercase">作品 0{project.id}</span>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-32">
        <header className="mb-32">
          <motion.h1 
            initial={{ y: 100, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="font-sans font-black text-[12vw] uppercase leading-[0.8] mb-16 tracking-tighter"
          >
            {project.title}
          </motion.h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-end">
             <motion.p 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="font-serif text-2xl italic leading-relaxed text-slate-600"
             >
               探索{project.category}的藝術本質。光影、質感與人體姿態的精密研究。
             </motion.p>
             <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="font-mono text-[10px] uppercase tracking-widest text-slate-400 border-l border-black pl-8"
             >
                <p className="mb-2">拍攝地點：上海</p>
                <p className="mb-2">器材：Leica SL2 / Phase One</p>
                <p>發布日期：{project.metadata?.date || '2024'}</p>
             </motion.div>
          </div>
        </header>

        <div className="space-y-48">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <ParallaxImage src={project.imageUrl} alt="Hero" className="w-full aspect-video rounded-3xl" />
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
             <motion.div 
               className="md:col-span-7 bg-white p-12 lg:p-24 flex flex-col justify-center rounded-3xl"
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6 }}
               viewport={{ once: true }}
             >
                <h4 className="font-sans font-black uppercase text-xs mb-8 text-slate-400">創作理念</h4>
                <p className="font-serif text-3xl italic leading-snug">
                  "傳統不是對灰燼的崇拜，而是對火焰的傳承。"
                </p>
                <p className="font-sans text-sm text-slate-500 mt-8 leading-relaxed">
                  我們相信每一張照片都是一個故事的開始。透過鏡頭捕捉那些轉瞬即逝的美好瞬間，
                  讓時尚與藝術在光影中交織，創造出獨一無二的視覺敘事。
                </p>
             </motion.div>
             <motion.div 
               className="md:col-span-5 h-[600px] overflow-hidden rounded-3xl"
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               viewport={{ once: true }}
             >
                <DistortionImage src={project.imageUrl} alt="Detail" className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000" />
             </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[...Array(3)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="aspect-[3/4] overflow-hidden rounded-2xl"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                   <DistortionImage src={project.imageUrl} alt={`Gallery ${i + 1}`} className="w-full h-full" />
                </motion.div>
             ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Floating Particles Background ---
// --- Floating Particles (Reduced from 20 to 8 for performance) ---
const FloatingParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/10 animate-float"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.id * 2}s`
          }}
        />
      ))}
    </div>
  );
};

// --- Counter Animation ---
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
};

// --- Stats Section ---
const StatsSection = () => {
  const stats = [
    { value: 500, suffix: "+", label: "完成專案" },
    { value: 12, suffix: "年", label: "行業經驗" },
    { value: 50, suffix: "+", label: "品牌合作" },
    { value: 98, suffix: "%", label: "客戶滿意度" }
  ];

  return (
    <section className="py-32 px-8 lg:px-24 bg-black text-white">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="font-sans font-black text-5xl lg:text-7xl mb-4">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/60">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// --- Asymmetrical Gallery Wall (Simplified - removed heavy parallax) ---
const InstagramGalleryWall = () => {
  const [apiItems, setApiItems] = useState<Array<{ name: string; url: string; number: number }> | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    let cancelled = false;

    const normalize = (data: any) => {
      if (!Array.isArray(data)) return [] as Array<{ name: string; url: string; number: number }>;
      const cleaned = data
        .filter((x: any) => x && typeof x.url === 'string')
        .map((x: any) => ({
          name: String(x.name || ''),
          url: String(x.url),
          number: Number(x.number ?? Number.parseInt(String(x.name || '').replace(/\D+/g, ''), 10))
        }))
        .filter((x) => Number.isFinite(x.number) && x.number > 0)
        .sort((a, b) => a.number - b.number);
      return cleaned;
    };

    const fetchJson = async (url: string) => {
      const r = await fetch(url, { cache: 'no-cache' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    };

    (async () => {
      try {
        const data = await fetchJson('/gallery.json');
        if (!cancelled) setApiItems(normalize(data));
        return;
      } catch {
        // Local dev fallback
      }

      try {
        const data = await fetchJson('/api/gallery');
        if (!cancelled) setApiItems(normalize(data));
      } catch {
        if (!cancelled) setApiItems([]);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const pad3 = (n: number) => String(n).padStart(3, '0');
  const sizePattern = ['tall', 'square', 'wide', 'square', 'tall', 'wide'] as const;

  const allItems = useMemo(() => {
    const fromApi = apiItems && apiItems.length > 0;
    const nums = fromApi ? apiItems : Array.from({ length: 321 }, (_, i) => ({
      name: `${pad3(i + 1)}.jpg`,
      url: `/images/gallery/${pad3(i + 1)}.jpg`,
      number: i + 1
    }));

    return nums.map((it, idx) => ({
      src: it.url,
      number: it.number,
      size: sizePattern[idx % sizePattern.length]
    }));
  }, [apiItems]);

  const galleryItems = useMemo(() => allItems.slice(0, visibleCount), [allItems, visibleCount]);
  const totalCount = allItems.length;

  const col1 = galleryItems.filter((_, idx) => idx % 3 === 0);
  const col2 = galleryItems.filter((_, idx) => idx % 3 === 1);
  const col3 = galleryItems.filter((_, idx) => idx % 3 === 2);

  const getAspectClass = (size: string) => {
    switch (size) {
      case 'tall': return 'aspect-[3/4]';
      case 'wide': return 'aspect-[4/3]';
      default: return 'aspect-square';
    }
  };

  // Simplified GalleryImage - uses CSS transitions instead of framer-motion
  const GalleryImage = ({ item }: { item: { src: string; number: number; size: string } }) => {
    const [isBroken, setIsBroken] = useState(false);

    if (isBroken) return null;
    
    return (
      <div
        className={`relative overflow-hidden ${getAspectClass(item.size)} group cursor-pointer`}
        data-cursor="View"
      >
        <img
          src={item.src}
          alt={`Gallery ${pad3(item.number)}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setIsBroken(true)}
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />

        {/* Caption */}
        <div className="absolute -bottom-6 left-0 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
          <span className="font-mono text-[9px] text-slate-400 tracking-widest uppercase">
            No. {pad3(item.number)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section 
      className="py-32 lg:py-48 px-8 lg:px-16 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 lg:mb-32"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-slate-400 block mb-6">
            Gallery · 001—{pad3(totalCount)}
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <h2 className="font-display text-5xl lg:text-8xl tracking-tight text-[#101010]">
              Gallery
            </h2>
            <p className="font-serif italic text-lg text-slate-500 max-w-sm">
              Ordered by filename number (auto-synced with your gallery folder).
            </p>
          </div>
        </motion.div>

        {/* Asymmetrical 3-Column Grid - CSS-only offsets for performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Column 1 */}
          <div className="flex flex-col gap-16">
            {col1.map((item) => (
              <GalleryImage key={item.src} item={item} />
            ))}
          </div>

          {/* Column 2 - Offset vertically */}
          <div className="flex flex-col gap-16 mt-0 md:mt-24">
            {col2.map((item) => (
              <GalleryImage key={item.src} item={item} />
            ))}
          </div>

          {/* Column 3 - Different offset */}
          <div className="flex flex-col gap-16 mt-0 md:mt-12">
            {col3.map((item) => (
              <GalleryImage key={item.src} item={item} />
            ))}
          </div>
        </div>

        {/* Load more */}
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-slate-400">
            Showing {Math.min(visibleCount, totalCount)} / {totalCount}
          </div>
          {visibleCount < totalCount && (
            <MagneticButton>
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(totalCount, c + 24))}
                data-cursor="More"
                className="font-mono text-[11px] uppercase tracking-widest text-[#101010] flex items-center gap-3 group border border-black/10 px-6 py-3 hover:border-black/30 transition-colors"
              >
                Load More
                <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </MagneticButton>
          )}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-24 lg:mt-32 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-black/10 pt-12"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <span className="font-display text-sm">H</span>
              </div>
            </div>
            <a 
              href="https://www.instagram.com/harrytwstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-[#101010] transition-colors"
            >
              @harrytwstudio
            </a>
          </div>
          
          <MagneticButton>
            <a 
              href="#work" 
              data-cursor="更多"
              className="font-mono text-[11px] uppercase tracking-widest text-[#101010] flex items-center gap-3 group"
            >
              View All Works
              <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
};

// --- Services Section: Luxury Hover-Reveal List ---
const ServicesSection = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const services = [
    {
      num: "01",
      title: "Editorial",
      subtitle: "雜誌／形象專題",
      desc: "以光影和姿態敘事，適合封面、專題、藝人與品牌形象。前期 moodboard + pose sheet，交付 48hr 初選／精修 8–12 張。",
      image: "/images/gallery/005.jpg"
    },
    {
      num: "02",
      title: "Lookbook",
      subtitle: "型錄／新品上線",
      desc: "為電商與陳列需求打造一致的光型與質感。規格統一、快速排程，可加購剪影、去背、細節特寫。",
      image: "/images/gallery/012.jpg"
    },
    {
      num: "03",
      title: "Campaign",
      subtitle: "廣告主視覺",
      desc: "從概念到落地：分鏡、場景、道具與燈光設計。提案 Key Visual + style frames，導演式控場。",
      image: "/images/gallery/023.jpg"
    },
    {
      num: "04",
      title: "Theater",
      subtitle: "舞台／劇場紀錄",
      desc: "捕捉表演藝術的張力與情感瞬間。專業劇場攝影經驗，與無垢舞蹈劇場等團隊長期合作。",
      image: "/images/gallery/031.jpg"
    },
    {
      num: "05",
      title: "Social",
      subtitle: "社群短影／動態",
      desc: "Reels、幕後、產品動態與氛圍短片。15–30 秒節奏設計，直式/橫式多版本交付。",
      image: "/images/gallery/045.jpg"
    }
  ];

  return (
    <section className="relative min-h-screen bg-[#F5F5F3] overflow-hidden">
      {/* Floating preview image */}
      <AnimatePresence>
        {hoveredIdx !== null && (
          <motion.div
            key={hoveredIdx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-1/2 right-[10%] -translate-y-1/2 w-[35vw] max-w-[500px] aspect-[3/4] pointer-events-none z-10"
          >
            <img 
              src={services[hoveredIdx].image}
              alt={services[hoveredIdx].title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-8 lg:px-16 py-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-slate-400 block mb-6">
            Services · 服務項目
          </span>
          <h2 className="font-display text-5xl lg:text-7xl tracking-tight text-[#101010]">
            What We Do
          </h2>
        </motion.div>

        {/* Service List */}
        <div className="border-t border-black/10">
          {services.map((service, idx) => (
            <motion.div
              key={service.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              viewport={{ once: true }}
              className="border-b border-black/10 group"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              data-cursor="View"
            >
              <div className="py-8 lg:py-10 cursor-pointer">
                <div className="flex items-baseline gap-6 lg:gap-10">
                  <span className="font-mono text-[11px] text-slate-300 w-8">{service.num}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <h3 className={`font-display text-3xl lg:text-5xl tracking-tight transition-all duration-500 ${
                        hoveredIdx === idx 
                          ? 'text-[#101010] italic' 
                          : hoveredIdx !== null 
                            ? 'text-black/20' 
                            : 'text-[#101010]'
                      }`}>
                        {service.title}
                      </h3>
                      <span className={`font-serif text-lg italic transition-all duration-500 ${
                        hoveredIdx === idx ? 'text-slate-500' : 'text-slate-300'
                      }`}>
                        {service.subtitle}
                      </span>
                    </div>
                    
                    {/* Expandable description on hover */}
                    <motion.div
                      initial={false}
                      animate={{ 
                        height: hoveredIdx === idx ? 'auto' : 0,
                        opacity: hoveredIdx === idx ? 1 : 0,
                        marginTop: hoveredIdx === idx ? 16 : 0
                      }}
                      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <p className="font-sans text-sm leading-relaxed text-slate-500 max-w-xl">
                        {service.desc}
                      </p>
                    </motion.div>
                  </div>
                  
                  <motion.div
                    animate={{ 
                      x: hoveredIdx === idx ? 0 : -10,
                      opacity: hoveredIdx === idx ? 1 : 0 
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowUpRight size={24} className="text-[#101010]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 font-serif italic text-xl text-slate-400 max-w-lg"
        >
          每個案子都是一支作品——從概念、燈光到交付，一起設計。
        </motion.p>
      </div>
    </section>
  );
};

export default function App() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { content, projects: contentProjects } = useContent();
  const projects = contentProjects?.length ? contentProjects : PROJECTS;
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const showLabels = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get('labels') === '1';
    } catch {
      return false;
    }
  }, []);

  const heroCoverSrc = content?.assets?.heroCover || '/images/hero-cover.jpg';

  const lightingEnabled = content?.features?.lighting !== false;
  const adminEnabled = content?.features?.admin === true;
  const worksArchiveStart = content?.site?.worksArchiveStart ?? 2016;
  
  return (
    <div className="bg-[#F5F5F3] selection:bg-black selection:text-white">
      <CustomCursor />

      <AnimatePresence>
        {selectedProject && (
          <ProjectCaseStudy project={selectedProject} onBack={() => setSelectedProject(null)} />
        )}
      </AnimatePresence>

      <main>
        {/* ===== HERO SECTION: Vogue Editorial × Cyberpunk ===== */}
        <section className="h-screen w-full relative overflow-hidden bg-[#101010]">
          {showLabels && <DebugLabel text={`HERO_COVER: ${heroCoverSrc}`} />}
          
          {/* Background Image with Slow Zoom Out */}
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
          >
            <img 
              src={heroCoverSrc}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            {/* Subtle dark overlay to ensure text readability */}
            <div className="absolute inset-0 bg-black/30" />
          </motion.div>

          {/* Four Corner Navigation */}
          {/* Top-Left: Logo */}
          <motion.div
            className="absolute top-8 left-8 lg:top-12 lg:left-12 z-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <MagneticButton className="pointer-events-auto">
              <a href="#/" data-cursor="首頁" className="font-display text-white text-xl lg:text-2xl tracking-wide">
                Harry Heng<span className="text-white/40">.</span>
              </a>
            </MagneticButton>
          </motion.div>

          {/* Top-Right: Menu */}
          <motion.div
            className="absolute top-8 right-8 lg:top-12 lg:right-12 z-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <div className="flex gap-6 lg:gap-10 font-mono text-[9px] lg:text-[10px] text-white/80 uppercase tracking-[0.25em]">
              <MagneticButton><a href="#work" data-cursor="瀏覽" className="hover:text-white transition-colors">Works</a></MagneticButton>
              <MagneticButton><a href="#/wedding" data-cursor="婚攝" className="hover:text-white transition-colors">Wedding</a></MagneticButton>
              <MagneticButton><a href="#/kunqu" data-cursor="崑曲" className="hover:text-white transition-colors">Kunqu</a></MagneticButton>
              <MagneticButton><a href="#/intimacy" data-cursor="親密" className="hover:text-white transition-colors">Intimacy</a></MagneticButton>
              <MagneticButton><a href="#about" data-cursor="了解" className="hover:text-white transition-colors">About</a></MagneticButton>
              <MagneticButton><a href="#contact" data-cursor="聯繫" className="hover:text-white transition-colors">Contact</a></MagneticButton>
              {lightingEnabled && <MagneticButton><a href="#/lighting" data-cursor="燈光" className="hover:text-white transition-colors">Light</a></MagneticButton>}
              {adminEnabled && <MagneticButton><a href="#/admin" data-cursor="管理" className="hover:text-white transition-colors">Admin</a></MagneticButton>}
            </div>
          </motion.div>

          {/* Bottom-Left: Location */}
          <motion.div
            className="absolute bottom-8 left-8 lg:bottom-12 lg:left-12 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <span className="font-mono text-[10px] text-white/60 uppercase tracking-[0.3em]">
              Kaohsiung · Since 2016
            </span>
          </motion.div>

          {/* Bottom-Right: Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 right-8 lg:bottom-12 lg:right-12 z-20 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-3"
            >
              <div className="w-12 lg:w-16 h-px bg-white/40" />
              <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">Scroll</span>
            </motion.div>
          </motion.div>

          {/* Center: Massive Hollow Outline Name */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              {/* Tagline above */}
              <motion.p
                className="font-mono text-[10px] lg:text-xs text-white/50 uppercase tracking-[0.5em] mb-8"
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.8, duration: 1 }}
              >
                Capturing the calm between light and soul
              </motion.p>

              {/* Hollow Outline Text - HARRY */}
              <motion.h1
                className="font-display text-[18vw] lg:text-[16vw] leading-[0.85] tracking-[0.02em] uppercase"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '1px rgba(255,255,255,0.7)',
                  textShadow: '0 0 60px rgba(255,255,255,0.1)'
                }}
                initial={{ opacity: 0, filter: "blur(20px)", y: 30 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ delay: 0.4, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Harry
              </motion.h1>

              {/* Solid Text - HENG (contrast) */}
              <motion.h1
                className="font-display text-[18vw] lg:text-[16vw] leading-[0.85] tracking-[0.02em] uppercase text-white/90"
                style={{
                  mixBlendMode: 'overlay'
                }}
                initial={{ opacity: 0, filter: "blur(20px)", y: 30 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ delay: 0.6, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Heng
              </motion.h1>

              {/* Subtitle below */}
              <motion.p
                className="mt-8 font-serif italic text-lg lg:text-2xl text-white/60 max-w-md mx-auto"
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 1.2, duration: 1 }}
              >
                光灑下的瞬間，真實與優雅共存。
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-black">
           <div className="border-r border-black p-8 lg:p-24 flex flex-col justify-between bg-white">
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="font-mono text-xs uppercase tracking-widest text-slate-400"
              >
                品牌宣言
              </motion.span>
              <div>
                 <motion.h2 
                   initial={{ opacity: 0, y: 50 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.8 }}
                   viewport={{ once: true }}
                   className="font-serif text-4xl lg:text-6xl italic leading-tight mb-12"
                 >
                   "在 Harry 的鏡頭下，
                   <br />
                   我重新看見最<span className="not-italic font-sans font-black uppercase">自然</span>的自己。"
                 </motion.h2>
                 <motion.p 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.6, delay: 0.2 }}
                   viewport={{ once: true }}
                   className="font-sans text-sm leading-relaxed max-w-md text-slate-600"
                 >
                    攝影師謝典恆，自2016年起累積超過八年的攝影經驗，
                    專注於以鏡頭捕捉人物與環境之間的深層連結。
                    作品風格強調情感與氛圍，善於刻畫瞬間的動人細節。
                 </motion.p>
              </div>
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
                className="flex items-center gap-8 mt-12"
              >
                 <Globe size={24} className="animate-spin-slow" />
                 <span className="font-mono text-[10px] uppercase tracking-widest">服務全球</span>
              </motion.div>
           </div>
           <div className="relative overflow-hidden">
              <motion.div
                initial={{ scale: 1.2, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
                className="h-full"
              >
                {showLabels && <DebugLabel text={`ABOUT_IMG: /images/about-portrait.jpg`} />}
                <DistortionImage 
                  src="/images/about-portrait.jpg" 
                  alt="形象攝影" 
                  className="h-full w-full grayscale hover:grayscale-0 transition-all duration-1000" 
                />
              </motion.div>
              <motion.div 
                className="absolute top-12 left-12 text-white mix-blend-difference"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                 {/* Subtle backdrop for readability on light backgrounds */}
                 <div className="absolute -inset-6 bg-gradient-to-br from-black/20 via-transparent to-transparent rounded-2xl blur-xl -z-10" />
                 <div className="font-mono text-[10px] uppercase tracking-[0.6em] text-white/70" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                   About Portrait
                 </div>
                 <div className="mt-4">
                   <div
                     className="font-display uppercase leading-[0.82]"
                     style={{
                       color: 'transparent',
                       WebkitTextStroke: '1px rgba(255,255,255,0.85)',
                       letterSpacing: '0.06em',
                       textShadow: '0 0 40px rgba(255,255,255,0.08), 0 4px 20px rgba(0,0,0,0.2)'
                     }}
                   >
                     <div className="text-[12vw] sm:text-[9vw] lg:text-6xl">Fashion</div>
                     <div className="text-[12vw] sm:text-[9vw] lg:text-6xl">Portrait</div>
                   </div>
                 </div>
              </motion.div>
           </div>
        </section>

        {/* Services */}
        <ServicesSection />

        {/* Instagram-Style Gallery Wall */}
        <InstagramGalleryWall />

        {/* Featured Work Grid */}
        <FeaturedWorkGrid projects={projects} />

        {/* Portfolio List */}
        <InteractivePortfolioList
          projects={projects}
          onSelect={setSelectedProject}
          archiveStartYear={worksArchiveStart}
          archiveEndYear={currentYear}
        />

        {/* Stats */}
        <StatsSection />

        {/* Process Section */}
        <section className="py-48 px-8 lg:px-24 bg-white relative overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-5 md:col-start-2">
                 <motion.span 
                   initial={{ opacity: 0 }}
                   whileInView={{ opacity: 1 }}
                   viewport={{ once: true }}
                   className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-8 block"
                 >
                   創作流程
                 </motion.span>
                 <motion.h3 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="font-serif text-4xl lg:text-5xl italic mb-12"
                 >
                   眼睛先傾聽，再去觀看。
                 </motion.h3>
                 <motion.div 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                   viewport={{ once: true }}
                   className="aspect-[4/5] bg-slate-100 overflow-hidden mb-12 rounded-3xl"
                 >
                    {showLabels && <DebugLabel text={`PROCESS1_IMG: /images/process-01.jpg`} />}
                    <DistortionImage 
                      src="/images/process-01.jpg" 
                      alt="牡丹亭" 
                      className="h-full w-full" 
                    />
                 </motion.div>
              </div>
              <div className="md:col-span-4 md:col-start-8 md:mt-48">
                 <motion.p 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="font-sans text-xs uppercase tracking-widest leading-loose text-slate-500 mb-12"
                 >
                   攝影啟蒙始於與無垢舞蹈劇場首席舞者鄭傑文老師的合作，
                   聚焦於舞台劇照與風格人像攝影，透過鏡頭將觀者引入每個故事的核心。
                 </motion.p>
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   transition={{ delay: 0.2 }}
                   viewport={{ once: true }}
                   className="aspect-square bg-slate-100 overflow-hidden rounded-3xl"
                 >
                    {showLabels && <DebugLabel text={`PROCESS2_IMG: /images/process-02.jpg`} />}
                    <DistortionImage 
                      src="/images/process-02.jpg" 
                      alt="紅樓詩社" 
                      className="w-full h-full" 
                    />
                 </motion.div>
              </div>
           </div>
           
           {/* Vertical Marquee */}
           <div className="absolute right-8 top-0 h-full hidden lg:flex flex-col justify-center gap-12 pointer-events-none">
              <motion.span 
                animate={{ y: [0, -50, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="font-sans font-black text-8xl uppercase tracking-tighter vertical-text opacity-5"
              >
                EDITORIAL
              </motion.span>
              <motion.span 
                animate={{ y: [0, 50, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="font-sans font-black text-8xl uppercase tracking-tighter vertical-text opacity-5"
              >
                FASHION
              </motion.span>
           </div>
        </section>

        {/* Contact Footer */}
        <footer id="contact" className="min-h-screen bg-black text-white flex flex-col justify-between p-8 lg:p-24 relative overflow-hidden">
           <FloatingParticles />
           
           <div className="relative z-10">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-mono text-xs uppercase tracking-[0.8em] text-slate-500 mb-24 block"
              >
                開始對話
              </motion.span>
              <div className="group overflow-hidden">
                 <MagneticButton strength={0.1}>
                   <a 
                     href="mailto:apple72899@gmail.com" 
                     data-cursor="發送"
                     className="font-sans font-black text-[10vw] lg:text-[12vw] uppercase leading-none tracking-tighter hover:italic transition-all inline-block"
                   >
                     <StaggerText text="聯繫我們" />
                   </a>
                 </MagneticButton>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="font-serif italic text-xl lg:text-2xl text-white/60 mt-12 max-w-lg"
              >
                讓我們用鏡頭，替你留下一段
                只屬於你的光影故事。
              </motion.p>
           </div>
           
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             viewport={{ once: true }}
             className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-12"
           >
              <div className="flex gap-16 font-mono text-[10px] uppercase tracking-widest">
                 <MagneticButton><a href="https://www.instagram.com/harrytwstudio" target="_blank" className="hover:text-slate-400 transition-colors">Instagram</a></MagneticButton>
                 <MagneticButton><a href="https://lin.ee/mnwrpoI" target="_blank" className="hover:text-slate-400 transition-colors">LINE</a></MagneticButton>
                 <MagneticButton><a href="https://www.facebook.com/harry7797" target="_blank" className="hover:text-slate-400 transition-colors">Facebook</a></MagneticButton>
              </div>
              <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">© {currentYear} Harry Heng Studio</p>
                 <p className="font-sans font-black text-xl mt-2 tracking-tighter">版權所有</p>
              </div>
           </motion.div>

           {/* Background Gradient */}
           <motion.div 
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px] pointer-events-none"
             animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
             transition={{ duration: 8, repeat: Infinity }}
           />
        </footer>
      </main>
      
      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0.2; }
          50% { transform: translateY(-50px); opacity: 0.5; }
        }
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
