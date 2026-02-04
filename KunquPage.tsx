import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

// Generate kunqu images from the folder
const generateKunquImages = () => {
  const images: { src: string; id: number }[] = [];
  // Known files in /images/kunqu/: 01, 02, 03, 003, 005, 009, 013, etc.
  const knownFiles = [
    '01', '02', '03', '003', '005', '009', '013', '014', '017', '019',
    '023', '025', '026', '029', '031', '033', '034', '040', '041', '047',
    '049', '056', '059', '060', '062', '067', '069', '073', '075', '076',
    '081', '086', '241'
  ];
  knownFiles.forEach((f, i) => {
    images.push({ src: `/images/kunqu/${f}.jpg`, id: i });
  });
  return images;
};

const KunquPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic SEO title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '崑曲藝術 Kunqu | Harry Heng Studio';
    return () => { document.title = originalTitle; };
  }, []);

  // Scroll lock when lightbox is open
  useEffect(() => {
    if (selectedImage) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [selectedImage]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 });
  const smoothY2 = useSpring(y2, { stiffness: 100, damping: 30 });
  const smoothY3 = useSpring(y3, { stiffness: 100, damping: 30 });

  const kunquImages = useMemo(() => generateKunquImages(), []);
  
  const col1 = kunquImages.filter((_, i) => i % 3 === 0);
  const col2 = kunquImages.filter((_, i) => i % 3 === 1);
  const col3 = kunquImages.filter((_, i) => i % 3 === 2);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black">
      {/* Navigation */}
      <motion.div
        className="fixed top-8 left-8 lg:top-12 lg:left-12 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <a href="#/" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Back</span>
        </a>
      </motion.div>

      <motion.div
        className="fixed top-8 right-8 lg:top-12 lg:right-12 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <span className="font-display text-xl tracking-wide">
          Harry Heng<span className="text-white/30">.</span>
        </span>
      </motion.div>

      {/* Hero */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0505] via-[#0a0a0a] to-[#0a0a0a]" />
        
        {/* Decorative Chinese pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-white/20 rotate-45" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 border border-white/10 rotate-12" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="relative z-10 text-center px-8"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber-500/60 block mb-8"
          >
            Kunqu Opera · 崑曲攝影
          </motion.span>
          
          {/* Traditional Chinese characters with modern treatment */}
          <motion.h1
            className="font-serif text-[20vw] lg:text-[15vw] leading-[0.85] tracking-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1.2 }}
          >
            <span className="block text-white/90">遊園</span>
            <span 
              className="block"
              style={{
                color: 'transparent',
                WebkitTextStroke: '1px rgba(255,255,255,0.25)',
              }}
            >
              驚夢
            </span>
          </motion.h1>
          
          <motion.p
            className="mt-12 font-serif italic text-lg lg:text-xl text-white/40 max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            以鏡頭捕捉崑曲之美，<br/>在光影流轉間，凝結六百年的優雅與詩意。
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-px h-16 bg-gradient-to-b from-amber-500/50 to-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">Scroll</span>
          </motion.div>
        </motion.div>
      </section>

      {/* About */}
      <section className="py-32 px-8 lg:px-16 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-16"
          >
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber-500/60 block mb-6">
                About
              </span>
              <h2 className="font-display text-4xl lg:text-5xl tracking-tight mb-8">
                關於崑曲攝影
              </h2>
            </div>
            <div className="space-y-6 text-white/60 leading-relaxed">
              <p>
                崑曲，被譽為「百戲之祖」，是中國最古老的戲曲藝術形式之一。
                透過攝影，我希望捕捉演員在舞台上那些轉瞬即逝的優雅瞬間——
                一個眼神、一個手勢、一抹微笑，都承載著數百年的文化傳承。
              </p>
              <p>
                與拾翠坊崑劇團的合作，讓我有機會深入了解崑曲的美學精髓。
                從《牡丹亭》的浪漫夢境到《長生殿》的悲歡離合，
                每一場演出都是一次與傳統對話的機會。
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery */}
      <section ref={containerRef} className="py-32 px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto mb-20"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/30 block mb-4">
            Portfolio · 作品集
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <h2 className="font-display text-5xl lg:text-7xl tracking-tight">Gallery</h2>
            <p className="font-serif italic text-lg text-white/40 max-w-sm">
              Capturing the essence of 600 years of artistic tradition.
            </p>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          <motion.div className="flex flex-col gap-10" style={{ y: smoothY1 }}>
            {col1.map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
          <motion.div className="flex flex-col gap-10 mt-0 md:mt-32" style={{ y: smoothY2 }}>
            {col2.map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i + col1.length} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
          <motion.div className="flex flex-col gap-10 mt-0 md:mt-16" style={{ y: smoothY3 }}>
            {col3.map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i + col1.length + col2.length} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-32 px-8 lg:px-16 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl lg:text-7xl tracking-tight mb-8"
          >
            合作洽詢
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="font-serif italic text-xl text-white/40 mb-12"
          >
            劇團、演出、藝術節合作歡迎聯繫
          </motion.p>
          <motion.a
            href="mailto:apple72899@gmail.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-amber-500 hover:text-white transition-colors group"
          >
            Contact
            <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </motion.a>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-8"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              src={selectedImage}
              alt="Selected"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-full max-h-full object-contain"
            />
            <button className="absolute top-8 right-8 text-white/60 hover:text-white">
              <span className="font-mono text-xs uppercase tracking-widest">Close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GalleryImage = ({ src, index, onClick }: { src: string; index: number; onClick: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const aspects = ['aspect-[2/3]', 'aspect-[3/5]', 'aspect-[1/2]'];
  const aspect = aspects[index % 3];

  return (
    <motion.div
      className={`relative overflow-hidden ${aspect} cursor-pointer group`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: (index % 3) * 0.1 }}
      viewport={{ once: true, margin: "-10%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.img
        src={src}
        alt={`Kunqu ${index + 1}`}
        className="w-full h-full object-cover"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.6 }}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500" />
      <motion.div
        className="absolute bottom-4 left-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0.4 }}
      >
        <span className="font-mono text-[9px] text-white/80 tracking-widest uppercase drop-shadow-lg">
          {String(index + 1).padStart(2, '0')}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default KunquPage;
