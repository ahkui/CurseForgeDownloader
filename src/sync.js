'use strict';

const readModList = require('./utils/readModList');
const readModConfig = require('./utils/readModConfig');
const writeModList = require('./utils/writeModList');
const isSameModItem = require('./utils/isSameModItem');
const request = require('request');
const writeModConfig = require('./utils/writeModConfig');
const { fetch } = require('./fetch');

exports.command = 'sync';

exports.desc = 'Sync with server mod';

exports.builder = function (yargs) {
    return yargs
        .option('server', {
            alias: 's',
            type: 'string',
            description: 'Mod list URL'
        })
        .option('fetch', {
            alias: 'f',
            type: 'boolean',
            description: 'Fetch mods'
        }).example('cmm sync')
        .example('cmm sync --server https://example.com/cmm_config.json', 'Specify modlist')
        .help('h');
}


const fetchServerConfig = async (argv) => {
    const config = readModConfig()

    const serverUrl = argv.server || config.server
    if (serverUrl == undefined || serverUrl == null)
        throw "server can't be empty!"
    console.log(`Server: ${serverUrl}`)

    config.server = serverUrl

    writeModConfig(config)

    return await (new Promise((resolve, reject) => {
        request({ url: serverUrl }, function (error, response, body) {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject("Fail to fetch from server...");
            }
        })
    }))
};

exports.handler = async function (argv) {
    let serverModConfig
    try {
        serverModConfig = await fetchServerConfig(argv);
    } catch (error) {
        console.error(error)
        return
    }
    const serverModList = serverModConfig.modList;

    const localModList = await readModList();

    for (const key in serverModList) {
        if (serverModList.hasOwnProperty(key)) {
            const serverMod = serverModList[key];

            if (localModList.hasOwnProperty(key)) {
                const localMod = localModList[key];

                if (isSameModItem({
                    oldMod: localMod,
                    newMod: serverMod,
                }) == false) {
                    localMod.name = serverMod.name
                    localMod.mod_id = serverMod.mod_id
                    localMod.mod_url = serverMod.mod_url
                    localMod.file_id = serverMod.file_id
                    localMod.file_url = serverMod.file_url
                    localMod.file_md5 = serverMod.file_md5
                    localMod.mode = serverMod.mode
                }

                localMod.enable = serverMod.enable
            } else {
                localModList[key] = serverMod;
            }
        }
    }

    await writeModList(localModList)
    if (argv.fetch == true) {
        await fetch();
    } else {

        // console.clear()
        console.log(`Your mods: ${Object.keys(localModList).map((k) => localModList[k].name).join(', ')}`)
        console.log('Done!')

    }
}
