/**
 * 산책 세션 API
 *
 * POST   /api/walk-sessions              → 세션 시작
 * PATCH  /api/walk-sessions/:id/end      → 세션 종료
 * POST   /api/walk-sessions/:id/route    → 경로 포인트 추가 (세션별 파일로 분리)
 * GET    /api/walk-sessions/:id/route    → 경로 조회
 * GET    /api/walk-sessions              → 내 세션 목록 (?userId=xxx)
 */

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const db      = require('../db');

const DATA_DIR = path.join(__dirname, '../data');
const GPS_MOCK_WALKER_ID = 'mock-walker-gps';
const MOCK_GPS_INTERVAL_MS = 3000;
const MOCK_WALK_DURATION_MS = 5 * 60 * 1000;
const MOCK_TRANSFER_DURATION_MS = 90 * 1000;
const mockRouteTimers = new Map();
const mockLocationTimers = new Map();

function isGpsMockWalkerId(walkerId) {
  const id = String(walkerId || '');
  if (id === GPS_MOCK_WALKER_ID) return true;
  const walkers = db.get('walkers', []);
  return walkers.some(w => w.userId === id && w.isGpsMockWalker === true);
}

function getRequestById(requestId) {
  return db.get('walkRequests', []).find(r => r.id === requestId) || null;
}

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getPickupPoint(session) {
  const request = getRequestById(session.requestId);
  const lat = toFiniteNumber(request?.pickupLatitude);
  const lng = toFiniteNumber(request?.pickupLongitude);
  if (lat !== null && lng !== null) return { lat, lng };
  return { lat: 37.5665, lng: 126.9780 };
}

function getWalkerStoredPoint(walkerId, fallback) {
  const walker = db.get('walkers', []).find(w => w.userId === walkerId);
  const lat = toFiniteNumber(walker?.lat);
  const lng = toFiniteNumber(walker?.lng);
  if (lat !== null && lng !== null) return { lat, lng };
  return {
    lat: fallback.lat + 0.0042,
    lng: fallback.lng - 0.0048
  };
}

function updateMockWalkerLocation(req, session, lat, lng) {
  const now = db.now();
  const requests = db.get('walkRequests', []);
  const idx = requests.findIndex(r => r.id === session.requestId);
  if (idx !== -1) {
    requests[idx].walkerCurrentLat = lat;
    requests[idx].walkerCurrentLng = lng;
    requests[idx].walkerLocationUpdatedAt = now;
    db.set('walkRequests', requests);
  }

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    const payload = { requestId: session.requestId, sessionId: session.id, lat, lng };
    emitToUser(session.requesterId, 'walker-location-update', payload);
    emitToUser(session.walkerId, 'walker-location-update', payload);
  }
}

function appendMockRoutePoint(req, session, latitude, longitude) {
  const existing = readRoutePoints(session.id);
  const last = existing[existing.length - 1];
  if (last && haversineMeters(last.latitude, last.longitude, latitude, longitude) < 1) {
    return last;
  }

  const point = {
    id: db.generateId(),
    walkSessionId: session.id,
    latitude,
    longitude,
    timestamp: db.now(),
    source: 'mock-gps'
  };

  appendRoutePoint(session.id, point);
  updateMockWalkerLocation(req, session, latitude, longitude);

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    const payload = {
      id: point.id,
      sessionId: session.id,
      requestId: session.requestId,
      latitude,
      longitude,
      timestamp: point.timestamp,
      source: 'mock-gps'
    };
    emitToUser(session.requesterId, 'walker-position', payload);
    emitToUser(session.walkerId, 'walker-position', payload);
  }

  return point;
}

function stopMockRoute(sessionId) {
  const timer = mockRouteTimers.get(sessionId);
  if (timer) clearInterval(timer);
  mockRouteTimers.delete(sessionId);
}

function stopMockLocation(sessionId) {
  const timer = mockLocationTimers.get(sessionId);
  if (timer) clearInterval(timer);
  mockLocationTimers.delete(sessionId);
}

