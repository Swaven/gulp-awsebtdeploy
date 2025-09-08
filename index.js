
var setup  = require('./lib/setup')
,   aws    = require('./lib/aws')
,   upload = aws.upload
,   createApplicationVersion = aws.createApplicationVersion
,   updateEnvironment = aws.updateEnvironment
,   waitdeploy = aws.waitdeploy;

module.exports = async function(opts) {

  try {
  var sets = await setup(opts);
  await upload(sets);

  const version = await createApplicationVersion(sets);

  updateResult = await updateEnvironment(sets, version);

  if(opts.waitForDeploy == null)
    opts.waitForDeploy = true;

  if (!opts.waitForDeploy)
    return updateResult;

  const results = await waitdeploy(sets, opts.checkIntervalSec || 2000)
  return results;
}
catch(ex){
  console.error(ex);
  throw ex;
}

}
