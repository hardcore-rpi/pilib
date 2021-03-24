#!/usr/bin/env node

import { startRpiWsUart } from './index';

const cfg = {
  port: +(process.env.PORT || '8080'),
  uart: {
    com: process.env.UART_COM || '/dev/ttyUSB0',
    baudRate: +(process.env.UART_BAUD_RATE || '115200'),
  },
};

startRpiWsUart(cfg);
