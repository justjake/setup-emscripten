const path = require('path');
const core = require('@actions/core');
const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');

async function run(version) {
  const emsdk_zip = await tc.downloadTool("https://github.com/emscripten-core/emsdk/archive/master.zip");
  const extPath = await tc.extractZip(emsdk_zip);
  const toolRoot = path.join(extPath, 'emsdk-master');
  const emsdk_bin = path.join(toolRoot, 'emsdk');

  await exec.exec(emsdk_bin, ["install", version]);
  await exec.exec(emsdk_bin, ["activate", version]);
  let env_stdout = "";
  await exec.exec(path.join(toolRoot, 'emsdk_env.sh'), [], {
    listeners: {
      stdout: data => env_stdout += data.toString()
    }
  });
  console.log(env_stdout);
  env_stdout.match(/(?<=(PATH \+= )).*/g).forEach(p => core.addPath(p))
  env_stdout.match(/\w+ = .*/g).forEach(line => {
    let [varName, varVal] = line.split(" = ");
    core.exportVariable(varName, varVal);
  })
}

try {
  // `who-to-greet` input defined in action metadata file
  const version = core.getInput('emscripten-version') || 'latest';
  console.log(`Installing emscripten (${version})...`);
  run(version).catch(e => core.setFailed(e));
} catch (error) {
  core.setFailed(error.message);
}
