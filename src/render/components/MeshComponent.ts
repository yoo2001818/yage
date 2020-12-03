import { UnisonComponent } from '../../components/UnisonComponent';

// Material, Geometry
export class MeshComponent extends UnisonComponent<[number, number]> {
  constructor() {
    super(
      (a, b) => a[0] === b[0] && a[1] === b[1],
      ([vid, gid]) => vid * 31 + gid,
    );
  }
}
