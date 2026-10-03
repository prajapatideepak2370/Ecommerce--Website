import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { splitGeometryByPlane } from "../../utils/jellyGeometry.js";

function makeJellyMaterial(colorMode, customColor, originalColor) {
  const colors = {
    original: originalColor || "#ffffff",
    clear: "#f4fbff",
    soft: "#f2b3cf",
    dark: "#43364f",
    custom: customColor,
  };
  return new THREE.MeshPhysicalMaterial({
    color: colors[colorMode] || colors.original,
    roughness: colorMode === "clear" ? 0.1 : 0.2,
    metalness: 0,
    transmission: colorMode === "clear" ? 0.45 : 0.22,
    thickness: 0.8,
    ior: 1.33,
    transparent: true,
    opacity: colorMode === "clear" ? 0.48 : 0.86,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    emissive: colors[colorMode] || colors.original,
    emissiveIntensity: 0.08,
  });
}

function JellyPiece({
  piece,
  colorMode,
  customColor,
  originalColor,
  firmness,
  damping,
  tool,
  paused,
  resetKey,
  nudgeKey,
  wireframe,
  onCut,
  onDrop,
  onGrabChange,
  onStroke,
}) {
  const meshRef = useRef();
  const dragRef = useRef(null);
  const lastNudgeRef = useRef(nudgeKey);
  const motionRef = useRef({
    position: [...piece.position],
    velocity: [...(piece.velocity || [0, 0, 0])],
    rotation: [...piece.rotation],
    angularVelocity: [0, 0, 0],
    released: Boolean(piece.velocity),
  });
  const smoothedVelocityRef = useRef(new THREE.Vector3());
  const smoothedKnifeRef = useRef(new THREE.Vector3());
  const material = useMemo(
    () => makeJellyMaterial(colorMode, customColor, originalColor),
    [colorMode, customColor, originalColor],
  );
  const origin = useMemo(() => {
    const pos = piece.geometry.getAttribute("position");
    return new Float32Array(pos.array);
  }, [piece.geometry, resetKey]);
  const velocity = useMemo(() => new Float32Array(origin.length), [origin]);

  useEffect(() => {
    motionRef.current.position = [...piece.position];
    motionRef.current.velocity = [...(piece.velocity || [0, 0, 0])];
    motionRef.current.rotation = [...(piece.rotation || [0, 0, 0])];
    motionRef.current.angularVelocity = [...(piece.angularVelocity || [0, 0, 0])];
    motionRef.current.released = Boolean(piece.velocity);
  }, [piece.position, piece.velocity, piece.rotation, piece.angularVelocity]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh || paused) return;
    const geometry = mesh.geometry;
    const position = geometry.getAttribute("position");
    const dt = Math.min(delta, 1 / 30);
    const spring = THREE.MathUtils.lerp(2.5, 16, firmness);
    const dampingFactor = THREE.MathUtils.lerp(0.985, 0.86, damping);
    const drag = dragRef.current;
    const pointer = drag?.point;
    const grabRadius = 0.42;
    const radiusSq = grabRadius * grabRadius;
    if (lastNudgeRef.current !== nudgeKey) {
      lastNudgeRef.current = nudgeKey;
      for (let index = 0; index < velocity.length; index += 3) {
        velocity[index] += (Math.random() - 0.5) * 2.2;
        velocity[index + 1] += 1.5 + Math.random();
        velocity[index + 2] += (Math.random() - 0.5) * 2.2;
      }
    }

    if (pointer && drag?.kind === "knife") {
      smoothedKnifeRef.current.lerp(pointer, 0.55);
    }

    for (let index = 0; index < position.count; index += 1) {
      const offset = index * 3;
      let x = position.array[offset];
      let y = position.array[offset + 1];
      let z = position.array[offset + 2];
      let vx = velocity[offset];
      let vy = velocity[offset + 1];
      let vz = velocity[offset + 2];
      const ox = origin[offset];
      const oy = origin[offset + 1];
      const oz = origin[offset + 2];

      vx += (ox - x) * spring * dt;
      vy += (oy - y) * spring * dt;
      vz += (oz - z) * spring * dt;

      if (pointer && drag?.kind === "hand") {
        const dx = x - drag.anchor.x;
        const dy = y - drag.anchor.y;
        const dz = z - drag.anchor.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const gaussWeight = Math.exp(-distSq / radiusSq);
        const dist = Math.sqrt(distSq);
        const pinchFalloff = Math.max(0, 1 - dist / grabRadius);
        const pinchWeight = pinchFalloff * pinchFalloff * (3 - 2 * pinchFalloff);
        const totalWeight = 0.55 * gaussWeight + 0.45 * pinchWeight;
        const moveX = pointer.x - drag.anchor.x;
        const moveY = pointer.y - drag.anchor.y;
        const moveZ = pointer.z - drag.anchor.z;
        vx += moveX * totalWeight * 34 * dt;
        vy += moveY * totalWeight * 34 * dt;
        vz += moveZ * totalWeight * 34 * dt;
        const pinchStrength = 0.18 * pinchWeight * totalWeight;
        vx -= dx * pinchStrength * 12 * dt;
        vy -= dy * pinchStrength * 12 * dt;
        vz -= dz * pinchStrength * 12 * dt;
      } else if (pointer && drag?.kind === "knife") {
        const kdx = x - smoothedKnifeRef.current.x;
        const kdy = y - smoothedKnifeRef.current.y;
        const kdz = z - smoothedKnifeRef.current.z;
        const kDistSq = kdx * kdx + kdy * kdy + kdz * kdz;
        const knifeRadius = 0.08;
        if (kDistSq < knifeRadius * knifeRadius) {
          const kWeight = Math.exp(-kDistSq / (knifeRadius * knifeRadius * 0.5));
          vx += (smoothedKnifeRef.current.x - drag.anchor.x) * kWeight * 8 * dt;
          vy += (smoothedKnifeRef.current.y - drag.anchor.y) * kWeight * 8 * dt;
          vz += (smoothedKnifeRef.current.z - drag.anchor.z) * kWeight * 8 * dt;
        }
      } else if (!drag) {
        const wobble = Math.sin(state.clock.elapsedTime * 7 + index * 0.02) * 0.002;
        vx += wobble;
      }

      vx *= dampingFactor;
      vy *= dampingFactor;
      vz *= dampingFactor;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;

      velocity[offset] = vx;
      velocity[offset + 1] = vy;
      velocity[offset + 2] = vz;
      position.array[offset] = x;
      position.array[offset + 1] = y;
      position.array[offset + 2] = z;
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    const motion = motionRef.current;
    if (piece.isCut || motion.released) {
      motion.velocity[1] -= 4.8 * dt;
      for (let axis = 0; axis < 3; axis += 1) {
        motion.position[axis] += motion.velocity[axis] * dt;
        motion.rotation[axis] += motion.angularVelocity[axis] * dt;
      }
      const floor = -1.02 - piece.geometry.boundingBox.min.y;
      if (motion.position[1] < floor) {
        motion.position[1] = floor;
        if (motion.velocity[1] < -0.05) {
          motion.velocity[1] = Math.abs(motion.velocity[1]) * 0.35;
        } else {
          motion.velocity[1] = 0;
        }
        motion.velocity[0] *= 0.72;
        motion.velocity[2] *= 0.72;
        motion.angularVelocity[0] *= 0.78;
        motion.angularVelocity[1] *= 0.78;
        motion.angularVelocity[2] *= 0.78;
      }
      mesh.position.set(
        motion.position[0],
        motion.position[1],
        motion.position[2],
      );
      mesh.rotation.set(
        motion.rotation[0],
        motion.rotation[1],
        motion.rotation[2],
      );
    } else {
      mesh.position.set(
        motion.position[0],
        motion.position[1],
        motion.position[2],
      );
      mesh.rotation.set(
        motion.rotation[0],
        motion.rotation[1],
        motion.rotation[2],
      );
    }
  });

  const localPoint = (event) =>
    meshRef.current.worldToLocal(event.point.clone());
  const pointerOnDragPlane = (event, drag) => {
    const worldPoint = new THREE.Vector3();
    if (!event.ray.intersectPlane(drag.plane, worldPoint)) return null;
    return worldPoint;
  };

  return (
    <mesh
      ref={meshRef}
      geometry={piece.geometry}
      position={piece.position}
      rotation={piece.rotation}
      castShadow
      receiveShadow
      onPointerDown={(event) => {
        event.stopPropagation();
        event.target.setPointerCapture?.(event.pointerId);
        const hit = localPoint(event);
        const motion = motionRef.current;
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
          event.camera.getWorldDirection(new THREE.Vector3()),
          event.point,
        );
        const now = performance.now();
        smoothedVelocityRef.current.set(0, 0, 0);
        if (tool === "hand") {
          motion.released = false;
          motion.velocity = [0, 0, 0];
          motion.angularVelocity = [0, 0, 0];
          dragRef.current = {
            kind: "hand",
            anchor: hit.clone(),
            point: hit.clone(),
            anchorWorld: event.point.clone(),
            initialPosition: [...motion.position],
            initialRotation: [...motion.rotation],
            previousWorld: event.point.clone(),
            previousTime: now,
            plane,
            velocityHistory: [],
            lastGrabWorld: event.point.clone(),
            lastGrabRotationOffset: new THREE.Vector3(),
          };
          smoothedKnifeRef.current.copy(hit);
          onGrabChange(true);
        } else {
          dragRef.current = {
            kind: "knife",
            anchor: hit.clone(),
            point: hit.clone(),
            plane,
            screenStart: [event.nativeEvent.clientX, event.nativeEvent.clientY],
            screenEnd: [event.nativeEvent.clientX, event.nativeEvent.clientY],
            screenPoints: [[event.nativeEvent.clientX, event.nativeEvent.clientY]],
          };
          smoothedKnifeRef.current.copy(hit);
          onGrabChange(true);
          onStroke(dragRef.current.screenStart, dragRef.current.screenEnd);
        }
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        if (drag.kind === "hand") {
          const worldPoint = pointerOnDragPlane(event, drag);
          if (!worldPoint) return;
          const now = performance.now();
          const dtMs = Math.max(8, now - drag.previousTime);
          const delta = worldPoint.clone().sub(drag.anchorWorld);
          const motion = motionRef.current;
          motion.position = [
            drag.initialPosition[0] + delta.x,
            drag.initialPosition[1] + delta.y,
            drag.initialPosition[2] + delta.z,
          ];
          const lateral = Math.sqrt(delta.x * delta.x + delta.z * delta.z);
          const verticalSign = delta.y > 0 ? 1 : -1;
          const tiltX = -delta.z * 0.45;
          const tiltZ = delta.x * 0.45 + lateral * verticalSign * 0.15;
          motion.rotation = [
            drag.initialRotation[0] + tiltX,
            drag.initialRotation[1],
            drag.initialRotation[2] + tiltZ,
          ];
          meshRef.current.position.set(...motion.position);
          meshRef.current.rotation.set(...motion.rotation);
          meshRef.current.updateMatrixWorld(true);
          const localDelta = meshRef.current
            .worldToLocal(worldPoint.clone())
            .sub(meshRef.current.worldToLocal(drag.anchorWorld.clone()));
          drag.point.copy(drag.anchor).add(localDelta);
          const instantVel = worldPoint
            .clone()
            .sub(drag.previousWorld)
            .multiplyScalar(1000 / dtMs);
          drag.velocityHistory.push({ v: instantVel, t: now });
          const cutoff = now - 90;
          while (drag.velocityHistory.length && drag.velocityHistory[0].t < cutoff) {
            drag.velocityHistory.shift();
          }
          if (drag.velocityHistory.length) {
            const alpha = 0.32;
            smoothedVelocityRef.current.lerp(instantVel, alpha);
            const avg = new THREE.Vector3();
            for (const entry of drag.velocityHistory) avg.add(entry.v);
            avg.multiplyScalar(1 / drag.velocityHistory.length);
            smoothedVelocityRef.current.lerp(avg, 0.5);
            const wx = (tiltZ - drag.lastGrabRotationOffset.z) * (1000 / dtMs);
            const wz = -(tiltX - drag.lastGrabRotationOffset.x) * (1000 / dtMs);
            motion.angularVelocity = [
              THREE.MathUtils.lerp(motion.angularVelocity[0], wz * 0.06, 0.35),
              THREE.MathUtils.lerp(motion.angularVelocity[1], 0, 0.3),
              THREE.MathUtils.lerp(motion.angularVelocity[2], wx * 0.06, 0.35),
            ];
            drag.lastGrabRotationOffset.set(tiltX, 0, tiltZ);
          }
          drag.previousWorld.copy(worldPoint);
          drag.lastGrabWorld.copy(worldPoint);
          drag.previousTime = now;
        } else {
          const nowMs = performance.now();
          drag.screenEnd = [
            event.nativeEvent.clientX,
            event.nativeEvent.clientY,
          ];
          drag.screenPoints.push([event.nativeEvent.clientX, event.nativeEvent.clientY, nowMs]);
          while (drag.screenPoints.length > 18) drag.screenPoints.shift();
          const worldPoint = pointerOnDragPlane(event, drag);
          if (worldPoint) {
            const localPointVal = meshRef.current.worldToLocal(worldPoint);
            drag.point.lerp(localPointVal, 0.8);
            smoothedKnifeRef.current.lerp(drag.point, 0.9);
          }
          if (drag.screenPoints.length >= 2) {
            const recent = drag.screenPoints.slice(-8);
            const sx = recent.reduce((s, p) => s + p[0], 0) / recent.length;
            const sy = recent.reduce((s, p) => s + p[1], 0) / recent.length;
            onStroke(
              [drag.screenStart[0], drag.screenStart[1]],
              [sx, sy],
            );
          } else {
            onStroke(drag.screenStart, drag.screenEnd);
          }
        }
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        if (!drag) return;
        event.stopPropagation();
        if (drag.kind === "knife") {
          const pts = drag.screenPoints?.length >= 3 ? drag.screenPoints : [
            [...drag.screenStart, 0],
            [...drag.screenEnd, 1],
          ];
          const smoothed = pts.length > 2
            ? (() => {
                const tail = pts.slice(-Math.min(12, pts.length));
                const head = pts.slice(0, Math.min(12, pts.length));
                const sx = head.reduce((s, p) => s + p[0], 0) / head.length;
                const sy = head.reduce((s, p) => s + p[1], 0) / head.length;
                const ex = tail.reduce((s, p) => s + p[0], 0) / tail.length;
                const ey = tail.reduce((s, p) => s + p[1], 0) / tail.length;
                return { sx, sy, ex, ey };
              })()
            : {
                sx: drag.screenStart[0],
                sy: drag.screenStart[1],
                ex: drag.screenEnd[0],
                ey: drag.screenEnd[1],
              };
          const dx = smoothed.ex - smoothed.sx;
          const dy = smoothed.ey - smoothed.sy;
          const length = Math.hypot(dx, dy);
          if (length > 18) {
            const point = drag.anchor.clone().lerp(drag.point, 0.5);
            const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(
              event.camera.quaternion,
            );
            const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
              event.camera.quaternion,
            );
            const worldNormal = cameraRight
              .multiplyScalar(-dy)
              .add(cameraUp.multiplyScalar(dx))
              .normalize();
            const worldPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
              worldNormal,
              meshRef.current.localToWorld(point.clone()),
            );
            const plane = worldPlane.applyMatrix4(
              meshRef.current.matrixWorld.clone().invert(),
            );
            const split = splitGeometryByPlane(meshRef.current.geometry, plane);
            if (split) {
              onCut(
                piece.id,
                split,
                worldNormal,
                meshRef.current.position.toArray(),
                meshRef.current.rotation.toArray(),
              );
            }
          }
          onStroke(null, null);
          onGrabChange(false);
        } else {
          let releaseVelocity = smoothedVelocityRef.current.clone();
          if (drag.velocityHistory?.length) {
            const recent = drag.velocityHistory.slice(-Math.min(8, drag.velocityHistory.length));
            const avg = new THREE.Vector3();
            for (const entry of recent) avg.add(entry.v);
            avg.multiplyScalar(1 / recent.length);
            releaseVelocity.lerp(avg, 0.55);
          }
          const velScale = 0.82;
          const maxSpeed = 4.5;
          const speed = releaseVelocity.length();
          if (speed > maxSpeed) releaseVelocity.multiplyScalar(maxSpeed / speed);
          motionRef.current.velocity = [
            releaseVelocity.x * velScale,
            releaseVelocity.y * velScale,
            releaseVelocity.z * velScale,
          ];
          motionRef.current.rotation = meshRef.current.rotation.toArray();
          const ang = motionRef.current.angularVelocity;
          motionRef.current.angularVelocity = [
            THREE.MathUtils.clamp(ang[0], -2.5, 2.5),
            THREE.MathUtils.clamp(ang[1], -2, 2),
            THREE.MathUtils.clamp(ang[2], -2.5, 2.5),
          ];
          motionRef.current.released = true;
          onDrop(
            piece.id,
            [...motionRef.current.position],
            [...motionRef.current.velocity],
            meshRef.current.rotation.toArray(),
            [...motionRef.current.angularVelocity],
          );
          onGrabChange(false);
        }
        dragRef.current = null;
        event.target.releasePointerCapture?.(event.pointerId);
      }}
      onPointerCancel={() => {
        if (dragRef.current) {
          dragRef.current = null;
          onStroke(null, null);
          onGrabChange(false);
        }
      }}
    >
      <primitive
        object={material}
        attach="material"
        color={material.color}
        side={THREE.DoubleSide}
        wireframe={wireframe}
      />
    </mesh>
  );
}

