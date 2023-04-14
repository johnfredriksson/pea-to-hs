const exchangeForToken = require('../../../src/models/auth').exchangeForToken;

it('should return object if token is present', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({access_token: 'access_token'}),
    }),
  );
  const title = await exchangeForToken({test: 'test'});
  expect(title.access_token).toEqual('access_token');
});

it('should throw error if token not present', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({error: 'error'}),
    }),
  );
  try {
    const data = await exchangeForToken();

    console.log(data);
  } catch (error) {
    expect(error.message).toEqual('Failed to retrieve access token');
  }
});
