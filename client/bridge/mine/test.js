'use strict'

const { exec, spawn } = require('child_process');

const java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', './minecraft_server.jar', 'nogui']);
var iconv = require("iconv-lite")

function myTest (cmd) {
    return new Promise(function (resolve, reject) {
        exec(cmd, {
            maxBuffer: 1024 * 4000,
            encoding: 'binary'
        }, function (err, stdout, stderr) {
            if (err) {
                reject(err)
                console.log(err)
            } else if (stderr.lenght > 0) {
                reject(new Error(stderr.toString()))
            } else {
                console.log(stdout)
                stdout = iconv.decode(Buffer.from(stdout, 'binary'), 'cp936')
                resolve(stdout)
            }
        })
    })
}
// myTest('java -Xmx1024M -Xms1024M -jar ./minecraft_server.jar nogui').then((res) => {
//     console.log(res)
// }).catch((err) => {
//     console.log(err)
// })
java.stdout.on('data', (data) => {
    console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
});
java.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});
java.on('close', (code) => {
    console.log(`子进程退出，退出码 ${code}`);
});
java.stdin.setEncoding('utf8');
// java.stdin.write('/help\n');