const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require(path.join(__dirname, '..', '.tools', 'video-playwright', 'node_modules', 'playwright-core'));

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.PAWSITIVE_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(ROOT, 'outputs', 'demo-videos-20260517');
const RAW_DIR = path.join(OUT_DIR, 'raw');
const VIEWPORT = { width: 1280, height: 720 };
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

fs.mkdirSync(RAW_DIR, { recursive: true });

const demoUser = {
  id: 'id-mol2g5lb-rvnvuvi',
  name: '조현찬',
  nickname: '요청자',
  email: 'demo@pawsitive.local',
  profileImage: '',
  dogs: [{
    id: 'id-motxbdfb-9r1w6sq',
    name: '초코',
    breed: '골든 리트리버',
    age: 3,
    size: 'large',
    gender: 'male',
    weight: 27,
    neutered: true,
    personality: '사람을 좋아하고 산책을 좋아하는 활발한 성격',
    healthNote: '특이 질환 없음'
  }]
};

const authToken = {
  token: 'demo-video-token',
  userId: demoUser.id,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

const breedRecommendation = {
  success: true,
  totalCandidates: 383,
  summary: '아파트 생활, 초보 보호자, 관리 난이도를 함께 고려해 성향이 잘 맞는 품종부터 정리했어요.',
  recommendations: [
    {
      id: 'breed-006',
      name: '푸들',
      nameEn: 'Poodle',
      matchScore: 94,
      reason: '훈련성이 높고 크기 선택 폭이 넓어서 첫 반려견으로도 안정적으로 적응할 수 있어요.',
      pros: ['훈련 쉬움', '실내 적응', '털 빠짐 적음'],
      cons: ['미용 관리 필요'],
      tip: '정기 미용 주기만 잡아두면 관리 루틴을 만들기 좋아요.'
    },
    {
      id: 'breed-009',
      name: '비숑 프리제',
      nameEn: 'Bichon Frise',
      matchScore: 89,
      reason: '사교성이 좋고 실내 생활에 잘 맞아 가족 단위 보호자에게 잘 어울려요.',
      pros: ['가족 친화', '밝은 성격', '실내 생활'],
      cons: ['피모 관리'],
      tip: '털 엉킴 방지를 위해 짧은 빗질 루틴을 추천해요.'
    },
    {
      id: 'breed-001',
      name: '골든 리트리버',
      nameEn: 'Golden Retriever',
      matchScore: 82,
      reason: '성격은 매우 안정적이지만 활동량이 많아 산책 시간이 충분한 보호자에게 잘 맞아요.',
      pros: ['온순함', '훈련성', '사교성'],
      cons: ['높은 활동량'],
      tip: '하루 1시간 이상 산책과 놀이 시간을 확보하면 좋아요.'
    }
  ]
};

const healthAnalysis = {
  overallScore: 84,
  summaryKeywords: ['규칙적인 산책', '활동량 양호', '관절 관리'],
  summary: '초코는 최근 일주일 동안 산책 빈도와 시간이 안정적으로 유지되고 있어요. 골든 리트리버 특성상 활동량을 꾸준히 가져가되, 더운 시간대는 피하는 흐름이 좋아요.',
  behaviorAnalysis: {
    consistency: '상',
    keywords: ['아침 루틴', '거리 안정', '스트레스 완화'],
    pattern: '아침과 저녁 산책이 반복되면서 활동 리듬이 일정하게 잡혀 있어요.',
    recommendation: '현재 루틴을 유지하면서 주 1~2회는 후각 놀이가 가능한 느린 산책을 섞어주세요.'
  },
  obesityRisk: {
    level: '낮음',
    factors: ['평균 거리 양호', '칼로리 소모 안정'],
    recommendation: '간식량만 과하지 않게 관리하면 현재 활동량은 좋은 편이에요.'
  },
  dietRecommendation: {
    dailyCalories: '900~1,050',
    mealFrequency: '하루 2회',
    foods: ['고단백 사료', '관절 보조 성분', '수분 보충'],
    avoid: ['기름진 간식', '과한 탄수화물']
  },
  vaccinationSchedule: {
    upcoming: [
      { name: '종합 백신 확인', dueDate: '다음 정기 검진' },
      { name: '심장사상충 예방', dueDate: '매월' }
    ],
    note: '정확한 접종 이력은 병원 기록과 함께 확인하는 것이 좋아요.'
  }
};

const requesterProfile = {
  userId: demoUser.id,
  userName: '조현찬',
  role: 'requester',
  location: '서울 성북구 안암동',
  lat: 37.57242,
  lng: 127.01595,
  dogName: '초코',
  dogBreed: '골든 리트리버',
  dogSize: 'large',
  dogAggression: 'none',
  dogEnergy: 'high',
  dogProblems: ['pulling'],
  preferredTime: '오후 (6-8시)',
  notes: '활발하지만 사람을 좋아해서 차분하게 리드해주면 좋아요.',
  profilePhoto: '',
  isAvailable: true
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createDemoPage(browser, name, options = {}) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: RAW_DIR, size: VIEWPORT },
    locale: 'ko-KR',
    permissions: ['geolocation']
  });
  context.setDefaultTimeout(12000);

  await context.addInitScript(({ user, token, breedData, healthData, enableMockGps }) => {
    sessionStorage.setItem('pawsitive_currentUser', JSON.stringify(user));
    sessionStorage.setItem('pawsitive_authToken', JSON.stringify(token));
    sessionStorage.setItem('breedLastRecommendResult', JSON.stringify(breedData));
    localStorage.setItem('pawsitive_walkingDogIdx', '0');
    localStorage.setItem('pawsitive_selectedDogId', JSON.stringify(user.dogs[0].name));
    localStorage.setItem(`pawsitive_healthAnalysis_${user.id}_${user.dogs[0].name}`, JSON.stringify({
      analysis: healthData,
      analyzedAt: new Date().toISOString()
    }));
    if (enableMockGps) localStorage.setItem('pawsitive_demoGpsTracking', '1');
    else localStorage.removeItem('pawsitive_demoGpsTracking');
  }, {
    user: demoUser,
    token: authToken,
    breedData: breedRecommendation,
    healthData: healthAnalysis,
    enableMockGps: !!options.mockGps
  });

  const page = await context.newPage();
  await setupDemoRoutes(page);
  page.on('dialog', dialog => dialog.dismiss().catch(() => {}));
  return { context, page, name };
}