function stopAllMockGps(sessionId) {
  stopMockRoute(sessionId);
  stopMockLocation(sessionId);
}

function interpolatePoint(start, end, progress) {
  const eased = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;
  const lat = start.lat + (end.lat - start.lat) * eased;
  const lng = start.lng + (end.lng - start.lng) * eased;
  const wobble = Math.sin(progress * Math.PI * 5) * 0.00008;
  return {
    lat: lat + wobble,
    lng: lng - wobble * 0.65
  };
}

function startMockLocationReplay(req, session, phase = 'heading') {
  if (!isGpsMockWalkerId(session.walkerId)) return;
  stopMockLocation(session.id);

  const pickup = getPickupPoint(session);
  const routePoints = readRoutePoints(session.id);
  const lastRoutePoint = routePoints.length
    ? { lat: Number(routePoints[routePoints.length - 1].latitude), lng: Number(routePoints[routePoints.length - 1].longitude) }
    : null;
  const start = phase === 'returning' && lastRoutePoint
    ? lastRoutePoint
    : getWalkerStoredPoint(session.walkerId, pickup);
  const startedAt = Date.now();

  const tick = () => {
    const latestSession = db.get('walkSessions', []).find(s => s.id === session.id);
    const allowed = phase === 'returning'
      ? latestSession?.status === 'returning'
      : ['heading', 'arrived', 'handoff'].includes(latestSession?.status);
    if (!allowed) {
      stopMockLocation(session.id);
      return;
    }

    const progress = Math.min(1, (Date.now() - startedAt) / MOCK_TRANSFER_DURATION_MS);
    const point = interpolatePoint(start, pickup, progress);
    updateMockWalkerLocation(req, session, point.lat, point.lng);
    if (progress >= 1) stopMockLocation(session.id);
  };

  tick();
  mockLocationTimers.set(session.id, setInterval(tick, MOCK_GPS_INTERVAL_MS));
}

function makeMockWalkPoint(anchor, progress) {
  const path = [
    [0, 0],
    [0.00010, 0.00018],
    [0.00028, 0.00036],
    [0.00048, 0.00028],
    [0.00056, -0.00002],
    [0.00038, -0.00028],
    [0.00014, -0.00018],
    [0, 0]
  ];
  const safeProgress = Math.max(0, Math.min(1, progress));
  const scaled = safeProgress * (path.length - 1);
  const idx = Math.min(path.length - 2, Math.floor(scaled));
  const local = scaled - idx;
  const start = path[idx];
  const end = path[idx + 1];
  const wobble = Math.sin(safeProgress * Math.PI * 8) * 0.000015;
  return {
    lat: anchor.lat + start[0] + (end[0] - start[0]) * local + wobble,
    lng: anchor.lng + start[1] + (end[1] - start[1]) * local - wobble * 0.5
  };
}

function startMockWalkRoute(req, session) {
  if (!isGpsMockWalkerId(session.walkerId)) return;
  if (mockRouteTimers.has(session.id)) return;
  stopMockLocation(session.id);

  const pickup = getPickupPoint(session);
  const startTime = new Date(session.walkStartedAt || session.handoffAt || session.startedAt || Date.now()).getTime();
  const startedAt = Number.isFinite(startTime) ? startTime : Date.now();
  let step = readRoutePoints(session.id).length;

  const tick = () => {
    const latestSession = db.get('walkSessions', []).find(s => s.id === session.id);
    if (!latestSession || latestSession.status !== 'walking') {
      stopMockRoute(session.id);
      return;
    }

    const elapsed = Date.now() - startedAt;
    const progress = Math.min(1, elapsed / MOCK_WALK_DURATION_MS);
    const basePoint = step === 0 ? pickup : makeMockWalkPoint(pickup, progress);
    appendMockRoutePoint(req, session, basePoint.lat, basePoint.lng);
    step += 1;

    if (progress >= 1) stopMockRoute(session.id);
  };

  tick();
  mockRouteTimers.set(session.id, setInterval(tick, MOCK_GPS_INTERVAL_MS));
}

