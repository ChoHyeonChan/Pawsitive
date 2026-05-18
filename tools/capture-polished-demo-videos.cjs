const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');
const { chromium } = require(path.join(__dirname, '..', '.tools', 'video-playwright', 'node_modules', 'playwright-core'));

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.PAWSITIVE_BASE_URL || 'http://localhost:3000';
const OUT_DIR = path.join(ROOT, 'outputs', 'demo-videos-polished-20260517');
const RAW_DIR = path.join(OUT_DIR, 'raw');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 390, height: 844 };

fs.mkdirSync(RAW_DIR, { recursive: true });

const dog = {
  id: 'demo-dog-choco',
  name: '초코',
  breed: '골든 리트리버',
  age: 3,
  size: 'large',
  gender: 'male',
  weight: 27,
  neutered: true,
  personality: '사람을 좋아하고 산책 의욕이 높은 편',
  healthNote: '특이 질환 없음'
};

const peterUser = {
  id: 'demo-requester-peter',
  name: 'PETER LEE',
  nickname: 'PETER LEE',
  email: 'peter.lee@pawsitive.demo',
  profileImage: '',
  dogs: [dog],
  pawCoins: 3000
};

const walkerUser = {
  id: 'mock-walker-gps',
  name: '민준워커',
  nickname: '민준워커',
  email: 'walker@pawsitive.demo',
  profileImage: '/images/walkers/dummy-walker-002.png',
  dogs: []
};

const communityDemoUsers = [
  {
    id: 'demo-user-happy',
    name: '해피누나',
    nickname: '해피누나',
    email: 'happy@pawsitive.demo',
    profileImage: '/images/walkers/dummy-walker-003.png',
    dogs: []
  },
  {
    id: 'demo-user-bami',
    name: '바미보호자',
    nickname: '바미보호자',
    email: 'bami@pawsitive.demo',
    profileImage: '/images/walkers/dummy-walker-004.png',
    dogs: []
  },
  {
    id: 'demo-user-kong',
    name: '콩이아빠',
    nickname: '콩이아빠',
    email: 'kong@pawsitive.demo',
    profileImage: '/images/walkers/dummy-walker-005.png',
    dogs: []
  },
  {
    id: 'demo-user-luna',
    name: '루나집사',
    nickname: '루나집사',
    email: 'luna@pawsitive.demo',
    profileImage: '/images/walkers/dummy-walker-006.png',
    dogs: []
  }
];

const authToken = user => ({
  token: `demo-token-${user.id}`,
  userId: user.id,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
});

const roadRoute = [
  [37.57487, 127.01682], [37.57501, 127.01716], [37.57527, 127.01706],
  [37.57553, 127.01695], [37.57556, 127.01690], [37.57554, 127.01663],
  [37.57553, 127.01662], [37.57542, 127.01646], [37.57528, 127.01626],
  [37.57478, 127.01655], [37.57479, 127.01658], [37.57487, 127.01682]
];

function interpolateRoute(route, steps = 5) {
  const out = [];
  for (let i = 0; i < route.length - 1; i += 1) {
    const [aLat, aLng] = route[i];
    const [bLat, bLng] = route[i + 1];
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      out.push([aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t]);
    }
  }
  out.push(route[route.length - 1]);
  return out;
}

const smoothRoute = interpolateRoute(roadRoute, 5);

const demoBreedImages = {
  'breed-001': '/images/demo-breeds/breed-001.jpg',
  'breed-002': '/images/demo-breeds/breed-002.jpg',
  'breed-003': '/images/demo-breeds/breed-003.jpg',
  'breed-004': '/images/demo-breeds/breed-004.jpg',
  'breed-005': '/images/demo-breeds/breed-005.jpg',
  'breed-006': '/images/demo-breeds/breed-006.jpg',
  'breed-007': '/images/demo-breeds/breed-007.jpg',
  'breed-008': '/images/demo-breeds/breed-008.jpg',
  'breed-009': '/images/demo-breeds/breed-009.jpg',
  'breed-013': '/images/demo-breeds/breed-013.jpg',
  'breed-035': '/images/demo-breeds/breed-035.jpg',
  'breed-058': '/images/demo-breeds/breed-058.jpg',
  'breed-382': '/images/demo-breeds/breed-382.jpg'
};

function routeCoordinates(route = smoothRoute, options = {}) {
  const { latOffset = 0, lngOffset = 0, start = 0, end = route.length } = options;
  return route.slice(start, end).map(([lat, lng]) => ({
    lat: lat + latOffset,
    lng: lng + lngOffset
  }));
}

const breedRecommendation = {
  success: true,
  totalCandidates: 383,
  summary: '초보 보호자, 아파트 생활, 관리 난이도와 활동량을 함께 고려해 가장 잘 맞는 견종 후보를 정리했어요.',
  recommendations: [
    {
      id: 'breed-006',
      name: '푸들',
      nameEn: 'Poodle',
      matchScore: 94,
      reason: '훈련 적응력이 높고 크기 선택 폭이 넓어 처음 반려견을 키우는 보호자에게 안정적으로 맞아요.',
      pros: ['훈련 적응력', '실내 생활', '털 빠짐 적음'],
      cons: ['정기 미용 필요'],
      tip: '미용 주기만 일정하게 잡으면 관리 부담을 예측하기 좋아요.'
    },
    {
      id: 'breed-009',
      name: '비숑 프리제',
      nameEn: 'Bichon Frise',
      matchScore: 89,
      reason: '사교성이 좋고 실내 생활에 잘 적응해 가족 단위 보호자에게 잘 어울려요.',
      pros: ['가족 친화', '밝은 성격', '실내 적응'],
      cons: ['털 엉킴 관리'],
      tip: '털 엉킴을 막기 위해 짧은 빗질 루틴을 추천해요.'
    },
    {
      id: 'breed-001',
      name: '골든 리트리버',
      nameEn: 'Golden Retriever',
      matchScore: 82,
      reason: '온순하고 친화적이지만 활동량이 많아 산책 시간을 충분히 낼 수 있는 보호자에게 잘 맞아요.',
      pros: ['온순함', '친화력', '가족 적합'],
      cons: ['높은 활동량'],
      tip: '하루 1시간 이상 산책과 놀이 시간을 확보하면 좋아요.'
    }
  ]
};

