import { Router } from 'express';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  baseRoute: string;
}

export interface BackendPlugin {
  manifest: PluginManifest;
  router: Router;
  initialize?: () => Promise<void>;
}

