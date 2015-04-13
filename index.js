/**
 * Created by fouber on 14-2-19.
 */

'use strict';


var child_process = require('child_process');
var spawn = child_process.spawn;

var step = require('step');


exports.name = 'server';
exports.usage = '<command> [options]';
exports.desc = 'launch nodejs server';
exports.register = function (commander) {


	commander
		.option('-a,--api_path <path>', '要代理的路径 - 将/api/xxx的请求转发到proxy_uri中的xxx', String)
		.option('-p,--proxy_uri <uri>', '代理路径 - http://api.server.com/v2/xxx', String)

		.action(function () {
			var args = Array.prototype.slice.call(arguments);
			args.pop();
			var cmd = args.shift();
			if (root) {
				if (fis.util.exists(root) && !fis.util.isDir(root)) {
					fis.log.error('invalid document root [' + root + ']');
				} else {
					fis.util.mkdir(root);
				}
			} else {
				fis.log.error('missing document root');
			}

			switch (cmd) {
				case 'start':
					stop(start);
					break;
//                case 'stop':
//                    stop(function(){});
//                    break;
				case 'open':
					open(root);
					break;
				case 'clean':
					process.stdout.write(' δ '.bold.yellow);
					var now = Date.now();
					var include = fis.config.get('server.clean.include', null);
					var reg = new RegExp('^' + fis.util.escapeReg(root + '/node_modules/'), 'i');
					var exclude = fis.config.get('server.clean.exclude', reg);
					fis.util.del(root, include, exclude);
					process.stdout.write((Date.now() - now + 'ms').green.bold);
					process.stdout.write('\n');
					break;
				default :
					commander.help();
			}
		});

	commander
		.command('start')
		.description('start server');

//    commander
//        .command('stop')
//        .description('shutdown server');

	commander
		.command('open')
		.description('open document root directory');

	commander
		.command('clean')
		.description('clean files in document root');

	function touch(dir) {
		if (fis.util.exists(dir)) {
			if (!fis.util.isDir(dir)) {
				fis.log.error('invalid directory [' + dir + ']');
			}
		} else {
			fis.util.mkdir(dir);
		}
		return fis.util.realpath(dir);
	}

	var root = touch((function () {
		var key = 'FIS_SERVER_DOCUMENT_ROOT';
		if (process.env && process.env[key]) {
			var path = process.env[key];
			if (fis.util.exists(path) && !fis.util.isDir(path)) {
				fis.log.error('invalid environment variable [' + key + '] of document root [' + path + ']');
			}
			return path;
		} else {
			return fis.project.getTempPath('www');
		}
	})());

	function open(path, callback) {
		fis.log.notice('browse ' + path.yellow.bold + '\n');
		var cmd = fis.util.escapeShellArg(path);
		if (fis.util.isWin()) {
			cmd = 'start "" ' + cmd;
		} else {
			if (process.env['XDG_SESSION_COOKIE']) {
				cmd = 'xdg-open ' + cmd;
			} else if (process.env['GNOME_DESKTOP_SESSION_ID']) {
				cmd = 'gnome-open ' + cmd;
			} else {
				cmd = 'open ' + cmd;
			}
		}
		child_process.exec(cmd, callback);
	}

	function getPidFile() {
		return fis.project.getTempPath('server/pid');
	}

	function lanuch(file) {
		var apiPath = commander.api_path,
			proxyUri = commander.proxy_uri;
		apiPath = apiPath ? '--api_path=' + apiPath : '';
		proxyUri = proxyUri ? '--proxy_uri=' + proxyUri : '';

		console.log(apiPath, proxyUri)
		var child_process = spawn(process.execPath, [file, apiPath , proxyUri], {cwd: root});
		child_process.stderr.pipe(process.stderr);
		child_process.stdout.pipe(process.stdout);
		process.stderr.write(' ➜ server is running\n');
		fis.util.write(getPidFile(), child_process.pid);
	}

	function startServer() {

		if (fis.util.exists(root + '/index.js')) {
			lanuch('index.js');
		} else {
			lanuch('.');
		}
	}

	function start() {
// 检测 script 脚本

		//var script = path.join(root, 'server.js');

		//var builtInScript = path.join(__dirname, 'node', 'server.js');

		if (!fis.util.exists(root + 'package.json')) {

			fis.util.copy(__dirname + '/_package.json', root + '/package.json')

		}

		if (!fis.util.exists(root + 'index.js')) {

			fis.util.copy(__dirname + '/_index.js', root + '/index.js')

		}

		var cwd;
		if (fis.util.exists(root + '/server/package.json')) {
			cwd = root + '/server';
		} else if (fis.util.exists(root + '/package.json')) {
			cwd = root;
		}


		if (cwd) {
			console.log('installing deps ...')
			var npm = child_process.exec('npm install', {cwd: cwd});
			npm.stderr.pipe(process.stderr);
			npm.stdout.pipe(process.stdout);
			npm.on('exit', function (code) {
				if (code === 0) {
					startServer();
				} else {
					process.stderr.write('launch server failed\n');
				}
			});
		} else {
			startServer();
		}


		/*if (!fis.util.exists(script)) {
		 fis.util.copy(builtInScript, script);


		 installNpmDependencies(path.join(root, 'package.json'), root, opt.registry, this);
		 } else if (!checkDeps(root)) {
		 installNpmDependencies(path.join(root, 'package.json'), root, opt.registry, this);
		 } else {
		 this();
		 }*/

	}

	function stop(callback) {
		var tmp = getPidFile();
		if (fis.util.exists(tmp)) {
			var pid = fis.util.fs.readFileSync(tmp, 'utf8').trim();
			var list, msg = '';
			var isWin = fis.util.isWin();
			if (isWin) {
				list = spawn('tasklist');
			} else {
				list = spawn('ps', ['-A']);
			}

			list.stdout.on('data', function (chunk) {
				msg += chunk.toString('utf-8').toLowerCase();
			});

			list.on('exit', function () {
				msg.split(/[\r\n]+/).forEach(function (item) {
					var reg = new RegExp('\\bnode\\b', 'i');
					if (reg.test(item)) {
						var iMatch = item.match(/\d+/);
						if (iMatch && iMatch[0] == pid) {
							try {
								process.kill(pid, 'SIGINT');
								process.kill(pid, 'SIGKILL');
							} catch (e) {
							}
							process.stdout.write('shutdown node process [' + iMatch[0] + ']\n');
						}
					}
				});
				fis.util.fs.unlinkSync(tmp);
				if (callback) {
					callback();
				}
			});
		} else {
			if (callback) {
				callback();
			}
		}
	}

};
