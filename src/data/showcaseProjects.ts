import imgCrann from '@/assets/images/CrannBethadh.png'
import imgCrest from '@/assets/images/Screenshot 2023-05-09 at 15.22.04.png'
import imgSmudge from '@/assets/images/SMUDGE.png'
import imgUchronia from '@/assets/images/MAIN_NEW.jpg.webp'
import imgMechanics from '@/assets/images/box_mechanics_large.png.webp'
import imgNastro from '@/assets/images/NASTRO_VHS_GUI.jpg.webp'
import imgCattaneo from '@/assets/images/UPRIGHTPIANO_UI_Pag1_31b62a02-8109-4087-9c1f-92af83a54e84.jpg.webp'
import imgUap from '@/assets/images/uap_artwork_2_1920x1080_e3395e53-c96c-44e0-8820-fa5f7c66eb53.png'
import imgSoundboard from '@/assets/images/soundboard.png'

export interface ShowcaseProject {
  title: string
  description: string
  tags: string[]
  link: string
  image?: string
  video?: string
  github?: string
}

export const showcaseProjects: ShowcaseProject[] = [
  {
    title: 'Crann Bethadh',
    description:
      'A convolution-based plugin with saturation processing and internal oversampling — warm, fuzzy tails that never sound harsh.',
    tags: ['C++', 'JUCE', 'DSP'],
    link: 'https://github.com/vewilya/Crann-Bethadh',
    image: imgCrann,
    video: 'https://player.vimeo.com/video/815241746',
    github: 'https://github.com/vewilya/Crann-Bethadh',
  },
  {
    title: 'CRest',
    description:
      'An analog filter emulation in C++ — a growing circuit modelling library with filters, saturators and compressors.',
    tags: ['C++', 'JUCE', 'Analog Modelling'],
    link: 'https://player.vimeo.com/video/825002682',
    image: imgCrest,
    video: 'https://player.vimeo.com/video/825002682',
  },
  {
    title: 'Pluviat',
    description:
      'A granular spatial delay plugin in AU/VST3 format with a code-based UI built with Vite, Svelte and Elementary Audio.',
    tags: ['Svelte', 'Elementary Audio', 'Vite'],
    link: 'https://www.youtube.com/embed/0yls1c7dIWk',
    video: 'https://www.youtube.com/embed/0yls1c7dIWk',
  },
  {
    title: 'Bolger Blødge',
    description:
      'A tape emulation experiment using Elementary Audio — inspired by a lifelong fascination with tape machines and analog sound.',
    tags: ['Elementary Audio', 'Web Audio', 'Svelte'],
    link: 'https://player.vimeo.com/video/819110999',
    video: 'https://player.vimeo.com/video/819110999',
  },
  {
    title: 'Smudge',
    description:
      'A saturation playground to prototype wave shaping functions and saturation algorithms interactively.',
    tags: ['JavaScript', 'Web Audio', 'DSP'],
    link: 'https://vewilya.github.io/smudge/',
    image: imgSmudge,
    github: 'https://github.com/vewilya/smudge-saturation-playground',
  },
  {
    title: 'Uchronia',
    description:
      'A granular synthesis instrument for Kontakt 6 with 4 independent granular engines, arpeggiators and an Entropy randomizer.',
    tags: ['KSP', 'Kontakt', 'HAVE Audio'],
    link: 'https://haveaudio.com/collections/virtual-instruments/products/uchronia',
    image: imgUchronia,
    video: 'https://www.youtube.com/embed/9REZUVG1Kf4',
  },
  {
    title: 'Mechanics of Noise',
    description:
      'Sound design and instrument programming for the Kontakt library Mechanics of Noise, HAVE Audio.',
    tags: ['KSP', 'Kontakt', 'HAVE Audio'],
    link: 'https://haveaudio.com/collections/virtual-instruments/products/bundle-mechanics-of-noise',
    image: imgMechanics,
    video: 'https://www.youtube.com/embed/i4NQcJf-Je0',
  },
  {
    title: 'Nastro VHS',
    description:
      'Kontakt scripting for Nastro VHS, HAVE Audio — a powerful time machine with lo-fi devices from reel-to-reel tape recorders to VHS & Betamax.',
    tags: ['KSP', 'Kontakt', 'HAVE Audio'],
    link: 'https://haveaudio.com/collections/virtual-instruments/products/nastro-vhs',
    image: imgNastro,
    video: 'https://www.youtube.com/embed/ZUFtWVLxC5s',
  },
  {
    title: 'Cattaneo Pianos',
    description:
      'Kontakt scripting for Cattaneo Pianos, HAVE Audio — an intimate upright piano, an authentic electric piano, plus an exclusive Cassette bonus instrument.',
    tags: ['KSP', 'Kontakt', 'HAVE Audio'],
    link: 'https://haveaudio.com/collections/virtual-instruments/products/cattaneo-pianos-bundle',
    image: imgCattaneo,
    video: 'https://www.youtube.com/embed/II1qb51GYTI',
  },
  {
    title: 'UAP',
    description:
      'Additional scripting for UAP, HAVE Audio — including DILATION and CASE modules with full FX randomization.',
    tags: ['KSP', 'Kontakt', 'HAVE Audio'],
    link: 'https://haveaudio.com/collections/virtual-instruments/products/uap-unique-audio-plugin',
    image: imgUap,
    video: 'https://www.youtube.com/embed/dCMq3MQ0bNE',
  },
  {
    title: 'SoundBoard',
    description:
      'A browser-based audio recording app for musicians and podcasters — one-click recording, waveform visualization, and project-based organization, all client-side.',
    tags: ['JavaScript', 'Web Audio', 'Node.js'],
    link: 'https://github.com/vewilya/SoundBoard',
    image: imgSoundboard,
    github: 'https://github.com/vewilya/SoundBoard',
  },
  {
    title: 'Out of Paradise',
    description:
      'Music composition and production for the feature film — winner of the Golden Goblet Award at the Shanghai International Film Festival.',
    tags: ['Film Score', 'Composition', 'Production'],
    link: 'https://www.swissfilms.ch/en/movie/out-of-paradise/29ec0d91e4ad4e5c82c5ece2077184dc',
    video: 'https://www.youtube.com/embed/boG5wGOmjI0',
  },
  {
    title: 'When We Disappear',
    description:
      'Music composition and sound design for a story-driven, reality-inspired puzzle platformer by Inlusio Interactive.',
    tags: ['Video Game', 'Composition', 'Sound Design'],
    link: 'https://www.inlusio.com/en/when-we-disappear',
    video: 'https://www.youtube.com/embed/ppcfQRU83_c',
  },
  {
    title: 'Rückkehr nach Alaska',
    description:
      'Co-composer and sound designer for an SRF DOK nature documentary featuring the landscape and wildlife of Alaska.',
    tags: ['Documentary', 'Composition', 'Sound Design'],
    link: 'https://www.srf.ch/play/tv/dok/video/rueckkehr-nach-alaska---reno-sommerhalder-im-urwald-von-tongass?urn=urn:srf:video:30d65a91-81d9-4b1e-82a9-8f01b2837fa1',
    video: 'https://www.youtube.com/embed/Wi3MqGcvXww',
  },
]

export function getRandomProjects(count: number): ShowcaseProject[] {
  const shuffled = [...showcaseProjects].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
