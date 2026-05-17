// ============================================================
// 산책 가격 계산 유틸 + 결제 처리
// ============================================================

const WALK_PRICING = {
  small:  10000,  // 소형견 (7kg 미만) 1회 40분
  medium: 15000,  // 중형견 (7~15kg)
  large:  20000,  // 대형견 (15kg 이상)
  platformFeeRate: 0.05  // 플랫폼 수수료 5%
};

const WALKER_LABELS = {
  careerYears: { under6m: '6개월 미만', '6m1y': '6개월~1년', '1y3y': '1~3년', over3y: '3년 이상' },
  largeDogExp: { lots: '많음', some: '조금', none: '없음' },
  aggressionHandle: { yes: '가능', some: '어느 정도', no: '불가' },
  ownPetExp: { current: '현재 양육 중', past: '과거 양육', none: '없음' },
  dogSize: { small: '소형견', medium: '중형견', large: '대형견' },
  timeSlots: {
    'morning-early': '오전 (7-9시)',
    morning: '오전 (9-11시)',
    afternoon: '오후 (2-4시)',
    evening: '오후 (5-7시)',
    night: '저녁 (7-9시)',
    anytime: '상시 가능'
  }
};

function getWalkerLabel(field, value) {
  const fieldMap = WALKER_LABELS[field];
  if (!fieldMap) return '알 수 없음';
  return fieldMap[value] || '알 수 없음';
}

function calculateWalkPrice(dogSizes) {
  const sizes = Array.isArray(dogSizes) ? dogSizes : [dogSizes || 'small'];
  const breakdown = sizes.map(size => ({
    size,
    label: { small: '소형견', medium: '중형견', large: '대형견' }[size] || '소형견',
    price: WALK_PRICING[size] || WALK_PRICING.small
  }));
  const total = breakdown.reduce((sum, b) => sum + b.price, 0);
  const fee = Math.round(total * WALK_PRICING.platformFeeRate);
  const walkerPayout = total - fee;
  return { total, fee, walkerPayout, breakdown };
}

function cleanupTossPaymentArtifacts() {
  const selectors = [
    'iframe[src*="tosspayments"]',
    'iframe[src*="toss.im"]',
    '[id*="tosspayments"]',
    '[class*="tosspayments"]',
    '[id*="TossPayments"]',
    '[class*="TossPayments"]'
  ];
  document.querySelectorAll(selectors.join(',')).forEach(node => {
    const shell = node.closest('[style*="position: fixed"]') || node.parentElement || node;
    if (shell && shell !== document.body) shell.remove();
  });
}

async function requestTossPayment({ amount, orderId, orderName, customerName, successHash, failHash }) {
  const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
  try {
    cleanupTossPaymentArtifacts();
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const payment = tossPayments.payment({ customerKey: orderId });
    const successUrl = successHash
      ? window.location.origin + '/' + successHash + (successHash.includes('?') ? '&' : '?') + 'paymentSuccess=true&orderId=' + orderId
      : window.location.origin + '/#/matching?paymentSuccess=true&orderId=' + orderId;
    const failUrl = failHash
      ? window.location.origin + '/' + failHash + (failHash.includes('?') ? '&' : '?') + 'paymentFail=true'
      : window.location.origin + '/#/matching?paymentFail=true';
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: amount },
      orderId,
      orderName,
      customerName: customerName || '요청자',
      successUrl,
      failUrl
    });
  } catch (e) {
    cleanupTossPaymentArtifacts();
    if (e.code === 'USER_CANCEL') {
      showToast('결제가 취소되었어요.', 'info');
    } else {
      showToast('결제 중 오류가 발생했어요: ' + (e.message || ''), 'error');
    }
    throw e;
  }
}

function escapePaymentHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function showPaymentConfirmModalModern({ dogSize, dogName, duration = 40 }) {
  const user = AuthService.getCurrentUser();
  const dogs = user?.dogs || [];

  return new Promise((resolve, reject) => {
    const modalId = 'payment-confirm-modal-' + Date.now();
    const sizeLabel = { small: '소형견', medium: '중형견', large: '대형견' };
    const allowedDurations = [40, 80, 120];
    let selectedDuration = allowedDurations.includes(Number(duration)) ? Number(duration) : 40;

    const dogRows = dogs.length > 0
      ? dogs.map((d, i) => {
        const size = d.size || dogSize || 'small';
        const name = d.name || dogName || '반려견';
        const basePrice = WALK_PRICING[size] || WALK_PRICING.small;
        return `
        <label class="walk-pay-dog">
          <input type="checkbox" class="pay-dog-cb" value="${i}" data-size="${escapePaymentHtml(size)}" data-name="${escapePaymentHtml(name)}" ${i === 0 ? 'checked' : ''}>
          <span class="walk-pay-check"></span>
          <span class="walk-pay-dog__main">
            <strong>${escapePaymentHtml(name)}</strong>
            <small>${escapePaymentHtml(sizeLabel[size] || '소형견')} · ${basePrice.toLocaleString()}원/40분</small>
          </span>
        </label>`;
      }).join('')
      : '<div class="walk-pay-empty">등록된 반려견이 없어요.</div>';

    const durationLabel = value => value === 40 ? '40분' : value === 80 ? '1시간 20분' : '2시간';
    const durationButtons = allowedDurations.map(value => `
      <button type="button" data-dur="${value}" class="pay-dur-btn ${value === selectedDuration ? 'is-active' : ''}">${durationLabel(value)}</button>
    `).join('');

    const modalHtml = `
    <div id="${modalId}" class="walk-pay-overlay" role="dialog" aria-modal="true" aria-labelledby="${modalId}-title">
      <style>
        .walk-pay-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(8,13,23,.54);backdrop-filter:blur(10px);}
        .walk-pay-modal{width:min(420px,100%);max-height:92vh;overflow:auto;background:#FCFCFA;border:1px solid rgba(15,23,42,.12);border-radius:8px;box-shadow:0 30px 80px rgba(15,23,42,.28);color:#0B1220;}
        .walk-pay-head{padding:24px 24px 18px;border-bottom:1px solid #E7E3DB;}
        .walk-pay-kicker{margin:0 0 10px;color:#7C6F60;font-size:.68rem;font-weight:900;text-transform:uppercase;}
        .walk-pay-head h2{margin:0;color:#0B1220;font-size:1.28rem;line-height:1.25;font-weight:950;letter-spacing:0;}
        .walk-pay-head p{margin:8px 0 0;color:#64748B;font-size:.8rem;line-height:1.55;font-weight:650;}
        .walk-pay-body{padding:20px 24px 22px;}
        .walk-pay-section{margin-bottom:18px;}
        .walk-pay-label{margin-bottom:9px;color:#0B1220;font-size:.78rem;font-weight:900;}
        .walk-pay-dogs{display:grid;gap:8px;}
        .walk-pay-dog{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:11px;padding:13px 14px;background:#fff;border:1px solid #E1E7EF;border-radius:8px;cursor:pointer;transition:border-color .16s,box-shadow .16s;}
        .walk-pay-dog:hover{border-color:#B8C4D2;box-shadow:0 12px 24px rgba(15,23,42,.055);}
        .walk-pay-dog input{position:absolute;opacity:0;pointer-events:none;}
        .walk-pay-check{width:18px;height:18px;border:1.5px solid #B6C1CF;border-radius:5px;background:#fff;position:relative;}
        .walk-pay-dog input:checked + .walk-pay-check{background:#0B1220;border-color:#0B1220;}
        .walk-pay-dog input:checked + .walk-pay-check:after{content:'';position:absolute;left:5px;top:2px;width:5px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg);}
        .walk-pay-dog__main{min-width:0;display:flex;flex-direction:column;gap:3px;}
        .walk-pay-dog__main strong{font-size:.92rem;line-height:1.2;font-weight:950;}
        .walk-pay-dog__main small{color:#7A8797;font-size:.74rem;font-weight:700;}
        .walk-pay-empty{padding:14px;border:1px dashed #CBD5E1;border-radius:8px;color:#64748B;text-align:center;font-size:.82rem;font-weight:700;}
        .walk-pay-segment{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
        .pay-dur-btn{min-width:0;padding:12px 8px;border:1px solid #DDE5EE;border-radius:8px;background:#fff;color:#334155;font-size:.82rem;font-weight:900;cursor:pointer;transition:background .16s,color .16s,border-color .16s,box-shadow .16s;}
        .pay-dur-btn.is-active{background:#0B1220;border-color:#0B1220;color:#fff;box-shadow:0 12px 26px rgba(15,23,42,.18);}
        .walk-pay-summary{padding:15px;background:#F5F2EC;border:1px solid #E4DED3;border-radius:8px;margin-bottom:16px;}
        .walk-pay-line{display:flex;justify-content:space-between;gap:14px;padding:5px 0;color:#334155;font-size:.8rem;font-weight:700;}
        .walk-pay-line strong{color:#0B1220;font-weight:950;}
        .walk-pay-total{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-top:9px;padding-top:12px;border-top:1px solid #0B1220;}
        .walk-pay-total span{font-size:.86rem;font-weight:950;}
        .walk-pay-total strong{font-size:1.18rem;font-weight:950;}
        .walk-pay-payout{display:flex;justify-content:space-between;margin-top:6px;color:#8893A2;font-size:.72rem;font-weight:800;}
        .walk-pay-warning{color:#B42318;font-size:.78rem;font-weight:850;text-align:center;padding:8px 0;}
        .walk-pay-note{display:grid;gap:5px;margin:0 0 18px;padding:0;color:#8A94A3;font-size:.72rem;line-height:1.5;font-weight:750;list-style:none;}
        .walk-pay-note li{display:flex;gap:7px;}
        .walk-pay-note li:before{content:'';width:4px;height:4px;border-radius:50%;background:#A8B2C1;margin-top:7px;flex:0 0 auto;}
        .walk-pay-actions{display:grid;grid-template-columns:112px 1fr;gap:9px;}
        .walk-pay-btn{height:46px;border-radius:8px;font-size:.88rem;font-weight:950;cursor:pointer;border:1px solid #D8E0EA;background:#fff;color:#0B1220;}
        .walk-pay-btn--primary{border-color:#0B1220;background:#0B1220;color:#fff;}
        .walk-pay-btn:disabled{cursor:not-allowed;opacity:.55;}
        @media(max-width:420px){.walk-pay-overlay{align-items:flex-end;padding:0}.walk-pay-modal{width:100%;max-height:94vh;border-radius:8px 8px 0 0}.walk-pay-head,.walk-pay-body{padding-left:18px;padding-right:18px}.walk-pay-actions{grid-template-columns:1fr}.walk-pay-segment{grid-template-columns:1fr;}}
      </style>
      <div class="walk-pay-modal">
        <header class="walk-pay-head">
          <div class="walk-pay-kicker">Secure checkout</div>
          <h2 id="${modalId}-title">산책 결제</h2>
          <p>반려견과 산책 시간을 확인한 뒤 결제를 진행합니다.</p>
        </header>
        <div class="walk-pay-body">
          <section class="walk-pay-section">
            <div class="walk-pay-label">함께할 반려견</div>
            <div class="walk-pay-dogs">${dogRows}</div>
          </section>
          <section class="walk-pay-section">
            <div class="walk-pay-label">산책 시간</div>
            <div class="walk-pay-segment" id="${modalId}-dur">${durationButtons}</div>
          </section>
          <section id="${modalId}-summary" class="walk-pay-summary"></section>
          <ul class="walk-pay-note">
            <li>매칭이 성사되지 않으면 결제 금액은 환불돼요.</li>
            <li>산책 완료 후 도우미에게 정산됩니다.</li>
          </ul>
          <div class="walk-pay-actions">
            <button id="${modalId}-cancel" class="walk-pay-btn">취소</button>
            <button id="${modalId}-pay" class="walk-pay-btn walk-pay-btn--primary">결제하기</button>
          </div>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = document.getElementById(modalId);

    function updateSummary() {
      const checked = Array.from(modal.querySelectorAll('.pay-dog-cb:checked'));
      const units = Math.ceil(selectedDuration / 40);
      let total = 0;
      let breakdown = '';

      checked.forEach(cb => {
        const size = cb.dataset.size || 'small';
        const name = cb.dataset.name || '반려견';
        const price = (WALK_PRICING[size] || WALK_PRICING.small) * units;
        total += price;
        breakdown += `
          <div class="walk-pay-line">
            <span>${escapePaymentHtml(name)} · ${escapePaymentHtml(sizeLabel[size] || '소형견')} x ${units}</span>
            <strong>${price.toLocaleString()}원</strong>
          </div>`;
      });

      if (checked.length === 0) {
        breakdown = '<div class="walk-pay-warning">반려견을 최소 1마리 선택해주세요.</div>';
      }

      const fee = Math.round(total * WALK_PRICING.platformFeeRate);
      const walkerPayout = total - fee;
      const summaryEl = document.getElementById(`${modalId}-summary`);
      if (summaryEl) {
        summaryEl.innerHTML = `
          ${breakdown}
          ${total > 0 ? `
          <div class="walk-pay-total">
            <span>총 결제 금액</span>
            <strong>${total.toLocaleString()}원</strong>
          </div>
          <div class="walk-pay-payout">
            <span>도우미 수령액</span>
            <span>${walkerPayout.toLocaleString()}원</span>
          </div>` : ''}`;
      }

      const payBtn = document.getElementById(`${modalId}-pay`);
      if (payBtn) {
        payBtn.disabled = total <= 0;
        payBtn.textContent = total > 0 ? `${total.toLocaleString()}원 결제하기` : '반려견을 선택해주세요';
      }
    }

    modal.querySelectorAll('.pay-dog-cb').forEach(cb => cb.addEventListener('change', updateSummary));
    modal.querySelectorAll('.pay-dur-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.pay-dur-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        selectedDuration = parseInt(btn.dataset.dur, 10);
        updateSummary();
      });
    });

    updateSummary();

    document.getElementById(`${modalId}-cancel`).onclick = () => {
      cleanupTossPaymentArtifacts();
      modal.remove();
      reject('cancelled');
    };

    document.getElementById(`${modalId}-pay`).onclick = async () => {
      const checked = Array.from(modal.querySelectorAll('.pay-dog-cb:checked'));
      if (checked.length === 0) { showToast('반려견을 선택해주세요.', 'error'); return; }
      const units = Math.ceil(selectedDuration / 40);
      let total = 0;
      const selectedDogs = checked.map(cb => {
        const size = cb.dataset.size || 'small';
        const price = (WALK_PRICING[size] || WALK_PRICING.small) * units;
        total += price;
        return { name: cb.dataset.name, size, price };
      });

      const btn = document.getElementById(`${modalId}-pay`);
      btn.disabled = true;
      btn.textContent = '결제 처리 중...';
      const orderId = 'walk_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      let pickupLatitude = null;
      let pickupLongitude = null;
      try {
        const pos = await new Promise((resolvePos, rejectPos) => {
          navigator.geolocation.getCurrentPosition(resolvePos, rejectPos, { timeout: 5000, enableHighAccuracy: true, maximumAge: 60000 });
        });
        pickupLatitude = pos.coords.latitude;
        pickupLongitude = pos.coords.longitude;
      } catch(e) {}

      const pendingPayment = {
        orderId,
        amount: total,
        duration: selectedDuration,
        dogs: selectedDogs,
        walkerId: window._pendingPaymentWalkerId || null,
        requestType: window._pendingPaymentType || 'direct',
        pickupLatitude,
        pickupLongitude,
        timestamp: Date.now()
      };
      localStorage.setItem('pawsitive_pending_payment', JSON.stringify(pendingPayment));

      try {
        const dogNames = selectedDogs.map(d => d.name).join(', ');
        await requestTossPayment({ amount: total, orderId, orderName: `산책 서비스 (${dogNames})`, customerName: user?.name || '요청자' });
        cleanupTossPaymentArtifacts();
        modal.remove();
        resolve({ orderId, amount: total, duration: selectedDuration, dogs: selectedDogs });
      } catch(e) {
        localStorage.removeItem('pawsitive_pending_payment');
        cleanupTossPaymentArtifacts();
        modal.remove();
        reject('payment_failed');
      }
    };
  });
}

function showPaymentConfirmModal({ dogSize, dogName, duration = 40 }) {
  return showPaymentConfirmModalModern({ dogSize, dogName, duration });
}
