// Demo-only quick signup helper.
// Load this after js/services/authService.js and js/services/storage.js.

function renderDemoQuickSignupBox() {
  return `
  <div style="border:2px solid var(--color-primary);background:#fff;border-radius:12px;padding:14px;margin-bottom:18px;">
    <div style="font-size:0.9rem;font-weight:800;color:var(--color-text);margin-bottom:8px;">발표 데모 입장</div>
    <div style="display:flex;gap:8px;align-items:center;">
      <input id="demo-nickname" class="form-input" maxlength="12" placeholder="닉네임만 입력">
      <button class="btn btn-primary btn-sm" style="white-space:nowrap;" onclick="handleDemoQuickSignup()">바로 입장</button>
    </div>
    <div id="demo-signup-error" style="margin-top:8px;"></div>
  </div>
  `;
}

async function handleDemoQuickSignup() {
  const input = document.getElementById('demo-nickname');
  const errEl = document.getElementById('demo-signup-error');
  const nickname = input?.value?.trim();

  if (!nickname || nickname.length < 2) {
    if (errEl) errEl.innerHTML = '<div class="alert alert-error">닉네임은 2자 이상 입력해주세요.</div>';
    input?.focus();
    return;
  }

  try {
    const res = await fetch('/api/demo/quick-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || '데모 입장에 실패했습니다.');

    StorageService.set('authToken', {
      token: StorageService.generateId(),
      userId: data.user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    StorageService.set('currentUser', data.user);
    try { await StorageService.syncFromServer(); } catch(e) {}

    updateNavAuth();
    if (typeof RealtimeService !== 'undefined') RealtimeService.connect(data.user.id);
    document.getElementById('login-modal-overlay')?.remove();
    Router.navigate('/');
  } catch (e) {
    if (errEl) errEl.innerHTML = `<div class="alert alert-error">${e.message || '데모 입장에 실패했습니다.'}</div>`;
  }
}
