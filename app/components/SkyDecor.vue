<script setup lang="ts">
/**
 * Decoration behind the page: hairline orbit arcs with small orbs travelling
 * along them, a dashed planetary ring turning very slowly, a tick-mark bezel
 * with readouts as the instrument part.
 * Echoes the lines in the pictures without competing with them: everything
 * is one pixel wide, in the page's line colour, at low opacity, and kept to
 * the edges so the text column stays clear.
 *
 * One SVG, scaled to cover the window. The motion is SVG's own (animateMotion
 * and CSS rotations); under prefers-reduced-motion it is left out entirely.
 */
const reduced = ref(false);
onMounted(() => {
  const q = matchMedia("(prefers-reduced-motion: reduce)");
  reduced.value = q.matches;
  q.addEventListener("change", () => (reduced.value = q.matches));
});

/**
 * The bezel: an arc of fine ticks around a centre below the lower left
 * corner, like the scale on an instrument's dial. Every tenth tick is
 * longer and carries a small reading.
 */
// Drawn in its own SVG pinned to the window's lower left corner, in CSS
// pixels, so the centre is the corner itself on every screen.
const BEZEL = { size: 320, cx: 0, cy: 320, r: 292, from: -3, to: -87 }; // degrees from 3 o'clock
const bezelPoint = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [BEZEL.cx + Math.cos(a) * r, BEZEL.cy + Math.sin(a) * r] as const;
};
const bezelTicks = computed(() => {
  const ticks: { d: string; label?: { x: number; y: number; text: string } }[] = [];
  const steps = 76;
  for (let i = 0; i <= steps; i++) {
    const deg = BEZEL.from + ((BEZEL.to - BEZEL.from) * i) / steps;
    const major = i % 10 === 0;
    const [x1, y1] = bezelPoint(deg, BEZEL.r);
    const [x2, y2] = bezelPoint(deg, BEZEL.r - (major ? 14 : 6));
    const tick: (typeof ticks)[number] = {
      d: `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`,
    };
    if (major) {
      const [lx, ly] = bezelPoint(deg, BEZEL.r - 28);
      // rounded, so server and client print the same digits (hydration check)
      tick.label = { x: +lx.toFixed(1), y: +ly.toFixed(1), text: String(i * 10).padStart(3, "0") };
    }
    ticks.push(tick);
  }
  return ticks;
});
const bezelArc = computed(() => {
  const [x1, y1] = bezelPoint(BEZEL.from, BEZEL.r + 5);
  const [x2, y2] = bezelPoint(BEZEL.to, BEZEL.r + 5);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${BEZEL.r + 5} ${BEZEL.r + 5} 0 0 0 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
});

// two long arcs, drawn once here and reused for the orbs' motion paths
const ARC_A = "M -120 220 C 380 -40, 1120 -10, 1760 300"; // high sweep, left to right
const ARC_B = "M -80 960 C 260 520, 760 460, 1720 120"; // rising diagonal
</script>

<template>
  <svg
    class="decor"
    viewBox="0 0 1600 1000"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <path id="decor-arc-a" :d="ARC_A" />
      <path id="decor-arc-b" :d="ARC_B" />
    </defs>

    <!-- trajectories -->
    <use href="#decor-arc-a" class="decor__line" />
    <use href="#decor-arc-b" class="decor__line decor__line--faint" />

    <!-- orbs riding the trajectories -->
    <circle r="4.5" class="decor__orb">
      <animateMotion v-if="!reduced" dur="140s" repeatCount="indefinite" rotate="auto">
        <mpath href="#decor-arc-a" />
      </animateMotion>
    </circle>
    <circle r="3" class="decor__orb decor__orb--accent">
      <animateMotion v-if="!reduced" dur="210s" repeatCount="indefinite" begin="-90s">
        <mpath href="#decor-arc-b" />
      </animateMotion>
    </circle>

    <!-- planetary ring, upper right, turning once in four minutes -->
    <g class="decor__ring" :class="{ 'is-still': reduced }" style="transform-origin: 1500px 60px">
      <circle cx="1500" cy="60" r="330" class="decor__line decor__line--dashed" />
      <circle cx="1500" cy="60" r="372" class="decor__line decor__line--faint" />
      <circle cx="1170" cy="60" r="3.5" class="decor__orb" />
    </g>

    <!-- small squares on open sky, from the poster series -->
    <rect x="296" y="136" width="6" height="6" class="decor__square" />
    <rect x="1118" y="298" width="5" height="5" class="decor__square decor__square--accent" />
    <rect x="1338" y="760" width="7" height="7" class="decor__square" />
  </svg>

  <!-- the bezel: its own SVG, pinned to the lower left corner in CSS pixels -->
  <svg
    class="decor decor--bezel"
    :viewBox="`0 0 ${BEZEL.size} ${BEZEL.size}`"
    :width="BEZEL.size"
    :height="BEZEL.size"
    aria-hidden="true"
  >
    <!-- bezel, lower left: a dial's scale with a marker crawling along it -->
    <g class="decor__bezel">
      <path id="decor-bezel-arc" :d="bezelArc" class="decor__line decor__line--faint" />
      <path :d="bezelTicks.map((t) => t.d).join('')" class="decor__line" />
      <text
        v-for="t in bezelTicks.filter((t) => t.label)"
        :key="t.label!.text"
        :x="t.label!.x"
        :y="t.label!.y"
        class="decor__text"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        {{ t.label!.text }}
      </text>
      <rect width="7" height="7" x="-3.5" y="-3.5" class="decor__square">
        <animateMotion v-if="!reduced" dur="300s" repeatCount="indefinite" rotate="auto">
          <mpath href="#decor-bezel-arc" />
        </animateMotion>
      </rect>
      <!-- readouts: where this is written -->
      <text x="22" y="58" class="decor__text decor__text--readout">47.05 N</text>
      <text x="22" y="74" class="decor__text decor__text--readout">8.31 E</text>
      <text x="22" y="90" class="decor__text decor__text--readout">435 M</text>
    </g>
  </svg>
</template>
