/* Automates setting multiple Heroku env vars into one script
Expects Heroku remote to be set and user to be authenticated
*/
const exec = require('child_process').exec;

const config = require('../config');
const { promisify } = require('util');
const fs = require('fs');

const readEnvVars = async () => {
    const readFileAsync = promisify(fs.readFile);
    const content = await readFileAsync(`${config.rootPath}/.env`, 'utf8');

    await processEnvVars(content);
};

const processEnvVars = async (content) => {
    // split env var file into separate var sets by newline
    const contentSets = content.split(/\n/);

    // trim spaces from each env var set
    trimmedContentSets = contentSets.map((set) => {
        return set.replace(/\s/g, '');
    });

    herokuSetEnvVars(trimmedContentSets);
};

const herokuSetEnvVars = (herokuEnvVars) => {
    herokuEnvVars.forEach((envVar) => {
        herokuPostEnvVar(envVar);
    });
};

const herokuPostEnvVar = (envVar) => {
    console.log(`Setting: ${envVar}`);
    exec(`heroku config:set ${envVar}`);
};

const startScript = () => {
    readEnvVars();
};

startScript();
