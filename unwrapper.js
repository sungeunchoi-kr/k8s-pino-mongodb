var readline = require('readline')

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
})

rl.on('line', line => {
    if (line) {
        line = line.toString()
        try {
            const obj = JSON.parse(line)
            console.log((obj.log || '').trim())
        } catch(e) {
            // The log may be format like this: `2021-08-30T20:55:30.514494087Z stdout F {\"level ...`, not a json.

            const startOfJson = line.indexOf('{')
            if (startOfJson >= 0) {
                const extracted = line.substring(startOfJson)
                console.error(`unwrapper: extracted=${JSON.stringify(extracted)}.`)
                try {
                    console.log(extracted)
                } catch(e) {
                    console.error(`unwrapper: extracted=${JSON.stringify(extracted)} is not JSON; skipping.`)
                }
            } else {
                console.error(`unwrapper: line=${JSON.stringify(line)} is not JSON; skipping.`)
            }
        }
    }
})

