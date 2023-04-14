const authUrl = require('../../../src/models/auth').authUrl;

test('should create a correct URL', () => {
  const clientId = 'clientId';
  const scope = 'scope';
  const redirectUri = 'redirectUri';

  const url = authUrl(clientId, scope, redirectUri);

  expect(url).toEqual('https://app.hubspot.com/oauth/authorize?client_id=clientId&scope=scope&redirect_uri=redirectUri',
  );
});
