import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Flame, Heart } from 'lucide-react'
import AnimatedSection from '../../components/ui/AnimatedSection'
import { FALLBACK_IMAGE_URL } from '../../utils/constants'

// ── Data ──────────────────────────────────────────────────────────────────────
const VALUES = [
  {
    icon: Leaf,
    title: 'Fresh Ingredients',
    desc: 'Every dish starts with locally sourced, seasonal produce — no shortcuts, no compromises.',
  },
  {
    icon: Flame,
    title: 'Traditional Recipes',
    desc: 'Our recipes have been passed down through generations, preserving the soul of Sri Lankan cooking.',
  },
  {
    icon: Heart,
    title: 'Made with Love',
    desc: 'From the kitchen to your table, every plate is prepared with genuine care and attention.',
  },
]

// ── Hero ──────────────────────────────────────────────────────────────────────
function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100
                        dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div aria-hidden="true"
           className="absolute -top-24 -right-24 w-96 h-96 rounded-full
                      bg-amber-200/30 dark:bg-amber-900/20 blur-3xl pointer-events-none" />
      <div aria-hidden="true"
           className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full
                      bg-orange-200/30 dark:bg-orange-900/20 blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
        <AnimatedSection delay={0}>
          <span className="inline-block text-amber-600 dark:text-amber-400 text-sm font-semibold
                           uppercase tracking-widest mb-4">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold
                         text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
            Authentic Flavors,{' '}
            <span className="text-amber-500">Rooted in Tradition</span>
          </h1>
          <p className="mt-5 text-gray-500 dark:text-gray-400 text-base md:text-lg
                        max-w-2xl mx-auto leading-relaxed">
            Nestled in the heart of Sri Lanka, we've been serving the community
            with honest, authentic Chinese cuisine since the very beginning.
          </p>
        </AnimatedSection>
      </div>
    </section>
  )
}

// ── Story Section ─────────────────────────────────────────────────────────────
function StorySection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

        {/* Image */}
        <AnimatedSection delay={0} y={30}>
          <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/3]
                          bg-gray-100 dark:bg-gray-800">
            <img
              src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=80"
              alt="Our restaurant kitchen with fresh spices and ingredients"
              onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
              className="w-full h-full object-cover"
            />
          </div>
        </AnimatedSection>

        {/* Text */}
        <AnimatedSection delay={0.15} y={30}>
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              A Kitchen Built on Heritage
            </h2>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Senari Chinese Hotel was born from a simple belief: that the best food
              comes from the best memories. Our founder grew up watching family elders
              prepare authentic Chinese recipes at dawn, slow-cook broths for hours, and set the table
              with pride. That spirit lives in every dish we serve today.
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              We source our ingredients from trusted local farmers in the Southern
              Province — coconut, lemongrass, pandan, and hand-picked chilies that give
              our food its unmistakable depth. Nothing is pre-packaged. Nothing is rushed.
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              Whether you're stopping by for a quick Kottu or settling in for a full
              Rice &amp; Curry spread, we want every visit to feel like coming home.
            </p>
            <Link
              to="/menu"
              className="self-start inline-flex items-center gap-2
                         bg-amber-500 hover:bg-amber-600 active:scale-95
                         text-white font-semibold px-6 py-3 rounded-full
                         shadow-md shadow-amber-200 dark:shadow-amber-900/30
                         transition-all duration-150 text-sm mt-2"
            >
              Explore Our Menu <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedSection>

      </div>
    </section>
  )
}

// ── Values Section ────────────────────────────────────────────────────────────
function ValuesSection() {
  return (
    <section className="bg-amber-50 dark:bg-gray-800/50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <AnimatedSection className="text-center mb-10">
          <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold uppercase tracking-widest mb-2">
            What We Stand For
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Our Commitments
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {VALUES.map(({ icon: Icon, title, desc }, index) => (
            <AnimatedSection key={title} delay={index * 0.12}>
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 flex flex-col gap-3
                              border border-gray-100 dark:border-gray-800 shadow-sm
                              hover:shadow-md transition-shadow duration-200 h-full">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-900/30
                                flex items-center justify-center">
                  <Icon size={22} className="text-amber-500" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Gallery Strip ─────────────────────────────────────────────────────────────
function GalleryStrip() {
  const imgs = [
    { src: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80', alt: 'Sri Lankan spices' },
    { src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop&q=80', alt: 'Freshly cooked rice and curry' },
    { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', alt: 'Restaurant dining table' },
  ]
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {imgs.map(({ src, alt }, index) => (
          <AnimatedSection key={alt} delay={index * 0.1}>
            <div className="rounded-3xl overflow-hidden aspect-[4/3]
                            bg-gray-100 dark:bg-gray-800 shadow-sm">
              <img
                src={src}
                alt={alt}
                onError={(e) => { e.target.src = FALLBACK_IMAGE_URL }}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <StorySection />
      <ValuesSection />
      <GalleryStrip />
    </>
  )
}
