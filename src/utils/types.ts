export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Values<T extends object> = Prettify<T[keyof T]>;

export type Concrete<T extends object> = {
  [K in keyof T]-?: T[K]
}

export type Result<T> =
  | { success: true, result: T }
  | { success: false, result: null }

export type Range = [number, number]
