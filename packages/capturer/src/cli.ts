#!/usr/bin/env node

import { CapturerApp } from './App';
import { CapturerConfig } from './Config';

new CapturerApp(new CapturerConfig()).start().catch(e => {
  console.error(e);
  process.exit(1);
});
