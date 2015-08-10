var mandrill = require('node-mandrill')
var templates = require('../templates')
var t = require('../translations').t
var log = require('debug')('democracyos:notifier:transports')

var name;
var fromEmail;

function setupMandrill(token, organizationEmail, organizationName) {
  if (!token || 'string' != typeof token) {
    throw new Error('Undefined or invalid mandrill API token')
  }

  name = organizationName;
  fromEmail = organizationEmail;
  log('Initializing mandrill API client')
  return mandrill(token)
}

function sendMandrill(opts, callback) {
  var to = resolveRecipient(opts.to)
  opts.vars = opts.vars || []
  opts.vars.push({ name: 'ORGANIZATION_NAME', content: name })

  // get mail body from jade template
  templates.jade(opts.template, opts.vars, function (err, body) {
    if (err) return callback(err);

    log('Sending email for "%s" job', opts.template)

    mandrill('/messages/send', {
      message: {
        to: to,
        from_email: fromEmail,
        from_name: name,
        subject: t('templates.' + opts.template + '.subject'),
        html: body
      }
    }, function (err, response) {
      if (err) log('Mandrill API error: %j', err)
      else log('Mandrill send successful: %j', response)

      if (callback) callback(err)
    })
  })
}

function resolveRecipient(obj) {
  if (Array.isArray(obj)) return obj
  if ('object' === typeof obj) return [obj]
  if ('string' === typeof obj) return { email: obj }

  throw new Error('Invalid or undefined recipient object')
}

/**
 * Module exports
 */
var exports = module.exports = function transports(config) {

  // setup mandrill
  mandrill = setupMandrill(
    config.mandrillToken,
    config.organizationEmail,
    config.organizationName)
  exports.mail = sendMandrill
}
