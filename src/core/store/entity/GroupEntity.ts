import { Entity } from './EntityInterface';
import { Component } from '../../components/Component';

import { ValueIsComponent } from '../types';

export class GroupEntity<D extends ValueIsComponent<D> = any>
implements Entity<D> {

}
