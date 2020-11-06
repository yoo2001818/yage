export interface Camera {
  type: 'perspective' | 'orthgonal',
  near: number,
  far: number,
  fov: number,
}
