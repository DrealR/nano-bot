/**
 * Chunk - Optimized voxel chunk rendering with instanced meshes
 * Uses greedy meshing for performance and beautiful voxel shaders
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { voxelVertexShader, voxelFragmentShader, voxelDefaultUniforms } from '../shaders';
import type { ChunkData, BlockType, VoxelData } from './WorldGenerator';
import { BLOCK_MATERIALS, BlockType as BT } from './WorldGenerator';

export interface ChunkProps {
  position: [number, number, number];
  voxelData: ChunkData;
  visible?: boolean;
  theme?: {
    primaryColor: [number, number, number];
    secondaryColor: [number, number, number];
    fogColor: [number, number, number];
  };
}

interface MeshData {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
  aos: number[];
  emissives: number[];
  indices: number[];
}

interface GreedyRect {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  type: BlockType;
  ao: number;
  normal: [number, number, number];
}

/**
 * Greedy meshing algorithm - combines adjacent same-type faces
 */
function greedyMesh(voxels: VoxelData[][][], chunkSize: number): MeshData {
  const meshData: MeshData = {
    positions: [],
    normals: [],
    uvs: [],
    colors: [],
    aos: [],
    emissives: [],
    indices: [],
  };

  let vertexCount = 0;

  // Process each axis (x, y, z) and each direction (+/-)
  const directions = [
    { axis: 0, dir: 1, u: 1, v: 2 },  // +X
    { axis: 0, dir: -1, u: 1, v: 2 }, // -X
    { axis: 1, dir: 1, u: 0, v: 2 },  // +Y
    { axis: 1, dir: -1, u: 0, v: 2 }, // -Y
    { axis: 2, dir: 1, u: 0, v: 1 },  // +Z
    { axis: 2, dir: -1, u: 0, v: 1 }, // -Z
  ];

  for (const { axis, dir, u, v } of directions) {
    const mask: (VoxelData | null)[][] = [];

    // Initialize mask
    for (let i = 0; i < chunkSize; i++) {
      mask[i] = [];
      for (let j = 0; j < chunkSize; j++) {
        mask[i][j] = null;
      }
    }

    // Build mask for this direction
    for (let d = -1; d < chunkSize; d++) {
      for (let i = 0; i < chunkSize; i++) {
        for (let j = 0; j < chunkSize; j++) {
          const pos = [0, 0, 0];
          pos[axis] = d;
          pos[u] = i;
          pos[v] = j;

          const [x, y, z] = pos;

          // Check current and neighbor voxel
          const current = (x >= 0 && x < chunkSize && y >= 0 && y < chunkSize && z >= 0 && z < chunkSize)
            ? voxels[x][y][z]
            : null;

          const neighborPos = [...pos];
          neighborPos[axis] += dir;
          const [nx, ny, nz] = neighborPos;

          const neighbor = (nx >= 0 && nx < chunkSize && ny >= 0 && ny < chunkSize && nz >= 0 && nz < chunkSize)
            ? voxels[nx][ny][nz]
            : null;

          // Determine if we need a face here
          const currentSolid = current && current.type !== BT.AIR;
          const neighborSolid = neighbor && neighbor.type !== BT.AIR;

          if (currentSolid && !neighborSolid) {
            mask[i][j] = current;
          } else {
            mask[i][j] = null;
          }
        }
      }

      // Generate mesh from mask using greedy algorithm
      for (let i = 0; i < chunkSize; i++) {
        for (let j = 0; j < chunkSize; ) {
          if (mask[i][j]) {
            const voxel = mask[i][j]!;

            // Compute width
            let width = 1;
            while (j + width < chunkSize &&
                   mask[i][j + width] &&
                   mask[i][j + width]!.type === voxel.type) {
              width++;
            }

            // Compute height
            let height = 1;
            let done = false;
            while (i + height < chunkSize && !done) {
              for (let k = 0; k < width; k++) {
                if (!mask[i + height][j + k] ||
                    mask[i + height][j + k]!.type !== voxel.type) {
                  done = true;
                  break;
                }
              }
              if (!done) height++;
            }

            // Create quad for this rect
            const rect: GreedyRect = {
              x: 0,
              y: 0,
              z: d + (dir > 0 ? 1 : 0),
              width,
              height,
              type: voxel.type,
              ao: voxel.ao,
              normal: [0, 0, 0] as [number, number, number],
            };

            rect[['x', 'y', 'z'][axis] as 'x' | 'y' | 'z'] = d + (dir > 0 ? 1 : 0);
            rect[['x', 'y', 'z'][u] as 'x' | 'y' | 'z'] = i;
            rect[['x', 'y', 'z'][v] as 'x' | 'y' | 'z'] = j;

            const normal = [0, 0, 0];
            normal[axis] = dir;
            rect.normal = normal as [number, number, number];

            addQuad(meshData, rect, u, v, axis, vertexCount);
            vertexCount += 4;

            // Clear mask
            for (let h = 0; h < height; h++) {
              for (let w = 0; w < width; w++) {
                mask[i + h][j + w] = null;
              }
            }

            j += width;
          } else {
            j++;
          }
        }
      }
    }
  }

  return meshData;
}

