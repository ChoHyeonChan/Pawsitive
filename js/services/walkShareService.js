/**
 * WalkShareService - completed walk record sharing to community feed.
 */
const WalkShareService = (() => {
  let pendingWalk = null;
  let pendingMatchedSession = null;

  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeCoordinates(points) {
    return (points || [])
      .map(p => ({
        lat: toNumber(p.lat ?? p.latitude, null),
        lng: toNumber(p.lng ?? p.longitude, null),
        accuracy: p.accuracy ?? null,
        timestamp: p.timestamp || p.createdAt || null
      }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }

  function normalizeWalk(walk, options = {}) {
    if (!walk) return null;
    const distance = toNumber(walk.distance ?? walk.totalDistanceKm ?? options.distance, 0);
    const duration = Math.max(0, Math.round(toNumber(walk.duration ?? options.duration, 0)));
    return {
      id: walk.id || options.id || StorageService.generateId(),
      source: options.source || walk.source || walk.type || 'personal',
      dogName: walk.dogName || options.dogName || '반려견',
      distance,
      duration,
      calories: Math.max(0, Math.round(toNumber(walk.calories, 0))),
      coordinates: normalizeCoordinates(walk.coordinates || walk.routePoints || options.coordinates),
      startTime: walk.startTime || options.startTime || null,
      endTime: walk.endTime || options.endTime || null
    };
  }

  function buildPostText(walk) {
    const distanceText = `${walk.distance.toFixed(2)}km`;
    const durationText = walk.duration ? `${walk.duration}분` : '산책';
    const kindText = walk.source === 'matched' ? '도우미 산책' : '직접 산책';
    return [
      `오늘 ${walk.dogName}와 ${kindText} 기록을 공유해요.`,
      `${distanceText} · ${durationText}`,
      '',
      '#산책기록 #Pawsitive'
    ].join('\n');
  }

  function createCommunityPost(walk) {
    const user = AuthService.getCurrentUser();
    if (!user) {
      showLoginModal?.('산책 기록을 공유하려면 로그인이 필요해요.');
      return null;
    }

    const normalized = normalizeWalk(walk);
    if (!normalized) return null;

    const post = CommunityService.createPost({
      authorId: user.id,
      authorName: user.nickname || user.name,
      authorProfileImage: user.profileImage || '',
      text: buildPostText(normalized),
      walkData: {
        dogName: normalized.dogName,
        distance: normalized.distance,
        duration: normalized.duration,
        coordinates: normalized.coordinates
      }
    });

    return post;
  }

  function goToSharedPost(post) {
    if (!post) return;
    window._communityTab = 'main';
    window._communityHashFilter = '';
    window._communitySearch = '';
    window._communityFocusPostId = post.id;
    showToast?.('산책 기록을 커뮤니티에 공유했어요.', 'success');
    Router.navigate('/community');
  }

  function preparePersonalWalk(walk, dog) {
    pendingWalk = normalizeWalk(walk, {
      source: 'personal',
      dogName: dog?.name || walk?.dogName || '반려견'
    });
    return pendingWalk;
  }

  function sharePendingWalk() {
    const post = createCommunityPost(pendingWalk);
    pendingWalk = null;
    goToSharedPost(post);
  }

  function prepareMatchedSession(session, distKm) {
    pendingMatchedSession = { session, distKm };
  }

  async function buildMatchedWalk(session, distKm) {
    if (!session?.id) return null;
    let coordinates = [];
    let totalDistanceKm = distKm;
    try {
      const res = await fetch(`/api/walk-sessions/${session.id}/route`);
      const data = await res.json();
      coordinates = normalizeCoordinates(data.points || []);
      if (data.totalDistanceKm != null) totalDistanceKm = data.totalDistanceKm;
    } catch (e) {}

    const startMs = session.walkStartedAt ? new Date(session.walkStartedAt).getTime() : 0;
    const endMs = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
    const duration = startMs && endMs > startMs ? Math.max(1, Math.round((endMs - startMs) / 60000)) : 0;

    return normalizeWalk({
      id: `matched_${session.id}`,
      source: 'matched',
      dogName: session.dogName || '반려견',
      distance: totalDistanceKm,
      duration,
      coordinates,
      startTime: session.walkStartedAt || session.startedAt || null,
      endTime: session.endedAt || null
    }, { source: 'matched' });
  }

  async function sharePendingMatchedWalk() {
    if (!pendingMatchedSession?.session) return;
    const walk = await buildMatchedWalk(pendingMatchedSession.session, pendingMatchedSession.distKm);
    pendingMatchedSession = null;
    const post = createCommunityPost(walk);
    document.getElementById('walk-completion-screen')?.remove();
    goToSharedPost(post);
  }

  return {
    preparePersonalWalk,
    sharePendingWalk,
    prepareMatchedSession,
    sharePendingMatchedWalk
  };
})();
