import { UnisonComponent } from '../../components/UnisonComponent';
import { Mesh } from '../Mesh';

// Material, Geometry
export class MeshComponent extends UnisonComponent<Mesh> {
  constructor() {
    super(
      (a, b) => a.geometryId === b.geometryId && a.materialId === b.materialId,
      ({ geometryId, materialId }) => geometryId * 31 + materialId,
    );
  }
}
