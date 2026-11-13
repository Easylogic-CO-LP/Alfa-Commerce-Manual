export type Template = {
  type: string;
  label: string;
  group: string;
  element: string;
  mode: 'names' | 'global';
  guide: string;
  demo: string;
  starter: string;
  todo: [string, string][];
  manual: string;
  files: Record<string, string>;
};

export type Input = {
  name: string;
  element: string;
  vendor: string;
  author?: string;
  authorEmail?: string;
  authorUrl?: string;
  copyright?: string;
  license?: string;
  version: string;
  description?: string;
  creationDate: string;
  alfaVersion?: string;
};

export const TESTED_AGAINST: string;
export function elementFrom(name: string): string;
export function vendorFrom(name: string): string;
export function problems(template: Template, input: Input): string[];
export function generate(template: Template, input: Input): Record<string, string>;
export function zipName(template: Template, input: Input): string;
export function zip(files: Record<string, string>, date?: Date): Uint8Array;
