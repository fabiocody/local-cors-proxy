import express from 'express';
import request from 'request';
import cors from 'cors';
import chalk from 'chalk';
import {parse, serialize} from '@tinyhttp/cookie';

const proxy = express();

export const startProxy = function (port, proxyUrl, proxyPartial, credentials, origin) {
  proxy.use(cors({credentials: credentials, origin: origin}));
  proxy.options('*', cors({credentials: credentials, origin: origin}));

  // remove trailing slash
  const cleanProxyUrl = proxyUrl.replace(/\/$/, '');
  // remove all forward slashes
  const cleanProxyPartial = proxyPartial.replace(/\//g, '');

  proxy.use(`/${cleanProxyPartial}`, function (req, res) {
    try {
      console.log(chalk.green('Request Proxied -> ' + req.url));
    } catch (e) {}
    req.pipe(
      request(cleanProxyUrl + req.url)
        .on('response', response => {
          // In order to avoid https://github.com/expressjs/cors/issues/134
          const accessControlAllowOriginHeader = response.headers['access-control-allow-origin'];
          if (accessControlAllowOriginHeader && accessControlAllowOriginHeader !== origin) {
            console.log(chalk.blue('Override access-control-allow-origin header from proxified URL : ' + chalk.green(accessControlAllowOriginHeader) + '\n'));
            response.headers['access-control-allow-origin'] = origin;
          }
          let cookieString = (response.headers['set-cookie'] || []).join(';');
          const cookies = parse(cookieString);
          if (cookies['JSESSIONID']) {
            const jSessionIdCookie = serialize('JSESSIONID', cookies['JSESSIONID'], {
              path: '/Synlab',
              httpOnly: true,
              secure: true,
              sameSite: 'None'
            });
            // remove JSESSIONID from cookieString
            cookieString = cookieString.replace(/JSESSIONID=[^;]+;?/g, '');
            // add JSESSIONID to cookieString
            cookieString = cookieString + `;${jSessionIdCookie}`;
            response.headers['set-cookie'] = cookieString;
          }
        }),
    ).pipe(res);
  });

  proxy.listen(port);

  // Welcome Message
  console.log(chalk.bgGreen.black.bold.underline('\n Proxy Active \n'));
  console.log(chalk.blue('Proxy Url: ' + chalk.green(cleanProxyUrl)));
  console.log(chalk.blue('Proxy Partial: ' + chalk.green(cleanProxyPartial)));
  console.log(chalk.blue('PORT: ' + chalk.green(port)));
  console.log(chalk.blue('Credentials: ' + chalk.green(credentials)));
  console.log(chalk.blue('Origin: ' + chalk.green(origin) + '\n'));
  console.log(
    chalk.cyan(
      'To start using the proxy simply replace the proxied part of your url with: ' +
      chalk.bold('http://localhost:' + port + '/' + cleanProxyPartial + '\n'),
    ),
  );
};