const healthAnalysis = {
  overallScore: 85,
  summaryKeywords: ['규칙적인 산책', '활동량 양호', '관절 관리'],
  summary: '초코는 최근 일주일 동안 산책 빈도와 시간이 안정적이에요. 골든 리트리버 특성상 관절 부담을 줄이기 위해 무리한 전력 질주는 줄이고 꾸준한 걷기 중심의 루틴이 좋아요.',
  behaviorAnalysis: {
    consistency: '상',
    keywords: ['아침 루틴', '거리 안정', '스트레스 완화'],
    pattern: '비슷한 시간대에 산책이 반복되어 활동 리듬이 일정하게 잡히고 있어요.',
    recommendation: '현재 루틴을 유지하면서 주 1~2회는 냄새 맡기 중심의 느린 산책을 섞어주세요.'
  },
  obesityRisk: {
    level: '낮음',
    factors: ['평균 거리 양호', '칼로리 소모 안정'],
    recommendation: '간식량만 과하지 않게 관리하면 현재 활동량은 좋은 편이에요.'
  },
  dietRecommendation: {
    dailyCalories: '900~1,050',
    mealFrequency: '하루 2회',
    foods: ['고단백 사료', '관절 보조 성분', '충분한 수분'],
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
  userId: peterUser.id,
  userName: 'PETER LEE',
  role: 'requester',
  location: '서울특별시 성북구 안암동',
  locationSido: '서울특별시',
  locationSigungu: '성북구',
  locationDong: '안암동',
  lat: 37.57242,
  lng: 127.01634,
  dogName: dog.name,
  dogBreed: dog.breed,
  dogSize: dog.size,
  dogAggression: 'none',
  dogEnergy: 'high',
  dogProblems: ['pulling'],
  preferredTime: '오후 (6~8시)',
  notes: '사람을 좋아하지만 리드가 필요한 편이에요.',
  profilePhoto: '',
  isAvailable: true
};

const walkerProfiles = [
  ['mock-walker-gps', '민준워커', '상시 가능', 37.57358, 127.01785, 96, '/images/walkers/dummy-walker-002.png', '대형견 산책 경험이 많은 도우미'],
  ['dummy-walker-002', '서윤 도우미', '오후 (6~8시)', 37.57090, 127.01720, 91, '/images/walkers/dummy-walker-003.png', '골든 리트리버 경험 보유'],
  ['dummy-walker-003', '지호 도우미', '저녁 (7~9시)', 37.57420, 127.01470, 87, '/images/walkers/dummy-walker-004.png', '줄 당김 케어 가능'],
  ['dummy-walker-004', '하린 도우미', '오후 (4~6시)', 37.57150, 127.01920, 83, '/images/walkers/dummy-walker-001.png', '차분한 리드 산책'],
  ['dummy-walker-005', '유나 도우미', '상시 가능', 37.57510, 127.01690, 78, '/images/walkers/dummy-walker-005.png', '응급 대처 교육 수료'],
  ['dummy-walker-006', '도윤 도우미', '오전 (9~11시)', 37.57100, 127.01430, 74, '/images/walkers/dummy-walker-006.png', '소형견 다견 산책']
].map(([userId, userName, preferredTime, lat, lng, trustScore, profilePhoto, specialty], index) => ({
  userId,
  id: userId,
  userName,
  name: userName,
  role: 'walker',
  location: index < 3 ? '서울특별시 성북구 안암동' : '서울특별시 종로구 숭인동',
  locationSido: '서울특별시',
  locationSigungu: index < 3 ? '성북구' : '종로구',
  locationDong: index < 3 ? '안암동' : '숭인동',
  lat,
  lng,
  preferredTime,
  message: `${specialty}입니다. 산책 경로와 반려견 컨디션을 꼼꼼하게 기록해요.`,
  intro: `${specialty}입니다. 산책 경로와 반려견 컨디션을 꼼꼼하게 기록해요.`,
  specialty,
  profilePhoto,
  profileImage: profilePhoto,
  isAvailable: true,
  acceptedSizes: ['small', 'medium', 'large'],
  careerYears: index < 2 ? 'over3y' : '1y3y',
  ownPetExp: index < 4 ? 'current' : 'past',
  largeDogExp: index < 3 ? 'lots' : 'some',
  aggressionHandle: index < 3 ? 'yes' : 'some',
  breedExp: index < 3 ? ['골든 리트리버', '래브라도 리트리버'] : ['푸들', '비숑 프리제'],
  problemBehavior: ['pulling', 'jumping'],
  canWalkLarge: index < 4,
  canWalkMultiple: index % 2 === 0,
  rating: 4.9 - index * 0.1,
  reviewCount: 18 + index * 3,
  trustScore,
  minutesSinceSeen: index * 7 + 2
}));

const expertProfiles = [
  {
    id: 'expert-vet-1',
    userId: 'expert-vet-1',
    status: 'approved',
    category: 'vet',
    categoryLabel: '수의사',
    name: '윤서진',
    title: '소동물 내과 수의사',
    price: 30000,
    location: '서울 강남 · 온라인',
    years: 9,
    licenseName: '수의사 면허',
    licenseIssuer: '농림축산식품부',
    verificationBadges: ['면허 확인', '병원 재직 확인'],
    tags: ['관절', '소화기', '건강검진'],
    intro: '산책 데이터와 생활 패턴을 함께 보고 보호자가 바로 실천할 수 있는 케어 방향을 제안합니다.',
    responseTime: '평균 15분'
  },
  {
    id: 'expert-trainer-1',
    userId: 'expert-trainer-1',
    status: 'approved',
    category: 'trainer',
    categoryLabel: '훈련사',
    name: '강도윤',
    title: '반려견 행동교정 전문가',
    price: 25000,
    location: '서울 성북 · 방문/온라인',
    years: 7,
    licenseName: '반려견지도사 1급',
    licenseIssuer: 'KKC',
    verificationBadges: ['자격 확인', '현장 경력 확인'],
    tags: ['줄당김', '분리불안', '사회화'],
    intro: '산책 중 행동 데이터를 바탕으로 줄 당김과 흥분도를 낮추는 루틴을 설계합니다.',
    responseTime: '평균 20분'
  }
];

const demoWalks = [
  {
    id: 'walk-demo-1',
    userId: peterUser.id,
    dogId: dog.id,
    dogName: dog.name,
    source: 'personal',
    distance: 1.24,
    duration: 32,
    calories: 96,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    coordinates: smoothRoute.map(([lat, lng]) => ({ lat, lng, timestamp: Date.now() }))
  },
  {
    id: 'walk-demo-2',
    userId: peterUser.id,
    dogId: dog.id,
    dogName: dog.name,
    source: 'matched',
    walkerName: '민준워커',
    distance: 1.08,
    duration: 28,
    calories: 83,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    coordinates: smoothRoute.slice(0, 45).map(([lat, lng]) => ({ lat, lng, timestamp: Date.now() }))
  }
];

let communityPosts = [
  {
    id: 'post-demo-before',
    authorId: peterUser.id,
    authorName: 'PETER LEE',
    text: '초코와 아침 산책 기록을 공유해요. 오늘은 컨디션이 좋아서 평소보다 조금 더 걸었어요. #산책기록 #Pawsitive',
    walkData: {
      dogName: dog.name,
      distance: 1.12,
      duration: 30,
      coordinates: smoothRoute.slice(0, 35).map(([lat, lng]) => ({ lat, lng }))
    },
    likes: 12,
    likedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];

communityPosts = [
  {
    id: 'post-demo-before-peter',
    authorId: peterUser.id,
    authorName: 'PETER LEE',
    authorProfileImage: peterUser.profileImage,
    text: '초코랑 아침 산책 기록을 공유해요. 오늘은 컨디션이 좋아서 평소보다 조금 더 걸었어요. #산책기록 #Pawsitive',
    walkData: {
      dogName: dog.name,
      distance: 1.24,
      duration: 32,
      coordinates: routeCoordinates(smoothRoute, { end: 52 })
    },
    likes: 18,
    likedBy: [],
    comments: [
      { authorId: 'demo-user-happy', authorName: '해피누나', text: '동선이 깔끔해서 따라 걷기 좋아 보여요!' }
    ],
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString()
  },
  {
    id: 'post-demo-happy',
    authorId: 'demo-user-happy',
    authorName: '해피누나',
    authorProfileImage: '/images/walkers/dummy-walker-003.png',
    text: '해피는 오늘 횡단보도 앞에서 잠깐 쉬었다가 천천히 한 바퀴 돌았어요. 기록으로 보니까 휴식 구간까지 잘 보여서 좋네요. #리트리버 #오전산책',
    walkData: {
      dogName: '해피',
      distance: 1.06,
      duration: 27,
      coordinates: routeCoordinates(smoothRoute, { latOffset: 0.00052, lngOffset: -0.00025, start: 8, end: 68 })
    },
    likes: 31,
    likedBy: [],
    comments: [
      { authorId: peterUser.id, authorName: 'PETER LEE', text: '해피 동선 진짜 안정적이네요.' },
      { authorId: 'demo-user-bami', authorName: '바미보호자', text: '저도 이 코스 저장해둘게요.' }
    ],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'post-demo-bami',
    authorId: 'demo-user-bami',
    authorName: '바미보호자',
    authorProfileImage: '/images/walkers/dummy-walker-004.png',
    text: '바미는 저녁에 에너지가 많아서 조금 빠르게 걸었어요. 산책 뒤 건강 분석에 바로 이어지는 흐름이 편해요. #저녁산책 #건강관리',
    walkData: {
      dogName: '바미',
      distance: 0.92,
      duration: 24,
      coordinates: routeCoordinates(smoothRoute, { latOffset: -0.00032, lngOffset: 0.00042, start: 0, end: 55 })
    },
    likes: 24,
    likedBy: [],
    comments: [
      { authorId: 'demo-user-kong', authorName: '콩이아빠', text: '산책 속도까지 같이 보이니까 비교하기 좋네요.' }
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'post-demo-kong',
    authorId: 'demo-user-kong',
    authorName: '콩이아빠',
    authorProfileImage: '/images/walkers/dummy-walker-005.png',
    text: '콩이는 오늘 짧게만 걸었는데도 냄새 맡는 시간이 길었어요. 동선이 남으니까 다음 산책 때 코스를 조절하기 좋습니다. #소형견산책 #산책공유',
    walkData: {
      dogName: '콩이',
      distance: 0.68,
      duration: 19,
      coordinates: routeCoordinates(smoothRoute, { latOffset: 0.00018, lngOffset: 0.00068, start: 12, end: 48 })
    },
    likes: 17,
    likedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'post-demo-luna',
    authorId: 'demo-user-luna',
    authorName: '루나집사',
    authorProfileImage: '/images/walkers/dummy-walker-006.png',
    text: '루나는 산책 후반에 속도가 떨어져서 오늘은 짧게 마무리했어요. 이렇게 공유해두면 다른 보호자랑 코스 얘기하기가 훨씬 쉬워요. #루나산책 #동선공유',
    walkData: {
      dogName: '루나',
      distance: 1.18,
      duration: 34,
      coordinates: routeCoordinates(smoothRoute, { latOffset: -0.00055, lngOffset: -0.0002, start: 4, end: 72 })
    },
    likes: 22,
    likedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
  }
];

function statsPayload() {
  return {
    success: true,
    stats: {
      weekly: {
        count: 5,
        totalDistance: 12.4,
        totalDuration: 192,
        totalCalories: 716,
        avgDistance: 2.48,
        avgDuration: 38
      },
      monthly: {
        count: 18,
        totalDistance: 36.2,
        totalDuration: 1120,
        totalCalories: 3560,
        avgDistance: 2.0,
        avgDuration: 62
      },
      total: {
        count: 7,
        totalDistance: 16.1,
        totalDuration: 252,
        totalCalories: 940,
        avgDistance: 2.3,
        avgDuration: 36
      }
    }
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body)
  });
}

function routePoint(index) {
  const [latitude, longitude] = smoothRoute[Math.max(0, Math.min(smoothRoute.length - 1, index))];
  return {
    id: `route-${index}`,
    sessionId: 'demo-session',
    latitude,
    longitude,
    accuracy: 8,
    source: 'mock-gps',
    timestamp: new Date(Date.now() + index * 600).toISOString(),
    createdAt: new Date(Date.now() + index * 600).toISOString()
  };
}

function demoRouteDistance(pointCount) {
  const progress = Math.max(0, Math.min(1, (Math.max(0, pointCount - 1)) / Math.max(1, smoothRoute.length - 1)));
  return Math.round(1.08 * progress * 100) / 100;
}

function createSessionState() {
  return {
    status: 'heading',
    routeIndex: 0,
    routePoints: [],
    startedAt: new Date().toISOString()
  };
}

function demoRequest(sessionState) {
  const point = routePoint(sessionState.routeIndex);
  return {
    id: 'demo-request',
    requesterId: peterUser.id,
    requesterName: 'PETER LEE',
    walkerId: walkerUser.id,
    walkerName: walkerUser.nickname,
    dogName: dog.name,
    dogBreed: dog.breed,
    dogSize: dog.size,
    duration: 40,
    totalPrice: 10000,
    status: sessionState.status,
    requestedStartTime: new Date().toISOString(),
    pickupLatitude: smoothRoute[0][0],
    pickupLongitude: smoothRoute[0][1],
    walkerCurrentLat: point.latitude,
    walkerCurrentLng: point.longitude,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function demoSession(sessionState) {
  return {
    id: 'demo-session',
    requestId: 'demo-request',
    requesterId: peterUser.id,
    requesterName: 'PETER LEE',
    walkerId: walkerUser.id,
    walkerName: walkerUser.nickname,
    dogName: dog.name,
    status: sessionState.status,
    startedAt: sessionState.startedAt,
    walkStartedAt: sessionState.status === 'walking' || sessionState.status === 'returning' || sessionState.status === 'return_arrived'
      ? sessionState.startedAt
      : null,
    endedAt: sessionState.status === 'completed' ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
    totalDistanceKm: sessionState.status === 'completed'
      ? 1.08
      : demoRouteDistance(sessionState.routePoints.length || sessionState.routeIndex + 1)
  };
}

async function setupApiRoutes(page, state = {}) {
  const sessionState = state.sessionState || createSessionState();

  await page.route('**/api/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const pathname = url.pathname;
    const method = req.method();

    if (pathname.startsWith('/api/data/')) {
      const key = pathname.split('/').pop();
      if (method === 'POST') {
        if (key === 'communityPosts') {
          try { communityPosts = req.postDataJSON(); } catch (e) {}
        }
        return json(route, { success: true });
      }
      const data = {
        users: [peterUser, walkerUser, ...communityDemoUsers],
        communityPosts,
        communityStories: [],
        transactions: [],
        matchProfiles: [requesterProfile, ...walkerProfiles],
        notices: [],
        walkers: walkerProfiles
      }[key] || [];
      return json(route, data);
    }

    if (pathname === '/api/walkers') return json(route, walkerProfiles);
    if (pathname.match(/^\/api\/walkers\/[^/]+\/stats$/)) {
      return json(route, { success: true, stats: { completedWalks: 28, rating: 4.9, trustScore: 94 } });
    }
    if (pathname.match(/^\/api\/walkers\/[^/]+\/location$/) || pathname === '/api/walkers/toggle') {
      return json(route, { success: true });
    }

    if (pathname === '/api/ai/recommend-breed') {
      if (state.realBreedRecommend) {
        try {
          const response = await route.fetch({ timeout: state.realBreedTimeoutMs || 120000 });
          if (response.ok()) return route.fulfill({ response });
        } catch (e) {
          // Fall through to the deterministic demo response when a local AI key is unavailable.
        }
      }
      await sleep(state.breedRecommendDelayMs ?? 120);
      return json(route, breedRecommendation);
    }
    if (pathname === '/api/matching/ai-score') {
      await sleep(650);
      let score = 88;
      try {
        const body = req.postDataJSON();
        const id = String(body?.walker?.userId || '');
        score = id === 'mock-walker-gps' ? 96 : 78 + (Array.from(id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 15);
      } catch (e) {}
      return json(route, {
        success: true,
        score,
        trustScore: Math.min(99, score + 1),
        reason: '거리, 가능 시간, 대형견 경험과 초코의 성향이 잘 맞아요.',
        breakdown: {
          '경력_적합도': 18,
          '공격성_대응력': 23,
          '체형_적합도': 19,
          '신뢰도': 18,
          '특기_매칭': 14
        },
        enhancedData: { trustScore: Math.min(99, score + 1) }
      });
    }

    if (pathname.startsWith('/api/walks/stats/')) return json(route, statsPayload());
    if (pathname.startsWith('/api/walks/history/')) return json(route, { success: true, walks: demoWalks });
    if (pathname === '/api/walks/save') {
      let body = {};
      try { body = req.postDataJSON(); } catch (e) {}
      const walk = {
        id: `walk-${Date.now()}`,
        userId: body.userId || peterUser.id,
        dogId: body.dogId || dog.id,
        dogName: body.dogName || dog.name,
        source: 'personal',
        ...(body.walkData || {}),
        createdAt: new Date().toISOString()
      };
      return json(route, { success: true, walk });
    }
    if (pathname === '/api/walks/sync') return json(route, { success: true });

    if (pathname === '/api/health/analyze') {
      await sleep(900);
      return json(route, { success: true, analysis: healthAnalysis });
    }
    if (pathname.startsWith('/api/health/profile/')) {
      return json(route, { success: true, profile: { dogName: dog.name } });
    }

    if (pathname.startsWith('/api/chat/')) {
      if (pathname.endsWith('/sessions')) return json(route, []);
      if (method === 'POST') return json(route, { success: true });
      return json(route, { id: 'demo-chat', title: '초코 건강 상담', mode: 'health', messages: [] });
    }
    if ((pathname === '/api/ai/consult' || pathname === '/api/ai/consult-with-image') && state.realAiConsult) {
      try {
        const response = await route.fetch({ timeout: 45000 });
        if (response.ok()) return route.fulfill({ response });
      } catch (e) {}
      return json(route, {
        success: true,
        reply: [
          '초코의 최근 산책 기록을 보면 이번 주 산책 횟수와 이동 거리는 비교적 안정적인 편이에요.',
          '다만 대형견은 관절 부담이 누적될 수 있어서 산책 후 다리 절뚝임, 계단 오르기 거부, 피로감이 반복되는지 함께 보는 게 좋아요.',
          '오늘처럼 활동량이 갑자기 줄거나 산책을 피하는 모습이 이어진다면 산책 강도를 잠깐 낮추고, 같은 증상이 반복될 때는 전문가 상담으로 이어가는 흐름이 안전합니다.'
        ].join('\n')
      });
    }
    if (pathname === '/api/ai/consult' || pathname === '/api/ai/consult-with-image') {
      await sleep(state.aiConsultDelayMs ?? 850);
      if (state.aiConsultReply) return json(route, { success: true, reply: state.aiConsultReply });
      return json(route, {
        success: true,
        reply: '초코의 최근 산책 기록을 보면 활동량은 좋은 편이에요. 다만 대형견은 관절 부담이 누적될 수 있으니 산책 후 절뚝임이나 피로감이 반복되면 전문가 상담으로 이어가 보는 게 좋아요.'
      });
    }

    if (pathname === '/api/experts/meta') {
      return json(route, {
        categories: { vet: '수의사', trainer: '훈련사', groomer: '미용사' },
        mockAccounts: []
      });
    }
    if (pathname === '/api/experts/profiles') return json(route, { profiles: expertProfiles });
    if (pathname.startsWith('/api/experts/consultations')) {
      return json(route, { consultations: [] });
    }
    if (pathname.startsWith('/api/experts/applications')) return json(route, { applications: [] });

    if (pathname === '/api/walk-requests') {
      if (method === 'POST') return json(route, { success: true, request: demoRequest(sessionState) });
      return json(route, { success: true, requests: state.includeSession ? [demoRequest(sessionState)] : [] });
    }
    if (pathname === '/api/walk-requests/broadcast') {
      return json(route, { success: true, sentCount: 4, request: demoRequest(sessionState) });
    }
    if (pathname === '/api/walk-requests/demo-request') {
      return json(route, { success: true, request: demoRequest(sessionState) });
    }
    if (pathname === '/api/walk-requests/demo-request/walker-location') {
      const point = routePoint(sessionState.routeIndex);
      return json(route, { success: true, lat: point.latitude, lng: point.longitude });
    }
    if (pathname.startsWith('/api/walk-requests')) {
      return json(route, { success: true, requests: state.includeSession ? [demoRequest(sessionState)] : [] });
    }

    if (pathname === '/api/walk-sessions') {
      if (method === 'POST') {
        sessionState.status = 'heading';
        return json(route, { success: true, session: demoSession(sessionState) });
      }
      return json(route, { success: true, sessions: state.includeSession ? [demoSession(sessionState)] : [] });
    }
    if (pathname === '/api/walk-sessions/demo-session/arrive') {
      sessionState.status = 'arrived';
      return json(route, { success: true, session: demoSession(sessionState) });
    }
    if (pathname === '/api/walk-sessions/demo-session/confirm-handoff') {
      sessionState.status = 'handoff';
      return json(route, { success: true, session: demoSession(sessionState) });
    }
    if (pathname === '/api/walk-sessions/demo-session/start-walk') {
      sessionState.status = 'walking';
      sessionState.startedAt = new Date().toISOString();
      return json(route, { success: true, session: demoSession(sessionState) });
    }
    if (pathname === '/api/walk-sessions/demo-session/start-return') {
      sessionState.status = 'returning';
      return json(route, { success: true, session: demoSession(sessionState) });
    }
    if (pathname === '/api/walk-sessions/demo-session/arrive-return') {
      sessionState.status = 'return_arrived';
      return json(route, { success: true, session: demoSession(sessionState) });
    }
    if (pathname === '/api/walk-sessions/demo-session/confirm-return-handoff' || pathname === '/api/walk-sessions/demo-session/confirm-walker-return-handoff') {
      sessionState.status = 'completed';
      return json(route, { success: true, completed: true, session: demoSession(sessionState), totalDistanceKm: 1.08 });
    }
    if (pathname === '/api/walk-sessions/demo-session/route') {
      if (method === 'POST') {
        const point = routePoint(Math.min(sessionState.routeIndex + 1, smoothRoute.length - 1));
        sessionState.routeIndex = Math.min(sessionState.routeIndex + 1, smoothRoute.length - 1);
        if (!sessionState.routePoints.some(item => item.id === point.id)) {
          sessionState.routePoints.push(point);
        }
        return json(route, { success: true, point, totalDistanceKm: demoRouteDistance(sessionState.routePoints.length) });
      }
      const points = sessionState.routePoints.length
        ? sessionState.routePoints
        : Array.from({ length: sessionState.routeIndex + 1 }, (_, index) => routePoint(index));
      return json(route, {
        success: true,
        points,
        totalDistanceKm: demoRouteDistance(points.length)
      });
    }
    if (pathname.startsWith('/api/walk-sessions')) {
      return json(route, { success: true, sessions: state.includeSession ? [demoSession(sessionState)] : [] });
    }

    return json(route, { success: true });
  });
}

async function createDemoPage(browser, name, options = {}) {
  const user = options.user || peterUser;
  const viewport = options.viewport || DESKTOP;
  const contextOptions = {
    viewport,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    permissions: ['geolocation'],
    geolocation: { latitude: 37.57242, longitude: 127.01634, accuracy: 8 },
    reducedMotion: 'no-preference',
    isMobile: !!options.mobile,
    hasTouch: !!options.mobile
  };
  if (options.recordVideo !== false) {
    contextOptions.recordVideo = { dir: RAW_DIR, size: viewport };
  }
  const context = await browser.newContext(contextOptions);
  context.setDefaultTimeout(16000);
  await context.addInitScript(({ user, token, healthData, dogName, enableMockGps }) => {
    sessionStorage.setItem('pawsitive_currentUser', JSON.stringify(user));
    sessionStorage.setItem('pawsitive_authToken', JSON.stringify(token));
    sessionStorage.setItem('breedLastRecommendResult', '');
    localStorage.setItem('pawsitive_walkingDogIdx', '0');
    localStorage.setItem('pawsitive_selectedDogId', JSON.stringify(dogName));
    localStorage.setItem(`pawsitive_healthAnalysis_${user.id}_${dogName}`, JSON.stringify({
      analysis: healthData,
      analyzedAt: new Date().toISOString()
    }));
    if (enableMockGps) localStorage.setItem('pawsitive_demoGpsTracking', '1');
    else localStorage.removeItem('pawsitive_demoGpsTracking');
  }, {
    user,
    token: authToken(user),
    healthData: healthAnalysis,
    dogName: dog.name,
    enableMockGps: !!options.mockGps
  });
  const recordingStartedAt = Date.now();
  const page = await context.newPage();
  page.on('dialog', d => d.accept().catch(() => {}));
  await setupApiRoutes(page, options.state || {});
  return { context, page, name, recordingStartedAt, recordVideo: options.recordVideo !== false };
}

async function gotoApp(page, hash, waitSelector = '#app') {
  await page.goto(`${BASE_URL}/?capture=${Date.now()}${hash}`);
  await page.waitForSelector(waitSelector, { timeout: 18000 });
  await page.waitForLoadState('domcontentloaded');
  await sleep(900);
}

async function smoothScrollTo(page, y, duration = 2400) {
  await page.evaluate(({ y, duration }) => new Promise(resolve => {
    const start = window.scrollY;
    const change = y - start;
    const startTime = performance.now();
    const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;
    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, start + change * ease(progress));
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  }), { y, duration });
}

async function smoothScrollElementTo(page, selector, duration = 2200, block = 'start') {
  const y = await page.locator(selector).evaluate((el, block) => {
    const rect = el.getBoundingClientRect();
    const offset = block === 'center' ? (window.innerHeight - rect.height) / 2 : 88;
    return window.scrollY + rect.top - Math.max(24, offset);
  }, block);
  await smoothScrollTo(page, Math.max(0, y), duration);
}

async function smoothScrollLocatorTo(page, locator, duration = 2200, block = 'start') {
  const y = await locator.evaluate((el, block) => {
    const rect = el.getBoundingClientRect();
    const offset = block === 'center' ? (window.innerHeight - rect.height) / 2 : 88;
    return window.scrollY + rect.top - Math.max(24, offset);
  }, block);
  await smoothScrollTo(page, Math.max(0, y), duration);
}

async function clickVisible(page, selector) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 12000 });
  await loc.click();
}