async function setupDemoRoutes(page) {
  await page.route('**/api/ai/recommend-breed', async route => {
    await sleep(900);
    await route.fulfill({
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(breedRecommendation)
    });
  });

  await page.route('**/api/matching/ai-score', async route => {
    await sleep(650);
    let score = 88;
    try {
      const body = route.request().postDataJSON();
      const id = String(body?.walker?.userId || '');
      const name = String(body?.walker?.userName || body?.walker?.name || '');
      const seed = Array.from(id + name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      score = 78 + (seed % 18);
    } catch (e) {}
    await route.fulfill({
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        success: true,
        score,
        trustScore: Math.min(98, score + 2),
        reason: '거리, 가능 시간, 대형견 경험이 초코와 잘 맞아요.',
        breakdown: {
          '경력_적합도': 18,
          '공격성_대응력': 23,
          '체형_적합도': 18,
          '신뢰도': 18,
          '특기_매칭': 13
        }
      })
    });
  });

  await page.route('**/api/walk-requests?**', async route => {
    await route.fulfill({
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ success: true, requests: [] })
    });
  });

  await page.route('**/api/health/analyze', async route => {
    await sleep(900);
    await route.fulfill({
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ success: true, analysis: healthAnalysis })
    });
  });

  await page.route('**/api/ai/consult', async route => {
    await sleep(850);
    await route.fulfill({
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        success: true,
        reply: '초코의 최근 산책 기록을 보면 활동량은 좋은 편이에요. 다만 골든 리트리버는 관절 부담이 생기기 쉬우니 더운 시간대의 장거리 산책은 피하고, 후각 놀이처럼 천천히 움직이는 산책을 섞어주면 더 안정적입니다.'
      })
    });
  });
}

