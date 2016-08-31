var config = require('@nodulus/config').config;
var http = require('http'),
    httpProxy = require('http-proxy');



var cp = require('child_process');
var path = require('path');
var proxy = httpProxy.createProxyServer({});

var debugger_port = 9000;
for (var app in config.appSettings.applications) {
    debugger_port++;
    var app_config = config.appSettings.applications[app];
    forkApplication(app_config);
}

var server = http.createServer(function (req, res) {
    if (!config.appSettings.applications[req.headers.host]) {
        res.write(req.headers.host + 'not found ');
        res.end();
        return console.error('app not found', req.headers.host);
    }


    var app_port = config.appSettings.applications[req.headers.host].port;
    proxy.web(req, res, { target: config.appSettings.server.protocol + config.appSettings.server.ip + ':' + app_port });
});

console.log("listening on port 80");
server.listen(80);


function forkApplication(app_config) {
    var child = cp.fork(app_config.main, [], {
        execArgv: ["--debug=" + debugger_port],
        cwd: app_config.cwd,
        env: { PORT: app_config.port }
    });
    child.on('close', function (code) {
        console.log('closing code: ' + code);
        forkApplication(app_config);

    });
}
