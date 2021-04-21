import { getConfig } from './config';
import { start } from './index';

const config = getConfig();
start(config);