function ModelGeometryProvider({ modelUrl, ...props }) {
  const { scene } = useGLTF(modelUrl, false, false);
  const geometry = useMemo(() => {
    scene.updateMatrixWorld(true);
    const parts = [];
    const bounds = new THREE.Box3();
    let usesZUpCoordinates = false;

    scene.traverse((object) => {
      if (!object.isMesh || !object.geometry?.getAttribute("position")) {
        return;
      }
      const sourceBounds = new THREE.Box3().setFromObject(object);
      const sourceSize = sourceBounds.getSize(new THREE.Vector3());
      if (
        /ground|floor|backdrop|background|stage/i.test(
          `${object.name} ${object.material?.name || ""}`,
        ) &&
        sourceSize.x > 1 &&
        sourceSize.y > 1 &&
        sourceSize.z < Math.min(sourceSize.x, sourceSize.y) * 0.08
      ) {
        usesZUpCoordinates = true;
      }
    });

    scene.traverse((object) => {
      if (
        !object.isMesh ||
        !object.geometry?.getAttribute("position") ||
        /ground|floor|backdrop|background|stage/i.test(
          `${object.name} ${object.material?.name || ""}`,
        )
      ) {
        return;
      }
      const part = object.geometry.clone().toNonIndexed();
      part.applyMatrix4(object.matrixWorld);
      if (usesZUpCoordinates) {
        part.applyMatrix4(
          new THREE.Matrix4().makeRotationX(-Math.PI / 2),
        );
      }
      part.computeBoundingBox();
      bounds.union(part.boundingBox);
      parts.push(part);
    });
    if (!parts.length) throw new Error("The product model contains no mesh.");

    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 1.55 / (Math.max(size.x, size.y, size.z) || 1);
    const positions = [];
    const uvs = [];
    for (const part of parts) {
      const position = part.getAttribute("position");
      const uv = part.getAttribute("uv");
      for (let index = 0; index < position.count; index += 1) {
        positions.push(
          (position.getX(index) - center.x) * scale,
          (position.getY(index) - center.y) * scale,
          (position.getZ(index) - center.z) * scale,
        );
        uvs.push(uv?.getX(index) || 0, uv?.getY(index) || 0);
      }
      part.dispose();
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    merged.computeVertexNormals();
    merged.computeBoundingSphere();
    return merged;
  }, [scene]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return <JellyWorld {...props} initialGeometry={geometry} />;
}

function StudioEnvironment() {
  return (
    <>
      <color attach="background" args={["#e8e5df"]} />
      <fog attach="fog" args={["#e8e5df", 7, 14]} />
      <ambientLight intensity={1.5} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 1, -2]} intensity={18} color="#a8c9ff" />
      <pointLight position={[2, 2, 3]} intensity={10} color="#ffd6e8" />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#f4f1eb" roughness={0.78} />
      </mesh>
    </>
  );
}

