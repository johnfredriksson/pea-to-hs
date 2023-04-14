const isAuthorized = require('../../../src/models/auth').isAuthorized;

test('should return authorized', () => {
  const userId = 'userid';
  const refreshToken = {userid: 'refreshtoken'};

  expect(isAuthorized(userId, refreshToken)).toBe(true);
});

test('should return authorized', () => {
  const userId = 'invalid';
  const refreshToken = {userid: 'refreshtoken'};

  expect(isAuthorized(userId, refreshToken)).toBe(false);
});
