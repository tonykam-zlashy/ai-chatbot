<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { ThemeProps } from '../../model/type';
import { themePropsDefaults } from '../../model/type';

interface Props extends ThemeProps {
  src: string;
}

const props = withDefaults(defineProps<Props>(), {
  ...themePropsDefaults,
});

const NUM_BARS = 50;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const WAVEFORM_HEIGHT = 40;

const audioEl = ref<HTMLAudioElement>();
const canvasRef = ref<HTMLCanvasElement>();

const canvasWidth = NUM_BARS * (BAR_WIDTH + BAR_GAP) + BAR_GAP;

const isPlaying = ref(false);
const currentTime = ref(0);
const totalDuration = ref(0);
const waveformData = ref<number[]>([]);
const isLoading = ref(true);
const loadError = ref(false);

const progress = computed(() => {
  if (totalDuration.value === 0) return 0;
  return currentTime.value / totalDuration.value;
});

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getPlayedBars(): number {
  if (totalDuration.value > 0) {
    return Math.floor((currentTime.value / totalDuration.value) * NUM_BARS);
  }
  if (currentTime.value > 0) {
    return Math.floor(((currentTime.value % 30) / 30) * NUM_BARS);
  }
  return 0;
}

function createFallbackWaveform(seedText: string): number[] {
  let seed = 0;
  for (let i = 0; i < seedText.length; i++) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }

  const data: number[] = [];
  for (let i = 0; i < NUM_BARS; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const random = seed / 0xffffffff;
    const wave = 0.5 + 0.35 * Math.sin(i * 0.55) + 0.15 * Math.sin(i * 1.35);
    data.push(Math.max(0.18, Math.min(0.95, wave * 0.75 + random * 0.25)));
  }
  return data;
}

function useFallbackWaveform() {
  waveformData.value = createFallbackWaveform(props.src || 'audio');
  drawWaveform(getPlayedBars());
}

function drawWaveform(playedBars: number = 0) {
  const canvas = canvasRef.value;
  if (!canvas || waveformData.value.length === 0) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvasWidth;
  const h = WAVEFORM_HEIGHT;

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);

  const isDark = props.theme === 'dark';
  const playedColor = isDark ? '#4a9eff' : '#fff';
  const unplayedColor = isDark ? 'rgba(255,255,255,0.2)' : '#713614';
  const midY = h / 2;

  for (let i = 0; i < waveformData.value.length; i++) {
    const x = i * (BAR_WIDTH + BAR_GAP) + BAR_GAP;
    const amp = waveformData.value[i] ?? 0;
    const barHeight = Math.max(2, amp * (h - 8));
    const y = midY - barHeight / 2;

    ctx.fillStyle = i < playedBars ? playedColor : unplayedColor;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1.5);
    } else {
      ctx.rect(x, y, BAR_WIDTH, barHeight);
    }
    ctx.fill();
  }
}

async function loadAudio() {
  if (!props.src) return;
  loadError.value = false;
  useFallbackWaveform();
  isLoading.value = false;
  try {
    const response = await fetch(props.src);
    const arrayBuffer = await response.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    audioCtx.close();

    const channelData = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.floor(channelData.length / NUM_BARS);

    const data: number[] = [];
    for (let i = 0; i < NUM_BARS; i++) {
      const start = i * samplesPerBar;
      const end = start + samplesPerBar;
      let max = 0;
      for (let j = start; j < end && j < channelData.length; j++) {
        const abs = Math.abs(channelData[j] ?? 0);
        if (abs > max) max = abs;
      }
      data.push(Math.min(1, max * 1.5));
    }
    waveformData.value = data;
    drawWaveform(0);
    isLoading.value = false;
  } catch (e) {
    console.warn('AudioPlayer: failed to decode audio for waveform', e);
    useFallbackWaveform();
    loadError.value = true;
  }
}

function togglePlay() {
  if (!audioEl.value) return;
  if (isPlaying.value) {
    audioEl.value.pause();
  } else {
    audioEl.value.play().catch(() => {});
  }
}

function onLoadedMetadata() {
  if (audioEl.value) {
    totalDuration.value = Number.isFinite(audioEl.value.duration)
      ? audioEl.value.duration
      : 0;
    drawWaveform(getPlayedBars());
  }
}

function onTimeUpdate() {
  if (audioEl.value) {
    currentTime.value = audioEl.value.currentTime || 0;
    drawWaveform(getPlayedBars());
  }
}

function onEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
  if (audioEl.value) audioEl.value.currentTime = 0;
  drawWaveform(0);
}

function onPlay() { isPlaying.value = true; }
function onPause() { isPlaying.value = false; }

watch(() => props.src, () => {
  waveformData.value = [];
  if (props.src) loadAudio();
  totalDuration.value = 0;
  currentTime.value = 0;
  isPlaying.value = false;
});

onMounted(() => {
  if (props.src) loadAudio();
  if (audioEl.value) {
    audioEl.value.addEventListener('play', onPlay);
    audioEl.value.addEventListener('pause', onPause);
  }
});

onUnmounted(() => {
  if (audioEl.value) {
    audioEl.value.removeEventListener('play', onPlay);
    audioEl.value.removeEventListener('pause', onPause);
  }
});
</script>

<template>
  <div
    class="audio-player"
    :class="[theme]"
    :style="{ cursor: isLoading ? 'wait' : 'pointer' }"
    @click="togglePlay"
  >
    <button
      class="play-btn"
      :disabled="isLoading"
      @click.stop="togglePlay"
    >
      <svg
        v-if="!isPlaying"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="currentColor"
        class="play-icon"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="currentColor"
        class="pause-icon"
      >
        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
      </svg>
    </button>

    <div class="waveform-wrap">
      <div v-if="isLoading" class="waveform-placeholder">
        <span class="loading-text">Loading...</span>
      </div>
      <canvas
        v-show="!isLoading && waveformData.length > 0"
        ref="canvasRef"
        class="waveform"
      />
      <div v-if="!isLoading && waveformData.length === 0" class="waveform-placeholder">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="audio-icon">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    </div>

    <span class="duration">{{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}</span>

    <audio
      ref="audioEl"
      :src="src"
      preload="metadata"
      @loadedmetadata="onLoadedMetadata"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @canplay="onLoadedMetadata"
    />
  </div>
</template>

<style scoped>
.audio-player {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid rgba(16, 32, 69, 0.08);
  border-radius: var(--td-radius-large, 12px);
  background: rgba(16, 32, 69, 0.02);
  max-width: 100%;
  user-select: none;
  transition: background 0.2s;
}
.audio-player:hover {
  background: rgba(16, 32, 69, 0.06);
}
.audio-player.dark {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}
.audio-player.dark:hover {
  background: rgba(255, 255, 255, 0.08);
}

.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--td-brand-color, #1677ff);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, transform 0.1s;
}
.play-btn:hover {
  background: var(--td-brand-color-hover, #4096ff);
}
.play-btn:active {
  transform: scale(0.95);
}
.play-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}
.dark .play-btn {
  background: var(--td-brand-color, #4a9eff);
}
.dark .play-btn:hover {
  background: var(--td-brand-color-hover, #6ab1ff);
}

.waveform-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.waveform {
  display: block;
  max-width: 100%;
}

.waveform-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 260px;
  color: rgba(0, 0, 0, 0.25);
}
.dark .waveform-placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.loading-text {
  font-size: 12px;
}

.audio-icon {
  opacity: 0.4;
}

.duration {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  flex-shrink: 0;
}
.dark .duration {
  color: rgba(255, 255, 255, 0.45);
}
</style>