function syncWalkRequestStatus(requestId, status, extra = {}) {
  const walkRequests = db.get('walkRequests', []);
  const reqIdx = walkRequests.findIndex(r => r.id === requestId);
  if (reqIdx === -1) return null;
  walkRequests[reqIdx] = {
    ...walkRequests[reqIdx],
    ...extra,
    status,
    updatedAt: db.now()
  };
  db.set('walkRequests', walkRequests);
  return walkRequests[reqIdx];
}

function emitReturnHandoffUpdate(req, session) {
  const emitToUser = req.app.get('emitToUser');
  if (!emitToUser) return;

  const payload = {
    sessionId: session.id,
    requestId: session.requestId,
    walkerId: session.walkerId,
    requesterId: session.requesterId,
    walkerReturnHandoffConfirmedAt: session.walkerReturnHandoffConfirmedAt || null,
    requesterReturnHandoffConfirmedAt: session.requesterReturnHandoffConfirmedAt || null
  };
  emitToUser(session.requesterId, 'return-handoff-updated', payload);
  emitToUser(session.walkerId, 'return-handoff-updated', payload);
}

function completeWalkSession(req, sessions, idx) {
  sessions[idx].status = 'completed';
  sessions[idx].endedAt = db.now();

  const s = sessions[idx];
  stopAllMockGps(s.id);
  const points = readRoutePoints(s.id);
  const totalDist = calcTotalDistance(points);
  sessions[idx].totalDistanceKm = totalDist;
  db.set('walkSessions', sessions);

  syncWalkRequestStatus(s.requestId, 'completed', {
    endedAt: sessions[idx].endedAt,
    totalDistanceKm: totalDist,
    walkerReturnHandoffConfirmedAt: s.walkerReturnHandoffConfirmedAt || null,
    requesterReturnHandoffConfirmedAt: s.requesterReturnHandoffConfirmedAt || null
  });

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    const payload = {
      sessionId: s.id,
      requestId: s.requestId,
      walkerId: s.walkerId,
      requesterId: s.requesterId,
      totalDistanceKm: totalDist
    };
    emitToUser(s.requesterId, 'walk-ended', payload);
    emitToUser(s.walkerId, 'walk-ended', payload);
  }

  return { session: sessions[idx], totalDistanceKm: totalDist };
}

// 세션별 경로 파일 경로
function routeFilePath(sessionId) {
  return path.join(DATA_DIR, `route_${sessionId}.json`);
}

function readRoutePoints(sessionId) {
  const fp = routeFilePath(sessionId);
  try {
    return fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, 'utf8')) : [];
  } catch { return []; }
}

function appendRoutePoint(sessionId, point) {
  const fp     = routeFilePath(sessionId);
  const points = readRoutePoints(sessionId);
  points.push(point);
  // 경로 파일은 pretty-print 없이 저장 (고빈도 쓰기)
  fs.writeFileSync(fp, JSON.stringify(points), 'utf8');
  return points;
}

