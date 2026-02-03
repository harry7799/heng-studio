import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Heart } from 'lucide-react';

// Generate wedding images from the folder
const generateWeddingImages = () => {
  const images: { src: string; id: number }[] = [];
  // Known files: 01, 02, 03, 06, then 089-237 range
  [1, 2, 3, 6].forEach((n, i) => {
    images.push({ src: `/images/wedding/${String(n).padStart(2, '0')}.jpg`, id: i });
  });
  for (let n = 89; n <= 160; n++) {
    // files in the folder use three-digit names like 089.jpg
    const name = String(n).padStart(3, '0');
    images.push({ src: `/images/wedding/${name}.jpg`, id: images.length });
  }
  return images.slice(0, 24);
};

const WeddingPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -90]);

  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 });
  const smoothY2 = useSpring(y2, { stiffness: 100, damping: 30 });
  const smoothY3 = useSpring(y3, { stiffness: 100, damping: 30 });

  const weddingImages = useMemo(() => generateWeddingImages(), []);
  
  const col1 = weddingImages.filter((_, i) => i % 3 === 0);
  const col2 = weddingImages.filter((_, i) => i % 3 === 1);
  const col3 = weddingImages.filter((_, i) => i % 3 === 2);

  const services = [
    { num: "01", title: "Wedding Day", subtitle: "婚禮紀錄", desc: "完整記錄婚禮當天的每一個珍貴時刻，從準備、儀式到宴會。" },
    { num: "02", title: "Pre-Wedding", subtitle: "婚紗攝影", desc: "量身打造專屬於你們的愛情故事，在最美的場景中留下永恆印記。" },
    { num: "03", title: "Engagement", subtitle: "訂婚紀錄", desc: "傳統與現代的完美融合，記錄兩個家庭相遇的溫馨時刻。" },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1a1a] selection:bg-rose-200 selection:text-rose-900">
      {/* Navigation - Four Corner */}
      <motion.div
        className="fixed top-8 left-8 lg:top-12 lg:left-12 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <a href="#/" className="flex items-center gap-3 text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition-colors group">
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
        <span className="font-display text-xl tracking-wide text-[#1a1a1a]">
          Harry Heng<span className="text-[#1a1a1a]/30">.</span>
        </span>
      </motion.div>

      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 via-[#faf9f7] to-[#faf9f7]" />
        
        {/* Floating hearts */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/4"
        >
          <Heart className="w-6 h-6 text-rose-200" fill="currentColor" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-8"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-[10px] uppercase tracking-[0.5em] text-rose-400 block mb-8"
          >
            Wedding Photography
          </motion.span>
          
          <motion.h1
            className="font-display text-[15vw] lg:text-[12vw] leading-[0.9] tracking-tight"
            style={{
              color: 'transparent',
              WebkitTextStroke: '1px rgba(26,26,26,0.3)',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            Wedding
          </motion.h1>
          
          <motion.p
            className="mt-8 font-serif italic text-xl lg:text-2xl text-[#1a1a1a]/50 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            執子之手，與子偕老
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-px h-12 bg-gradient-to-b from-rose-300 to-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#1a1a1a]/30">Scroll</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Services */}
      <section className="py-32 px-8 lg:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-rose-400 block mb-4">
              Services
            </span>
            <h2 className="font-display text-4xl lg:text-6xl tracking-tight">What We Offer</h2>
          </motion.div>

          <div className="border-t border-[#1a1a1a]/10">
            {services.map((service, idx) => (
              <motion.div
                key={service.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="border-b border-[#1a1a1a]/10 py-8 group cursor-pointer"
              >
                <div className="flex items-baseline gap-6">
                  <span className="font-mono text-[11px] text-[#1a1a1a]/30">{service.num}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <h3 className="font-display text-2xl lg:text-4xl tracking-tight group-hover:italic transition-all">
                        {service.title}
                      </h3>
                      <span className="font-serif text-base italic text-[#1a1a1a]/40 group-hover:text-rose-400 transition-colors">
                        {service.subtitle}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#1a1a1a]/50 max-w-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      {service.desc}
                    </p>
                  </div>
                  <ArrowUpRight size={20} className="text-[#1a1a1a]/20 group-hover:text-rose-400 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section ref={containerRef} className="py-32 px-8 lg:px-16 bg-[#faf9f7]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto mb-20"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#1a1a1a]/40 block mb-4">
            Portfolio
          </span>
          <h2 className="font-display text-5xl lg:text-7xl tracking-tight">Gallery</h2>
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
          <motion.div className="flex flex-col gap-10" style={{ y: smoothY1 }}>
            {col1.map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
          <motion.div className="flex flex-col gap-10 mt-0 md:mt-20" style={{ y: smoothY2 }}>
            {col2.map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i + col1.length} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
          <motion.div className="flex flex-col gap-10 mt-0 md:mt-10" style={{ y: smoothY3 }}>
            {col3.map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i + col1.length + col2.length} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-32 px-8 lg:px-16 bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl lg:text-7xl tracking-tight mb-8"
          >
            Let's Create Your Story
          </motion.h2>
          <motion.a
            href="mailto:apple72899@gmail.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-rose-300 hover:text-white transition-colors group"
          >
            Contact Us
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
  const aspects = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]'];
  const aspect = aspects[index % 3];

  return (
    <motion.div
      className={`relative overflow-hidden ${aspect} cursor-pointer group`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
      viewport={{ once: true, margin: "-10%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.img
        src={src}
        alt={`Wedding ${index + 1}`}
        className="w-full h-full object-cover"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ duration: 0.6 }}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
      <motion.div
        className="absolute bottom-4 left-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0.3 }}
      >
        <span className="font-mono text-[9px] text-white/80 tracking-widest uppercase drop-shadow-lg">
          {String(index + 1).padStart(2, '0')}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default WeddingPage;
