/**
 * SunEee
 * @date Created on 2015/4/16
 * @author YuHui(”ÔÍÕ)<yuhui@suneee.com>
 *
 */

'use strict';


var express = require('express');
var app = express();

var url = require('url');
var proxy = require('proxy-middleware');
var path = require('path');
var open = require("open");

/**
 * get config
 */
var conf = require('rc')('sulky', {
    root: process.cwd(),
    port: 8008,
    host: 'localhost',
    proxy: {
        path: '',
        api: ''
    }
});

/**
 * use proxy conf
 */
if (conf.proxy && conf.proxy.path) {
    app.use(conf.proxy.path, proxy(url.parse(conf.proxy.api)));
}


/**
 * static files
 */
app.use(express.static(path.resolve(conf.root)));

/**
 * no index.html
 */
app.get('/', function (req, res) {
    res.send('sulky release required');
});

/**
 * error handler
 */
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

var server = app.listen(conf.port, function () {


    console.log('sulky listening at http://%s:%s', conf.host, conf.port);

    open('http://' + conf.host + ':' + conf.port);


});