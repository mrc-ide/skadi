export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Values<T extends object> = Prettify<T[keyof T]>;

export type Concrete<T extends object> = Prettify<{
  [K in keyof T]-?: T[K]
}>

export type Result<T> =
  | { success: true, result: T }
  | { success: false, result: null }

export type Range = [number, number]

export type ReadOnly<T extends object> = {
  readonly [K in keyof T]: T[K]
}
