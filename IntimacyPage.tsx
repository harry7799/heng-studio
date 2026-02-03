import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Heart, Users, Dog } from 'lucide-react';

// Generate intimacy images from subfolders: bestie/family/pet
const generateIntimacyImages = () => {
  return [
    { src: `/images/intimacy/bestie/01.jpg`, id: 0, category: 'bestie' },
    { src: `/images/intimacy/family/02.jpg`, id: 1, category: 'family' },
    { src: `/images/intimacy/pet/03.jpg`, id: 2, category: 'pet' },
    { src: `/images/intimacy/pet/04.jpg`, id: 3, category: 'pet' },
  ];
};

const IntimacyPage = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic SEO title
  useEffect(() => {
    const originalTitle = document.title;
    document.title = '親密寫真 Intimacy | Harry Heng Studio';
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

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -25]);

  const smoothY1 = useSpring(y1, { stiffness: 100, damping: 30 });
  const smoothY2 = useSpring(y2, { stiffness: 100, damping: 30 });

  const intimacyImages = useMemo(() => generateIntimacyImages(), []);
  
  const filteredImages = activeFilter === 'all' 
    ? intimacyImages 
    : intimacyImages.filter(img => img.category === activeFilter);

  const filters = [
    { id: 'all', label: 'All', icon: Heart },
    { id: 'bestie', label: '閨蜜', icon: Users },
    { id: 'family', label: '全家福', icon: Users },
    { id: 'pet', label: '寵物', icon: Dog },
  ];

  const services = [
    { num: "01", title: "Bestie", subtitle: "閨蜜寫真", desc: "和最好的朋友一起，留下青春最燦爛的笑容。輕鬆自然的氛圍，捕捉真摯的友誼。", icon: Users },
    { num: "02", title: "Family", subtitle: "全家福", desc: "記錄家庭的溫馨時刻，從三代同堂到小家庭，每個成員都是畫面中最重要的主角。", icon: Heart },
    { num: "03", title: "Pet", subtitle: "寵物寫真", desc: "毛小孩也是家人！專業的寵物攝影，捕捉牠們最可愛、最自然的表情與動作。", icon: Dog },
  ];

  return (
    <div className="min-h-screen bg-[#fdfcfa] text-[#2a2a2a] selection:bg-rose-200 selection:text-rose-900">
      {/* Navigation */}
      <motion.div
        className="fixed top-8 left-8 lg:top-12 lg:left-12 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <a href="#/" className="flex items-center gap-3 text-[#2a2a2a]/50 hover:text-[#2a2a2a] transition-colors group">
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
        <span className="font-display text-xl tracking-wide text-[#2a2a2a]">
          Harry Heng<span className="text-[#2a2a2a]/30">.</span>
        </span>
      </motion.div>

      {/* Hero */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-[#fdfcfa] to-amber-50/50" />
        
        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full bg-rose-100/40 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-1/3 right-1/4 w-32 h-32 rounded-full bg-amber-100/40 blur-2xl"
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-8"
        >
          {/* Icons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4 mb-8"
          >
            <Heart className="w-6 h-6 text-rose-300" strokeWidth={1.5} />
            <Users className="w-6 h-6 text-amber-400" strokeWidth={1.5} />
            <Dog className="w-6 h-6 text-rose-400" strokeWidth={1.5} />
          </motion.div>

          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-[10px] uppercase tracking-[0.5em] text-rose-400 block mb-8"
          >
            Intimate Portraits · 親密時刻
          </motion.span>
          
          <motion.h1
            className="font-display text-[12vw] lg:text-[10vw] leading-[0.9] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            <span className="block bg-gradient-to-r from-rose-400 via-amber-400 to-rose-300 bg-clip-text text-transparent">
              Intimacy
            </span>
          </motion.h1>
          
          <motion.p
            className="mt-8 font-serif italic text-lg lg:text-xl text-[#2a2a2a]/50 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            閨蜜的歡笑、家人的溫暖、毛孩的陪伴——<br/>
            每一個珍貴的連結，都值得被永恆記錄。
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
            <div className="w-px h-12 bg-gradient-to-b from-rose-300/50 to-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#2a2a2a]/30">Scroll</span>
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
            <h2 className="font-display text-4xl lg:text-6xl tracking-tight">拍攝類型</h2>
          </motion.div>

          <div className="border-t border-[#2a2a2a]/10">
            {services.map((service, idx) => (
              <motion.div
                key={service.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="border-b border-[#2a2a2a]/10 py-8 group cursor-pointer"
              >
                <div className="flex items-baseline gap-6">
                  <span className="font-mono text-[11px] text-[#2a2a2a]/30">{service.num}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <h3 className="font-display text-2xl lg:text-4xl tracking-tight group-hover:italic transition-all">
                        {service.title}
                      </h3>
                      <span className="font-serif text-base italic text-[#2a2a2a]/40 group-hover:text-rose-400 transition-colors">
                        {service.subtitle}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#2a2a2a]/50 max-w-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      {service.desc}
                    </p>
                  </div>
                  <service.icon size={20} className="text-[#2a2a2a]/20 group-hover:text-rose-400 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section ref={containerRef} className="py-32 px-8 lg:px-16 bg-[#fdfcfa]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto mb-12"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#2a2a2a]/40 block mb-4">
            Portfolio
          </span>
          <h2 className="font-display text-5xl lg:text-7xl tracking-tight mb-8">Gallery</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-widest border transition-all ${
                  activeFilter === filter.id
                    ? 'border-rose-400 text-rose-500 bg-rose-50'
                    : 'border-[#2a2a2a]/10 text-[#2a2a2a]/50 hover:border-[#2a2a2a]/30'
                }`}
              >
                <filter.icon size={14} />
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          <motion.div className="flex flex-col gap-10" style={{ y: smoothY1 }}>
            {filteredImages.filter((_, i) => i % 2 === 0).map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
          <motion.div className="flex flex-col gap-10 mt-0 md:mt-16" style={{ y: smoothY2 }}>
            {filteredImages.filter((_, i) => i % 2 === 1).map((img, i) => (
              <GalleryImage key={img.id} src={img.src} index={i + 1} onClick={() => setSelectedImage(img.src)} />
            ))}
          </motion.div>
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-24 text-[#2a2a2a]/40">
            <p className="font-serif text-xl">即將上線更多作品</p>
            <p className="font-mono text-xs mt-4 uppercase tracking-widest">Coming Soon</p>
          </div>
        )}
      </section>

      {/* Contact */}
      <section className="py-32 px-8 lg:px-16 bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-5xl lg:text-7xl tracking-tight text-[#2a2a2a] mb-8"
          >
            Book Your Session
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="font-serif italic text-xl text-[#2a2a2a]/50 mb-12 max-w-lg mx-auto"
          >
            讓我們一起記錄生命中最珍貴的連結
          </motion.p>
          <motion.a
            href="mailto:apple72899@gmail.com"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 font-mono text-sm uppercase tracking-widest text-rose-500 hover:text-[#2a2a2a] transition-colors group"
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
  const aspects = ['aspect-[3/4]', 'aspect-square'];
  const aspect = aspects[index % 2];

  return (
    <motion.div
      className={`relative overflow-hidden ${aspect} cursor-pointer group`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      viewport={{ once: true, margin: "-10%" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.img
        src={src}
        alt={`Intimacy ${index + 1}`}
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

export default IntimacyPage;
