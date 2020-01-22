const express = require('express')
// const users = require('./users.js')
// const guilds = require('./guilds.js')
const log = require('../../../util/logger.js')
// const dbOpsVips = require('../../../util/db/vips')
const api = express.Router()
// const cp = require('./cp.js')
// const feedback = require('./feedback.js')
// const rating = require('./rating.js')
// const feeds = require('./guilds.feeds.js')
// const roles = require('./guilds.roles.js')
// const feedParser = require('./feeds.js')
// const message = require('./guilds.feeds.message.js')
// const embeds = require('./guilds.feeds.embeds.js')
// const filters = require('./guilds.feeds.filters.js')
// const subscribers = require('./guilds.feeds.subscribers.js')
// const subscribersFilters = require('./guilds.feeds.subscribers.filters.js')
// const channels = require('./guilds.channels.js')
const statusCodes = require('../../constants/codes.js')
const csrf = require('csurf')
const rateLimit = require('express-rate-limit')
// const config = require('../../../config.js')
// All API routes tries to mirror Discord's own API routes

if (process.env.NODE_ENV !== 'test') {
  api.use(rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per 1 minute
    message: {
      code: 429,
      message: 'Too many requests'
    }
  }))
}

async function authenticate (req, res, next) {
  if (!req.session.auth) {
    if (req.session.identity) log.web.warning(`(${req.session.identity.id}, ${req.session.identity.username}) Failed Discord Authorization`)
    return res.status(401).json({ code: 401, message: 'Failed Discord authorization' })
  }
  const accessTokenObject = req.app.get('oauth2').accessToken.create(req.session.auth)
  if (!accessTokenObject.expired()) return next()
  accessTokenObject.refresh().then(result => {
    req.session.auth = result.token
    next()
  }).catch(next)
}

// Handle API route errors
function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  if (err.response) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(err.response)
    }
    // Axios errors for Discord API calls
    const status = err.response.status
    const data = err.response.data
    const message = data ? data.message ? data.message : data : statusCodes[status] ? statusCodes[status].message : err.response.statusText
    return res.status(status).json({ code: status, message, discord: true })
  } else if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ code: 403, message: 'Bad CSRF Token' })
  } else {
    if (process.env.NODE_ENV !== 'test') console.log(err)
    res.status(500).json({ code: 500, message: statusCodes['500'].message })
  }
}

// api.use(verifyBotStatus)
api.get('/authenticated', require('./authenticated.js'))
// api.use('/feeds', feedParser.router)

// // Any routes defined past here requires authorization
// api.use(authenticate)

if (process.env.NODE_ENV !== 'test') {
  api.use(csrf())
}
// api.use('/cp', cp.router)
// api.use('/feedback', feedback)
// api.use('/rating', rating)
// // api.use('/config', config)
// api.use('/users', users.router)
// api.use('/guilds', guilds.router)
// guilds.router.use('/:guildID/feeds', feeds.router)
// guilds.router.use('/:guildID/roles', roles.router)
// guilds.router.use('/:guildID/channels', channels.router)
// feeds.router.use('/:feedID/message', message.router)
// feeds.router.use('/:feedID/embeds', embeds.router)
// feeds.router.use('/:feedID/filters', filters.router)
// feeds.router.use('/:feedID/subscribers', subscribers.router)
// feeds.router.use('/:feedID/subscribers/:subscriberID/filters', subscribersFilters.router)
// api.use(mongooseResults)
api.use(errorHandler)

module.exports = {
  router: api,
  middleware: {
    // verifyBotStatus,
    authenticate,
    // mongooseResults,
    errorHandler
  }
}
