/**
 * Demo-only quick signup route.
 *
 * Mount example:
 *   const demoUserRoutes = require('./routes/demo-users');
 *   app.use('/api/demo', demoUserRoutes);
 */

const express = require('express');
const router = express.Router();
const db = require('../../../server/db');

function cleanNickname(value) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12);
}

function createDemoDog() {
  const idSeed = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  return {
    id: 'demo-dog-' + idSeed,
    name: '초코',
    breed: '말티즈',
    age: 3,
    size: 'small',
    gender: null,
    weight: null,
    neutered: null,
    personality: '발표 데모용 기본 반려견',
    healthNote: null,
    photo: null
  };
}

router.post('/quick-signup', (req, res) => {
  const nickname = cleanNickname(req.body?.nickname);
  if (!nickname || nickname.length < 2) {
    return res.status(400).json({
      success: false,
      error: '닉네임은 2자 이상 입력해주세요.'
    });
  }

  const users = db.get('users', []);
  const idSeed = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  const demoUser = {
    id: 'demo-user-' + idSeed,
    email: 'demo-' + idSeed + '@pawsitive.demo',
    name: nickname,
    nickname,
    phone: '',
    isDemo: true,
    referralCode: 'DEMO-' + idSeed.slice(-6).toUpperCase(),
    dogs: [createDemoDog()],
    pawCoins: 3000,
    createdAt: db.now()
  };

  users.push(demoUser);
  db.set('users', users);

  res.json({ success: true, user: demoUser });
});

module.exports = router;
