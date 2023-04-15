// A module to hold functionality to collect data from PE Accounting and Hubspot

const fetcher = {
  /**
    * - Fetch and return all clients linked to the PE Accounting credentials
    *
    * @param  {string} companyId - PE Accounting company id
    * @param  {string} apiKey    - PE Accounting API key
    *
    * @return {array}            - An array containing all clients
    */
  getPeaClients: async (companyId, apiKey) => {
    const response = await fetch(
        `https://api.accounting.pe/v1/company/${companyId}/client`,
        {headers: {'Content-Type': 'application/json', 'X-token': apiKey}},
    );
    if (response.status == 401) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();

    if (data.clients.length == 0) {
      throw new Error('The account contains no clients');
    }

    return data.clients;
  },

  /**
   * - Fetch all companies tied to the user
   *
   * @param {hubspotClient} hubspotClient - The hubspot client
   *
   * @return {object}                    - An object containing clients
   */
  getHsCompanies: async (hubspotClient) => {
    const companies = {};

    const response = await hubspotClient.crm.companies.basicApi.getPage();

    const data = await response;
    data.results.forEach((company) => {
      companies[company.properties.name] = company.id;
    });

    return companies;
  },
};

module.exports = fetcher;
