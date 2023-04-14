// Model to authenticate a user toward HubSpot and receive an access token.

const auth = {

  /**
    * - Retreive an access token and a refresh token from HubSpot
    *   by sending a form to the HubSpot API
    *
    * @param  {object} formData - A form containing containing client_id,
    *                             client_secret, code, redirect_uri and
    *                             grant type.
    * @return {object}          - An object containing the user id, access
    *                             token, refresh token, and token TTL.
    */
  exchangeForToken: async (formData) => {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          method: 'POST',
          body: new URLSearchParams(formData),
        });
    const data = await response.json();

    if (data.access_token) {
      return data;
    }

    throw Error('Failed to retreive access token');
  },

  /**
    * - Construct the URL to authenticate towards HubSpot.
    *
    * @param  {string} clientId     - Hubspot application id
    * @param  {string} scope         - Hubspot application scope,
    *                                  e.g. app permissions to user data
    * @param  {string} redirectUri  - Hubspot application redirect uri
    * @return {string}               - The full URL
    */
  authUrl: (clientId, scope, redirectUri) => {
    return 'https://app.hubspot.com/oauth/authorize' +
            `?client_id=${clientId}` +
            `&scope=${scope}` +
            `&redirect_uri=${redirectUri}`;
  },

  /**
    * Check if the user is authorized with Hubspot
    *
    * @param   {string} userId       - The session id
    * @param   {object} refreshToken - Object containing the
    *                                  Hubspot refresh token
    * @return  {bool}                - Boolean value if authorized or not
    */
  isAuthorized: (userId, refreshToken) => {
    return refreshToken[userId] ? true : false;
  },
};

module.exports = auth;
