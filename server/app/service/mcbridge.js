'use strict'
const Service = require('egg').Service;
const Response = require('../../src/response')
const { exec, spawn } = require('child_process');



// myTest('java -Xmx1024M -Xms1024M -jar ./minecraft_server.jar nogui').then((res) => {
//     console.log(res)
// }).catch((err) => {
//     console.log(err)
// })

class minecraft {
    start(){
        return new Promise((resolve, rejects)=>{
            const java = spawn('java', ['-Xmx1024M', '-Xms1024M', '-jar', __dirname.replace(/\\app\\service/, '')+'\\src\\bridge\\mine\\server.jar', 'nogui']);
            var iconv = require("iconv-lite")
            java.stdin.setEncoding('utf8');
            java.stdin.write('/help\n');
            java.stdout.on('data', (data) => {
                // console.log(iconv.decode(Buffer.from(data, 'binary'), 'cp936'));
                resolve(iconv.decode(Buffer.from(data, 'binary'), 'cp936'))
                // return new Response({code: 1, msg: '获取成功', data : iconv.decode(Buffer.from(data, 'binary'), 'cp936')})
            });
            java.stderr.on('data', (data) => {
                // console.error(`stderr: ${data}`);
                resolve(iconv.decode(Buffer.from(data, 'binary'), 'cp936'))
            });
            java.on('close', (code) => {
                return new Response({code: -1, msg: '子进程退出，退出码'})
            });
        })
    }
}

class mcBridgeService extends Service {
    async get(options) {
        let mc = new minecraft()
        let res = await mc.start()
        return res
    }
}
  
module.exports = mcBridgeService;