"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { SOCIAL_LINKS } from "@/lib/constants"
import { ChevronLeft, ChevronRight } from "lucide-react"

const socialProofImages = [
  "/images/01-prova-social.png",
  "/images/02-prova-social.png",
  "/images/03-prova-social.png",
  "/images/04-prova-social.png",
  "/images/05-prova-social.png",
  "/images/06-prova-social.png",
  "/images/07-prova-social.png",
]

export function SocialProofSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const maxIndex = socialProofImages.length - 1
  const totalDots = socialProofImages.length

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex >= maxIndex ? 0 : prevIndex + 1))
  }, [maxIndex])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex <= 0 ? maxIndex : prevIndex - 1))
  }, [maxIndex])

  // Autoplay functionality with hover pause
  useEffect(() => {
    if (isHovering) return

    const interval = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(interval)
  }, [isHovering, nextSlide])

  return (
    <section className="py-20">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-bold tracking-tight mb-12 text-center text-text-primary">
          Uma comunidade que cresce com dados, não com hype.
        </h2>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {/* Telegram */}
          <a
            href={SOCIAL_LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center p-6 bg-surface/30 rounded-xl border border-border hover:border-[#229ED9]/50 transition-colors flex flex-col items-center gap-3"
          >
            <Image src="/images/telegram_logo.png" alt="Telegram" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-primary">+1.600</div>
            <div className="text-sm md:text-base text-muted-foreground">membros no Telegram</div>
          </a>

          {/* YouTube */}
          <a
            href={SOCIAL_LINKS.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center p-6 bg-surface/30 rounded-xl border border-border hover:border-[#FF0000]/50 transition-colors flex flex-col items-center gap-3"
          >
            <Image src="/images/youtube_logo.png" alt="YouTube" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-[#FF0000]">+2.800</div>
            <div className="text-sm md:text-base text-muted-foreground">inscritos no YouTube</div>
          </a>

          {/* Instagram */}
          <a
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center p-6 bg-surface/30 rounded-xl border border-border hover:border-[#E1306C]/50 transition-colors flex flex-col items-center gap-3"
          >
            <Image src="/images/instagram_logo.png" alt="Instagram" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-[#E1306C]">+819</div>
            <div className="text-sm md:text-base text-muted-foreground">seguidores no Instagram</div>
          </a>

          {/* Desde 2019 */}
          <div className="text-center p-6 bg-surface/30 rounded-xl border border-border flex flex-col items-center gap-3">
            <Image src="/images/desde_2022.png" alt="Desde 2019" width={48} height={48} className="object-contain" />
            <div className="text-3xl md:text-4xl font-extrabold text-text-primary">Desde 2019</div>
            <div className="text-sm md:text-base text-muted-foreground">construindo com a comunidade</div>
          </div>
        </div>

        {/* Subtítulo do Carrossel */}
        <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-8 text-center text-text-primary">
          O que dizem sobre nossos produtos
        </h3>

        {/* Carrossel de Provas Sociais */}
        <div 
          className="relative w-full max-w-5xl mx-auto px-4 md:px-12 group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Wrapper com Overflow hidden */}
          <div className="overflow-hidden py-4">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * 100}%)` 
              }}
            >
              {socialProofImages.map((src, index) => (
                <div 
                  key={src}
                  className="flex-shrink-0 w-full px-4 flex justify-center"
                >
                  <div className="relative h-[250px] sm:h-[350px] md:h-[450px] w-full max-w-4xl rounded-2xl bg-surface/30 border border-border/80 overflow-hidden flex items-center justify-center p-3 hover:border-primary/40 hover:bg-surface/40 transition-all duration-300 backdrop-blur-sm shadow-xl hover:shadow-primary/5">
                    <div className="relative w-full h-full">
                      <Image
                        src={src}
                        alt={`Prova social ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 80vw"
                        className="object-contain select-none transition-transform duration-500 hover:scale-[1.02]"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seta Esquerda (Chevron Left) */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-surface/80 hover:bg-primary border border-border hover:border-primary text-text-primary hover:text-background transition-all duration-300 shadow-xl opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center focus:outline-none cursor-pointer"
            aria-label="Depoimento anterior"
          >
            <ChevronLeft size={24} className="stroke-[2.5]" />
          </button>

          {/* Seta Direita (Chevron Right) */}
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-surface/80 hover:bg-primary border border-border hover:border-primary text-text-primary hover:text-background transition-all duration-300 shadow-xl opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center focus:outline-none cursor-pointer"
            aria-label="Próximo depoimento"
          >
            <ChevronRight size={24} className="stroke-[2.5]" />
          </button>

          {/* Dots Indicadores */}
          {totalDots > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalDots }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentIndex === index 
                      ? "w-8 bg-primary shadow-sm shadow-primary/50" 
                      : "w-2.5 bg-border hover:bg-text-muted"
                  }`}
                  aria-label={`Ir para depoimento ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
