export function convert(value: string): string;
export function convert(value: number): number;
export function convert(value: string | number): string | number {
  return value;
}

export interface Settings {
  name: string;
}

export interface Settings {
  count: number;
}

export class Converter {
  convert(value: string): string;
  convert(value: number): number;
  convert(value: string | number): string | number {
    return value;
  }
}

export function currentProcess(): NodeJS.Process {
  return process;
}

export interface Token {
  value: string;
}

export const Token = 'token';
