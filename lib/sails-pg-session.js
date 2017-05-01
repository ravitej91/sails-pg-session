/*!
 * sails-pg-session
 * @author Ravi Teja <ravi-tej@live.com>
 * @version 1.0
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

  var pg = require('pg');
  var __options__ = null;

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

    sails.log.info('sails-pg-session#Constructor - constructing a new pool of connections...');

    options = options || {};
    Store.call(this, options);

    __options__ = options;
    if ( __options__.pool ) {
    	pg.defaults.poolSize			= __options__.pool.poolSize					|| 10;
    	pg.defaults.poolIdleTimeout		= __options__.pool.poolIdleTimeout			|| 30000;
    	pg.defaults.reapIntervalMillis	= __options__.pool.reapIntervalMillis		|| 1000;

        delete __options__.pool;
    }

    sails.log.info('sails-pg-session#Constructor - the pool has been constructed with:');
    sails.log.info('sails-pg-session#Constructor - => size               : ' + pg.defaults.poolSize);
    sails.log.info('sails-pg-session#Constructor - => idleTimeout        : ' + pg.defaults.poolIdleTimeout);
    sails.log.info('sails-pg-session#Constructor - => reapIntervalMillis : ' + pg.defaults.reapIntervalMillis);

  }

  /**
   * Inherit from `Store`.
   */

  PostSQLStore.prototype = new Store();
//  PostSQLStore.prototype.__proto__ = Store.prototype;

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */

  PostSQLStore.prototype.get = function (sid, fn) {
	sails.log.verbose('sails-pg-session#get - requesting a new connection from the pool...');
	pg.connect(__options__, function(err, client, done) {
	  try {
        sails.log.silly('sails-pg-session#get - ' + client.processID + '@' + client.poolCount + ': lookup session ' + sid + '...');
        client.query("SELECT data_out FROM sails_session_store_get($1)", [sid], function (err, result) {
            if (err) {
              sails.log.error('sails-pg-session#get - ' + client.processID + '@' + client.poolCount + ': ', err);

              sails.log.silly('sails-pg-session#get - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
              done();

              return fn(err);
            }
            sails.log.silly('sails-pg-session#get - ' + client.processID + '@' + client.poolCount + ': ',result);

            sails.log.silly('sails-pg-session#get - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
            done();

            return fn && fn(null, result.rows[0].data_out);
        });
      } catch(err) {
        sails.log.error('sails-pg-session#get - ' + client.processID + '@' + client.poolCount + ': ', err);

        sails.log.silly('sails-pg-session#get - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
        done();

        if ( fn ) {
        	fn(err);
        }
      }
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
    sails.log.verbose('sails-pg-session#set - requesting a new connection from the pool...');
	pg.connect(__options__, function(err, client, done) {
      try {
          sails.log.silly('sails-pg-session#set - ' + client.processID + '@' + client.poolCount + ': persisting session ' + sid + '...');
          client.query("SELECT sails_session_store_set($1,$2)", [sid, sess], function (err, result) {
            if (err) {
              sails.log.error('sails-pg-session#set - ' + client.processID + '@' + client.poolCount + ': ', err);

              sails.log.silly('sails-pg-session#set - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
              done();

              return fn && fn(err);
            }
            sails.log.silly('sails-pg-session#set - ' + client.processID + '@' + client.poolCount + ': ',result);

            sails.log.silly('sails-pg-session#set - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
            done();

            if ( fn ) {
            	fn(null);
            }
          });
        } catch (err) {
          sails.log.error('sails-pg-session#set - Catch - ' + client.processID + '@' + client.poolCount + ': ',err);

          sails.log.silly('sails-pg-session#set - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
          done();

          if ( fn ) {
        	  fn(err);
          }
        }
    });
  };

  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Callback} fn
   * @api public
   */

  PostSQLStore.prototype.destroy = function (sid, fn) {
    sails.log.verbose('sails-pg-session#destroy - requesting a new connection from the pool...');
    pg.connect(__options__, function(err, client, done) {
      try {
        sails.log.silly('sails-pg-session#destroy - ' + client.processID + '@' + client.poolCount + ': desctroying session ' + sid + '...');
        client.query("SELECT sails_session_store_destroy($1)", [sid], function (err, result) {
          if (err) {
            sails.log.error('sails-pg-session#destroy - ' + client.processID + '@' + client.poolCount + ': ',err);

            sails.log.silly('sails-pg-session#destroy - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
            done();

            return fn && fn(err);
          }
          sails.log.silly('sails-pg-session#destroy - ' + client.processID + '@' + client.poolCount + ': ',result);

          sails.log.silly('sails-pg-session#destroy - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
          done();

          if ( fn ) {
        	  fn();
          }
        });
      } catch(err) {
        sails.log.error('sails-pg-session#destroy - ' + client.processID + '@' + client.poolCount + ': ',err);

        sails.log.silly('sails-pg-session#destroy - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
        done();

        return fn && fn(err);
      }
    });
  };

  PostSQLStore.prototype.length = function (fn) {
    pg.connect(__options__, function(err, client, done) {
      sails.log.verbose('sails-pg-session#length - ' + client.processID + '@' + client.poolCount + ': requesting a new connection from the pool...');
      try {
        sails.log.silly('sails-pg-session#length - ' + client.processID + '@' + client.poolCount + ': lookup the number of sessions...');
        client.query("SELECT length FROM sails_session_store_length()", function (err, result) {
          if (err) {
            sails.log.error('sails-pg-session#length - ' + client.processID + '@' + client.poolCount + ': ',err);

            sails.log.silly('sails-pg-session#length - ' + client.processID + '@' + client.poolCount + ': releasign connection...');
            done();

            return fn && fn(err);
          }
          sails.log.silly('sails-pg-session#length - ' + client.processID + '@' + client.poolCount + ': ',result);

          sails.log.silly('sails-pg-session#length - ' + client.processID + '@' + client.poolCount + ': releasign connection...');
          done();

          if ( fn ) {
        	  fn(null, result);
          }
        });
      } catch (err) {
        sails.log.error('sails-pg-session#length - Catch - ' + client.processID + '@' + client.poolCount + ': ',err);

        sails.log.silly('sails-pg-session#length - ' + client.processID + '@' + client.poolCount + ': releasign connection...');
        done();

        if ( fn ) {
        	fn(err);
        }
      }
    });

  };

  PostSQLStore.prototype.clear = function (fn) {
    pg.connect(__options__, function(err, client, done) {
      sails.log.verbose('sails-pg-session#clear - ' + client.processID + '@' + client.poolCount + ': requesting a new connection from the pool...');
      try{
        sails.log.silly('sails-pg-session#clear - ' + client.processID + '@' + client.poolCount + ': clearing sessions...');
        client.query("SELECT sails_session_store_clear()", function (err, result) {
    	  if (err) {
    	    sails.log.error('sails-pg-session#clear ' + client.processID + '@' + client.poolCount + ': ',err);

            sails.log.silly('sails-pg-session#clear - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
            done();

    	    return fn && fn(err);
    	  }
    	  sails.log.silly('sails-pg-session#clear ' + client.processID + '@' + client.poolCount + ': ',result);

          sails.log.silly('sails-pg-session#clear - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
          done();

    	  if ( fn ) {
    		  fn();
    	  }
    	});
      } catch(err){
  	    sails.log.error('sails-pg-session#clear ' + client.processID + '@' + client.poolCount + ': ',err);

        sails.log.silly('sails-pg-session#clear - ' + client.processID + '@' + client.poolCount + ': releasing connection...');
        done();

	    return fn && fn(err);
      }
    });
  };

  return PostSQLStore;
};
