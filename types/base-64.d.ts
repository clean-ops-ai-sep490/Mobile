declare module "base-64" {
  export function encode(input: string): string;
  export function decode(input: string): string;

  export const atob: (input: string) => string;
  export const btoa: (input: string) => string;
}
