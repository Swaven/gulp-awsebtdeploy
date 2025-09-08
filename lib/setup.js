
'use strict';

var fs   = require('fs')
,   path = require('path')
,   {ElasticBeanstalkClient}  = require('@aws-sdk/client-elastic-beanstalk');

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