// 세션 시작
router.post('/', (req, res) => {
  const { requestId, walkerId, requesterId, dogName } = req.body || {};
  if (!requestId || !walkerId || !requesterId) {
    return res.status(400).json({ success: false, error: 'requestId, walkerId, requesterId가 필요합니다.' });
  }

  // 동일 요청에 대한 진행 중 세션이 이미 있으면 기존 세션 반환 (중복 방지)
  const existingSessions = db.get('walkSessions', []);
  const dup = existingSessions.find(s => s.requestId === requestId && ['heading','arrived','handoff','walking','returning','return_arrived'].includes(s.status));
  if (dup) {
    return res.json({ success: true, session: dup });
  }

  // walk request 상태 → heading (픽업 이동 중)
  const requests = db.get('walkRequests', []);
  const reqIdx   = requests.findIndex(r => r.id === requestId);
  if (reqIdx !== -1) {
    requests[reqIdx].status    = 'heading';
    requests[reqIdx].updatedAt = db.now();
    db.set('walkRequests', requests);
  }

  const session = {
    id: db.generateId(),
    requestId,
    walkerId,
    requesterId,
    dogName:       dogName || '',
    status:        'heading',
    startedAt:     db.now(),
    arrivedAt:     null,
    handoffAt:      null,
    walkStartedAt: null,
    returnStartedAt: null,
    returnArrivedAt: null,
    walkerReturnHandoffConfirmedAt: null,
    requesterReturnHandoffConfirmedAt: null,
    endedAt:       null
  };

  const sessions = db.get('walkSessions', []);
  sessions.push(session);
  db.set('walkSessions', sessions);

  // 요청 객체에 sessionId 저장 + status를 heading으로 업데이트
  if (reqIdx !== -1) {
    requests[reqIdx].sessionId = session.id;
    requests[reqIdx].status = 'heading';
    requests[reqIdx].updatedAt = db.now();
    db.set('walkRequests', requests);
  }

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(requesterId, 'walk-started', { sessionId: session.id, walkerId, requestId });

  startMockLocationReplay(req, session, 'heading');

  res.json({ success: true, session });
});

// 도우미 취소 (heading/arrived/handoff 상태에서만)
router.patch('/:id/cancel', (req, res) => {
  const { reason } = req.body || {};
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (!['heading', 'arrived', 'handoff'].includes(sessions[idx].status)) {
    return res.json({ success: false, error: '산책 중에는 취소할 수 없습니다.' });
  }

  sessions[idx].status     = 'cancelled';
  sessions[idx].cancelledAt = db.now();
  sessions[idx].cancelReason = reason || '';
  db.set('walkSessions', sessions);

  const s = sessions[idx];
  stopAllMockGps(s.id);
  const requests = db.get('walkRequests', []);
  const ri = requests.findIndex(r => r.id === s.requestId);
  if (ri !== -1) { requests[ri].status = 'cancelled'; requests[ri].updatedAt = db.now(); db.set('walkRequests', requests); }

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(s.requesterId, 'walk-request-cancelled', { requestId: s.requestId, cancelledBy: 'walker', reason });

  res.json({ success: true });
});

// 세션 종료
router.patch('/:id/end', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx      = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });

  sessions[idx].status  = 'completed';
  sessions[idx].endedAt = db.now();

  const s = sessions[idx];
  stopAllMockGps(s.id);
  const points    = readRoutePoints(s.id);
  const totalDist = calcTotalDistance(points);
  sessions[idx].totalDistanceKm = totalDist;
  db.set('walkSessions', sessions);

  const requests = db.get('walkRequests', []);
  const reqIdx   = requests.findIndex(r => r.id === s.requestId);
  if (reqIdx !== -1) {
    requests[reqIdx].status    = 'completed';
    requests[reqIdx].updatedAt = db.now();
    db.set('walkRequests', requests);
  }

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(s.requesterId, 'walk-ended', { sessionId: s.id, totalDistanceKm: totalDist });

  res.json({ success: true, session: sessions[idx], totalDistanceKm: totalDist });
});

// 산책 종료 후 요청자에게 복귀 시작 (walking -> returning)
router.patch('/:id/start-return', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (sessions[idx].status !== 'walking') {
    return res.json({ success: false, error: '산책 중일 때만 복귀를 시작할 수 있습니다.' });
  }

  sessions[idx].status = 'returning';
  sessions[idx].returnStartedAt = db.now();
  db.set('walkSessions', sessions);

  const s = sessions[idx];
  stopMockRoute(s.id);
  startMockLocationReplay(req, s, 'returning');
  syncWalkRequestStatus(s.requestId, 'returning');

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(s.requesterId, 'walker-returning', { sessionId: s.id, requestId: s.requestId, walkerId: s.walkerId });
  }

  res.json({ success: true, session: sessions[idx] });
});

