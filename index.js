const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const logdir = '/var/log/containers'

if (!process.env.DB_URL) {
    throw new Error(`DB_URL not defined!`)
}
const db_url = process.env.DB_URL

if (!process.env.DB_COLLECTION) {
    throw new Error(`DB_COLLECTION not defined!`)
}
const db_collection = process.env.DB_COLLECTION

if (!process.env.MATCH_PODS) {
    throw new Error(`MATCH_PODS not defined!`)
}
const matchPods = process.env.MATCH_PODS.split(',')

// const PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

const hang = () => {
    setTimeout(hang, 1000)
}

const main = () => {
    console.log(`==== parameters ====
DB_URL=${db_url}
DB_COLLECTION=${db_collection}
MATCH_PODS=${JSON.stringify(matchPods)}
=========`)

    try {
        const ls = fs.readdirSync(logdir)
        console.log(`[${new Date().toISOString()}] ls ${logdir}=`, JSON.stringify(ls))

        const logs = ls
            .filter(filename => {
                for (let m of matchPods) {
                    if (filename.startsWith(m + '_') || filename.startsWith(m + '-')) {
                        return true
                    }
                }
                return false
            })
            .map(filename => path.join(logdir, filename))
        console.log(`[${new Date().toISOString()}] logs=`, JSON.stringify(logs))

        // For each log in logs, tail it and pipe into pino-mongodb
        for (let log of logs) {
            let command = `/usr/bin/tail -F ${log} | ` +
                `node ./unwrapper.js | ` +
                `pino-mongodb '${db_url}' --collection='${db_collection}'`
            console.log(`[${new Date().toISOString()}] process.cwd()="${process.cwd()}"`)
            console.log(`[${new Date().toISOString()}] process.env.PATH= "${process.env.PATH}"`)
            console.log(`[${new Date().toISOString()}] launching "${command}"`)

            let proc = spawn('/bin/sh', [ '-c', command ], {
                cwd: process.cwd(),
                env: {
                    PATH: process.env.PATH + ':./node_modules/.bin'
                }
            })
            proc.stdout.on('data', data => {
                console.error(`proc stdout: ${data}`)
            })
            proc.stderr.on('data', data => {
                console.error(`proc stderr: ${data}`)
                if (data.toString().indexOf('tail:') >= 0) {
                    console.error(`Detected tail produced error. Exiting process.`)
                    process.exit(1)
                }
            })
            proc.on('close', code => {
                console.log(`child process for log=${log} exited with code ${code}.`)
            })
        }
    } catch(e) {
        console.log(`[${new Date().toISOString()}] fs.readdirSync('/var/log') returned error: %O`, e)
    }

    hang()
}

main()

