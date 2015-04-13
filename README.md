
# sulky-command-server

Fork from fis's repo

## Usage

```
  $ sulky server

  Usage: server <command> [options]

  Commands:

    start                  start server
    open                   open document root directory
    clean                  clean files in document root

  Options:

    -h, --help            output usage information
    -a,--api_path <path>  要代理的路径 - 将/api/xxx的请求转发到proxy_uri中的xxx
    -p,--proxy_uri <uri>  代理路径 - http://api.server.com/v2/xxx

```