function JellyWorld(props) {
  const orbitRef = useRef();
  const [knifeCutting, setKnifeCutting] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const makeInitialGeometry = () => {
    const geometry = props.initialGeometry.clone();
    geometry.computeBoundingBox();
    return geometry;
  };
  const [pieces, setPieces] = useState(() => [
    {
      id: 0,
      geometry: makeInitialGeometry(),
      position: [0, 0.1, 0],
      rotation: [0, 0, 0],
      angularVelocity: [0, 0, 0],
    },
  ]);
  const piecesRef = useRef(pieces);

  useEffect(() => {
    props.onPieceCount?.(pieces.length);
  }, [pieces.length, props.onPieceCount]);

  useEffect(() => {
    const resetGeometry = makeInitialGeometry();
    piecesRef.current.forEach((piece) => piece.geometry.dispose());
    const resetPieces = [
      {
        id: 0,
        geometry: resetGeometry,
        position: [0, 0.1, 0],
        rotation: [0, 0, 0],
        angularVelocity: [0, 0, 0],
      },
    ];
    piecesRef.current = resetPieces;
    setPieces(resetPieces);
  }, [props.resetKey, props.initialGeometry]);

  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);
  useEffect(() => () => {
    piecesRef.current.forEach((piece) => piece.geometry.dispose());
  }, []);

  const cutPiece = (id, split, direction, position, rotation) => {
    const sourcePieces = piecesRef.current;
    if (sourcePieces.length >= 14) {
      split.forEach((geometry) => geometry.dispose());
      props.onPieceLimit();
      return;
    }
    const source = sourcePieces.find((piece) => piece.id === id);
    if (!source) {
      split.forEach((geometry) => geometry.dispose());
      return;
    }
    setKnifeCutting(true);
    const currentPieces = piecesRef.current;
    const currentSource = currentPieces.find((piece) => piece.id === id);
    if (!currentSource || currentPieces.length >= 14) {
      split.forEach((geometry) => geometry.dispose());
      setKnifeCutting(false);
      return;
    }
    currentSource.geometry.dispose();
    const push = direction.clone().multiplyScalar(0.06);
    const impulse = direction.clone().multiplyScalar(0.75);
    const perpendicular = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      0,
      (Math.random() - 0.5) * 0.3,
    );
    const next = [
      ...currentPieces.filter((piece) => piece.id !== id),
      ...split.map((geometry, index) => {
        const sign = index === 0 ? -1 : 1;
        const perpOffset = perpendicular.clone().multiplyScalar(sign);
        return {
          id: `${id}-${index}-${Date.now()}`,
          geometry,
          position: [
            position[0] + push.x * sign + perpOffset.x * 0.02,
            position[1] + push.y * sign,
            position[2] + push.z * sign + perpOffset.z * 0.02,
          ],
          velocity: [
            impulse.x * sign + perpOffset.x * 1.2,
            0.6 + impulse.y * sign * 0.6,
            impulse.z * sign + perpOffset.z * 1.2,
          ],
          angularVelocity: [
            perpOffset.z * 3.5 * sign,
            (Math.random() - 0.5) * 0.8,
            -perpOffset.x * 3.5 * sign,
          ],
          isCut: true,
          rotation,
        };
      }),
    ];
    piecesRef.current = next;
    setPieces(next);
    window.setTimeout(() => setKnifeCutting(false), 80);
  };
  const dropPiece = (id, position, velocity, rotation, angularVelocity) => {
    const next = piecesRef.current.map((piece) =>
      piece.id === id
        ? {
            ...piece,
            position,
            velocity,
            rotation,
            angularVelocity: angularVelocity || piece.angularVelocity || [0, 0, 0],
            isCut: true,
          }
        : piece,
    );
    piecesRef.current = next;
    setPieces(next);
  };

  useEffect(() => {
    if (orbitRef.current) orbitRef.current.reset();
  }, [props.resetKey]);

  return (
    <>
      {pieces.map((piece) => (
        <JellyPiece
          key={piece.id}
          piece={piece}
          {...props}
          onCut={cutPiece}
          onDrop={dropPiece}
          onGrabChange={(active) => {
            setIsInteracting(active);
            props.onGrabChange?.(active);
          }}
        />
      ))}
      <ContactShadows
        position={[0, -0.99, 0]}
        opacity={0.24}
        scale={5}
        blur={2.5}
        far={2}
      />
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enabled={!isInteracting && !knifeCutting}
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={5}
        autoRotate={false}
      />
    </>
  );
}

class ModelErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Could not load the product 3D model in Jelly Lab:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function CanvasFallback() {
  return (
    <div className="grid h-full min-h-[55vh] place-items-center p-8 text-center text-stone-700">
      <div>
        <div className="font-display text-2xl font-semibold">JELLY LAB</div>
        <p className="mt-2 text-sm">
          Interactive 3D is unavailable on this device.
        </p>
      </div>
    </div>
  );
}

function ModelLoadFailure() {
  return (
    <Html center>
      <div className="w-72 rounded-2xl border border-red-200 bg-white/95 p-5 text-center text-stone-800 shadow-xl">
        <div className="font-semibold">Product model unavailable</div>
        <p className="mt-2 text-xs leading-relaxed text-stone-600">
        This model could not be loaded. Re-upload a self-contained,
        uncompressed GLB from the product editor before using the lab.
        </p>
      </div>
    </Html>
  );
}

export default function JellyScene(props) {
  const wrapperRef = useRef(null);
  const [stroke, setStroke] = useState(null);
  const [cursor, setCursor] = useState(null);
  const handleStroke = (start, end) => {
    if (!start || !end || !wrapperRef.current) {
      setStroke(null);
      return;
    }
    const bounds = wrapperRef.current.getBoundingClientRect();
    setStroke({
      start: [start[0] - bounds.left, start[1] - bounds.top],
      end: [end[0] - bounds.left, end[1] - bounds.top],
    });
  };

  return (
    <div
      ref={wrapperRef}
      className="relative h-[60vh] min-h-[360px] max-h-[760px] overflow-hidden rounded-2xl bg-[#e8e5df]"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setCursor({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
      }}
      onPointerCancel={() => props.onGrabChange(false)}
      onPointerLeave={() => setCursor(null)}
    >
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.25, 3.4], fov: 38 }}
        fallback={<CanvasFallback />}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ cursor: props.tool === "hand" ? "none" : "crosshair" }}
      >
        <StudioEnvironment />
        <Suspense
          fallback={
            <Html center>
              <div className="rounded-full bg-white/90 px-4 py-2 text-xs text-stone-700 shadow">
                Loading product model…
              </div>
            </Html>
          }
        >
          <ModelErrorBoundary key={props.modelUrl} fallback={<ModelLoadFailure />}>
            <ModelGeometryProvider {...props} onStroke={handleStroke} />
          </ModelErrorBoundary>
        </Suspense>
      </Canvas>
      {stroke && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          <line
            x1={stroke.start[0]}
            y1={stroke.start[1]}
            x2={stroke.end[0]}
            y2={stroke.end[1]}
            stroke="#d64c72"
            strokeWidth="3"
            strokeDasharray="7 8"
            strokeLinecap="round"
          />
        </svg>
      )}
      {props.tool === "hand" && cursor && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <svg
            width="34"
            height="38"
            viewBox="0 0 34 38"
            fill="none"
            className="drop-shadow-md"
          >
            <path
              d="M10 18V8.5a2.5 2.5 0 0 1 5 0V17 6.5a2.5 2.5 0 0 1 5 0V17 9a2.5 2.5 0 0 1 5 0v10-5a2.5 2.5 0 0 1 5 0v10c0 6.6-4.8 11-11 11h-2.1c-3.2 0-5.8-1.3-7.6-3.8L4 23.5a2.7 2.7 0 0 1 4.3-3.2L10 22"
              transform="translate(-3 -2)"
              fill={props.isGrabbing ? "#1c1917" : "#fff"}
              stroke="#1c1917"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      {props.tool === "knife" && cursor && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#292524"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-md"
          >
            <path d="m14.5 3.5-9 9 6 6 9-9a4.24 4.24 0 0 0-6-6Z" fill="#f5f5f4" />
            <path d="m5.5 12.5 6 6-3 3-6-6 3-3Z" fill="#a8a29e" />
          </svg>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-600 backdrop-blur">
        Product GLB mesh / jelly material study
      </div>
    </div>
  );
}
