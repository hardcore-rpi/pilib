#!/usr/bin/env node

import * as dotenv from 'dotenv';
import { CapturerApp } from './App';
import { CapturerConfig } from './Config';

dotenv.config();

new CapturerApp(new CapturerConfig()).start().catch(e => {
  console.error(e);
  process.exit(1);
});
