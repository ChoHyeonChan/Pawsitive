const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const chromium = require(path.join(ROOT, '.tools', 'video-playwright', 'node_modules', 'playwright-core')).chromium;
const ffmpegPath = require(path.join(ROOT, '.tools', 'video-ffmpeg', 'node_modules', 'ffmpeg-static'));

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SRC_DIR = path.join(ROOT, 'outputs', 'demo-videos-polished-20260517');
const OUT_DIR = path.join(ROOT, 'outputs', 'ad-style-demo-videos-20260517');
const RAW_DIR = path.join(OUT_DIR, 'raw');
const CHARACTER_VIDEO = path.join(ROOT, 'images', 'demo-character', 'pawsitive-character.mp4');
const VIEWPORT = { width: 1920, height: 1080 };
let ASSET_BASE_URL = '';

fs.mkdirSync(RAW_DIR, { recursive: true });

const scenes = [
  {
    id: '01',
    slug: 'breeds_ai_recommendation',
    source: '01_breeds_ai_recommendation_polished.mp4',
    eyebrow: 'DEMO 01 / BREEDS',
    title: '내 생활에 맞는 견종 찾기',
    quote: '강아지는 키워보고 싶은데,\n내 환경에서 키울 수 있을까?',
    solution: '품종 정보와 AI 맞춤 추천으로 생활 패턴에 맞는 선택을 도와줘요.',
    caption: '품종 정보 확인 → 조건 입력 → AI 추천 1·2·3위 비교',
    chips: ['품종 정보', '맞춤 견종 추천', 'RAG 기반 추천'],
    accent: '#ff7a2f'
  },
  {
    id: '02',
    slug: 'ai_matching_score',
    source: '02_ai_matching_score_polished.mp4',
    eyebrow: 'DEMO 02 / MATCHING',
    title: '아무에게나 맡기지 않는 산책 매칭',
    quote: '너무 바쁜데 산책시켜줄 사람 없나?\n그런데 아무한테나 맡기고 싶진 않아.',
    solution: '거리, 가능 시간, 경험, 평점, 반려견 성향을 함께 보고 도우미 우선순위를 계산해요.',
    caption: 'AI 추천 도우미 → 적합도 계산 → 점수 기준 확인',
    chips: ['AI 적합도', '우선순위 정렬', '신뢰 기반 매칭'],
    accent: '#0f9f7a'
  },
  {
    id: '03',
    slug: 'payment_walk_gps',
    source: '03_mobile_payment_walk_gps_split_polished.mp4',
    eyebrow: 'DEMO 03 / LIVE WALK',
    title: '결제부터 실시간 산책 확인까지',
    quote: '잘 산책되고 있는지\n안심하고 확인하고 싶어.',
    solution: '결제와 수락 이후 도우미·요청자 화면에서 GPS 이동 경로를 실시간으로 확인해요.',
    caption: '지도에서 도우미 선택 → 결제 → 수락 → GPS 산책 진행',
    chips: ['간편결제', '실시간 GPS', '양방향 진행 상태'],
    accent: '#3478f6'
  },
  {
    id: '04',
    slug: 'walk_health_ai_expert',
    source: '04_walk_health_ai_expert_flow_polished.mp4',
    eyebrow: 'DEMO 04 / HEALTH LOOP',
    title: '산책 데이터가 다음 케어로 이어지는 흐름',
    quote: '좋은 산책 코스는 공유하고 싶고,\n요즘 활동량이 줄면 이유도 알고 싶어.',
    solution: '산책기록은 커뮤니티로 공유되고, 누적 데이터는 건강분석과 AI 상담, 전문가 매칭까지 이어져요.',
    caption: '산책기록 공유 → 건강분석 → AI 상담 → 전문가 매칭',
    chips: ['기록 공유', '건강 분석', 'AI 상담', '전문가 연결'],
    accent: '#7c5cff'
  }
];