/**
 * Add a quad to the mesh data
 */
function addQuad(
  meshData: MeshData,
  rect: GreedyRect,
  u: number,
  v: number,
  axis: number,
  vertexOffset: number
): void {
  const { x, y, z, width, height, type, ao, normal } = rect;

  const material = BLOCK_MATERIALS[type];
  const [r, g, b] = material.color;
  const emissive = material.emissive;

  // Calculate vertex positions
  const du = [0, 0, 0];
  const dv = [0, 0, 0];
  du[u] = width;
  dv[v] = height;

  // Four corners of the quad
  const v0 = [x, y, z];
  const v1 = [x + du[0], y + du[1], z + du[2]];
  const v2 = [x + du[0] + dv[0], y + du[1] + dv[1], z + du[2] + dv[2]];
  const v3 = [x + dv[0], y + dv[1], z + dv[2]];

  // Add vertices
  meshData.positions.push(...v0, ...v1, ...v2, ...v3);

  // Add normals (same for all 4 vertices)
  for (let i = 0; i < 4; i++) {
    meshData.normals.push(...normal);
  }

  // Add UVs
  meshData.uvs.push(
    0, 0,
    width, 0,
    width, height,
    0, height
  );

  // Add colors
  for (let i = 0; i < 4; i++) {
    meshData.colors.push(r, g, b);
  }

  // Add AO
  for (let i = 0; i < 4; i++) {
    meshData.aos.push(ao);
  }

  // Add emissive flag
  for (let i = 0; i < 4; i++) {
    meshData.emissives.push(emissive);
  }

  // Add indices (two triangles)
  meshData.indices.push(
    vertexOffset, vertexOffset + 1, vertexOffset + 2,
    vertexOffset, vertexOffset + 2, vertexOffset + 3
  );
}

/**
 * Chunk component - renders optimized voxel geometry
 */
export const Chunk: React.FC<ChunkProps> = React.memo(({ position, voxelData, visible = true, theme }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate optimized mesh using greedy meshing
  const geometry = useMemo(() => {
    const meshData = greedyMesh(voxelData.voxels, voxelData.voxels.length);

    const geo = new THREE.BufferGeometry();

    // Set attributes
    geo.setAttribute('position', new THREE.Float32BufferAttribute(meshData.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(meshData.uvs, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(meshData.colors, 3));
    geo.setAttribute('ao', new THREE.Float32BufferAttribute(meshData.aos, 1));
    geo.setAttribute('emissive', new THREE.Float32BufferAttribute(meshData.emissives, 1));

    // Set indices
    geo.setIndex(meshData.indices);

    // Compute bounding box/sphere for frustum culling
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    return geo;
  }, [voxelData]);

  // Shader uniforms
  const uniforms = useMemo(() => {
    const baseUniforms = {
      ...voxelDefaultUniforms,
      time: { value: 0 },
      sunDirection: { value: new THREE.Vector3(0.5, 1.0, 0.5).normalize() },
      sunColor: { value: new THREE.Vector3(1.0, 0.95, 0.8) },
      skyColor: { value: new THREE.Vector3(0.5, 0.7, 1.0) },
      ambientColor: {
        value: theme
          ? new THREE.Vector3(...theme.primaryColor).multiplyScalar(0.2)
          : new THREE.Vector3(0.2, 0.2, 0.3),
      },
      fogDensity: { value: 0.5 },
      fogNear: { value: 50 },
      fogFar: { value: 200 },
      fogColor: {
        value: theme
          ? new THREE.Vector3(...theme.fogColor)
          : new THREE.Vector3(0.1, 0.1, 0.15),
      },
      shadowSoftness: { value: 0.1 },
    };

    return baseUniforms;
  }, [theme]);

  // Animate shader uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  if (!visible) return null;

  const chunkSize = voxelData.voxels.length;
  const worldPosition: [number, number, number] = [
    position[0] * chunkSize,
    position[1] * chunkSize,
    position[2] * chunkSize,
  ];

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={worldPosition}
      frustumCulled={true}
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={voxelVertexShader}
        fragmentShader={voxelFragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
        transparent={false}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
});

Chunk.displayName = 'Chunk';

export default Chunk;
