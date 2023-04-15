const getPeaClients = require('../../../src/models/fetcher').getPeaClients;

test('should return list of clients', async () => {
  const clients = [{name: 'client1'}, {name: 'client2'}];
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({clients: clients}),
    }),
  );
  const data = await getPeaClients('companyId', 'apiKey');
  expect(data).toEqual(clients);
});

test('should throw error if status is 401', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      status: 401,
    }),
  );
  try {
    await getPeaClients('companyId', 'apiKey');
  } catch (error) {
    expect(error.message).toEqual('Invalid credentials');
  }
});

test('should throw error if the response has no clients', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({clients: []}),
    }),
  );
  try {
    await getPeaClients('companyId', 'apiKey');
  } catch (error) {
    expect(error.message).toEqual('The account contains no clients');
  }
});