// 도우미 도착 (heading → arrived)
router.patch('/:id/arrive', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (sessions[idx].status !== 'heading') {
    return res.json({ success: false, error: '이동 중 상태가 아닙니다.' });
  }
  sessions[idx].status    = 'arrived';
  sessions[idx].arrivedAt = db.now();
  db.set('walkSessions', sessions);

  const s = sessions[idx];
  stopMockLocation(s.id);
  if (isGpsMockWalkerId(s.walkerId)) {
    const pickup = getPickupPoint(s);
    updateMockWalkerLocation(req, s, pickup.lat, pickup.lng);
  }

  // 요청 상태도 업데이트
  const requests = db.get('walkRequests', []);
  const reqIdx = requests.findIndex(r => r.id === s.requestId);
  if (reqIdx !== -1) {
    requests[reqIdx].status = 'arrived';
    requests[reqIdx].updatedAt = db.now();
    db.set('walkRequests', requests);
  }

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) emitToUser(s.requesterId, 'walker-arrived', { sessionId: s.id, walkerName: req.body?.walkerName || '' });

  res.json({ success: true, session: sessions[idx] });
});

// 도우미가 복귀 장소에 도착 (returning -> return_arrived)
router.patch('/:id/arrive-return', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (sessions[idx].status !== 'returning') {
    return res.json({ success: false, error: '복귀 중 상태일 때만 도착 처리할 수 있습니다.' });
  }

  sessions[idx].status = 'return_arrived';
  sessions[idx].returnArrivedAt = db.now();
  sessions[idx].walkerReturnHandoffConfirmedAt = null;
  sessions[idx].requesterReturnHandoffConfirmedAt = null;
  db.set('walkSessions', sessions);

  const s = sessions[idx];
  stopMockLocation(s.id);
  if (isGpsMockWalkerId(s.walkerId)) {
    const pickup = getPickupPoint(s);
    updateMockWalkerLocation(req, s, pickup.lat, pickup.lng);
  }
  syncWalkRequestStatus(s.requestId, 'return_arrived', {
    returnArrivedAt: s.returnArrivedAt,
    walkerReturnHandoffConfirmedAt: null,
    requesterReturnHandoffConfirmedAt: null
  });

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(s.requesterId, 'walker-returned', {
      sessionId: s.id,
      requestId: s.requestId,
      walkerName: req.body?.walkerName || ''
    });
  }

  res.json({ success: true, session: sessions[idx] });
});

// 요청자가 반려견 전달 완료 확인 (arrived -> walking)
router.patch('/:id/confirm-handoff', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (sessions[idx].status === 'walking') {
    startMockWalkRoute(req, sessions[idx]);
    return res.json({ success: true, session: sessions[idx] });
  }
  if (sessions[idx].status !== 'arrived') {
    return res.json({ success: false, error: '도우미가 도착한 후 전달 확인이 가능합니다.' });
  }
  const now = db.now();
  sessions[idx].status        = 'walking';
  sessions[idx].handoffAt     = now;
  sessions[idx].walkStartedAt = now;
  db.set('walkSessions', sessions);

  const s = sessions[idx];
  syncWalkRequestStatus(s.requestId, 'walking', {
    handoffAt: s.handoffAt,
    walkStartedAt: s.walkStartedAt,
    sessionId: s.id
  });

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(s.walkerId, 'handoff-confirmed', {
      sessionId: s.id,
      requestId: s.requestId,
      status: 'walking'
    });
    emitToUser(s.requesterId, 'walk-tracking-started', {
      sessionId: s.id,
      requestId: s.requestId,
      walkerId: s.walkerId
    });
  }

  startMockWalkRoute(req, s);

  res.json({ success: true, session: sessions[idx] });
});

