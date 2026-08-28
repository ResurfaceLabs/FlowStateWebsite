import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navbar } from './Navbar';
import { EmailCapturePanel } from './EmailCapturePanel';
import { ShareToast } from './ShareToast';
import { HERO_BG_IMAGE_JPG, HERO_BG_IMAGE_WEBP } from '../config';
import { getCountry, submitEmailInBackground, triggerDownload } from '../lib/downloadFlow';

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  async function handleDownloadClick(email: string | null) {
    if (email) {
      const country = await getCountry(); // safe to await — getCountry() always resolves, never throws
      submitEmailInBackground(email, country); // stays fire-and-forget, NOT awaited
    }
    triggerDownload();
    setShowEmailPanel(false);
    setShowToast(true);
  }

  return (
    <section ref={sectionRef} className="relative min-h-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ y: bgY }}
        className="absolute inset-0 z-0"
      >
        <picture>
          <source srcSet={HERO_BG_IMAGE_WEBP} type="image/webp" />
          <img
            src={HERO_BG_IMAGE_JPG}
            alt=""
            className="h-full w-full object-cover object-bottom"
          />
        </picture>
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/30 via-background/10 to-background/70" />

      <div className="relative z-10">
        <Navbar />
      </div>

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 mt-16 flex flex-col items-center px-4 text-center md:mt-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="liquid-glass mb-6 flex items-center gap-2 rounded-lg px-3 py-2"
        >
          <span className="rounded-md bg-foreground px-2 py-0.5 text-sm font-medium text-background">
            New
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            100% Offline. Zero Servers.
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-3 text-5xl font-medium leading-tight tracking-[-2px] md:text-7xl md:leading-[1.15]"
        >
          Speak Your Mind.
          <br />
          Stay Completely <span className="font-serif italic font-normal">Private</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 text-lg font-normal leading-6 opacity-90 text-hero-subtitle"
        >
          FlowState turns your voice into text, instantly — <br />
          no internet, no cloud, no one listening but you.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowEmailPanel(true)}
          className="rounded-full bg-foreground px-8 py-3.5 text-base font-medium text-background"
        >
          Download for macOS
        </motion.button>
      </motion.div>

      <div className="pointer-events-none absolute bottom-0 z-[2] h-40 w-full bg-gradient-to-t from-background to-transparent" />

      {showEmailPanel && (
        <EmailCapturePanel
          onSubmit={(email) => handleDownloadClick(email)}
          onSkip={() => handleDownloadClick(null)}
          onClose={() => setShowEmailPanel(false)}
        />
      )}

      {showToast && <ShareToast onDismiss={() => setShowToast(false)} />}
    </section>
  );
}
