const awsebtdeploy = require('../index.js')

describe('e2e', () => {

  it('should deploy', async () => {
    const result = await awsebtdeploy({
      region: 'eu-west-1',
      applicationName: '[[ REPLACE WITH APPLICATION NAME ]]',
      environmentName: '[[ REPLACE WITH ENVIRONMENT NAME ]]',
      sourceBundle: 'test/[[ A TEST ZIP FILE ]]',
      s3Bucket: {
        bucket: 'elasticbeanstalk-eu-west-1-443798107548'
      },
    })
  })
})