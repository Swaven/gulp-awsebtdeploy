
'use strict'

var fs     = require('fs')
,   util   = require('gulp-util')
,   Q      = require('q')
,   AWS    = require('aws-sdk')
,   color  = util.colors
,   logger = util.log

function upload(sets) {
  var opts = sets.opts
  ,   bucketParam = sets.bucketParam
  ,   s3 = new AWS.S3(sets.awsOptions)
  ,   deferred = Q.defer();

  logger('Start to upload sourceBundle to %s/%s',
      color.cyan(bucketParam.Bucket),
      color.cyan(bucketParam.Key));

  fs.readFile(opts.sourceBundle, function(err, data) {

    if(err) {
      deferred.reject(err);
      return;
    }

    s3.putObject({
      Bucket: bucketParam.Bucket,
      Key: bucketParam.Key,
      Body: new Buffer(data)
    }, function(err, result){

      if(err) {
        deferred.reject(err);
        return;
      }

      logger('Upload success -> %s/%s ',
        color.cyan(bucketParam.Bucket),
        color.cyan(bucketParam.Key));
      deferred.resolve(result);

    });
  });

  return deferred.promise;
}

function createApplicationVersion(sets) {
  var eb = sets.eb
  ,   opts = sets.opts
  ,   bucketParam = sets.bucketParam
  ,   deferred = Q.defer();

  logger('Start to create application version %s to %s',
    color.cyan(opts.applicationName),
    color.cyan(opts.versionLabel));

  eb.createApplicationVersion({
    ApplicationName: opts.applicationName,
    VersionLabel: opts.versionLabel,
    Description: opts.description,
    SourceBundle: {
      S3Bucket: bucketParam.Bucket,
      S3Key: bucketParam.Key
    }
  }, function(error, version){
    if(error) {
      logger('Fail to create application %s version to %s',
        color.red(opts.applicationName),
        color.red(opts.versionLabel));
      deferred.reject(error);
    } else {
      logger('Create application %s version to %s success',
        color.cyan(opts.applicationName),
        color.cyan(opts.versionLabel));
      deferred.resolve(version);
    }
  });
  return deferred.promise;
}

function updateEnvironment(sets, version) {
  var eb = sets.eb
  ,   opts = sets.opts
  ,   envSettings = sets.envSettings
  ,   versionLabel = version.ApplicationVersion.VersionLabel
  ,   deferred = Q.defer()
  ,   envParameter = {};

  logger('Start to update environment version %s to %s',
    color.cyan(opts.environmentName),
    color.cyan(versionLabel));

  envParameter.EnvironmentName = opts.environmentName;
  envParameter.VersionLabel = versionLabel;

  if (envSettings) {
    envParameter.OptionSettings = envSettings;
  }

  eb.updateEnvironment(envParameter, function(error, result){
    if(error) {
      logger('Fail to update environment %s version to %s',
        color.red(opts.environmentName),
        color.red(versionLabel));
      deferred.reject(error);
    } else {
      logger('Deploying environment %s version to %s success',
        color.cyan(opts.environmentName),
        color.cyan(versionLabel));
      deferred.resolve(result);
    }
  });

  return deferred.promise;
}

// promisify describeEnvironmentHealth request
function getEnvHealth(sets){
  var eb = sets.eb

  return new Promise((resolve, reject) => {
    eb.describeEnvironmentHealth({
      EnvironmentName: sets.opts.environmentName,
      AttributeNames: ['All']
    }, (err, data) => {
      if (err)
        return reject(err)
      resolve(data)
    })
  })
}

function waitdeploy(sets, interval) {
  var eb = sets.eb
  ,   opts = sets.opts
  ,   waitState = sets.waitState = sets.waitState || {}

  return new Promise(async (resolve, reject) => {
    try{
      do {
        await new Promise(r => {setTimeout(r, interval)})

        let env = await getEnvHealth(sets)
        waitState.current = env
        waitState.current.color = color[env.Color.toLowerCase()] || color.gray

        if(waitState.prev) {
          let _p = waitState.prev.color,
              _c = waitState.current.color

          logger('Environment %s health has transitioned from %s(%s) to %s(%s)',
              color.cyan(opts.environmentName),
              _p(waitState.prev.HealthStatus),
              _p(waitState.prev.Status),
              _c(env.HealthStatus),
              _c(env.Status)
            );
        }

        waitState.prev = waitState.current;
      } while (waitState.current.Status !== 'Ready')

      resolve()
    }
    catch(err){
      return reject(err)
    }
  })
}

module.exports = {
  upload: upload,
  createApplicationVersion: createApplicationVersion,
  updateEnvironment: updateEnvironment,
  waitdeploy: waitdeploy
};