// 도우미가 복귀 후 반려견 인계 완료 확인
router.patch('/:id/confirm-walker-return-handoff', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (sessions[idx].status === 'completed') {
    return res.json({ success: true, completed: true, session: sessions[idx], totalDistanceKm: sessions[idx].totalDistanceKm || 0 });
  }
  if (sessions[idx].status !== 'return_arrived') {
    return res.json({ success: false, error: '복귀 도착 후에만 인계 확인이 가능합니다.' });
  }

  sessions[idx].walkerReturnHandoffConfirmedAt = sessions[idx].walkerReturnHandoffConfirmedAt || db.now();

  if (sessions[idx].requesterReturnHandoffConfirmedAt) {
    const completed = completeWalkSession(req, sessions, idx);
    return res.json({ success: true, completed: true, ...completed });
  }

  db.set('walkSessions', sessions);
  const s = sessions[idx];
  syncWalkRequestStatus(s.requestId, 'return_arrived', {
    walkerReturnHandoffConfirmedAt: s.walkerReturnHandoffConfirmedAt,
    requesterReturnHandoffConfirmedAt: s.requesterReturnHandoffConfirmedAt || null
  });
  emitReturnHandoffUpdate(req, s);
  res.json({
    success: false,
    pending: true,
    completed: false,
    error: '요청자의 인계 확인을 기다리고 있습니다.',
    session: s
  });
});

// 요청자가 반려견을 다시 인계받았는지 확인
router.patch('/:id/confirm-return-handoff', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (sessions[idx].status === 'completed') {
    return res.json({ success: true, completed: true, session: sessions[idx], totalDistanceKm: sessions[idx].totalDistanceKm || 0 });
  }
  if (sessions[idx].status !== 'return_arrived') {
    return res.json({ success: false, error: '도우미가 복귀 도착한 후에만 인계 확인이 가능합니다.' });
  }

  sessions[idx].requesterReturnHandoffConfirmedAt = sessions[idx].requesterReturnHandoffConfirmedAt || db.now();

  if (sessions[idx].walkerReturnHandoffConfirmedAt) {
    const completed = completeWalkSession(req, sessions, idx);
    return res.json({ success: true, completed: true, ...completed });
  }

  db.set('walkSessions', sessions);
  const s = sessions[idx];
  syncWalkRequestStatus(s.requestId, 'return_arrived', {
    walkerReturnHandoffConfirmedAt: s.walkerReturnHandoffConfirmedAt || null,
    requesterReturnHandoffConfirmedAt: s.requesterReturnHandoffConfirmedAt
  });
  emitReturnHandoffUpdate(req, s);
  res.json({
    success: false,
    pending: true,
    completed: false,
    error: '도우미의 인계 확인을 기다리고 있습니다.',
    session: s
  });
});

// 산책 실제 시작 (handoff → walking) — 도우미가 반려견 픽업 후 누름
router.patch('/:id/start-walk', (req, res) => {
  const sessions = db.get('walkSessions', []);
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false });
  if (sessions[idx].status === 'walking') {
    startMockWalkRoute(req, sessions[idx]);
    return res.json({ success: true, session: sessions[idx] });
  }
  if (sessions[idx].status !== 'handoff') {
    return res.json({ success: false, error: '요청자가 반려견 전달을 확인한 뒤 산책을 시작할 수 있습니다.' });
  }
  const now = db.now();
  sessions[idx].status        = 'walking';
  sessions[idx].walkStartedAt = sessions[idx].walkStartedAt || now;
  sessions[idx].handoffAt     = sessions[idx].handoffAt || now;
  db.set('walkSessions', sessions);

  // walk-request status도 walking으로 업데이트 (요청자 화면 동기화)
  const s = sessions[idx];
  syncWalkRequestStatus(s.requestId, 'walking', {
    handoffAt: s.handoffAt,
    walkStartedAt: s.walkStartedAt,
    sessionId: s.id
  });

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(s.requesterId, 'walk-tracking-started', { sessionId: s.id, requestId: s.requestId, walkerId: s.walkerId });
    emitToUser(s.walkerId, 'handoff-confirmed', { sessionId: s.id, requestId: s.requestId, status: 'walking' });
  }

  startMockWalkRoute(req, s);

  res.json({ success: true, session: sessions[idx] });
});