const scene04 = scenes.find(scene => scene.id === '04');
if (scene04) {
  Object.assign(scene04, {
    title: '산책 기록이 건강 관리와 학습으로 이어지는 흐름',
    quote: '산책 후에도\n건강 관리와 필요한 지식을 계속 이어가고 싶어.',
    solution: '산책 기록을 커뮤니티에 공유하고, 건강 분석과 AI 상담, 전문가 상담, 교육센터 퀴즈 학습까지 하나의 흐름으로 연결해요.',
    caption: '산책 기록 공유 → 건강 분석 → AI 상담 → 전문가 상담 → 교육센터 학습',
    chips: ['기록 공유', '건강 분석', 'AI 상담', '전문가 상담', '교육센터 퀴즈']
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDurationSec(file) {
  const result = spawnSync(ffmpegPath, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const text = `${result.stderr || ''}${result.stdout || ''}`;
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!match) return 30;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function convertToMp4(webmPath, mp4Path) {
  const result = spawnSync(ffmpegPath, [
    '-y',
    '-i', webmPath,
    '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#f8f4ed',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Path
  ], { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error((result.stderr || Buffer.from('ffmpeg failed')).toString('utf8').slice(-1600));
  }
  return mp4Path;
}

function serveVideo(req, res, file) {
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const stat = fs.statSync(file);
  const range = req.headers.range;
  const headers = {
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store'
  };
  if (range) {
    const match = range.match(/bytes=(\d+)-(\d*)/);
    const start = match ? Number(match[1]) : 0;
    const end = match && match[2] ? Number(match[2]) : stat.size - 1;
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      ...headers,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': chunkSize
    });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
  fs.createReadStream(file).pipe(res);
}

function startAssetServer() {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname.startsWith('/videos/')) {
        const name = decodeURIComponent(url.pathname.replace('/videos/', ''));
        serveVideo(req, res, path.join(SRC_DIR, path.basename(name)));
        return;
      }
      if (url.pathname === '/assets/character.mp4') {
        serveVideo(req, res, CHARACTER_VIDEO);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ok');
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(error.message);
    }
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise(done => server.close(done))
      });
    });
  });
}

