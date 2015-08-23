/*!
 * sails-pg-session
 * @author Ravi Teja <ravi-tej@live.com>
 * @version 1.0.0
 */


/* global sails, module */

/**
 * Return the `PostSQLStore` extending `connect`'s session Store.
 *
 * @param {object} connect
 * @return {Function}
 * @api public
 */

module.exports = function (connect) {

  /**
   * Connect's Store.
   */

  var Store = connect.session.Store;

  /**
   * Initialize PostSQLStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  function PostSQLStore(options) {
    var self = this;

    options = options || {};
    Store.call(this, options);

    var pg = require('pg');

    this.pg_client = new pg.Client(options);
    this.pg_client.connect(function (err, client, done) {
      if (err) {
        sails.log.error('sails-pg-session#PostSQLStore - ', err);
      } else {
        sails.log.silly('sails-pg-session#PostSQLStore - Success - Postgres connection successfull');
      }
    });
  }

  /**
   * Inherit from `Store`.
   */

  PostSQLStore.prototype.__proto__ = Store.prototype;

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  PostSQLStore.prototype.get = function (sid, fn) {
    this.pg_client.query("SELECT data_out FROM sails_session_store_get($1)", [sid], function (err, result) {
      if (err) {
        sails.log.error('sails-pg-session#get - ', err);
        return fn(err);
      }
      sails.log.silly('sails-pg-session#get - ',result);
      return fn(null, result.rows[0].data_out);
    });
  };

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @param {Function} fn
   * @api public
   */

  PostSQLStore.prototype.set = function (sid, sess, fn) {
    try {
      this.pg_client.query("SELECT sails_session_store_set($1,$2)", [sid, sess], function (err, result) {
        if (err) {
          sails.log.error('sails-pg-session#set - ', err);
          return fn && fn(err);
        }
        sails.log.silly('sails-pg-session#set - ',result);
        fn && fn(null);
      });
    } catch (err) {
      sails.log.error('sails-pg-session#set - Catch - ',err);
      fn && fn(err);
    }
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Callback} fn
   * @api public
   */

  PostSQLStore.prototype.destroy = function (sid, fn) {
    this.pg_client.query("SELECT sails_session_store_destroy($1)", [sid], function (err, result) {
      if (err) {
        sails.log.error('sails-pg-session#destroy - ',err);
        return fn && fn(err);
      }
      sails.log.silly('sails-pg-session#destroy - ',result);
      fn && fn();
    });
  };

  PostSQLStore.prototype.length = function (callback) {
    try {
      this.pg_client.query("SELECT length FROM sails_session_store_length()", function (err, result) {
        if (err) {
          sails.log.error('sails-pg-session#length - ',err);
          return callback && callback(err);
        }
        sails.log.silly('sails-pg-session#length - ',result);
        callback && callback(null, length);
      });
    } catch (err) {
      sails.log.error('sails-pg-session#length - Catch - ',err);
      callback && callback(err);
    }
  };

  PostSQLStore.prototype.clear = function (callback) {
    this.pg_client.query("SELECT sails_session_store_clear()", function (err, result) {
      if (err) {
        sails.log.error('sails-pg-session#clear ',err);
        return callback && callback(err);
      }
      sails.log.silly('sails-pg-session#clear ',result);
      callback && callback();
    });
  };

  return PostSQLStore;
};