// 경로 포인트 추가 (세션별 파일에 직접 append)
router.post('/:id/route', (req, res) => {
  const { latitude, longitude, accuracy } = req.body || {};

  const sessions = db.get('walkSessions', []);
  const session  = sessions.find(s => s.id === req.params.id);
  if (!session || session.status !== 'walking') {
    return res.status(400).json({ success: false, error: 'No active walking session.' });
  }

  if (isGpsMockWalkerId(session.walkerId)) {
    return res.json({ success: true, skipped: true, mockGps: true });
  }

  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  const acc = toFiniteNumber(accuracy);
  if (lat === null || lng === null) {
    return res.status(400).json({ success: false, error: 'latitude and longitude are required.' });
  }
  if (acc !== null && acc > 150) {
    return res.json({ success: true, skipped: true, reason: 'low_accuracy' });
  }

  const existing = readRoutePoints(req.params.id);
  if (existing.length > 0) {
    const last = existing[existing.length - 1];
    const jumpMeters = haversineMeters(last.latitude, last.longitude, lat, lng);
    const lastMs = new Date(last.timestamp || 0).getTime();
    const elapsedSec = Number.isFinite(lastMs) && lastMs > 0
      ? Math.max(1, (Date.now() - lastMs) / 1000)
      : null;
    if (jumpMeters < 5) {
      return res.json({ success: true, skipped: true });
    }
    if (elapsedSec && jumpMeters / elapsedSec > 12) {
      return res.json({ success: true, skipped: true, reason: 'unrealistic_jump' });
    }
  }

  const point = {
    id:            db.generateId(),
    walkSessionId: req.params.id,
    latitude:      lat,
    longitude:     lng,
    accuracy:      acc,
    source:        'browser-gps',
    timestamp:     db.now()
  };

  appendRoutePoint(req.params.id, point);

  const emitToUser = req.app.get('emitToUser');
  if (emitToUser) {
    emitToUser(session.requesterId, 'walker-position', {
      id: point.id,
      sessionId: req.params.id,
      latitude: lat,
      longitude: lng,
      timestamp: point.timestamp,
      source: 'browser-gps'
    });
  }

  res.json({ success: true, point });
});

// 경로 조회 (세션별 파일에서 직접 읽기)
router.get('/:id/route', (req, res) => {
  const session = db.get('walkSessions', []).find(s => s.id === req.params.id) || null;
  if (session?.status === 'walking' && isGpsMockWalkerId(session.walkerId)) {
    startMockWalkRoute(req, session);
  }
  let points = readRoutePoints(req.params.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (session && isGpsMockWalkerId(session.walkerId)) {
    points = points.filter(point => point.source === 'mock-gps');
  }

  const totalDist = calcTotalDistance(points);
  res.json({ success: true, points, totalDistanceKm: totalDist });
});

// 내 세션 목록
router.get('/', (req, res) => {
  const { userId } = req.query;
  let sessions = db.get('walkSessions', []);
  if (userId) sessions = sessions.filter(s => s.walkerId === userId || s.requesterId === userId);
  const requests = db.get('walkRequests', []);
  const activeRequestStatuses = ['accepted', 'heading', 'arrived', 'handoff', 'walking', 'returning', 'return_arrived'];
  sessions = sessions.filter(s => {
    if (!['heading', 'arrived', 'handoff', 'walking', 'returning', 'return_arrived'].includes(s.status)) return true;
    const request = requests.find(r => r.id === s.requestId);
    return request && activeRequestStatuses.includes(request.status);
  });
  sessions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  res.json({ success: true, sessions });
});

// ── 유틸 ──────────────────────────────────────────────────────

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcTotalDistance(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineMeters(
      points[i - 1].latitude, points[i - 1].longitude,
      points[i].latitude,     points[i].longitude
    );
  }
  return Math.round(total) / 1000;
}

module.exports = router;