async function installDemoEffects(page) {
  await page.addStyleTag({
    content: `
      @keyframes demoFocusPulse {
        0%,100% { box-shadow:0 10px 22px rgba(15,23,42,.045), 0 0 0 0 rgba(15,118,110,.34); transform:translateY(0) scale(1); }
        50% { box-shadow:0 20px 42px rgba(15,118,110,.22), 0 0 0 9px rgba(15,118,110,.10); transform:translateY(-1px) scale(1.025); }
      }
      @keyframes demoCardSpotlight {
        0%,100% { transform:scale(1); box-shadow:0 12px 28px rgba(15,118,110,.07), 0 0 0 0 rgba(15,118,110,.32); }
        50% { transform:scale(1.035); box-shadow:0 26px 58px rgba(15,118,110,.22), 0 0 0 12px rgba(15,118,110,.10); }
      }
      .demo-focus-target { position:relative !important; z-index:12 !important; animation:demoFocusPulse 1.3s ease-in-out infinite; border-color:#0F766E !important; }
      .demo-health-card-focus { transform-origin:center; animation:demoCardSpotlight 1.55s ease-in-out infinite; border-color:#0F766E !important; }
      .demo-video-callout { position:fixed; z-index:80; padding:10px 13px; border-radius:999px; background:#0B1220; color:#fff; font-size:13px; font-weight:900; box-shadow:0 14px 30px rgba(15,23,42,.22); pointer-events:none; white-space:nowrap; }
      .demo-video-callout::after { content:''; position:absolute; left:50%; bottom:-7px; width:14px; height:14px; background:#0B1220; transform:translateX(-50%) rotate(45deg); }
      #ai-loading { display:none !important; }
    `
  });
}

async function clearDemoEffects(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.demo-video-callout').forEach(el => el.remove());
    document.querySelectorAll('.demo-focus-target').forEach(el => el.classList.remove('demo-focus-target'));
    document.querySelectorAll('.demo-health-card-focus').forEach(el => el.classList.remove('demo-health-card-focus'));
  }).catch(() => {});
}

async function installWalkSpeedDemoOverlay(page, options = {}) {
  const speed = options.speed || 50;
  const summaryMinutes = options.summaryMinutes || 10;
  await page.addStyleTag({
    content: `
      .demo-gps-speed-badge {
        position: fixed;
        left: 28px;
        top: 210px;
        z-index: 120;
        width: 220px;
        padding: 16px 17px;
        border-radius: 18px;
        color: #fff;
        background: rgba(11,18,32,.91);
        border: 1px solid rgba(255,255,255,.18);
        box-shadow: 0 22px 50px rgba(15,23,42,.22);
        backdrop-filter: blur(14px);
        opacity: 0;
        transform: translateY(10px);
        transition: opacity .24s ease, transform .24s ease;
        pointer-events: none;
      }
      .demo-gps-speed-badge.is-on {
        opacity: 1;
        transform: translateY(0);
      }
      .demo-gps-speed-badge__dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 8px;
        border-radius: 50%;
        background: #38bdf8;
        box-shadow: 0 0 0 7px rgba(56,189,248,.16);
        vertical-align: 1px;
      }
      .demo-gps-speed-badge strong {
        display: block;
        font-size: 16px;
        font-weight: 950;
        letter-spacing: 0;
        line-height: 1.25;
      }
      .demo-gps-speed-badge span {
        display: block;
        margin-top: 7px;
        color: rgba(255,255,255,.76);
        font-size: 12px;
        font-weight: 800;
        line-height: 1.45;
      }
    `
  });
  await page.evaluate(({ speed, summaryMinutes }) => {
    window.__pawsitiveDemoArmSpeedWalk = () => {
      localStorage.removeItem('pawsitive_demoGpsStartOffsetMinutes');
      window.__pawsitiveDemoWalkStats = {
        speed,
        targetKmh: 1.4,
        startedAt: null,
        stoppedAt: null,
        lastDisplaySec: 0,
        lastDistanceKm: 0
      };
      const formatClock = seconds => {
        const total = Math.max(0, Math.floor(seconds));
        const mm = String(Math.floor(total / 60)).padStart(2, '0');
        const ss = String(total % 60).padStart(2, '0');
        return `${mm}:${ss}`;
      };
      window.__pawsitiveDemoApplyWalkStats = () => {
        const state = window.__pawsitiveDemoWalkStats;
        if (!state?.startedAt) return;
        const now = state.stoppedAt || Date.now();
        const rawDisplaySec = ((now - state.startedAt) / 1000) * state.speed;
        const displaySec = Math.max(state.lastDisplaySec || 0, rawDisplaySec);
        state.lastDisplaySec = displaySec;
        const distanceKm = Math.max(state.lastDistanceKm || 0, state.targetKmh * (displaySec / 3600));
        state.lastDistanceKm = distanceKm;

        const durationEl = document.getElementById('track-duration');
        if (durationEl) durationEl.textContent = formatClock(displaySec);
        const distanceEl = document.getElementById('track-distance');
        if (distanceEl) distanceEl.textContent = distanceKm.toFixed(2);
        const paceEl = document.getElementById('track-pace');
        if (paceEl) paceEl.textContent = state.targetKmh.toFixed(1);
        const caloriesEl = document.getElementById('track-calories');
        if (caloriesEl) caloriesEl.textContent = String(Math.max(0, Math.round(18 * (displaySec / 600))));
      };
      if (!window.__pawsitiveDemoOriginalUpdateTrackingDisplay && typeof window.updateTrackingDisplay === 'function') {
        window.__pawsitiveDemoOriginalUpdateTrackingDisplay = window.updateTrackingDisplay;
        window.updateTrackingDisplay = function patchedUpdateTrackingDisplay(...args) {
          const result = window.__pawsitiveDemoOriginalUpdateTrackingDisplay.apply(this, args);
          window.__pawsitiveDemoApplyWalkStats?.();
          return result;
        };
      }
      if (!window.__pawsitiveDemoOriginalUpdateElapsedClock && typeof window.updateElapsedClock === 'function') {
        window.__pawsitiveDemoOriginalUpdateElapsedClock = window.updateElapsedClock;
        window.updateElapsedClock = function patchedUpdateElapsedClock(...args) {
          const result = window.__pawsitiveDemoOriginalUpdateElapsedClock.apply(this, args);
          window.__pawsitiveDemoApplyWalkStats?.();
          return result;
        };
      }
      if (!window.__pawsitiveDemoOriginalStopTracking && window.GPSTrackingService?.stopTracking) {
        window.__pawsitiveDemoOriginalStopTracking = window.GPSTrackingService.stopTracking.bind(window.GPSTrackingService);
        window.GPSTrackingService.stopTracking = function patchedDemoStopTracking(...args) {
          const data = window.__pawsitiveDemoOriginalStopTracking(...args);
          const state = window.__pawsitiveDemoWalkStats;
          if (!data || !state?.lastDisplaySec) return data;
          const durationMin = Math.max(1, Math.round(state.lastDisplaySec / 60));
          const distanceKm = Math.round((state.lastDistanceKm || data.distance || 0) * 1000) / 1000;
          return {
            ...data,
            startTime: new Date(Date.now() - state.lastDisplaySec * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration: durationMin,
            distance: distanceKm,
            avgPace: Number(state.targetKmh.toFixed(1)),
            calories: Math.max(1, Math.round(18 * (state.lastDisplaySec / 600)))
          };
        };
      }
    };
    window.__pawsitiveDemoStartSpeedWalk = () => {
      window.__pawsitiveDemoArmSpeedWalk();
      document.querySelectorAll('.demo-gps-speed-badge').forEach(el => el.remove());
      const badge = document.createElement('div');
      badge.className = 'demo-gps-speed-badge';
      badge.innerHTML = `<strong><i class="demo-gps-speed-badge__dot"></i>시연 영상 ${speed}배속 중</strong><span>실제 산책 속도에 맞춰 시간과 거리를 압축해서 보여드립니다.</span>`;
      document.body.appendChild(badge);
      requestAnimationFrame(() => badge.classList.add('is-on'));
      if (window.__pawsitiveDemoWalkStats) {
        window.__pawsitiveDemoWalkStats.startedAt = Date.now();
        window.__pawsitiveDemoWalkStats.stoppedAt = null;
        window.__pawsitiveDemoWalkStats.lastDisplaySec = 0;
        window.__pawsitiveDemoWalkStats.lastDistanceKm = 0;
      }
      window.__pawsitiveDemoApplyWalkStats?.();
      if (window.__pawsitiveDemoSpeedTimer) clearInterval(window.__pawsitiveDemoSpeedTimer);
      window.__pawsitiveDemoSpeedTimer = setInterval(() => {
        window.__pawsitiveDemoApplyWalkStats?.();
      }, 120);
    };
    window.__pawsitiveDemoStopSpeedWalk = () => {
      if (window.__pawsitiveDemoWalkStats?.startedAt && !window.__pawsitiveDemoWalkStats.stoppedAt) {
        window.__pawsitiveDemoWalkStats.stoppedAt = Date.now();
        window.__pawsitiveDemoApplyWalkStats?.();
      }
      if (window.__pawsitiveDemoSpeedTimer) {
        clearInterval(window.__pawsitiveDemoSpeedTimer);
        window.__pawsitiveDemoSpeedTimer = null;
      }
      document.querySelectorAll('.demo-gps-speed-badge').forEach(el => el.classList.remove('is-on'));
    };
  }, { speed, summaryMinutes });
}

async function focusWithCallout(page, selector, text, options = {}) {
  await installDemoEffects(page).catch(() => {});
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: options.timeout || 12000 });
  await page.evaluate(({ selector, text, offsetY, offsetX, className }) => {
    document.querySelectorAll('.demo-video-callout').forEach(el => el.remove());
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add(className || 'demo-focus-target');
    const rect = el.getBoundingClientRect();
    const label = document.createElement('div');
    label.className = 'demo-video-callout';
    label.textContent = text;
    label.style.left = `${Math.max(24, rect.left + rect.width / 2 - (offsetX || 150))}px`;
    label.style.top = `${Math.max(74, rect.top - (offsetY || 54))}px`;
    document.body.appendChild(label);
  }, { selector, text, offsetY: options.offsetY, offsetX: options.offsetX, className: options.className });
}

