require('dotenv').config();
const fs =require('fs');
const commandLineArgs = require('command-line-args');
const conf = {
  appKey: process.env.KIBO_APPLICATION_KEY,
  secret: process.env.KIBO_SHARED_SECRET,
  homePod: process.env.KIBO_HOME,
  api: process.env.KIBO_API,
  namespace: process.env.KIBO_NAMESPACE,
};
const helper = require('./lib/importExportHelper.js')(conf);

const optionDefinitions = [
  { name: 'command', defaultOption: true},
  { name: 'template', alias: 't', type: String },
  { name: 'output', alias: 'o', type: String },
  { name: 'name', alias: 'n', type: String },
];




const options = commandLineArgs(optionDefinitions);

async function exportFn() {
    const template = options.template ? JSON.parse(fs.readFileSync(options.template)) : null;

    await helper.performExport(template, options.output, options.name );
    console.log('complete');
}

switch (options.command){
    case 'export':{
        exportFn();
        return;
    }
    default:{
        console.error(`unknown command [${options.command}] expected export`)
    }
}