const getHsCompanies = require('../../../src/models/fetcher').getHsCompanies;
let hubspot = require('@hubspot/api-client');

// jest.mock('@hubspot/api-client');

it('return object with company name and id', async () => {
  hubspotClient = new hubspot.Client({accessToken: "test"});
  hubspotClient.crm.companies.basicApi.getPage = jest.fn(() =>
    Promise.resolve({
      results: [
        {
          id: "companyId",
          properties: {
            name: "companyName"
          }
        }
      ]
    })
  );

  const data = await getHsCompanies(hubspotClient);
  expect(data).toEqual({companyName: "companyId"});
});

it('return object with multiple company names and ids', async () => {
  hubspotClient = new hubspot.Client({accessToken: "test"});
  hubspotClient.crm.companies.basicApi.getPage = jest.fn(() =>
    Promise.resolve({
      results: [
        {
          id: "companyIdOne",
          properties: {
            name: "companyNameOne"
          }
        },
        {
          id: "companyIdTwo",
          properties: {
            name: "companyNameTwo"
          }
        },
        {
          id: "companyIdThree",
          properties: {
            name: "companyNameThree"
          }
        }
      ]
    })
  );

  const data = await getHsCompanies(hubspotClient);
  expect(data.companyNameOne).toEqual("companyIdOne");
  expect(data.companyNameTwo).toEqual("companyIdTwo");
  expect(data.companyNameThree).toEqual("companyIdThree");
});

it('return empty object', async () => {
  hubspotClient = new hubspot.Client({accessToken: "test"});
  hubspotClient.crm.companies.basicApi.getPage = jest.fn(() =>
    Promise.resolve({
      results: []
    })
  );

  const data = await getHsCompanies(hubspotClient);
  expect(data).toEqual({});
});



