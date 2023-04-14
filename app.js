// =====IMPORTS================================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const hubspot = require('@hubspot/api-client');
const bodyParser = require('body-parser');
const authModel = require('./src/models/auth.js');
const moveModel = require('./src/models/move.js');
const fetcherModel = require('./src/models/fetcher.js');
const path = require('path');
const flash = require('express-flash-notification');
const cookieParser = require('cookie-parser');
const NodeCache = require( 'node-cache' );

// =====ENVIRONMENTAL VARIABLES================================================

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPE = (process.env.SCOPE.split(/ |, ?|%20/)).join(' ');

// =====MISC===================================================================

const accessToken = new NodeCache({deleteOnExpire: true});
const refreshToken = {};
const companies = [];
let hubspotClient;
let peaClients;
let hsClients;


// =====EXPRESS SETUP/MIDDLEWARE===============================================

const app = express();
const urlencodedParser = bodyParser.urlencoded({extended: false});
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({
  secret: Math.random().toString(36).substring(2),
  resave: false,
  saveUninitialized: true,
}));
app.use(flash(app));

// =====TOKEN HANDLING=========================================================

/**
 * Checks if the access token is still valid
 * - if not, the token is refreshed using the refreshToken
 *
 * @param   {object} req - The express request object
 *
 * @return {void}
 */
async function validateToken(req) {
  if (!accessToken.get(req.sessionID)) {
    console.log(req.sessionID);
    const formData = {
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      refresh_token: refreshToken[req.sessionID],
    };
    const tokens = await authModel.exchangeForToken(formData);

    setTokens(req, tokens);
  }
}

// =====ROUTES=================================================================

/**
 * - Sets various tokens:
 *   access token to Node Cache with specified TTL
 *   and refresh token to refreshToken.
 *
 * @param  {object} req    - The express request object
 * @param  {object} tokens - The token object containing access, refresh and TTL
 *
 * @return {void}
 */
function setTokens(req, tokens) {
  accessToken.set(
      req.sessionID,
      tokens.access_token,
      Math.round(tokens.expires_in * 0.75),
  );
  refreshToken[req.sessionID] = tokens.refresh_token;
  hubspotClient = new hubspot.Client({accessToken: tokens.access_token});
}

/**
* - Index
*
* - If authorized, the user will be prompted to enter PEA credentials
*   to proceed. If not authorized, the user will be prompted to authorize
*   through HubSpot to proceed.
*/
app.get('/', async (req, res) => {
  if (authModel.isAuthorized(req.sessionID, refreshToken)) {
    await validateToken(req);

    return res.render('index');
  }
  const data = {
    authUrl: authModel.authUrl(CLIENT_ID, SCOPE, REDIRECT_URI),
  };

  return res.render('auth', data);
});

/**
 * - OAuth Callback
 *
 * - Catches the redirect from OAuth, proceeds to exchange
 *   received code for access token. If failed, redirects
 *   to index with error message.
 */
app.get('/auth/oauth-callback', async (req, res) => {
  if (req.query.code) {
    try {
      const formData = {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: req.query.code,
      };

      const tokens = await authModel.exchangeForToken(formData);

      setTokens(req, tokens);

      return res.redirect('/');
    } catch (error) {
      return req.flash('error', error.message, '/');
    }
  }
  return req.flash('error', 'OAuth code missing', '/');
});

/**
 * - Clients
 *
 * - Collects PEA clients and HubSpot companies by using access
 *   token and credentials from form.
 *
 */
app.post('/clients', urlencodedParser, async (req, res) => {
  if (authModel.isAuthorized(req.sessionID, refreshToken)) {
    await validateToken(req);
    if (req.body.companyId && req.body.apiKey) {
      try {
        peaClients = await fetcherModel.get_pea_clients(
            req.body.companyId,
            req.body.apiKey,
        );
        hsClients = await fetcherModel.get_hs_companies(hubspotClient);

        peaClients.forEach((client) =>
          companies.push(moveModel.createCompanyObject(client)));

        const data = {
          peaClients: companies,
          hsClients: hsClients,
        };

        return res.render('clients', data);
      } catch (error) {
        return req.flash('error', error.message, '/');
      }
    }
    return req.flash('error', 'Company id or API key missing', '/');
  }
  return req.flash('error', 'Not authorized', '/');
});

/**
 * - Move the clients
 *
 * - Performs the transfer of the new company objects towards HubSpot
 *   and delivers a status page after transfer is complete.
 */
app.post('/move', urlencodedParser, async (req, res) => {
  if (authModel.isAuthorized(req.sessionID, refreshToken)) {
    await validateToken(req);
    companies.forEach((company) => {
      company.properties.domain = req.body[company.properties.name];
    });

    await moveModel.moveCompanies(companies, hubspotClient, hsClients);

    return res.render('complete');
  }

  return req.flash('error', 'Not authorized', '/');
});

// =====RUNNING================================================================

// Start the server
app.listen(4000);