async function ensureBreedImages(page) {
  await page.evaluate(imageMap => {
    const toThumbUrl = (url, width) => {
      if (!url || url.includes('/thumb/')) return url;
      const m = url.match(/upload\.wikimedia\.org\/wikipedia\/commons\/([a-f0-9]\/[a-f0-9]{2})\/(.+)/);
      return m ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${width}px-${m[2]}` : url;
    };
    const findBreed = id => (window.BREEDS_DATA || []).find(b => b.id === id);
    const pickImage = (el, index) => {
      const breedId = el.getAttribute('data-breed-id');
      if (imageMap[breedId]) return imageMap[breedId];
      const breed = findBreed(breedId);
      return breed?.imageUrl ? toThumbUrl(breed.imageUrl, el.id === 'breed-detail-img' ? 800 : 520) : null;
    };
    const applyImage = (el, index) => {
      if (!el) return;
      const src = pickImage(el, index);
      if (!src) {
        el.dataset.demoImageReady = '';
        return;
      }
      const shouldUseContainedThumb = el.closest('.breed-atlas-card') || el.closest('.breed-rec-result-card__img-wrap');
      const isRecommendationResult = Boolean(el.closest('.breed-rec-result-card__img-wrap'));
      const fit = el.hasAttribute('data-fit-contain') ? 'contain' : 'cover';
      const badge = el.querySelector('.breed-atlas-card__badge')?.outerHTML || '';
      el.style.setProperty('background-color', '#f5f0eb', 'important');
      el.style.position = 'relative';
      el.style.overflow = 'hidden';
      if (shouldUseContainedThumb) {
        if (isRecommendationResult) {
          el.style.setProperty('height', '260px', 'important');
          el.style.setProperty('min-height', '260px', 'important');
        }
        el.style.setProperty('background-image', 'none', 'important');
        if (el.dataset.demoImageSrc !== src || !el.querySelector('.pawsitive-demo-image-main')) {
          el.innerHTML = `
            <span class="pawsitive-demo-image-bg" aria-hidden="true"></span>
            <img class="pawsitive-demo-image-main" alt="" src="${src}">
            ${badge}
          `;
          el.dataset.demoImageSrc = src;
        }
        const bg = el.querySelector('.pawsitive-demo-image-bg');
        if (bg) {
          Object.assign(bg.style, {
            position: 'absolute',
            inset: '-18px',
            background: `url("${src}") center/cover no-repeat`,
            filter: 'blur(18px)',
            opacity: '0.20',
            transform: 'scale(1.08)',
            pointerEvents: 'none'
          });
        }
        const img = el.querySelector('.pawsitive-demo-image-main');
        if (img) {
          Object.assign(img.style, {
            position: 'absolute',
            inset: isRecommendationResult ? '12px 18px' : '8px',
            width: isRecommendationResult ? 'calc(100% - 36px)' : 'calc(100% - 16px)',
            height: isRecommendationResult ? 'calc(100% - 24px)' : 'calc(100% - 16px)',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block',
            pointerEvents: 'none',
            zIndex: '1'
          });
        }
        const badgeEl = el.querySelector('.breed-atlas-card__badge');
        if (badgeEl) {
          badgeEl.style.zIndex = '2';
        }
      } else {
        el.style.setProperty('background-image', `url("${src}")`, 'important');
        el.style.setProperty('background-position', 'center', 'important');
        el.style.setProperty('background-size', fit, 'important');
        el.style.setProperty('background-repeat', 'no-repeat', 'important');
        el.innerHTML = badge;
      }
      el.dataset.demoImageReady = '1';
    };
    const collectTargets = () => Array.from(document.querySelectorAll('.breed-img, #breed-detail-img'));
    const applyAll = () => {
      collectTargets().forEach(applyImage);
    };
    window.__pawsitiveApplyDemoBreedImages = applyAll;
    if (!window.__pawsitiveDemoBreedImageLock && window.BreedImageService) {
      const service = window.BreedImageService;
      service.loadAll = () => {
        applyAll();
        return Promise.resolve();
      };
      service.loadInto = el => {
        applyImage(el, 0);
        return Promise.resolve();
      };
      window.__pawsitiveDemoBreedImageLock = true;
    }
    applyAll();
    setTimeout(applyAll, 250);
    setTimeout(applyAll, 900);
    if (!window.__pawsitiveDemoBreedImageInterval) {
      window.__pawsitiveDemoBreedImageInterval = setInterval(applyAll, 280);
    }
  }, demoBreedImages).catch(() => {});
  await page.waitForFunction(() => {
    const cards = Array.from(document.querySelectorAll('.breed-img, #breed-detail-img')).slice(0, 9);
    return cards.length > 0 && cards.every(el => {
      const bg = getComputedStyle(el).backgroundImage || '';
      const img = el.querySelector('.pawsitive-demo-image-main');
      const containedReady = img && img.complete && img.naturalWidth > 0;
      return el.dataset.demoImageReady === '1' && (containedReady || (bg && bg !== 'none'));
    });
  }, { timeout: 6000 }).catch(() => {});
}

async function navigateViaDrawer(page, labelIncludes, waitSelector) {
  await clearDemoEffects(page).catch(() => {});
  await smoothScrollTo(page, 0, 1400).catch(() => {});
  await page.locator('.navbar__hamburger').first().click({ force: true });
  await page.waitForSelector('#nav-drawer.open', { timeout: 8000 });
  await sleep(900);
  await page.evaluate(labelIncludes => {
    const items = Array.from(document.querySelectorAll('.nav-drawer__item'));
    const target = items.find(item => item.textContent.includes(labelIncludes));
    if (target) target.click();
  }, labelIncludes);
  await page.waitForSelector(waitSelector, { timeout: 18000 });
  await sleep(1400);
}

async function saveVideo(session) {
  const video = session.page.video();
  await session.context.close();
  const rawPath = await video.path();
  const webmPath = path.join(OUT_DIR, `${session.name}.webm`);
  if (fs.existsSync(webmPath)) fs.rmSync(webmPath, { force: true });
  fs.renameSync(rawPath, webmPath);
  return webmPath;
}

function convertToMp4(webmPath, options = {}) {
  const ffmpegPath = require(path.join(ROOT, '.tools', 'video-ffmpeg', 'node_modules', 'ffmpeg-static'));
  const mp4Path = webmPath.replace(/\.webm$/i, '.mp4');
  const size = options.size || '1280:720';
  const result = spawnSync(ffmpegPath, [
    '-y',
    '-i', webmPath,
    '-vf', `scale=${size}:force_original_aspect_ratio=decrease,pad=${size}:(ow-iw)/2:(oh-ih)/2:color=#f8f7f4,fps=30`,
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Path
  ], { stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error((result.stderr || Buffer.from('ffmpeg failed')).toString('utf8').slice(-1200));
  }
  return mp4Path;
}

function trimMp4Start(mp4Path, startSec, suffix = 'trimmed') {
  const ffmpegPath = require(path.join(ROOT, '.tools', 'video-ffmpeg', 'node_modules', 'ffmpeg-static'));
  const outPath = mp4Path.replace(/\.mp4$/i, `_${suffix}.mp4`);
  if (fs.existsSync(outPath)) fs.rmSync(outPath, { force: true });
  const result = spawnSync(ffmpegPath, [
    '-y',
    '-ss', Math.max(0, startSec).toFixed(3),
    '-i', mp4Path,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    outPath
  ], { stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error((result.stderr || Buffer.from('ffmpeg trim failed')).toString('utf8').slice(-1200));
  }
  return outPath;
}

async function saveTrimmedSegment(session, visibleStartedAt, suffix) {
  const mp4Path = convertToMp4(await saveVideo(session));
  const trimStart = Math.max(0, ((visibleStartedAt || session.recordingStartedAt) - session.recordingStartedAt) / 1000 - 0.18);
  return trimStart > 0.28 ? trimMp4Start(mp4Path, trimStart, suffix) : mp4Path;
}

function getVideoDurationSec(file) {
  const ffmpegPath = require(path.join(ROOT, '.tools', 'video-ffmpeg', 'node_modules', 'ffmpeg-static'));
  const result = spawnSync(ffmpegPath, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const text = `${result.stderr || ''}${result.stdout || ''}`;
  const match = text.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!match) return 30;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function serveVideoFile(req, res, file) {
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

function startSplitVideoServer(leftMp4, rightMp4) {
  const server = http.createServer((req, res) => {
    if (req.url === '/left.mp4') return serveVideoFile(req, res, leftMp4);
    if (req.url === '/right.mp4') return serveVideoFile(req, res, rightMp4);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok');
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

function buildMobileSplitHtml(leftUrl, rightUrl, durationSec) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1280px;
    height: 720px;
    overflow: hidden;
    font-family: "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif;
    color: #10131d;
    background:
      radial-gradient(circle at 24% 16%, rgba(52,120,246,.13), transparent 25%),
      radial-gradient(circle at 78% 22%, rgba(15,159,122,.13), transparent 24%),
      linear-gradient(135deg, #fffaf2 0%, #f6f2ea 50%, #fbfaf6 100%);
  }
  .grid {
    position: fixed;
    inset: 0;
    opacity: .2;
    background-image:
      linear-gradient(rgba(17,24,39,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(17,24,39,.045) 1px, transparent 1px);
    background-size: 42px 42px;
  }
  .title {
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 950;
    letter-spacing: 0;
  }
  .stage {
    position: absolute;
    left: 60px;
    right: 60px;
    top: 54px;
    bottom: 18px;
    display: grid;
    grid-template-columns: 214px 306px 54px 306px 214px;
    align-items: center;
  }
  .speed-badge {
    position: absolute;
    top: 54px;
    left: 50%;
    z-index: 12;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 36px;
    padding: 0 16px;
    border-radius: 999px;
    color: #fff;
    background: rgba(17,24,39,.9);
    border: 1px solid rgba(255,255,255,.22);
    box-shadow: 0 18px 44px rgba(17,24,39,.22);
    backdrop-filter: blur(14px);
    opacity: 0;
    transform: translate(-50%, -8px) scale(.96);
    transition: opacity .24s ease, transform .24s ease;
    pointer-events: none;
  }
  .speed-badge::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #38bdf8;
    box-shadow: 0 0 0 7px rgba(56,189,248,.18);
  }
  .speed-badge strong {
    font-size: 14px;
    font-weight: 950;
    letter-spacing: 0;
  }
  .speed-badge span {
    font-size: 12px;
    font-weight: 850;
    color: rgba(255,255,255,.78);
  }
  body.route-stats-on .speed-badge {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
  .role-card {
    position: relative;
    width: 204px;
    min-height: 150px;
    padding: 18px 18px 17px 20px;
    border-radius: 26px;
    background: rgba(255,255,255,.76);
    border: 1px solid rgba(255,255,255,.95);
    box-shadow: 0 22px 52px rgba(17,24,39,.12);
    backdrop-filter: blur(16px);
    opacity: 0;
    transform: translateY(18px);
    overflow: hidden;
  }
  body.ready .role-card {
    animation: cardIn .72s cubic-bezier(.2,.8,.2,1) .28s forwards;
  }
  .role-card::before {
    content: "";
    position: absolute;
    left: 0;
    top: 18px;
    bottom: 18px;
    width: 5px;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--role), color-mix(in srgb, var(--role) 52%, #111827));
    box-shadow: 0 0 22px color-mix(in srgb, var(--role) 34%, transparent);
  }
  .role-card::after {
    content: "";
    position: absolute;
    inset: -40% -30% auto auto;
    width: 120px;
    height: 120px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--role) 16%, transparent);
  }
  .role-card.requester { --role: #3478f6; justify-self: end; }
  .role-card.walker { --role: #0f9f7a; justify-self: start; }
  .role-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    position: relative;
    z-index: 1;
  }
  .role-avatar {
    width: 38px;
    height: 38px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 15px;
    font-weight: 950;
    background: linear-gradient(135deg, var(--role), #111827);
    box-shadow: 0 12px 26px color-mix(in srgb, var(--role) 28%, transparent);
  }
  .role-kicker {
    font-size: 20px;
    font-weight: 950;
    line-height: 1;
    color: var(--role);
  }
  .role-name {
    position: relative;
    z-index: 1;
    margin-bottom: 8px;
    font-size: 19px;
    font-weight: 900;
    color: #111827;
  }
  .role-desc {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    font-weight: 760;
    color: #64748b;
    word-break: keep-all;
  }
  .role-status {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 30px;
    margin-top: 14px;
    padding: 0 12px;
    border-radius: 999px;
    color: #111827;
    background: rgba(255,255,255,.72);
    border: 1px solid rgba(17,24,39,.08);
    font-size: 12px;
    font-weight: 950;
  }
  .role-status::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--role);
    box-shadow: 0 0 0 6px color-mix(in srgb, var(--role) 16%, transparent);
  }
  .phone {
    position: relative;
    width: 306px;
    height: 650px;
    justify-self: center;
    border-radius: 54px;
    background: linear-gradient(145deg, #0b0d10 0%, #2d3034 38%, #050607 100%);
    box-shadow:
      0 26px 70px rgba(17,24,39,.28),
      12px 20px 54px rgba(17,24,39,.16),
      inset 0 0 0 2px rgba(255,255,255,.14);
    opacity: 0;
    transform: translateY(20px) scale(.985);
  }
  body.ready .phone {
    animation: phoneIn .82s cubic-bezier(.2,.8,.2,1) .15s forwards;
  }
  .phone::before {
    content: "";
    position: absolute;
    inset: 3px;
    border-radius: 51px;
    border: 2px solid rgba(255,255,255,.22);
    pointer-events: none;
  }
  .phone::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 11px;
    width: 94px;
    height: 5px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: rgba(255,255,255,.22);
  }
  .phone-button {
    position: absolute;
    width: 4px;
    border-radius: 99px;
    background: linear-gradient(180deg, #9ca3af, #3f3f46);
    opacity: .9;
  }
  .phone-button.left-1 { left: -3px; top: 142px; height: 44px; }
  .phone-button.left-2 { left: -3px; top: 210px; height: 72px; }
  .phone-button.right-1 { right: -3px; top: 218px; height: 104px; }
  .phone-screen {
    position: absolute;
    left: 14px;
    right: 14px;
    top: 24px;
    bottom: 24px;
    border-radius: 40px;
    overflow: hidden;
    background: #fff;
    box-shadow: inset 0 0 0 2px #000;
  }
  .phone-screen video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #fff;
  }
  .synced-stats {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
    height: 172px;
    padding: 42px 18px 18px;
    display: grid;
    place-items: center;
    gap: 4px;
    background: linear-gradient(180deg, rgba(255,255,255,.96), #fff);
    border-top: 1px solid rgba(226,232,240,.9);
    opacity: 0;
    transform: translateY(8px);
    transition: opacity .22s ease, transform .22s ease;
    pointer-events: none;
  }
  body.route-stats-on .synced-stats {
    opacity: 1;
    transform: translateY(0);
  }
  body.route-stats-ended .synced-stats {
    opacity: 1;
    transform: translateY(0);
  }
  body.route-stats-ended .synced-stats > div {
    opacity: 0;
  }
  .synced-time,
  .synced-distance {
    text-align: center;
    font-weight: 950;
    color: #111827;
    line-height: 1.08;
  }
  .synced-time { font-size: 17px; }
  .synced-distance { font-size: 16px; margin-top: 7px; }
  .stats-mode {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    margin-bottom: 8px;
    padding: 0 10px;
    border-radius: 999px;
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    font-size: 10px;
    font-weight: 950;
  }
  .synced-distance small {
    margin-left: 2px;
    font-size: 9px;
    font-weight: 900;
    color: #111827;
  }
  .synced-label {
    text-align: center;
    font-size: 9px;
    line-height: 1;
    color: #64748b;
    font-weight: 850;
  }
  .island {
    position: absolute;
    left: 50%;
    top: 28px;
    z-index: 2;
    width: 92px;
    height: 28px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: #030303;
    box-shadow: 0 2px 8px rgba(0,0,0,.22);
  }
  .island::after {
    content: "";
    position: absolute;
    right: 13px;
    top: 8px;
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: radial-gradient(circle at 60% 40%, #6078ff 0 20%, #18204b 45%, #050505 72%);
  }
  @keyframes phoneIn {
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cardIn {
    to { opacity: 1; transform: translateY(0); }
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="title">결제 완료 후 화면이 두 역할로 나뉘어 실시간 진행됩니다</div>
  <div class="speed-badge"><strong>80배속 촬영</strong><span>실제 산책 시간을 압축해 보여드립니다</span></div>
  <main class="stage">
    <aside class="role-card requester">
      <div class="role-top">
        <div class="role-avatar">요</div>
        <div class="role-kicker">요청자</div>
      </div>
      <div class="role-name">PETER LEE</div>
      <p class="role-desc">경로와 완료 상태를 한눈에 확인</p>
      <div class="role-status">Live tracking</div>
    </aside>
    <section class="phone">
      <i class="phone-button left-1"></i>
      <i class="phone-button left-2"></i>
      <i class="phone-button right-1"></i>
      <div class="phone-screen">
        <video id="leftVideo" muted playsinline preload="auto" src="${leftUrl}"></video>
        <div class="synced-stats">
          <div>
            <div class="stats-mode">80배속 시연</div>
            <div class="synced-time">00:00</div>
            <div class="synced-label">산책 시간</div>
            <div class="synced-distance">0.00<small>km</small></div>
            <div class="synced-label">이동 거리</div>
          </div>
        </div>
      </div>
      <div class="island"></div>
    </section>
    <div></div>
    <section class="phone">
      <i class="phone-button left-1"></i>
      <i class="phone-button left-2"></i>
      <i class="phone-button right-1"></i>
      <div class="phone-screen">
        <video id="rightVideo" muted playsinline preload="auto" src="${rightUrl}"></video>
        <div class="synced-stats">
          <div>
            <div class="stats-mode">80배속 시연</div>
            <div class="synced-time">00:00</div>
            <div class="synced-label">산책 시간</div>
            <div class="synced-distance">0.00<small>km</small></div>
            <div class="synced-label">이동 거리</div>
          </div>
        </div>
      </div>
      <div class="island"></div>
    </section>
    <aside class="role-card walker">
      <div class="role-top">
        <div class="role-avatar">도</div>
        <div class="role-kicker">도우미</div>
      </div>
      <div class="role-name">민준워커</div>
      <p class="role-desc">수락부터 복귀까지 GPS 산책 진행</p>
      <div class="role-status">Walker mode</div>
    </aside>
  </main>
  <script>
    const trimStart = 4;
    const videos = [document.getElementById('leftVideo'), document.getElementById('rightVideo')];
    const speedMultiplier = 80;
    const routeStatsStartSec = 6.2;
    const routeStatsEndSec = Math.min(Math.max(routeStatsStartSec + 1, 18.6), Math.max(routeStatsStartSec + 1, ${durationSec.toFixed(3)} - 3.2));
    const statEls = Array.from(document.querySelectorAll('.synced-stats'));
    function formatClock(seconds) {
      const total = Math.max(0, Math.floor(seconds));
      const mm = String(Math.floor(total / 60)).padStart(2, '0');
      const ss = String(total % 60).padStart(2, '0');
      return mm + ':' + ss;
    }
    function updateSyncedStats() {
      const playSec = Math.max(0, videos[0].currentTime - trimStart);
      const routeSec = Math.max(0, playSec - routeStatsStartSec);
      const active = playSec >= routeStatsStartSec && playSec <= routeStatsEndSec;
      document.body.classList.toggle('route-stats-on', active);
      document.body.classList.toggle('route-stats-ended', playSec > routeStatsEndSec);
      const progress = Math.min(1, routeSec / Math.max(1, routeStatsEndSec - routeStatsStartSec));
      const displaySec = routeSec * speedMultiplier;
      const distance = Math.min(1.08, Math.max(0, 1.08 * progress));
      statEls.forEach(panel => {
        const time = panel.querySelector('.synced-time');
        const dist = panel.querySelector('.synced-distance');
        if (time) time.textContent = formatClock(displaySec);
        if (dist) dist.innerHTML = distance.toFixed(2) + '<small>km</small>';
      });
      requestAnimationFrame(updateSyncedStats);
    }
    function seek(video) {
      return new Promise(resolve => {
        const done = () => {
          video.removeEventListener('seeked', done);
          resolve();
        };
        video.addEventListener('seeked', done);
        video.currentTime = Math.min(trimStart, Math.max(0, video.duration - .2));
      });
    }
    window.__startSplit = async () => {
      document.body.classList.add('ready');
      await Promise.all(videos.map(seek));
      requestAnimationFrame(updateSyncedStats);
      await Promise.all(videos.map(video => video.play()));
    };
  </script>
</body>
</html>`;
}

async function composeMobileSplit(browser, leftMp4, rightMp4, outPath) {
  const durationSec = Math.max(1, Math.min(getVideoDurationSec(leftMp4), getVideoDurationSec(rightMp4)) - 4);
  const assetServer = await startSplitVideoServer(leftMp4, rightMp4);
  const context = await browser.newContext({
    viewport: DESKTOP,
    recordVideo: { dir: RAW_DIR, size: DESKTOP },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'no-preference'
  });
  context.setDefaultTimeout(20000);
  const page = await context.newPage();
  try {
    await page.setContent(buildMobileSplitHtml(`${assetServer.baseUrl}/left.mp4`, `${assetServer.baseUrl}/right.mp4`, durationSec), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('video')).every(video => video.readyState >= 2 && Number.isFinite(video.duration)));
    await page.evaluate(() => window.__startSplit());
    await page.waitForTimeout(Math.round((durationSec + .45) * 1000));
    const video = page.video();
    await context.close();
    const rawPath = await video.path();
    const webmPath = outPath.replace(/\.mp4$/i, '.webm');
    if (fs.existsSync(webmPath)) fs.rmSync(webmPath, { force: true });
    if (fs.existsSync(outPath)) fs.rmSync(outPath, { force: true });
    fs.renameSync(rawPath, webmPath);
    return convertToMp4(webmPath, { size: '1280:720' });
  } finally {
    await assetServer.close();
  }
}

function concatMp4(parts, outPath) {
  const ffmpegPath = require(path.join(ROOT, '.tools', 'video-ffmpeg', 'node_modules', 'ffmpeg-static'));
  const listPath = path.join(RAW_DIR, `concat-${Date.now()}.txt`);
  const escaped = parts
    .map(file => `file '${file.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(listPath, escaped, 'utf8');
  const result = spawnSync(ffmpegPath, [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    outPath
  ], { stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 });
  if (result.status === 0) return outPath;

  const inputs = parts.flatMap(file => ['-i', file]);
  const labels = parts.map((_, index) => `[${index}:v]`).join('');
  const fallback = spawnSync(ffmpegPath, [
    '-y',
    ...inputs,
    '-filter_complex', `${labels}concat=n=${parts.length}:v=1:a=0[out]`,
    '-map', '[out]',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    outPath
  ], { stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 });
  if (fallback.status !== 0) {
    throw new Error((fallback.stderr || result.stderr || Buffer.from('ffmpeg concat failed')).toString('utf8').slice(-1200));
  }
  return outPath;
}

const demoBreedRecommendPreferences = {
  size: 'small',
  exerciseLevel: 'medium',
  groomingLevel: 'low',
  trainability: 'high',
  barkingLevel: 'low',
  childFriendly: true,
  apartmentFriendly: true,
  freeText: '처음 키우는 가족이고, 아이와 함께 아파트에서 지내기 좋고 관리 부담이 너무 크지 않은 견종을 원해요.'
};

async function advanceBreedRecommendFlow(page) {
  const chooseCard = async (key, value) => {
    await page.evaluate(({ key, value }) => {
      if (typeof selectBreedRecCard === 'function') selectBreedRecCard(key, value);
    }, { key, value });
    await sleep(260);
    await page.evaluate(() => {
      if (typeof nextBreedRecStep === 'function') nextBreedRecStep();
    });
    await sleep(430);
  };

  await chooseCard('size', 'small');
  await chooseCard('exercise', 'medium');
  await chooseCard('grooming', 'low');
  await chooseCard('trainability', 'high');
  await chooseCard('barking', 'low');
  await page.evaluate(() => {
    if (typeof toggleBreedRecFlag === 'function') {
      toggleBreedRecFlag('childFriendly');
      toggleBreedRecFlag('apartmentFriendly');
    }
  });
  await sleep(320);
  await page.evaluate(() => {
    if (typeof nextBreedRecStep === 'function') nextBreedRecStep();
  });
  await sleep(420);
  await page.fill('#breed-rec-input', '3');
  await sleep(260);
  await page.evaluate(() => {
    if (typeof nextBreedRecStep === 'function') nextBreedRecStep();
  });
  await sleep(420);
  await page.fill('#breed-rec-input', demoBreedRecommendPreferences.freeText);
  await sleep(650);
  await page.evaluate(() => {
    if (typeof finishBreedRecommendFlow === 'function') finishBreedRecommendFlow();
  });
}

async function computeRealBreedRecommendation(browser) {
  const session = await createDemoPage(browser, '01_breeds_ai_recommendation_real_ai_compute', {
    recordVideo: false,
    state: { realBreedRecommend: true, realBreedTimeoutMs: 150000 }
  });
  try {
    const { page } = session;
    await gotoApp(page, '#/breeds');
    const data = await page.evaluate(async ({ preferences, count }) => {
      const res = await fetch('/api/ai/recommend-breed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences, count })
      });
      const payload = await res.json();
      if (typeof normalizeBreedRecommendResponse === 'function') {
        const normalized = normalizeBreedRecommendResponse(payload);
        if (normalized?.success && Array.isArray(normalized.recommendations)) {
          const breeds = BreedService.getAll();
          const compact = value => String(value || '').toLowerCase().replace(/[\s\-_()]/g, '');
          const findByName = rec => {
            const nameEn = compact(rec.nameEn);
            const name = compact(rec.name);
            return breeds.find(b => nameEn && compact(b.nameEn) === nameEn)
              || breeds.find(b => name && compact(b.name) === name)
              || null;
          };
          normalized.recommendations = normalized.recommendations
            .map(rec => {
              const breed = findByName(rec) || BreedService.getById(rec.id);
              if (!breed) return null;
              return {
                ...rec,
                id: breed.id,
                name: breed.name,
                nameEn: breed.nameEn || rec.nameEn || ''
              };
            })
            .filter(Boolean);
        }
        return normalized;
      }
      return payload;
    }, { preferences: demoBreedRecommendPreferences, count: 3 });

    if (data?.success && Array.isArray(data.recommendations) && data.recommendations.length) {
      return data;
    }
    return breedRecommendation;
  } finally {
    await session.context.close().catch(() => {});
  }
}

async function showBreedRecommendationResult(page, data) {
  await page.evaluate(result => {
    if (result?.success && Array.isArray(result.recommendations) && typeof BreedService !== 'undefined') {
      const breeds = BreedService.getAll();
      const compact = value => String(value || '').toLowerCase().replace(/[\s\-_()]/g, '');
      const findByName = rec => {
        const nameEn = compact(rec.nameEn);
        const name = compact(rec.name);
        return breeds.find(b => nameEn && compact(b.nameEn) === nameEn)
          || breeds.find(b => name && compact(b.name) === name)
          || null;
      };
      result = {
        ...result,
        recommendations: result.recommendations
          .map(rec => {
            const breed = findByName(rec) || BreedService.getById(rec.id);
            if (!breed) return null;
            return {
              ...rec,
              id: breed.id,
              name: breed.name,
              nameEn: breed.nameEn || rec.nameEn || ''
            };
          })
          .filter(Boolean)
      };
    }
    sessionStorage.setItem('breedLastRecommendResult', JSON.stringify(result));
    if (typeof saveBreedRecommendResult === 'function') saveBreedRecommendResult(result);
    if (typeof switchBreedTab === 'function') switchBreedTab('recommend');
    const resultEl = document.getElementById('breed-recommend-result');
    if (resultEl && typeof renderBreedRecommendResult === 'function') {
      resultEl.innerHTML = renderBreedRecommendResult(result);
    }
    setTimeout(() => window.BreedImageService?.loadAll?.(), 100);
  }, data);
  await page.waitForSelector('.breed-rec-result-card', { timeout: 12000 });
  await ensureBreedImages(page);
  await page.evaluate(() => window.__pawsitiveApplyDemoBreedImages?.()).catch(() => {});
}

async function recordBreeds(browser) {
  const introSession = await createDemoPage(browser, '01_breeds_ai_recommendation_intro_polished', {
    state: { breedRecommendDelayMs: 12500 }
  });
  const introPage = introSession.page;
  await gotoApp(introPage, '#/breeds');
  await clickVisible(introPage, '#tab-encyclopedia');
  await introPage.waitForSelector('.breed-atlas-card', { timeout: 18000 });
  await ensureBreedImages(introPage);
  await introPage.evaluate(() => window.__pawsitiveApplyDemoBreedImages?.()).catch(() => {});
  await smoothScrollTo(introPage, 0, 600).catch(() => {});
  const introVisibleAt = Date.now();
  await sleep(780);
  await smoothScrollElementTo(introPage, '#breed-list', 2100, 'start');
  await sleep(1050);
  await smoothScrollTo(introPage, 680, 2400);
  await sleep(820);
  await smoothScrollTo(introPage, 0, 1700);
  await sleep(520);
  await clickVisible(introPage, '#tab-recommend');
  await introPage.waitForSelector('.breed-recommend-hero', { timeout: 12000 });
  await sleep(820);
  await introPage.locator('#rec-submit-btn').first().click({ force: true });
  await introPage.waitForSelector('#breed-rec-modal', { timeout: 8000 });
  await sleep(520);
  await advanceBreedRecommendFlow(introPage);
  await introPage.waitForSelector('.breed-recommend-loading-card', { timeout: 8000 });
  await smoothScrollElementTo(introPage, '.breed-recommend-loading-card', 900, 'center').catch(() => {});
  await introPage.evaluate(() => {
    const video = document.querySelector('.breed-recommend-loading-video');
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }).catch(() => {});
  await sleep(6400);
  const intro = await saveTrimmedSegment(introSession, introVisibleAt, 'ready');

  const realRecommendation = await computeRealBreedRecommendation(browser);

  const resultSession = await createDemoPage(browser, '01_breeds_ai_recommendation_result_polished');
  const resultPage = resultSession.page;
  await gotoApp(resultPage, '#/breeds');
  await showBreedRecommendationResult(resultPage, realRecommendation);
  await resultPage.evaluate(() => {
    const summary = document.querySelector('.breed-rec-summary');
    if (summary) summary.scrollIntoView({ block: 'start' });
  }).catch(() => {});
  const resultVisibleAt = Date.now();
  await sleep(920);
  await smoothScrollLocatorTo(resultPage, resultPage.locator('.breed-rec-result-card').first(), 2300, 'center');
  await sleep(1050);
  const cards = await resultPage.locator('.breed-rec-result-card').count();
  for (let i = 1; i < Math.min(cards, 3); i += 1) {
    await smoothScrollLocatorTo(resultPage, resultPage.locator('.breed-rec-result-card').nth(i), 2500, 'center');
    await sleep(900);
  }
  await smoothScrollLocatorTo(resultPage, resultPage.locator('.breed-rec-result-card').first(), 2100, 'center');
  await sleep(720);
  await resultPage.locator('.breed-rec-result-card button').first().click({ force: true });
  await resultPage.waitForSelector('.breed-detail-page', { timeout: 16000 });
  await ensureBreedImages(resultPage);
  await resultPage.evaluate(() => window.__pawsitiveApplyDemoBreedImages?.()).catch(() => {});
  await smoothScrollTo(resultPage, 0, 500).catch(() => {});
  await sleep(950);
  await smoothScrollElementTo(resultPage, '.breed-detail-metrics', 2400, 'start').catch(() => {});
  await sleep(850);
  await smoothScrollElementTo(resultPage, '.breed-detail-ai', 3100, 'center').catch(async () => {
    const bottom = await resultPage.evaluate(() => document.body.scrollHeight - window.innerHeight);
    await smoothScrollTo(resultPage, Math.max(0, bottom), 3100);
  });
  await sleep(1100);
  const result = await saveTrimmedSegment(resultSession, resultVisibleAt, 'ready');

  const out = path.join(OUT_DIR, '01_breeds_ai_recommendation_polished.mp4');
  return concatMp4([intro, result], out);
}

async function recordBreedsLegacy(browser) {
  const session = await createDemoPage(browser, '01_breeds_ai_recommendation_polished');
  const { page } = session;
  await gotoApp(page, '#/breeds');
  await page.addStyleTag({ content: '.breed-recommend-loading-card,.breed-recommend-loading-video{display:none!important;}' }).catch(() => {});
  await clickVisible(page, '#tab-encyclopedia');
  await page.waitForSelector('.breed-atlas-card', { timeout: 18000 });
  await ensureBreedImages(page);
  await sleep(1600);
  await smoothScrollElementTo(page, '#breed-list', 2800, 'start');
  await sleep(1800);
  await smoothScrollTo(page, 680, 3600);
  await sleep(1800);
  await page.locator('.breed-atlas-card').nth(2).click({ force: true });
  await page.waitForSelector('.breed-detail-page', { timeout: 16000 });
  await ensureBreedImages(page);
  await sleep(1800);
  await smoothScrollElementTo(page, '.breed-detail-metrics', 3200, 'start');
  await sleep(1600);
  await smoothScrollElementTo(page, '.breed-detail-ai', 3200, 'center').catch(() => {});
  await sleep(1900);
  await page.locator('.breed-detail-back').click({ force: true });
  await page.waitForSelector('#tab-recommend', { timeout: 16000 });
  await sleep(1200);
  await clickVisible(page, '#tab-recommend');
  await sleep(1600);
  await focusWithCallout(page, '#rec-submit-btn', '조건을 차례로 입력해 AI 추천으로 연결', { offsetX: 170 });
  await sleep(1500);
  await page.locator('#rec-submit-btn').first().click({ force: true });
  await page.waitForSelector('#breed-rec-modal', { timeout: 8000 }).catch(() => {});
  await sleep(1100);

  const cardSteps = [
    '소형',
    '보통',
    '적음',
    '쉬운 편',
    '적음'
  ];
  for (const label of cardSteps) {
    await page.locator('#breed-rec-content button', { hasText: label }).first().click({ force: true });
    await sleep(850);
    await page.locator('#breed-rec-content button', { hasText: '다음' }).last().click({ force: true });
    await sleep(1100);
  }
  await page.locator('#breed-rec-content button', { hasText: '아이와 함께' }).first().click({ force: true });
  await sleep(650);
  await page.locator('#breed-rec-content button', { hasText: '아파트 거주' }).first().click({ force: true });
  await sleep(900);
  await page.locator('#breed-rec-content button', { hasText: '다음' }).last().click({ force: true });
  await sleep(900);
  await page.fill('#breed-rec-input', '3');
  await sleep(700);
  await page.locator('#breed-rec-content button', { hasText: '다음' }).last().click({ force: true });
  await sleep(850);
  await page.fill('#breed-rec-input', '처음 키우는 가족이고, 아파트에서 아이와 함께 지내기 좋고 관리 부담이 너무 크지 않은 견종을 원해요.');
  await sleep(1200);
  await page.locator('#breed-rec-content button', { hasText: 'AI 맞춤 추천 받기' }).last().click({ force: true });
  await page.waitForSelector('.breed-rec-result-card', { timeout: 18000 });
  await ensureBreedImages(page);
  await page.evaluate(() => window.__pawsitiveApplyDemoBreedImages?.()).catch(() => {});
  await sleep(1400);
  await smoothScrollElementTo(page, '.breed-rec-summary', 3200, 'start');
  await sleep(1600);
  const cards = await page.locator('.breed-rec-result-card').count();
  for (let i = 0; i < Math.min(cards, 3); i += 1) {
    await smoothScrollLocatorTo(page, page.locator('.breed-rec-result-card').nth(i), 3600, 'center');
    await sleep(2500);
  }
  await clearDemoEffects(page);
  await sleep(1000);
  return convertToMp4(await saveVideo(session));
}

async function recordMatching(browser) {
  const session = await createDemoPage(browser, '02_ai_matching_score_polished');
  const { page } = session;
  await gotoApp(page, '#/matching');
  await installDemoEffects(page);
  await page.waitForSelector('#walker-list-section', { timeout: 18000 });
  await smoothScrollElementTo(page, '#walker-list-section', 5200, 'start');
  await sleep(1800);
  await focusWithCallout(page, '#ai-calc-btn', '거리·시간·경험·평점·견종 적합도를 함께 계산', { offsetX: 205 });
  await sleep(1800);
  await page.locator('#ai-calc-btn').first().click({ force: true });
  await page.waitForFunction(() => !document.getElementById('ai-score-blur-overlay') || getComputedStyle(document.getElementById('ai-score-blur-overlay')).display === 'none', { timeout: 18000 });
  await clearDemoEffects(page);
  await sleep(2200);
  await smoothScrollTo(page, 0, 5200);
  await sleep(1600);
  await smoothScrollElementTo(page, '#walker-list-section', 6200, 'start');
  await sleep(1800);
  await focusWithCallout(page, '#ai-walker-list .dw-card', 'AI 추천 1위부터 신뢰도 순서로 정렬', { offsetX: 170 });
  await sleep(2600);
  await clearDemoEffects(page);
  await smoothScrollTo(page, Math.min(await page.evaluate(() => document.body.scrollHeight - window.innerHeight), 1320), 5200);
  await sleep(1800);
  await smoothScrollElementTo(page, '#walker-list-section', 3800, 'start');
  await sleep(900);
  await page.locator('button', { hasText: '점수 계산 방식' }).first().click();
  await page.waitForSelector('#ai-score-explain', { state: 'visible', timeout: 8000 });
  await focusWithCallout(page, '#ai-score-explain', '점수 산정 기준을 발표에서 짧게 설명', { className: 'demo-health-card-focus', offsetX: 185 });
  await sleep(5600);
  await clearDemoEffects(page);
  await sleep(900);
  return convertToMp4(await saveVideo(session));
}

async function patchRealtimeCapture(page) {
  await page.evaluate(() => {
    window.__demoRtHandlers = {};
    const install = () => {
      if (typeof RealtimeService === 'undefined' || RealtimeService.__demoPatched) return false;
      const originalOn = RealtimeService.on.bind(RealtimeService);
      RealtimeService.on = (event, fn) => {
        window.__demoRtHandlers[event] = window.__demoRtHandlers[event] || [];
        window.__demoRtHandlers[event].push(fn);
        return originalOn(event, fn);
      };
      window.__demoEmit = (event, data) => {
        (window.__demoRtHandlers[event] || []).forEach(fn => {
          try { fn(data); } catch (e) {}
        });
      };
      RealtimeService.__demoPatched = true;
      return true;
    };
    if (!install()) {
      const timer = setInterval(() => {
        if (install()) clearInterval(timer);
      }, 50);
    }
  });
}

async function openWalkSessionMobile(page) {
  await gotoApp(page, '#/');
  await page.waitForFunction(() => (
    typeof Router !== 'undefined' &&
    typeof RealtimeService !== 'undefined' &&
    typeof AuthService !== 'undefined'
  ), { timeout: 16000 });
  await patchRealtimeCapture(page);
  await page.evaluate(() => {
    window._activeSessionId = 'demo-session';
    window._activeWalkRequestId = 'demo-request';
    Router.navigate('/walk-session');
  });
  await page.waitForSelector('#walk-session-map', { timeout: 18000 });
  await sleep(1900);
}

async function emitRouteTo(page, maxIndex, delay = 120, sessionState = null) {
  for (let i = 0; i <= maxIndex; i += 1) {
    const point = routePoint(Math.min(i, smoothRoute.length - 1));
    if (sessionState) {
      sessionState.routeIndex = Math.min(i, smoothRoute.length - 1);
      if (!sessionState.routePoints.some(item => item.id === point.id)) {
        sessionState.routePoints.push(point);
      }
    }
    await page.evaluate(point => {
      window.__demoEmit?.('walker-position', point);
    }, point);
    await sleep(delay);
  }
}

async function setSessionStatus(page, sessionState, status) {
  sessionState.status = status;
  if (status === 'walking') sessionState.startedAt = new Date().toISOString();
  await page.evaluate(() => renderWalkSessionPage('demo-session'));
  await page.waitForSelector('#walk-session-map', { timeout: 12000 });
  await patchRealtimeCapture(page);
  await sleep(1150);
}

async function recordOneMobileSide(browser, name, user, side, sharedState) {
  const session = await createDemoPage(browser, name, {
    viewport: MOBILE,
    mobile: true,
    user,
    state: { includeSession: true, sessionState: sharedState }
  });
  const { page } = session;
  await openWalkSessionMobile(page);

  if (side === 'walker') {
    await sleep(1500);
    await clickVisible(page, '.wsp-action--primary');
    sharedState.status = 'arrived';
    await setSessionStatus(page, sharedState, 'arrived');
    await sleep(1500);
    await setSessionStatus(page, sharedState, 'walking');
    await smoothScrollElementTo(page, '#walk-session-map', 1700, 'center');
    await sleep(900);
    await emitRouteTo(page, smoothRoute.length - 1, 180, sharedState);
    await setSessionStatus(page, sharedState, 'returning');
    await sleep(1700);
    await setSessionStatus(page, sharedState, 'return_arrived');
    await sleep(1500);
    await page.locator('.wsp-action--accent').first().click({ force: true }).catch(() => {});
    await page.waitForSelector('#walk-completion-screen', { timeout: 14000 }).catch(() => {});
    await sleep(2600);
  } else {
    await sleep(2100);
    await setSessionStatus(page, sharedState, 'arrived');
    await sleep(1500);
    await clickVisible(page, '.wsp-action--primary');
    await setSessionStatus(page, sharedState, 'walking');
    await smoothScrollElementTo(page, '#walk-session-map', 1700, 'center');
    await sleep(900);
    await emitRouteTo(page, smoothRoute.length - 1, 180, sharedState);
    await setSessionStatus(page, sharedState, 'returning');
    await sleep(1700);
    await setSessionStatus(page, sharedState, 'return_arrived');
    await sleep(1700);
    await page.locator('.wsp-action--accent').first().click({ force: true }).catch(() => {});
    await page.waitForSelector('#walk-completion-screen', { timeout: 14000 }).catch(() => {});
    await sleep(1800);
    await page.locator('#walk-completion-screen button').last().click({ force: true }).catch(() => {});
    await page.waitForSelector('#requester-review-modal', { timeout: 14000 }).catch(() => {});
    await sleep(1200);
    await page.evaluate(() => {
      if (typeof selectReviewStar === 'function') selectReviewStar(5, 'req');
    }).catch(() => {});
    await page.fill('#req-review-comment', 'GPS 경로와 진행 상태가 잘 보여서 안심하고 맡길 수 있었어요.').catch(() => {});
    await sleep(2600);
  }

  return convertToMp4(await saveVideo(session), { size: '390:844' });
}

async function recordMapPaymentIntro(browser) {
  const session = await createDemoPage(browser, '03_map_payment_intro_polished', {
    state: { includeSession: false }
  });
  const { page } = session;
  await gotoApp(page, '#/matching');
  await page.waitForSelector('#dw-disc-map', { timeout: 18000 });
  await smoothScrollElementTo(page, '#dw-disc-map', 3200, 'center');
  await page.waitForSelector('.leaflet-marker-icon', { timeout: 18000 }).catch(() => {});
  await sleep(2500);

  const markerCount = await page.locator('.leaflet-marker-icon').count().catch(() => 0);
  if (markerCount > 2) {
    await page.locator('.leaflet-marker-icon').nth(2).click({ force: true }).catch(() => {});
  }
  await sleep(1400);
  await page.evaluate(() => {
    if (document.querySelector('.dw-popup-card__button')) return;
    const walker = (typeof MatchingService !== 'undefined')
      ? MatchingService.getAvailableWalkers().find(w => w.userId === 'dummy-walker-002')
      : null;
    if (!walker || !window._dwDiscoveryMap || !window._dwDiscoveryLayer) return;
    window._dwDiscoveryMap.setView([walker.lat, walker.lng], 15, { animate: true });
    window._dwDiscoveryLayer.eachLayer(layer => {
      if (!layer.getLatLng || !layer.openPopup) return;
      const latLng = layer.getLatLng();
      if (Math.abs(latLng.lat - walker.lat) < 0.00001 && Math.abs(latLng.lng - walker.lng) < 0.00001) {
        layer.openPopup();
      }
    });
  });
  await page.waitForSelector('.dw-popup-card__button', { timeout: 12000 }).catch(() => {});
  await sleep(2800);
  await page.evaluate(() => {
    window.__showDemoTossCheckout = ({ amount = 10000, orderName = '산책 서비스' } = {}) => new Promise(resolve => {
      document.getElementById('demo-toss-checkout')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'demo-toss-checkout';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:20000;background:rgba(8,13,23,.58);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);';
      overlay.innerHTML = `
        <div style="width:min(520px,calc(100vw - 36px));height:620px;background:#fff;border-radius:18px;box-shadow:0 28px 90px rgba(0,0,0,.32);overflow:hidden;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;border-bottom:1px solid #eef1f5;">
            <div style="display:flex;align-items:center;gap:9px;font-weight:900;color:#111827;"><span style="width:22px;height:22px;border-radius:7px;background:#0064ff;display:inline-block;"></span>toss payments</div>
            <div style="font-size:22px;color:#9aa4b2;">×</div>
          </div>
          <div style="padding:34px 30px 28px;">
            <div style="font-size:13px;font-weight:800;color:#0064ff;letter-spacing:.08em;text-transform:uppercase;">Secure checkout</div>
            <h2 style="margin:12px 0 8px;font-size:30px;line-height:1.18;color:#101828;">토스페이먼츠로<br>결제를 진행합니다</h2>
            <p style="margin:0;color:#667085;font-size:15px;line-height:1.6;">발표 시연용 결제 화면입니다. 실제 서비스 흐름과 동일하게 결제 성공 후 매칭 요청이 이어집니다.</p>
            <div style="margin-top:30px;border:1px solid #e6ecf3;border-radius:16px;padding:18px;background:#f8fbff;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;color:#667085;font-size:14px;"><span>주문명</span><strong style="color:#101828;">${orderName}</strong></div>
              <div style="display:flex;justify-content:space-between;align-items:center;color:#667085;font-size:14px;"><span>결제 금액</span><strong style="font-size:24px;color:#101828;">${Number(amount || 0).toLocaleString()}원</strong></div>
            </div>
            <div style="margin-top:28px;display:grid;gap:10px;">
              <div style="border:2px solid #0064ff;background:#f4f8ff;border-radius:14px;padding:15px 16px;display:flex;justify-content:space-between;align-items:center;font-weight:800;color:#101828;"><span>카드 간편결제</span><span style="color:#0064ff;">선택됨</span></div>
              <div style="border:1px solid #e6ecf3;border-radius:14px;padding:15px 16px;color:#98a2b3;font-weight:700;">계좌 이체</div>
            </div>
            <div style="margin-top:30px;height:52px;border-radius:14px;background:#0064ff;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;" class="demo-toss-state">결제 승인 중...</div>
            <div style="margin-top:18px;height:5px;border-radius:999px;background:#eef2f7;overflow:hidden;"><div class="demo-toss-bar" style="height:100%;width:0;background:#0064ff;transition:width 3.5s cubic-bezier(.22,1,.36,1);"></div></div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        const bar = overlay.querySelector('.demo-toss-bar');
        if (bar) bar.style.width = '100%';
      });
      setTimeout(() => {
        const state = overlay.querySelector('.demo-toss-state');
        if (state) {
          state.textContent = '결제가 완료되었습니다';
          state.style.background = '#0f9f7a';
        }
      }, 3000);
      setTimeout(() => {
        overlay.remove();
        resolve({ success: true });
      }, 4300);
    });
    window.requestTossPayment = async options => {
      await window.__showDemoTossCheckout(options || {});
      return { success: true };
    };
    try { requestTossPayment = window.requestTossPayment; } catch (e) {}
  });
  const popupButton = page.locator('.dw-popup-card__button').first();
  if (await popupButton.count()) {
    await popupButton.click({ force: true }).catch(() => {});
  } else {
    await page.evaluate(() => handleSendMatchRequest('dummy-walker-002'));
  }
  await page.waitForSelector('.walk-pay-overlay', { timeout: 16000 });
  await sleep(2400);
  await page.locator('.pay-dur-btn[data-dur="80"]').click({ force: true }).catch(() => {});
  await sleep(1700);
  await page.locator('.walk-pay-btn--primary').click({ force: true }).catch(() => {});
  await sleep(4550);
  return convertToMp4(await saveVideo(session));
}

async function recordMobileWalkProcess(browser) {
  const intro = await recordMapPaymentIntro(browser);
  const leftState = createSessionState();
  const rightState = createSessionState();
  const left = await recordOneMobileSide(browser, '03_requester_mobile_side', peterUser, 'requester', leftState);
  const right = await recordOneMobileSide(browser, '03_walker_mobile_side', walkerUser, 'walker', rightState);
  const splitOut = path.join(OUT_DIR, '03_mobile_walk_process_split_polished.mp4');
  const split = await composeMobileSplit(browser, left, right, splitOut);
  const out = path.join(OUT_DIR, '03_mobile_payment_walk_gps_split_polished.mp4');
  return concatMp4([intro, split], out);
}

async function recordWalkHealthFlow(browser) {
  const session = await createDemoPage(browser, '04_walk_health_ai_expert_flow_polished', {
    mockGps: true,
    state: { includeSession: false, realAiConsult: true }
  });
  const { page } = session;
  await gotoApp(page, '#/walk-tracking');
  await installDemoEffects(page);
  await page.waitForSelector('#tracking-map', { timeout: 16000 });
  await smoothScrollElementTo(page, '.gps-panel--tracker', 2200, 'start');
  await sleep(1400);
  await clickVisible(page, '.gps-start');
  await sleep(12200);
  await clickVisible(page, '.gps-stop');
  await page.waitForSelector('.gps-complete', { timeout: 16000 });
  await sleep(1800);
  await clickVisible(page, '.gps-complete .gps-btn--blue');
  await page.waitForSelector('.community-post, .community-post__body, [class*="community"]', { timeout: 16000 }).catch(() => {});
  await page.waitForSelector('.community-walk-card, .community-post__map', { timeout: 16000 }).catch(() => {});
  await page.waitForFunction(() => (
    document.querySelector('.community-post__map .leaflet-overlay-pane path') ||
    document.querySelector('.community-post__map .leaflet-marker-icon') ||
    document.querySelector('.community-post__map .leaflet-tile')
  ), { timeout: 18000 }).catch(() => {});
  await page.addStyleTag({ content: '#community-pet-dog,#community-pet-kennel{display:none!important;}' }).catch(() => {});
  await sleep(2400);
  await smoothScrollElementTo(page, '.community-walk-card', 3600, 'center').catch(async () => {
    await smoothScrollTo(page, Math.min(await page.evaluate(() => document.body.scrollHeight - window.innerHeight), 620), 3200);
  });
  await sleep(2200);
  const communityPostCount = await page.locator('.community-post').count().catch(() => 0);
  for (let i = 1; i < Math.min(communityPostCount, 4); i += 1) {
    await smoothScrollLocatorTo(page, page.locator('.community-post').nth(i), 4300, 'center').catch(() => {});
    await sleep(1800);
  }
  await sleep(1100);
  await navigateViaDrawer(page, '건강', '.health-page');
  await page.waitForSelector('.health-page', { timeout: 16000 });
  await smoothScrollTo(page, 0, 2200);
  await page.waitForSelector('#health-stats-section .health-stat-card', { timeout: 16000 }).catch(() => {});
  await page.evaluate(() => {
    const section = document.getElementById('health-stats-section');
    if (section && typeof setHealthAnimationProgress === 'function') setHealthAnimationProgress(section, 0);
  }).catch(() => {});
  await sleep(500);
  await page.evaluate(() => {
    const section = document.getElementById('health-stats-section');
    if (section && typeof animateHealthMetricCounters === 'function') animateHealthMetricCounters(section);
  }).catch(() => {});
  await sleep(3600);
  await page.evaluate(() => {
    document.querySelectorAll('.demo-video-callout').forEach(el => el.remove());
    const btn = document.querySelectorAll('.health-quick-actions .health-action-btn')[1];
    if (!btn) return;
    btn.classList.add('demo-focus-target');
    const rect = btn.getBoundingClientRect();
    const label = document.createElement('div');
    label.className = 'demo-video-callout';
    label.textContent = '건강 분석 데이터를 AI 상담으로 전달';
    label.style.left = `${rect.left + rect.width / 2 - 126}px`;
    label.style.top = `${rect.top - 52}px`;
    document.body.appendChild(label);
  });
  await sleep(2600);
  await page.locator('.health-quick-actions .health-action-btn').nth(1).click({ force: true });
  await clearDemoEffects(page);
  await page.waitForSelector('#ai-health-transfer-card', { timeout: 18000 });
  await page.waitForSelector('#ai-input', { timeout: 16000 });
  await sleep(1100);
  await smoothScrollElementTo(page, '#ai-health-transfer-card', 2200, 'center').catch(() => {});
  await page.addStyleTag({
    content: `
      @keyframes demoCardSpotlight {
        0%,100% { transform:scale(1); box-shadow:0 12px 28px rgba(15,118,110,.07), 0 0 0 0 rgba(15,118,110,.32); }
        50% { transform:scale(1.035); box-shadow:0 26px 58px rgba(15,118,110,.22), 0 0 0 12px rgba(15,118,110,.10); }
      }
      .demo-health-card-focus { transform-origin:center; animation:demoCardSpotlight 1.55s ease-in-out infinite; border-color:#0F766E !important; }
    `
  });
  await page.evaluate(() => {
    document.querySelectorAll('.demo-video-callout').forEach(el => el.remove());
    const card = document.getElementById('ai-health-transfer-card');
    if (!card) return;
    card.classList.add('demo-health-card-focus');
    const rect = card.getBoundingClientRect();
    const label = document.createElement('div');
    label.className = 'demo-video-callout';
    label.textContent = '산책 통계 + 건강 분석 결과가 함께 연결됨';
    label.style.left = `${Math.max(24, rect.left + rect.width / 2 - 170)}px`;
    label.style.top = `${Math.max(82, rect.top - 54)}px`;
    document.body.appendChild(label);
  });
  await sleep(4200);
  await clearDemoEffects(page);
  await sleep(1600);
  await page.fill('#ai-breed', '골든 리트리버');
  await page.fill('#ai-topic', '산책 후 관절 관리');
  await page.fill('#ai-age', '3살');
  await page.fill('#ai-input', '오늘 산책 기록을 보면 초코 관절 관리를 어떻게 이어가면 좋을까요?');
  await sleep(1000);
  await clickVisible(page, '#ai-send-btn');
  await page.waitForSelector('.ai-msg-row--ai:not(#ai-loading)', { timeout: 65000 });
  await smoothScrollLocatorTo(page, page.locator('.ai-msg-row--ai:not(#ai-loading)').last(), 2600, 'center').catch(() => {});
  await sleep(6200);
  await navigateViaDrawer(page, '전문가', '.experts-page');
  await page.waitForSelector('.experts-page', { timeout: 18000 });
  await sleep(2600);
  await smoothScrollElementTo(page, '.expert-list', 4400, 'start');
  await sleep(2200);
  const expertCards = await page.locator('.expert-card').count().catch(() => 0);
  for (let i = 0; i < Math.min(expertCards, 3); i += 1) {
    await smoothScrollLocatorTo(page, page.locator('.expert-card').nth(i), 3900, 'center').catch(() => {});
    await sleep(2300);
  }
  await smoothScrollTo(page, Math.max(0, await page.evaluate(() => document.body.scrollHeight - window.innerHeight)), 5200).catch(() => {});
  await sleep(2600);
  return convertToMp4(await saveVideo(session));
}

async function recordWalkHealthEducationFlow(browser) {
  const aiConsultReply = [
    '초코의 최근 산책 기록을 보면 산책 빈도와 이동 거리는 일정하게 유지되고 있어요. 다만 골든 리트리버는 관절 부담이 누적되기 쉬운 편이라, 긴 산책을 한 번에 몰아서 하기보다는 짧고 규칙적인 산책을 나누어 진행하는 편이 더 안전합니다.',
    '오늘처럼 활동량이 갑자기 줄거나 걷는 속도가 평소보다 느려진다면 컨디션 변화를 함께 확인해 주세요. 산책 후 절뚝거림, 계단 오르기 거부, 오래 누워 있으려는 행동이 반복되면 관절 상태를 점검하는 것이 좋습니다.',
    '관리 방법은 세 가지로 정리할 수 있어요. 첫째, 산책 전후로 3분 정도 천천히 걷는 워밍업과 쿨다운을 넣어 주세요. 둘째, 미끄러운 바닥이나 급한 경사길은 피하고 평평한 길 위주로 산책해 주세요. 셋째, 체중이 늘면 관절 부담이 커지므로 간식 양과 식사량을 함께 관리해 주세요.',
    '증상이 반복되거나 통증 반응이 보이면 앱의 전문가 상담으로 이어가고, 평소 관리 지식은 교육센터에서 보호자가 직접 학습하면서 꾸준히 관리하는 흐름을 추천합니다.'
  ].join('\n\n');

  const session = await createDemoPage(browser, '04_walk_health_ai_expert_flow_polished', {
    mockGps: true,
    state: {
      includeSession: false,
      realAiConsult: false,
      aiConsultDelayMs: 550,
      aiConsultReply
    }
  });
  const { page } = session;

  await gotoApp(page, '#/walk-tracking');
  await installDemoEffects(page);
  await installWalkSpeedDemoOverlay(page, { speed: 50, summaryMinutes: 10 });
  await page.waitForSelector('#tracking-map', { timeout: 16000 });
  await smoothScrollElementTo(page, '.gps-panel--tracker', 1800, 'start');
  await sleep(900);
  await page.evaluate(() => window.__pawsitiveDemoArmSpeedWalk?.());
  await clickVisible(page, '.gps-start');
  await page.evaluate(() => window.__pawsitiveDemoStartSpeedWalk?.());
  await sleep(12200);
  await page.evaluate(() => window.__pawsitiveDemoStopSpeedWalk?.());
  await clickVisible(page, '.gps-stop');
  await page.waitForSelector('.gps-complete', { timeout: 16000 });
  await sleep(1200);
  await clickVisible(page, '.gps-complete .gps-btn--blue');

  await page.waitForSelector('.community-post, .community-post__body, [class*="community"]', { timeout: 16000 }).catch(() => {});
  await page.waitForSelector('.community-walk-card, .community-post__map', { timeout: 16000 }).catch(() => {});
  await page.waitForFunction(() => (
    document.querySelector('.community-post__map .leaflet-overlay-pane path') ||
    document.querySelector('.community-post__map .leaflet-marker-icon') ||
    document.querySelector('.community-post__map .leaflet-tile')
  ), { timeout: 18000 }).catch(() => {});
  await page.addStyleTag({ content: '#community-pet-dog,#community-pet-kennel{display:none!important;}' }).catch(() => {});
  await sleep(900);
  await smoothScrollElementTo(page, '.community-walk-card', 1700, 'center').catch(async () => {
    await smoothScrollTo(page, Math.min(await page.evaluate(() => document.body.scrollHeight - window.innerHeight), 620), 1700);
  });
  await sleep(900);
  await smoothScrollTo(page, Math.min(await page.evaluate(() => document.body.scrollHeight - window.innerHeight), 760), 1800).catch(() => {});
  await sleep(800);

  await navigateViaDrawer(page, '건강', '.health-page');
  await page.waitForSelector('.health-page', { timeout: 16000 });
  await smoothScrollTo(page, 0, 1200);
  await sleep(1800);
  await page.waitForSelector('#health-stats-section .health-stat-card', { timeout: 16000 }).catch(() => {});
  await page.evaluate(() => {
    const section = document.getElementById('health-stats-section');
    if (section && typeof setHealthAnimationProgress === 'function') setHealthAnimationProgress(section, 0);
  }).catch(() => {});
  await sleep(350);
  await page.evaluate(() => {
    const section = document.getElementById('health-stats-section');
    if (section && typeof animateHealthMetricCounters === 'function') animateHealthMetricCounters(section);
  }).catch(() => {});
  await sleep(2500);
  await smoothScrollElementTo(page, '#health-analysis-section', 2400, 'start').catch(async () => {
    await smoothScrollTo(page, Math.min(await page.evaluate(() => document.body.scrollHeight - window.innerHeight), 860), 2400);
  });
  await sleep(1000);
  await smoothScrollTo(page, Math.max(0, await page.evaluate(() => document.body.scrollHeight - window.innerHeight)), 3800).catch(() => {});
  await sleep(900);
  await smoothScrollTo(page, 0, 1200);
  await sleep(500);
  await page.evaluate(() => {
    document.querySelectorAll('.demo-video-callout').forEach(el => el.remove());
    const btn = document.querySelectorAll('.health-quick-actions .health-action-btn')[1];
    if (!btn) return;
    btn.classList.add('demo-focus-target');
    const rect = btn.getBoundingClientRect();
    const label = document.createElement('div');
    label.className = 'demo-video-callout';
    label.textContent = '건강 분석 데이터를 AI 상담으로 연결';
    label.style.left = `${rect.left + rect.width / 2 - 126}px`;
    label.style.top = `${rect.top - 52}px`;
    document.body.appendChild(label);
  });
  await sleep(1700);
  await page.locator('.health-quick-actions .health-action-btn').nth(1).click({ force: true });

  await clearDemoEffects(page);
  await page.waitForSelector('#ai-health-transfer-card', { timeout: 18000 });
  await page.waitForSelector('#ai-input', { timeout: 16000 });
  await sleep(900);
  await smoothScrollElementTo(page, '#ai-health-transfer-card', 1500, 'center').catch(() => {});
  await page.addStyleTag({
    content: `
      @keyframes demoCardSpotlight {
        0%,100% { transform:scale(1); box-shadow:0 12px 28px rgba(15,118,110,.07), 0 0 0 0 rgba(15,118,110,.32); }
        50% { transform:scale(1.035); box-shadow:0 26px 58px rgba(15,118,110,.22), 0 0 0 12px rgba(15,118,110,.10); }
      }
      .demo-health-card-focus { transform-origin:center; animation:demoCardSpotlight 1.55s ease-in-out infinite; border-color:#0F766E !important; }
    `
  });
  await page.evaluate(() => {
    document.querySelectorAll('.demo-video-callout').forEach(el => el.remove());
    const card = document.getElementById('ai-health-transfer-card');
    if (!card) return;
    card.classList.add('demo-health-card-focus');
    const rect = card.getBoundingClientRect();
    const label = document.createElement('div');
    label.className = 'demo-video-callout';
    label.textContent = '산책 통계와 건강 분석을 함께 읽어 답변';
    label.style.left = `${Math.max(24, rect.left + rect.width / 2 - 170)}px`;
    label.style.top = `${Math.max(82, rect.top - 54)}px`;
    document.body.appendChild(label);
  });
  await sleep(2200);
  await clearDemoEffects(page);
  await page.fill('#ai-breed', '골든 리트리버');
  await page.fill('#ai-topic', '산책 후 관절 관리');
  await page.fill('#ai-age', '3살');
  await page.fill('#ai-input', '오늘 산책 기록을 보면 초코 관절 관리를 어떻게 이어가면 좋을까요?');
  await sleep(700);
  await clickVisible(page, '#ai-send-btn');
  await page.waitForSelector('.ai-msg-row--ai:not(#ai-loading)', { timeout: 18000 });
  await sleep(600);
  await page.evaluate(duration => new Promise(resolve => {
    const chat = document.getElementById('ai-chat');
    if (!chat) { resolve(); return; }
    const start = chat.scrollTop;
    const end = Math.max(0, chat.scrollHeight - chat.clientHeight);
    const started = performance.now();
    const ease = t => 0.5 - Math.cos(Math.PI * t) / 2;
    function frame(now) {
      const p = Math.min(1, (now - started) / duration);
      chat.scrollTop = start + (end - start) * ease(p);
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  }), 6200);
  await sleep(900);

  await navigateViaDrawer(page, '전문가', '.experts-page');
  await page.waitForSelector('.experts-page', { timeout: 18000 });
  await sleep(1300);
  await smoothScrollElementTo(page, '.expert-list', 2600, 'start').catch(() => {});
  await sleep(900);
  const expertCards = await page.locator('.expert-card').count().catch(() => 0);
  for (let i = 0; i < Math.min(expertCards, 2); i += 1) {
    await smoothScrollLocatorTo(page, page.locator('.expert-card').nth(i), 1900, 'center').catch(() => {});
    await sleep(900);
  }

  await page.evaluate(() => Router.navigate('/education'));
  await page.waitForSelector('#education-list', { timeout: 18000 });
  await sleep(1200);
  await smoothScrollTo(page, 0, 900);
  await page.evaluate(() => {
    document.querySelectorAll('.demo-video-callout').forEach(el => el.remove());
    const label = document.createElement('div');
    label.className = 'demo-video-callout';
    label.textContent = '필요한 지식은 교육센터에서 스스로 학습해요';
    label.style.left = '50%';
    label.style.top = '86px';
    label.style.transform = 'translateX(-50%)';
    document.body.appendChild(label);
  });
  await sleep(1900);
  await clearDemoEffects(page);
  await page.evaluate(() => Router.navigate('/education/edu-b01'));
  await page.waitForSelector('button[onclick*="startEducationQuiz"]', { timeout: 18000 }).catch(() => {});
  await sleep(900);
  await smoothScrollTo(page, Math.max(0, await page.evaluate(() => document.body.scrollHeight - window.innerHeight)), 2300).catch(() => {});
  await sleep(600);
  await page.locator('button[onclick*="startEducationQuiz"]').last().click({ force: true }).catch(async () => {
    await page.evaluate(() => startEducationQuiz('edu-b01'));
  });
  await page.waitForSelector('#edu-quiz-questions', { timeout: 12000 });
  await sleep(700);
  await page.evaluate(() => {
    if (Array.isArray(_currentQuiz) && _currentQuiz.length > 1 && typeof _buildQuizHtml === 'function') {
      _currentQuiz = _currentQuiz.slice(0, 1);
      const box = document.getElementById('edu-quiz-questions');
      if (box) box.innerHTML = _buildQuizHtml(_currentQuiz);
    }
  }).catch(() => {});
  await sleep(500);
  await page.evaluate(() => {
    const quiz = _currentQuiz || [];
    const answer = quiz[0]?.answer ?? 0;
    if (typeof selectQuizOption === 'function') selectQuizOption(0, answer);
  }).catch(() => {});
  await sleep(1400);
  await page.evaluate(() => {
    const user = AuthService.getCurrentUser();
    if (user && EducationService) EducationService.markComplete(user.id, 'edu-b01');
    const resultEl = document.getElementById('quiz-result');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = '<div style="padding:18px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:16px;border:1.5px solid #86efac;text-align:center;"><div style="font-weight:900;color:#15803d;font-size:1rem;">정답입니다! 학습 완료로 기록했어요.</div><div style="font-size:.8rem;color:#166534;margin-top:5px;">상담 이후 필요한 지식을 교육센터에서 이어서 확인합니다.</div></div>';
    }
  });
  await sleep(1700);
  await page.evaluate(() => Router.navigate('/education'));
  await page.waitForSelector('#education-progress-runner', { timeout: 12000 }).catch(() => {});
  await sleep(3900);

  return convertToMp4(await saveVideo(session));
}

async function main() {
  const selected = new Set(process.argv.slice(2).length ? process.argv.slice(2) : ['1', '2', '3', '4']);
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
    if (selected.has('1')) outputs.push(await recordBreeds(browser));
    else outputs.push(path.join(OUT_DIR, '01_breeds_ai_recommendation_polished.mp4'));
    if (selected.has('2')) outputs.push(await recordMatching(browser));
    else outputs.push(path.join(OUT_DIR, '02_ai_matching_score_polished.mp4'));
    if (selected.has('3')) outputs.push(await recordMobileWalkProcess(browser));
    else outputs.push(path.join(OUT_DIR, '03_mobile_payment_walk_gps_split_polished.mp4'));
    if (selected.has('4')) outputs.push(await recordWalkHealthEducationFlow(browser));
    else outputs.push(path.join(OUT_DIR, '04_walk_health_ai_expert_flow_polished.mp4'));
  } finally {
    await browser.close();
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    outputs: outputs.map(file => ({
      file,
      size: fs.existsSync(file) ? fs.statSync(file).size : 0
    }))
  };
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
