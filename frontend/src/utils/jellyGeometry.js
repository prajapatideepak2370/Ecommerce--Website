import * as THREE from "three";

const EPSILON = 1e-6;
const POINT_EPSILON_SQUARED = 1e-10;

function samePoint(left, right) {
  return left.distanceToSquared(right) < POINT_EPSILON_SQUARED;
}

function uniquePoints(points) {
  return points.filter(
    (point, index) =>
      points.findIndex((candidate) => samePoint(candidate, point)) === index,
  );
}

function clipTriangle(triangle, keepPositive) {
  const clipped = [];
  for (let index = 0; index < triangle.length; index += 1) {
    const current = triangle[index];
    const next = triangle[(index + 1) % triangle.length];
    const currentInside = keepPositive
      ? current.distance >= -EPSILON
      : current.distance <= EPSILON;
    const nextInside = keepPositive
      ? next.distance >= -EPSILON
      : next.distance <= EPSILON;

    if (currentInside) clipped.push(current.position);
    if (
      (current.distance < -EPSILON && next.distance > EPSILON) ||
      (current.distance > EPSILON && next.distance < -EPSILON)
    ) {
      const amount =
        current.distance / (current.distance - next.distance);
      clipped.push(current.position.clone().lerp(next.position, amount));
    }
  }
  return uniquePoints(clipped);
}

function appendPolygon(target, polygon) {
  if (polygon.length < 3) return;
  for (let index = 1; index < polygon.length - 1; index += 1) {
    const a = polygon[0];
    const b = polygon[index];
    const c = polygon[index + 1];
    if (new THREE.Triangle(a, b, c).getArea() < EPSILON) continue;
    target.push(a, b, c);
  }
}

function pointKey(point) {
  const precision = 1 / Math.sqrt(POINT_EPSILON_SQUARED);
  return `${Math.round(point.x * precision)},${Math.round(point.y * precision)},${Math.round(point.z * precision)}`;
}

function collectCutLoops(segments) {
  const vertices = new Map();
  const edges = [];
  const edgeKeys = new Set();

  const getVertex = (point) => {
    const key = pointKey(point);
    if (!vertices.has(key)) vertices.set(key, { point, edges: [] });
    return [key, vertices.get(key)];
  };

  for (const [start, end] of segments) {
    const [startKey, startVertex] = getVertex(start);
    const [endKey, endVertex] = getVertex(end);
    if (startKey === endKey) continue;
    const edgeKey = [startKey, endKey].sort().join("|");
    if (edgeKeys.has(edgeKey)) continue;
    edgeKeys.add(edgeKey);
    const edge = { startKey, endKey, visited: false };
    const edgeIndex = edges.push(edge) - 1;
    startVertex.edges.push(edgeIndex);
    endVertex.edges.push(edgeIndex);
  }

  const loops = [];
  for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex += 1) {
    const firstEdge = edges[edgeIndex];
    if (firstEdge.visited) continue;

    const startKey = firstEdge.startKey;
    let currentKey = startKey;
    let currentEdgeIndex = edgeIndex;
    const loop = [];
    let closed = false;

    while (true) {
      const edge = edges[currentEdgeIndex];
      edge.visited = true;
      loop.push(vertices.get(currentKey).point);
      currentKey = edge.startKey === currentKey ? edge.endKey : edge.startKey;
      if (currentKey === startKey) {
        closed = true;
        break;
      }
      const nextEdgeIndex = vertices
        .get(currentKey)
        .edges.find((candidate) => !edges[candidate].visited);
      if (nextEdgeIndex === undefined) break;
      currentEdgeIndex = nextEdgeIndex;
    }

    if (closed && loop.length >= 3) loops.push(loop);
  }
  return loops;
}

function getTriangleCutSegment(triangle) {
  const intersections = [];
  for (let index = 0; index < triangle.length; index += 1) {
    const current = triangle[index];
    const next = triangle[(index + 1) % triangle.length];
    if (Math.abs(current.distance) <= EPSILON) {
      intersections.push(current.position);
    }
    if (
      (current.distance < -EPSILON && next.distance > EPSILON) ||
      (current.distance > EPSILON && next.distance < -EPSILON)
    ) {
      const amount =
        current.distance / (current.distance - next.distance);
      intersections.push(current.position.clone().lerp(next.position, amount));
    }
  }
  const points = uniquePoints(intersections);
  return points.length === 2 ? points : null;
}

function appendCaps(target, loops, normal) {
  const tangent = new THREE.Vector3()
    .crossVectors(
      normal,
      Math.abs(normal.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0),
    )
    .normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

  for (const loop of loops) {
    const contour = loop.map((point) => new THREE.Vector2(
      point.dot(tangent),
      point.dot(bitangent),
    ));
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const [aIndex, bIndex, cIndex] of triangles) {
      const a = loop[aIndex];
      let b = loop[bIndex];
      let c = loop[cIndex];
      const faceNormal = new THREE.Vector3()
        .subVectors(b, a)
        .cross(new THREE.Vector3().subVectors(c, a));
      if (faceNormal.dot(normal) < 0) [b, c] = [c, b];
      for (const point of [a, b, c]) {
        target.push(point.x, point.y, point.z);
      }
    }
  }
}

function buildGeometry(vertices, capLoops, capNormal) {
  if (vertices.length < 3) return null;
  const positions = [];
  for (const vertex of vertices) positions.push(vertex.x, vertex.y, vertex.z);
  appendCaps(positions, capLoops, capNormal);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const uvs = [];
  for (let index = 0; index < positions.length; index += 3) {
    uvs.push(positions[index] * 0.5 + 0.5, positions[index + 1] * 0.5 + 0.5);
  }
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function splitGeometryByPlane(sourceGeometry, plane) {
  const geometry = sourceGeometry.index
    ? sourceGeometry.toNonIndexed()
    : sourceGeometry;
  const positions = geometry.getAttribute("position");
  if (!positions || positions.count < 3) {
    if (geometry !== sourceGeometry) geometry.dispose();
    return null;
  }

  const positive = [];
  const negative = [];
  const segments = [];

  for (let index = 0; index + 2 < positions.count; index += 3) {
    const triangle = [0, 1, 2].map((offset) => {
      const position = new THREE.Vector3().fromBufferAttribute(
        positions,
        index + offset,
      );
      return { position, distance: plane.distanceToPoint(position) };
    });
    appendPolygon(positive, clipTriangle(triangle, true));
    appendPolygon(negative, clipTriangle(triangle, false));
    const segment = getTriangleCutSegment(triangle);
    if (segment) segments.push(segment);
  }

  const cutLoops = collectCutLoops(segments);
  const positiveGeometry = buildGeometry(
    positive,
    cutLoops,
    plane.normal.clone().negate(),
  );
  const negativeGeometry = buildGeometry(negative, cutLoops, plane.normal);
  if (geometry !== sourceGeometry) geometry.dispose();

  if (
    !positiveGeometry ||
    !negativeGeometry ||
    positiveGeometry.getAttribute("position").count < 18 ||
    negativeGeometry.getAttribute("position").count < 18
  ) {
    positiveGeometry?.dispose();
    negativeGeometry?.dispose();
    return null;
  }
  return [positiveGeometry, negativeGeometry];
}
