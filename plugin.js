import { writeFileSync } from 'node:fs';
import anylogger from 'anylogger';
import ulog from 'ulog';

const log = anylogger('drone-mvn-auth');
log.debug(ulog.levels);

const generateServer = (server) => `<server><id>${server.id}</id><username>${server.username}</username><password>${server.password}</password></server>`;

const generateRepository = (type) => (repo) => `<${type}><id>${repo.id}</id><name>${repo.name}</name><url>${repo.url}</url><layout>${repo.layout}</layout></${type}>`;

const generateProfile = (profile) => `<profile><id>${profile.id}</id><repositories>${profile.hasOwnProperty('repositories') ? profile.repositories.map(generateRepository('repository')).join('') : ''}</repositories><pluginRepositories>${profile.hasOwnProperty('plugin_repositories') ? profile.plugin_repositories
  .map(generateRepository('pluginRepository')).join('') : ''}</pluginRepositories></profile>`;

const generateActiveProfile = (profile) => `<activeProfile>${profile}</activeProfile>`;

const parseParam = (param) => {
  let config = [];
  let env = process.env[`PLUGIN_${param.toUpperCase()}`];
  if (!env) env = process.env[`MAVEN_${param.toUpperCase()}`];

  if (env) {
    if (param === 'active_profiles') {
      config = env.split(',');
    } else {
      try {
        config = JSON.parse(env);
      } catch (ignore) {
        log.error(`-- Error: cannot parse ${param} data`);
        process.exit(1);
      }
    }
  }
  log.debug(`-- Found ${param}: ${config.length}`);

  return config;
};

export default init() {
  log.info('-- Preparing Maven for authentication...');

  const config = ['servers', 'profiles', 'active_profiles'].reduce((
    acc,
    val,
  ) => {
    acc[val] = parseParam(val);
    return acc;
  }, {});

  const data = `<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
    <localRepository>${process.env.PWD}/.m2</localRepository>
    <servers>${config.servers.map(generateServer).join('')}</servers>
    <profiles>${config.profiles.map(generateProfile).join('')}</profiles>
    <activeProfiles>${config.active_profiles.map(generateActiveProfile).join('')}</activeProfiles>
  </settings>`;
  try {
    writeFileSync('settings.xml', data);
    log.info('-- Maven authentication done!');
  } catch (ignore) {
    log.error('-- Error: cannot write file');
    return process.exit(1);
  }
  return process.exit(0);
};
