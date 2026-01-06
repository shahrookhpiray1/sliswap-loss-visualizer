// src/services/endlessClient.ts
import { Endless, EndlessConfig, Network } from '@endlesslab/endless-ts-sdk';

const config = new EndlessConfig({ network: Network.MAINNET });
export const endlessClient = new Endless(config);