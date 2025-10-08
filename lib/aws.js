
'use strict'

const fs = require('fs'),
  { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'),
  {
    CreateApplicationVersionCommand,
    UpdateEnvironmentCommand,
    DescribeEnvironmentHealthCommand,
  } = require('@aws-sdk/client-elastic-beanstalk'),
  color  = require('ansi-colors'),
  log = require('fancy-log');
/**
 * Uploads source bundle to S3 bucket.
 * @param {Object} sets - Configuration object containing AWS options and bucket parameters.
 */
async function upload(sets) {
  const opts = sets.opts
  ,   bucketParam = sets.bucketParam
  ,   s3client = new S3Client(sets.awsOptions)

  log('Start to upload sourceBundle to %s/%s',
      color.cyan(bucketParam.Bucket),
      color.cyan(bucketParam.Key));

  try{
    const data = await fs.promises.readFile(opts.sourceBundle);

    const putCmd = new PutObjectCommand({
      Bucket: bucketParam.Bucket,
      Key: bucketParam.Key,
      Body: data
    })

    await s3client.send(putCmd);

    log('Upload success -> %s/%s ',
      color.cyan(bucketParam.Bucket),
      color.cyan(bucketParam.Key)
    );

    return;
  }
  catch (err) {
    throw err;
  }
}

/**
 * Creates a new application version in Elastic Beanstalk.
 * @param {Object} sets - Configuration object containing EB client and deployment options.
 * @returns {Promise<Object>} The created application version.
 */
async function createApplicationVersion(sets) {
  var eb = sets.eb
  ,   opts = sets.opts
  ,   bucketParam = sets.bucketParam;

  log('Start to create application version %s to %s',
    color.cyan(opts.applicationName),
    color.cyan(opts.versionLabel));

  try {
    const createCmd = new CreateApplicationVersionCommand({
      ApplicationName: opts.applicationName,
      VersionLabel: opts.versionLabel,
      Description: opts.description,
      SourceBundle: {
        S3Bucket: bucketParam.Bucket,
        S3Key: bucketParam.Key
      }
    })

    const version = await eb.send(createCmd);

    log('Create application %s version to %s success',
      color.cyan(opts.applicationName),
      color.cyan(opts.versionLabel)
    );

    return version
  }
  catch (err) {
    log('Fail to create application %s version to %s',
      color.red(opts.applicationName),
      color.red(opts.versionLabel)
    );
    throw err;
  }
}

/**
 * Updates the environment with the new application version.
 * @param {Object} sets - Configuration object containing EB client and environment settings.
 * @param {Object} version - The application version to deploy.
 * @returns {Promise<Object>} The update result.
 */
async function updateEnvironment(sets, version) {
  var eb = sets.eb
  ,   opts = sets.opts
  ,   envSettings = sets.envSettings
  ,   versionLabel = version.ApplicationVersion.VersionLabel;

  log('Start to update environment version %s to %s',
    color.cyan(opts.environmentName),
    color.cyan(versionLabel));

  try{
    const updateCmd = new UpdateEnvironmentCommand({
      EnvironmentName: opts.environmentName,
      VersionLabel: versionLabel,
    })

    if (envSettings) {
      updateCmd.OptionSettings = envSettings;
    }

    const result = await eb.send(updateCmd);

    log('Deploying environment %s version to %s success',
      color.cyan(opts.environmentName),
      color.cyan(versionLabel)
    );
    return result;
  }
  catch (err) {
    log('Fail to update environment %s version to %s',
      color.red(opts.environmentName),
      color.red(versionLabel)
    );
    throw err;
  }
}

/**
 * Gets environment health status from Elastic Beanstalk.
 * @param {Object} sets - Configuration object containing EB client and environment name.
 * @returns {Promise<Object>} The environment health status.
 */
async function getEnvHealth(sets) {
  var eb = sets.eb

  const describeCmd = new DescribeEnvironmentHealthCommand({
    EnvironmentName: sets.opts.environmentName,
    AttributeNames: ['All']
  })

  const health = await eb.send(describeCmd)
  return health
}

/**
 * Waits for deployment to complete by polling environment status.
 * @param {Object} sets - Configuration object containing deployment settings.
 * @param {number} interval - Polling interval in milliseconds.
 * @returns {Promise<string>} The final deployment status.
 */
async function waitdeploy(sets, interval) {
  const opts = sets.opts,
    waitState = sets.waitState = sets.waitState || {
      current:null, prev:null
    }

  try{
    do {
      await new Promise(r => {setTimeout(r, interval)})

      let env = await getEnvHealth(sets)

      waitState.current = env
      waitState.current.color = color[env.Color.toLowerCase()] || color.gray

      if (waitState.prev) {
        let _p = waitState.prev.color,
          _c = waitState.current.color

        log('Environment %s health has transitioned from %s(%s) to %s(%s)',
          color.cyan(opts.environmentName),
          _p(waitState.prev.HealthStatus),
          _p(waitState.prev.Status),
          _c(env.HealthStatus),
          _c(env.Status)
        );
      }

      waitState.prev = waitState.current;

    } while (waitState.current.Status !== 'Ready')

  }
  catch (ex) {}
  return waitState.current.status
}

module.exports = {
  upload: upload,
  createApplicationVersion: createApplicationVersion,
  updateEnvironment: updateEnvironment,
  waitdeploy: waitdeploy
};