async function saveVideo(session) {
  const video = session.page.video();
  await session.context.close();
  const rawPath = await video.path();
  const webmPath = path.join(OUT_DIR, `${session.name}.webm`);
  if (fs.existsSync(webmPath)) fs.rmSync(webmPath);
  fs.renameSync(rawPath, webmPath);
  return webmPath;
}

function convertToMp4(webmPath) {
  const ffmpegPath = require(path.join(ROOT, '.tools', 'video-ffmpeg', 'node_modules', 'ffmpeg-static'));
  const mp4Path = webmPath.replace(/\.webm$/i, '.mp4');
  const result = spawnSync(ffmpegPath, [
    '-y',
    '-i', webmPath,
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=white,fps=30',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Path
  ], { stdio: 'pipe', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    const err = result.stderr ? result.stderr.toString('utf8') : 'unknown ffmpeg error';
    throw new Error(err.slice(-1200));
  }
  return mp4Path;
}

async function gotoApp(page, hash, options = {}) {
  const prefix = options.demoGps ? '/?demoGps=1' : '';
  await page.goto(`${BASE_URL}${prefix}#${hash}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await sleep(options.after || 800);
}

async function clickModalText(page, text) {
  await page.locator('#breed-rec-modal').getByText(text, { exact: true }).first().click();
}

async function runBreedVideo(browser) {
  const session = await createDemoPage(browser, '01_breeds_ai_recommendation');
  const { page } = session;
  await gotoApp(page, '/breeds', { after: 3200 });
  await page.locator('#rec-submit-btn').click();
  await sleep(1200);
  await clickModalText(page, '중형');
  await sleep(800);
  await page.locator('#breed-rec-modal').getByText('다음', { exact: true }).click();
  await sleep(900);
  await clickModalText(page, '보통');
  await sleep(800);
  await page.locator('#breed-rec-modal').getByText('다음', { exact: true }).click();
  await sleep(900);
  await clickModalText(page, '적음');
  await sleep(800);
  await page.locator('#breed-rec-modal').getByText('다음', { exact: true }).click();
  await sleep(900);
  await clickModalText(page, '쉬운 편');
  await sleep(800);
  await page.locator('#breed-rec-modal').getByText('다음', { exact: true }).click();
  await sleep(900);
  await clickModalText(page, '적음');
  await sleep(800);
  await page.locator('#breed-rec-modal').getByText('다음', { exact: true }).click();
  await sleep(900);
  await clickModalText(page, '아이와 함께');
  await sleep(500);
  await clickModalText(page, '아파트 거주');
  await sleep(900);
  await page.locator('#breed-rec-modal').getByText('다음', { exact: true }).click();
  await sleep(900);
  await page.locator('#breed-rec-input').fill('3');
  await sleep(700);
  await page.locator('#breed-rec-modal').getByText('다음', { exact: true }).click();
  await sleep(900);
  await page.locator('#breed-rec-input').fill('처음 키우는 가족이고, 산책 루틴을 꾸준히 만들 수 있어요.');
  await sleep(1100);
  await page.locator('#breed-rec-modal').getByText('AI 맞춤 추천 받기', { exact: true }).click();
  await page.waitForSelector('.breed-rec-result-card', { timeout: 20000 });
  await sleep(2600);
  await page.locator('.breed-rec-result-card').first().scrollIntoViewIfNeeded();
  await sleep(2800);
  await page.locator('.breed-rec-result-card').first().locator('button').click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await sleep(6000);
  const webm = await saveVideo(session);
  return { webm, mp4: convertToMp4(webm) };
}

async function forceRequesterDashboard(page) {
  await page.evaluate((profile) => {
    const currentProfiles = StorageService.get('matchProfiles', []);
    const merged = [profile].concat(currentProfiles.filter(p => p.userId !== profile.userId));
    StorageService.setCache('matchProfiles', merged);
    if (typeof renderMatchingPage === 'function') renderMatchingPage();
  }, requesterProfile);
  await page.waitForSelector('#walker-list-section', { timeout: 20000 });
  await sleep(1000);
}

async function runMatchingVideo(browser) {
  const session = await createDemoPage(browser, '02_ai_matching_score');
  const { page } = session;
  await gotoApp(page, '/matching', { after: 1200 });
  await forceRequesterDashboard(page);
  await page.locator('#walker-list-section').scrollIntoViewIfNeeded();
  await sleep(3600);
  await page.evaluate(() => {
    if (typeof toggleAiScoreExplain === 'function') toggleAiScoreExplain();
  });
  await sleep(5200);
  await page.locator('#ai-calc-btn').click();
  await sleep(9000);
  await page.locator('#ai-walker-list').scrollIntoViewIfNeeded();
  await sleep(19000);
  const webm = await saveVideo(session);
  return { webm, mp4: convertToMp4(webm) };
}

async function runWalkGpsVideo(browser) {
  const session = await createDemoPage(browser, '03_direct_walk_mock_gps', { mockGps: true });
  const { page } = session;
  await gotoApp(page, '/walk-tracking', { demoGps: true, after: 1500 });
  await page.locator('.gps-panel--tracker').scrollIntoViewIfNeeded();
  await sleep(3500);
  await page.locator('#tracking-quick-action button').click();
  await page.waitForSelector('#tracking-data:not([style*="display:none"])').catch(() => {});
  await sleep(1800);
  await page.evaluate(() => {
    document.getElementById('tracking-map')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
  await sleep(2200);
  await sleep(38000);
  const webm = await saveVideo(session);
  return { webm, mp4: convertToMp4(webm) };
}

async function runHealthAiVideo(browser) {
  const session = await createDemoPage(browser, '04_walk_health_ai_flow');
  const { page } = session;
  await gotoApp(page, '/walk-tracking', { after: 1400 });
  await page.evaluate(() => window.scrollTo({ top: 640, behavior: 'smooth' }));
  await sleep(6200);
  await gotoApp(page, '/health', { after: 2800 });
  await page.locator('#health-analysis-section').scrollIntoViewIfNeeded();
  await sleep(9800);
  await gotoApp(page, '/ai', { after: 2800 });
  await page.locator('#ai-tab-health').click();
  await sleep(800);
  await page.locator('#ai-breed').fill('골든 리트리버');
  await sleep(500);
  await page.locator('#ai-topic').fill('산책 후 컨디션');
  await sleep(500);
  await page.locator('#ai-age').fill('3살');
  await sleep(600);
  await page.locator('#ai-input').fill('초코 산책 기록을 보면 활동량이 괜찮은 편인가요? 주의할 점도 알려주세요.');
  await sleep(1600);
  await page.locator('#ai-send-btn').click();
  await page.getByText('초코의 최근 산책 기록을 보면', { exact: false }).waitFor({ timeout: 20000 });
  await sleep(9000);
  const webm = await saveVideo(session);
  return { webm, mp4: convertToMp4(webm) };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined
  });
  const results = [];
  const only = String(process.env.ONLY || '').trim();
  try {
    if (!only || only === '01') results.push(await runBreedVideo(browser));
    if (!only || only === '02') results.push(await runMatchingVideo(browser));
    if (!only || only === '03') results.push(await runWalkGpsVideo(browser));
    if (!only || only === '04') results.push(await runHealthAiVideo(browser));
  } finally {
    await browser.close();
  }
  const manifest = {
    createdAt: new Date().toISOString(),
    files: results.map(item => ({ webm: item.webm, mp4: item.mp4 }))
  };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(err => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
