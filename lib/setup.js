
'use strict';

var fs   = require('fs')
,   path = require('path')
,   {ElasticBeanstalkClient}  = require('@aws-sdk/client-elastic-beanstalk');

/**
 * Prepares and validates deployment settings for AWS Elastic Beanstalk and creates the client.
 *
 * @param {Object} opts - The deployment options.
 * @param {string} opts.region - AWS region (required).
 * @param {string} opts.applicationName - Elastic Beanstalk application name (required).
 * @param {string} opts.environmentName - Elastic Beanstalk environment name (required).
 * @param {string} opts.sourceBundle - Path to the source bundle file (required).
 * @param {string} [opts.versionLabel] - Version label for the application version.
 * @param {string} [opts.description] - Description for the deployment.
 * @param {Object} [opts.s3Bucket] - S3 bucket configuration.
 * @param {string} [opts.s3Bucket.bucket] - S3 bucket name.
 * @param {string} [opts.s3Bucket.key] - S3 object key.
 * @param {Array} [opts.settings] - Environment setting parameters.
 * @param {string} [opts.proxy] - Optional proxy URL for requests.
 * @returns {Promise<Object>} The prepared settings object for deployment.
 * @throws {Error} If required parameters are missing or the source bundle does not exist.
 */

module.exports = async function(opts) {
  var sets = {};

  if(!opts.region) {
    throw new Error('Param missing [region]');
  }
  if(!opts.applicationName) {
    throw new Error('Param missing [applicationName]');
  }
  if(!opts.environmentName) {
    throw new Error('Param missing [environmentName]');
  }
  if(!opts.sourceBundle) {
    throw new Error('Param missing [sourceBundle]');
  }

  try {
    await fs.promises.stat(opts.sourceBundle);
  } catch(e) {
    var error_msg;
    if(e.code === 'ENOENT' ) {
      error_msg = new Error('Invalid sourceBundle, It is not exist ' + opts.sourceBundle);
    } else {
      error_msg = e;
    }
    throw error_msg;
  }

  sets.opts = {
    region: opts.region,
    applicationName: opts.applicationName,
    environmentName: opts.environmentName,
    sourceBundle: opts.sourceBundle,
    description: opts.description
  };

  sets.opts.versionLabel = opts.versionLabel || path.basename(opts.sourceBundle, path.extname(opts.sourceBundle));
  sets.bucketParam = {
    Bucket: (opts.s3Bucket && opts.s3Bucket.bucket) || opts.applicationName,
    Key: (opts.s3Bucket && opts.s3Bucket.key) || path.basename(opts.sourceBundle)
  };

  sets.awsOptions = { region: opts.region }

  if (opts.proxy)
    sets.awsOptions.httpOptions = { proxy: opts.proxy }

  sets.eb = new ElasticBeanstalkClient(sets.awsOptions);
  sets.envSettings = opts.settings;

  return sets;
};
