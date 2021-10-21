const fetch = require('node-fetch');
const fs = require('fs');
var Spinner = require('cli-spinner').Spinner;

function helper(config = new {}()) {
  const app = config.appKey;
  const sec = config.secret;
  const home = config.homePod || 'https://home.mozu.com';
  const api = config.api;
  const namespace = config.namespace || 'current';

  async function getAuthToken() {
    const body = {
      client_id: app,
      client_secret: sec,
      grant_type: 'client',
    };
    return await fetch(`${home}/api/platform/applications/authtickets/oauth`, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        kube_namespace: namespace,
      },
      body: JSON.stringify(body),
      method: 'POST',
    }).then((x) => x.json());
  }

  function delay(milisec) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('');
      }, milisec);
    });
  }

  async function doExport(name, body) {
    body = body || {
      domain: 'catalog',
      resources: [
        {
          resource: 'products',
          format: 'legacy',
          fields: ['*'],
        }
      ],
    };
    body.name = name;

    const token = await getAuthToken();

    return await fetch(`${api}/api/platform/data/export/`, {
      headers: {
        Authorization: 'Bearer ' + token.access_token,
        accept: 'application/json',
        'content-type': 'application/json',
        kube_namespace: namespace,
      },
      body: JSON.stringify(body),
      method: 'POST',
    }).then((x) => x.json());
  }

  async function pollExport(id) {
    var token = await getAuthToken();
    let flg = false;
    var spinner = new Spinner('processing.. %s');
    spinner.setSpinnerString('|/-\\');
    spinner.start();
    while (true) {
      await delay(1000);
      const exp = await fetch(`${api}/api/platform/data/export/${id}`, {
        headers: {
          Authorization: 'Bearer ' + token.access_token,
          accept: 'application/json',
          'content-type': 'application/json',
          kube_namespace: namespace,
        },
        method: 'GET',
      }).then((x) => x.json());

      if (!exp.isComplete) {
      //  console.log('polling export');
        continue;
      }
      if (exp.files) {
        spinner.stop();
        return exp;
      }
      if (flg) {
        spinner.stop();
        return exp;
      }
      flg = true;
    }
  }

  async function pollImport(id) {
    var token = await getAuthToken();
    var spinner = new Spinner('processing.. %s');
    let flg = false;
    while (true) {
      await delay(1000);
      const exp = await fetch(`${api}/api/platform/data/import/${id}`, {
        headers: {
          Authorization: 'Bearer ' + token.access_token,
          accept: 'application/json',
          'content-type': 'application/json',
          kube_namespace: namespace,
        },
        method: 'GET',
      }).then((x) => x.json());

      if (!exp.isComplete) {
        continue;
      }
      if (exp.files) {
        spinner.stop();
        return exp;
      }
      if (flg) {
        spinner.stop();
        return exp;
      }
      flg = true;
    }
  }

  async function downloadFile(id, filename) {
    var token = await getAuthToken();
    const s3Link = await getDowloadLink(id);
    return await fetch(s3Link).then((res) => {
      const dest = fs.createWriteStream(filename);
      res.body.pipe(dest);
    });
  }

  async function getDowloadLink(id) {
    var token = await getAuthToken();
    return await fetch(`${api}/api/platform/data/files/${id}/generatelink`, {
      headers: {
        Authorization: 'Bearer ' + token.access_token,
        accept: 'application/json',
        'content-type': 'application/json',
        kube_namespace: namespace,
      },
      method: 'POST',
      body: null,
    }).then((x) => x.json());
  }

  async function doImport(name, file, body) {
    body = body || {
      name: name,
      domain: 'catalog',
      resources: [
        {
          resource: 'products',
          format: 'legacy',
        },
      ],
      files: [file],
    };

    const token = await getAuthToken();

    return await fetch(`${api}/api/platform/data/import/`, {
      headers: {
        Authorization: 'Bearer ' + token.access_token,
        accept: 'application/json',
        'content-type': 'application/json',
        kube_namespace: namespace,
      },
      body: JSON.stringify(body),
      method: 'POST',
    }).then((x) => x.json());
  }

  async function uplaodFile(name, fileType = 'import') {
    const stats = fs.statSync(file);
    const fileSizeInBytes = stats.size;
    const readStream = fs.createReadStream(file);

    var token = await getAuthToken();
    return await fetch(
      `${api}/api/platform/data/files?fileType=${fileType}&fileName=${name}`,
      {
        headers: {
          Authorization: 'Bearer ' + token.access_token,
          accept: 'application/json',
          'Content-length': fileSizeInBytes,
          kube_namespace: namespace,
        },
        method: 'POST',
        body: readStream,
      }
    ).then((x) => x.json());
  }

  async function performExport(
    body = null,
    filename = 'export.zip',
    exportName = 'export'
  ) {
    try {
      fs.unlink(filename);
    } catch (e) {}
    let exp = await doExport(exportName, body);
    exp = await pollExport(exp.id);
    console.log(exp);
    const file = exp.files.find((x) => x.fileType === 'export');
    if (file) {
      console.log('downloading');
      await downloadFile(file.id, filename);
    }
  }

  async function performImport(
    body = null,
    filename = 'import.zip',
    importName = 'import'
  ) {
    try {
      fs.unlink('logs.zip');
    } catch (e) {}
    let file = await uplaodFile(filename, 'import', filename);
    file.fileType = 'import';
    let imp = await doImport(importName, file, body);

    console.log(imp);

    imp = await pollImport(imp.id);
    const logs = imp.files.find((x) => x.fileType === 'log');
    if (logs) {
      await downloadFile(logs.id, 'logs.zip');
    }
    console.log('complete');
  }
  return {
    getAuthToken: getAuthToken,
    getDowloadLink: getDowloadLink,
    doExport: doExport,
    pollExport: pollExport,
    pollImport: pollImport,
    downloadFile: downloadFile,
    doImport: doImport,
    uplaodFile: uplaodFile,
    performExport: performExport,
    performImport: performImport,
  };
}
module.exports = helper;
//export default helper;