function buildHtml(scene, sourcePath, durationSec) {
  const sourceUrl = `${ASSET_BASE_URL}/videos/${encodeURIComponent(path.basename(sourcePath))}`;
  const characterUrl = fs.existsSync(CHARACTER_VIDEO) ? `${ASSET_BASE_URL}/assets/character.mp4` : '';
  const chips = scene.chips.map(chip => `<span>${escapeHtml(chip)}</span>`).join('');
  const lines = scene.quote.split('\n').map(line => `<span>${escapeHtml(line)}</span>`).join('');
  const solutionLines = scene.solution.split('\n').map(line => `<span>${escapeHtml(line)}</span>`).join('');
  const accent = scene.accent;
  const durationLabel = `${Math.round(durationSec)}s`;
  const isFocusReveal = ['01', '02', '03', '04'].includes(scene.id);
  const focusRevealDelayMs = isFocusReveal ? 5200 : 0;
  const focusRevealDelaySec = Number((focusRevealDelayMs / 1000).toFixed(2));
  const focusVideoStartDelayMs = isFocusReveal ? 5200 : 0;
  const focusVideoStartDelaySec = Number((focusVideoStartDelayMs / 1000).toFixed(2));
  const focusIntroOutDelaySec = isFocusReveal ? 5.1 : 0;
  const focusLaptopRevealDelaySec = isFocusReveal ? 5.35 : 0;
  const focusCaptionDelaySec = isFocusReveal ? 6.85 : 1.15;

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pawsitive ${escapeHtml(scene.id)}</title>
<style>
  :root {
    --accent: ${accent};
    --ink: #10131d;
    --muted: #6b7280;
    --paper: #f8f4ed;
    --cream: #fffdf8;
    --line: rgba(17, 24, 39, .12);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    color: var(--ink);
    font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif;
    background:
      radial-gradient(circle at 18% 18%, rgba(255, 122, 47, .13), transparent 28%),
      radial-gradient(circle at 80% 12%, rgba(15, 159, 122, .12), transparent 24%),
      linear-gradient(135deg, #fffaf2 0%, #f4f1ea 48%, #f8f4ed 100%);
  }
  body.focus-reveal {
    background:
      radial-gradient(circle at 16% 17%, rgba(255, 204, 92, .32), transparent 28%),
      radial-gradient(circle at 28% 38%, rgba(255, 140, 72, .16), transparent 25%),
      radial-gradient(circle at 77% 13%, rgba(15, 159, 122, .16), transparent 26%),
      linear-gradient(135deg, #fff1c5 0%, #fff9ed 46%, #eef8f0 100%);
  }
  .grain {
    position: fixed;
    inset: 0;
    opacity: .18;
    background-image:
      linear-gradient(rgba(17, 24, 39, .045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(17, 24, 39, .045) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: linear-gradient(90deg, rgba(0,0,0,.8), rgba(0,0,0,.2));
  }
  .scene {
    position: relative;
    z-index: 1;
    height: 100%;
    display: grid;
    grid-template-columns: 690px 1fr;
    gap: 74px;
    padding: 78px 84px 74px;
  }
  body.focus-reveal .scene {
    display: block;
    padding: 0;
  }
  .left {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }
  body.focus-reveal .left {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 54px 0 72px;
    pointer-events: none;
    opacity: 0;
    transform: translate3d(0, 14px, 0) scale(.982);
    will-change: opacity, transform;
    backface-visibility: hidden;
  }
  body.ready.focus-reveal .left {
    animation:
      demo03IntroIn 1.25s cubic-bezier(.16,1,.3,1) .08s forwards,
      demo03IntroOut 1.35s cubic-bezier(.16,1,.3,1) ${focusIntroOutDelaySec}s forwards;
  }
  .brand {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 15px;
    letter-spacing: .18em;
    font-weight: 800;
    color: rgba(16, 19, 29, .58);
  }
  body.focus-reveal .brand,
  body.focus-reveal .meta {
    display: none;
  }
  .brand::before {
    content: "";
    width: 9px;
    height: 9px;
    border-radius: 99px;
    background: var(--accent);
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--accent) 16%, transparent);
  }
  .character-wrap {
    position: relative;
    width: 390px;
    height: 390px;
    margin: 0 0 28px 70px;
  }
  .character-wrap--video {
    width: 520px;
    height: 318px;
    margin: 0 0 34px 32px;
  }
  body.focus-reveal .character-wrap--video {
    width: 610px;
    height: 372px;
    margin: 0 0 34px;
  }
  .orb {
    position: absolute;
    inset: 22px;
    border-radius: 999px;
    background: rgba(255,255,255,.58);
    border: 1px solid rgba(255,255,255,.76);
    box-shadow: 0 30px 90px rgba(39, 37, 31, .12);
    transform: scale(.86);
    opacity: 0;
  }
  body.ready .orb {
    animation: orbIn .9s cubic-bezier(.2,.8,.2,1) .05s forwards;
  }
  .character {
    position: absolute;
    inset: 0;
    filter: drop-shadow(0 22px 28px rgba(17, 24, 39, .14));
    transform-origin: 50% 90%;
    opacity: 0;
  }
  body.ready .character {
    animation: riseIn .9s cubic-bezier(.2,.8,.2,1) .2s forwards, floaty 4.2s ease-in-out 1.1s infinite;
  }
  .character-video-card {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: 42px;
    background: #f7cf6f;
    border: 1px solid rgba(255,255,255,.88);
    box-shadow:
      0 24px 62px rgba(116, 84, 31, .16),
      inset 0 1px 0 rgba(255,255,255,.52);
    filter: drop-shadow(0 22px 28px rgba(17,24,39,.10));
    opacity: 0;
    transform: translateY(18px) scale(.96);
  }
  .character-video-card::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(110deg, rgba(255,255,255,.22), transparent 38%, rgba(255,255,255,.18));
    mix-blend-mode: soft-light;
  }
  .character-video {
    width: 100%;
    height: calc(100% + 46px);
    display: block;
    object-fit: cover;
    object-position: center top;
  }
  body.focus-reveal .character-video {
    opacity: 0;
    transform: translate3d(0, 0, 0) scale(1.006);
    filter: saturate(1.02);
    will-change: opacity, transform;
    backface-visibility: hidden;
  }
  body.ready.focus-reveal .character-video {
    animation: characterVideoSoftIn 1.1s cubic-bezier(.16,1,.3,1) .2s forwards;
  }
  body.ready .character-video-card {
    animation: riseIn .9s cubic-bezier(.2,.8,.2,1) .2s forwards, floaty 4.2s ease-in-out 1.1s infinite;
  }
  .spark {
    transform-origin: center;
    opacity: .1;
  }
  body.ready .spark { animation: twinkle 2.2s ease-in-out infinite; }
  body.ready .spark.s2 { animation-delay: .55s; }
  body.ready .spark.s3 { animation-delay: 1s; }
  .question-bubble { transform-origin: 116px 78px; }
  body.ready .question-bubble { animation: bubbleBob 2.7s ease-in-out 1.1s infinite; }
  .arm, .tail, .dog-head { transform-origin: center; }
  body.ready .arm { animation: wave 2.8s ease-in-out 1.3s infinite; }
  body.ready .tail { animation: wag 1.1s ease-in-out 1s infinite; }
  body.ready .dog-head { animation: dogNod 3.4s ease-in-out 1.4s infinite; }
  .bubble {
    position: relative;
    width: 664px;
    padding: 32px 34px 28px;
    border-radius: 34px;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(255,255,255,.95);
    box-shadow: 0 28px 70px rgba(17, 24, 39, .12);
    backdrop-filter: blur(18px);
    opacity: 0;
    transform: translateY(20px);
  }
  body.focus-reveal .bubble {
    width: 760px;
    padding: 38px 42px 34px;
    border-radius: 34px;
  }
  body.focus-reveal .bubble::before {
    left: 118px;
  }
  body.ready .bubble {
    animation: fadeUp .82s cubic-bezier(.2,.8,.2,1) .45s forwards;
  }
  .bubble::before {
    content: "";
    position: absolute;
    top: -15px;
    left: 94px;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(255,255,255,.78);
    border-left: 1px solid rgba(255,255,255,.95);
    border-top: 1px solid rgba(255,255,255,.95);
    transform: rotate(45deg);
  }
  .bubble-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
    color: var(--accent);
    font-size: 15px;
    font-weight: 900;
  }
  .bubble-kicker::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 99px;
    background: var(--accent);
  }
  .quote {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 112px;
    font-size: 36px;
    line-height: 1.22;
    font-weight: 900;
    letter-spacing: 0;
    word-break: keep-all;
  }
  body.focus-reveal .quote {
    min-height: 118px;
    font-size: 40px;
  }
  .solution {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 18px;
    min-height: 62px;
    font-size: 19px;
    line-height: 1.58;
    font-weight: 700;
    color: #485263;
  }
  body.focus-reveal .solution {
    min-height: 64px;
    font-size: 20px;
  }
  .cursor {
    display: inline-block;
    width: 3px;
    height: 1em;
    margin-left: 3px;
    border-radius: 99px;
    background: var(--accent);
    vertical-align: -4px;
    animation: cursorBlink .8s steps(2) infinite;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }
  .chips span {
    height: 38px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0 15px;
    color: #1f2937;
    background: rgba(255,255,255,.74);
    border: 1px solid rgba(17, 24, 39, .08);
    font-size: 14px;
    font-weight: 850;
  }
  .right {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
  }
  body.focus-reveal .right {
    position: absolute;
    inset: 0;
    z-index: 2;
    justify-content: center;
    padding: 0;
  }
  .meta {
    position: absolute;
    top: 0;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 16px;
    color: rgba(16, 19, 29, .55);
    font-size: 15px;
    font-weight: 800;
    letter-spacing: .12em;
  }
  .meta .pill {
    height: 34px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(255,255,255,.66);
    border: 1px solid rgba(17,24,39,.08);
    color: #111827;
    letter-spacing: 0;
  }
  .laptop-wrap {
    width: 100%;
    opacity: 0;
    transform: translateX(34px) scale(.97);
  }
  body.ready .laptop-wrap {
    animation: laptopIn 1s cubic-bezier(.2,.8,.2,1) .3s forwards;
  }
  body.focus-reveal .laptop-wrap {
    width: min(1660px, calc(100vw - 140px));
    transform: translate3d(0, 54px, 0) scale(.78);
    will-change: opacity, transform;
    backface-visibility: hidden;
  }
  body.ready.focus-reveal .laptop-wrap {
    animation: demo03LaptopReveal 1.85s cubic-bezier(.16,1,.3,1) ${focusLaptopRevealDelaySec}s forwards;
  }
  .laptop {
    position: relative;
    padding: 19px 19px 24px;
    border-radius: 34px;
    background: linear-gradient(180deg, #27231d 0%, #181611 100%);
    box-shadow:
      0 42px 90px rgba(17,24,39,.24),
      inset 0 1px 0 rgba(255,255,255,.12);
  }
  body.focus-reveal .laptop {
    padding: 18px 18px 22px;
    border-radius: 36px;
  }
  .laptop::after {
    content: "";
    position: absolute;
    left: 9%;
    right: 9%;
    bottom: -39px;
    height: 38px;
    border-radius: 0 0 46px 46px;
    background: linear-gradient(180deg, #d8d1c5, #aca497);
    box-shadow: 0 22px 46px rgba(17,24,39,.18);
  }
  body.focus-reveal .laptop::after {
    left: 11%;
    right: 11%;
    bottom: -31px;
    height: 31px;
  }
  .laptop-top {
    height: 37px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px 0 10px;
    color: rgba(255,255,255,.66);
    font-size: 14px;
    font-weight: 750;
    letter-spacing: .04em;
  }
  .dot { width: 10px; height: 10px; border-radius: 99px; background: #ff6b45; }
  .dot:nth-child(2) { background: #ffbd4a; }
  .dot:nth-child(3) { background: #25c26e; margin-right: 12px; }
  .url {
    flex: 1;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.58);
    font-size: 12px;
  }
  .screen {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 18px;
    background: #fff;
    border: 1px solid rgba(255,255,255,.12);
  }
  .screen video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #fff;
  }
  .screen-shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(110deg, rgba(255,255,255,.16), transparent 26%, transparent 70%, rgba(255,255,255,.12));
    mix-blend-mode: soft-light;
  }
  .caption {
    position: absolute;
    left: 46px;
    bottom: 43px;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    height: 48px;
    padding: 0 18px;
    border-radius: 999px;
    color: #fff;
    background: rgba(13, 18, 28, .86);
    box-shadow: 0 18px 44px rgba(17, 24, 39, .26);
    font-size: 15px;
    font-weight: 900;
    backdrop-filter: blur(14px);
    opacity: 0;
    transform: translateY(16px);
  }
  body.focus-reveal .caption {
    left: 56px;
    bottom: 38px;
    height: 44px;
    padding: 0 16px;
    font-size: 14px;
  }
  body.ready .caption {
    animation: fadeUp .78s cubic-bezier(.2,.8,.2,1) 1.15s forwards;
  }
  body.ready.focus-reveal .caption {
    animation: fadeUp .78s cubic-bezier(.2,.8,.2,1) ${focusCaptionDelaySec}s forwards;
  }
  .caption::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 99px;
    background: var(--accent);
  }
  .progress-shell {
    position: absolute;
    left: 42px;
    right: 42px;
    bottom: -78px;
    height: 5px;
    overflow: hidden;
    border-radius: 99px;
    background: rgba(17,24,39,.12);
  }
  body.focus-reveal .progress-shell {
    left: 72px;
    right: 72px;
    bottom: -50px;
  }
  .progress {
    width: 0%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--accent), #10131d);
  }
  body.ready .progress {
    animation: progress ${durationSec}s linear forwards;
  }
  body.ready.focus-reveal .progress {
    animation: progress ${durationSec}s linear ${focusVideoStartDelaySec}s forwards;
  }
  @keyframes orbIn {
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes riseIn {
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes floaty {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-12px) rotate(-1.5deg); }
  }
  @keyframes wave {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(-9deg); }
  }
  @keyframes wag {
    0%, 100% { transform: rotate(-8deg); }
    50% { transform: rotate(12deg); }
  }
  @keyframes bubbleBob {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-7px) scale(1.03); }
  }
  @keyframes dogNod {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(3px) rotate(-1.8deg); }
  }
  @keyframes twinkle {
    0%, 100% { transform: scale(.82); opacity: .18; }
    50% { transform: scale(1.08); opacity: .85; }
  }
  @keyframes fadeUp {
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes laptopIn {
    to { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes demo03IntroIn {
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }
  @keyframes demo03IntroOut {
    to {
      opacity: 0;
      transform: translate3d(0, -26px, 0) scale(.955);
    }
  }
  @keyframes characterVideoSoftIn {
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
      filter: saturate(1.02);
    }
  }
  @keyframes demo03LaptopReveal {
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }
  @keyframes progress {
    to { width: 100%; }
  }
  @keyframes cursorBlink {
    50% { opacity: 0; }
  }
</style>
</head>
<body class="demo-${escapeHtml(scene.id)}${isFocusReveal ? ' focus-reveal' : ''}">
<div class="grain"></div>
<main class="scene">
  <section class="left">
    <div class="brand">${escapeHtml(scene.eyebrow)}</div>
    <div class="character-wrap character-wrap--video" aria-hidden="true">
      <div class="orb"></div>
      <div class="character-video-card">
        <video class="character-video" muted autoplay loop playsinline preload="auto" src="${characterUrl}"></video>
      </div>
    </div>
    <div class="bubble">
      <div class="bubble-kicker">사용자 고민</div>
      <div class="quote" id="quote">${lines}</div>
      <div class="solution" id="solution">${solutionLines}</div>
      <div class="chips">${chips}</div>
    </div>
  </section>
  <section class="right">
    <div class="meta">
      <span>PAWSITIVE PRODUCT FILM</span>
      <span class="pill">${durationLabel}</span>
    </div>
    <div class="laptop-wrap">
      <div class="laptop">
        <div class="laptop-top">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
          <span class="url">pawsitive.app / ${escapeHtml(scene.slug)}</span>
        </div>
        <div class="screen">
          <video id="demoVideo" muted playsinline preload="auto" src="${sourceUrl}"></video>
          <div class="screen-shine"></div>
        </div>
      </div>
      <div class="caption">${escapeHtml(scene.caption)}</div>
      <div class="progress-shell"><div class="progress"></div></div>
    </div>
  </section>
</main>
<script>
  const quoteText = ${JSON.stringify(scene.quote)};
  const solutionText = ${JSON.stringify(scene.solution)};
  const isFocusReveal = ${isFocusReveal ? 'true' : 'false'};
  const focusRevealDelayMs = ${focusRevealDelayMs};
  const focusVideoStartDelayMs = ${focusVideoStartDelayMs};
  const quoteEl = document.getElementById('quote');
  const solutionEl = document.getElementById('solution');
  const video = document.getElementById('demoVideo');

  function htmlLines(text) {
    return text.split('\\n').map(line => '<span>' + line + '</span>').join('');
  }
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  function typeInto(el, text, speed) {
    return new Promise(resolve => {
      el.innerHTML = '';
      let i = 0;
      const cursor = document.createElement('i');
      cursor.className = 'cursor';
      let lastTick = 0;
      const step = now => {
        if (!lastTick) lastTick = now;
        if (now - lastTick < speed) {
          requestAnimationFrame(step);
          return;
        }
        lastTick = now;
        i += 1;
        el.innerHTML = htmlLines(text.slice(0, i)).replace(/\\n$/, '') + cursor.outerHTML;
        if (i >= text.length) {
          el.innerHTML = htmlLines(text);
          resolve();
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  window.__startPawsitiveAd = async () => {
    document.body.classList.add('ready');
    document.querySelectorAll('.character-video').forEach(charVideo => {
      charVideo.currentTime = 0;
      charVideo.play().catch(() => {});
    });
    if (isFocusReveal) {
      const startedAt = performance.now();
      quoteEl.innerHTML = '';
      solutionEl.innerHTML = '';
      video.pause();
      video.currentTime = 0;
      (async () => {
        await wait(900);
        await typeInto(quoteEl, quoteText, 34);
        await wait(220);
        await typeInto(solutionEl, solutionText, 32);
        const remaining = focusVideoStartDelayMs - (performance.now() - startedAt);
        if (remaining > 0) await wait(remaining);
        video.playbackRate = 1;
        await video.play();
      })();
      return;
    }
    video.currentTime = 0;
    video.playbackRate = 1;
    await video.play();
    quoteEl.innerHTML = '';
    solutionEl.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, 650));
    await typeInto(quoteEl, quoteText, 34);
    await new Promise(resolve => setTimeout(resolve, 360));
    await typeInto(solutionEl, solutionText, 18);
  };
</script>
</body>
</html>`;
}

async function renderScene(browser, scene) {
  const sourcePath = path.join(SRC_DIR, scene.source);
  if (!fs.existsSync(sourcePath)) throw new Error(`Missing source video: ${sourcePath}`);
  const maxDurationByScene = { '01': 98, '02': 64, '03': 74, '04': 145 };
  const durationSec = Math.min(getDurationSec(sourcePath), maxDurationByScene[scene.id] || 64);
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: RAW_DIR, size: VIEWPORT },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'no-preference'
  });
  context.setDefaultTimeout(20000);
  const page = await context.newPage();
  await page.setContent(buildHtml(scene, sourcePath, durationSec), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const video = document.getElementById('demoVideo');
    return video && video.readyState >= 2;
  });
  await page.evaluate(() => window.__startPawsitiveAd());
  const leadInSec = ['01', '02', '03', '04'].includes(scene.id) ? 5.6 : 0;
  await page.waitForTimeout(Math.round((durationSec + leadInSec + 1.2) * 1000));
  const video = page.video();
  await context.close();
  const rawPath = await video.path();
  const webmPath = path.join(OUT_DIR, `${scene.id}_${scene.slug}_ad_style.webm`);
  const mp4Path = path.join(OUT_DIR, `${scene.id}_${scene.slug}_ad_style.mp4`);
  if (fs.existsSync(webmPath)) fs.rmSync(webmPath, { force: true });
  if (fs.existsSync(mp4Path)) fs.rmSync(mp4Path, { force: true });
  fs.renameSync(rawPath, webmPath);
  return convertToMp4(webmPath, mp4Path);
}

function makeContactSheet(files) {
  const thumbsDir = path.join(OUT_DIR, 'thumbs');
  fs.mkdirSync(thumbsDir, { recursive: true });
  const outputs = [];
  for (const file of files) {
    const base = path.basename(file, '.mp4');
    const out = path.join(thumbsDir, `${base}_contact_sheet.png`);
    const result = spawnSync(ffmpegPath, [
      '-y',
      '-i', file,
      '-vf', 'fps=1/8,scale=420:-1,tile=4x3:padding=8:margin=8:color=white',
      '-frames:v', '1',
      out
    ], { stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 });
    if (result.status === 0) outputs.push(out);
  }
  return outputs;
}

async function main() {
  const selected = new Set(process.argv.slice(2).length ? process.argv.slice(2) : scenes.map(scene => scene.id));
  const toRender = scenes.filter(scene => selected.has(scene.id) || selected.has(scene.slug));
  if (!toRender.length) {
    console.log('No scenes selected.');
    return;
  }
  const assetServer = await startAssetServer();
  ASSET_BASE_URL = assetServer.baseUrl;
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--force-device-scale-factor=1'
    ]
  });
  const outputs = [];
  try {
    for (const scene of toRender) {
      console.log(`Rendering demo ${scene.id}...`);
      outputs.push(await renderScene(browser, scene));
    }
  } finally {
    await browser.close();
    await assetServer.close();
  }
  const contactSheets = makeContactSheet(outputs);
  const manifest = {
    createdAt: new Date().toISOString(),
    outputs: outputs.map(file => ({
      file,
      size: fs.existsSync(file) ? fs.statSync(file).size : 0,
      durationSec: Number(getDurationSec(file).toFixed(2))
    })),
    contactSheets
  };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
