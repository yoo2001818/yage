import { Component } from '../components';

export type ValueIsComponent<T> = Record<keyof T, Component<any>>;
export type ValueOfComponent<T> = T extends Component<infer D> ? D : never;
export type EntityData<T> = { [K in keyof T]?: ValueOfComponent<T[K]> };
export type EntitySerialized<T> = { [K in keyof T]?: unknown };
