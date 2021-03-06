(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

module.exports = function () {
  var renderer, scene, camera, controls, floor;
  var raycaster = new THREE.Raycaster();
  var black = new THREE.Color('black'),
      white = new THREE.Color('white'),
      green = new THREE.Color(0x00ff00),
      red = new THREE.Color('#ED0000');
  var faceMaterial = new THREE.MeshBasicMaterial({
    color: red,
    transparent: true,
    opacity: .2,
    side: THREE.DoubleSide
  });
  var greenMaterial = new THREE.MeshBasicMaterial({
    color: green
  });
  var polygon = new THREE.Geometry(),
      polygonMesh;
  var arrows = [];
  var faceGraph = [];
  var mouse = new THREE.Vector2();
  var stats = new Stats();
  var wireframeMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x08CDFA
  });
  var adding = false;
  var arrowHelper;
  var previousArrowPoint;
  var bounds = {};
  var infiniteFaceMesh;
  return {
    settings: {
      defaultCameraLocation: {
        x: 0,
        y: 75,
        z: 0
      },
      messageDuration: 2000,
      arrowHeadSize: 1.5,
      colors: {
        worldColor: black,
        gridColor: new THREE.Color('#ED0000'),
        arrowColor: red
      },
      floorSize: 100,
      zBuffer: .1,
      infiniteScale: 50000 //infiniteScale: 50

    },
    init: function init() {
      var self = this;
      self.loadFont();
    },
    begin: function begin() {
      var self = this;
      scene = gfx.setUpScene();
      renderer = gfx.setUpRenderer(renderer);
      camera = gfx.setUpCamera(camera);
      floor = gfx.addFloor(this.settings.floorSize, this.settings.colors.worldColor, this.settings.colors.gridColor);
      controls = gfx.enableControls(controls, renderer, camera);
      gfx.resizeRendererOnWindowResize(renderer, camera);
      gfx.setUpLights();
      gfx.setCameraLocation(camera, self.settings.defaultCameraLocation);
      self.setUpButtons();
      self.sandbox();

      var animate = function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
        controls.update();
      };

      animate();
    },
    sandbox: function sandbox() {
      var self = this;
      bounds.left = this.createLine(new THREE.Vector3(-this.settings.floorSize / 2, 0, -this.settings.floorSize / 2), new THREE.Vector3(-this.settings.floorSize / 2, 0, this.settings.floorSize / 2));
      bounds.right = this.createLine(new THREE.Vector3(this.settings.floorSize / 2, 0, -this.settings.floorSize / 2), new THREE.Vector3(this.settings.floorSize / 2, 0, this.settings.floorSize / 2));
      bounds.top = this.createLine(new THREE.Vector3(-this.settings.floorSize / 2, 0, -this.settings.floorSize / 2), new THREE.Vector3(this.settings.floorSize / 2, 0, -this.settings.floorSize / 2));
      bounds.bottom = this.createLine(new THREE.Vector3(-this.settings.floorSize / 2, 0, this.settings.floorSize / 2), new THREE.Vector3(this.settings.floorSize / 2, 0, this.settings.floorSize / 2));
      bounds.bottomRight = new THREE.Vector3(this.settings.floorSize / 2, 0, this.settings.floorSize / 2);
      bounds.bottomLeft = new THREE.Vector3(-this.settings.floorSize / 2, 0, this.settings.floorSize / 2);
      bounds.topLeft = new THREE.Vector3(-this.settings.floorSize / 2, 0, -this.settings.floorSize / 2);
      bounds.topRight = new THREE.Vector3(this.settings.floorSize / 2, 0, -this.settings.floorSize / 2);
      gfx.labelPoint(new THREE.Vector3(-this.settings.floorSize / 2 - 5, 0, 0), '-X', red);
      gfx.labelPoint(new THREE.Vector3(this.settings.floorSize / 2 + 1.5, 0, 0), '+X', red);
      gfx.labelPoint(new THREE.Vector3(0, 0, -this.settings.floorSize / 2 - 2), '-Z', red);
      gfx.labelPoint(new THREE.Vector3(0, 0, this.settings.floorSize / 2 + 4.5), '+Z', red);
      var geometry = new THREE.Geometry();
      gfx.showPoint(new THREE.Vector3(-40, 0, -20), 0xff0000);
      geometry.vertices.push(new THREE.Vector3(-40, 0, -40), new THREE.Vector3(-20, 0, -40), new THREE.Vector3(-40, 0, -20), new THREE.Vector3(-25, 0, -25));
      gfx.showPoints(geometry, 0xff0000);
      var testMesh = self.drawConvexFace(geometry, faceMaterial);
      testMesh.position.set(testMesh.position.x, -.01, testMesh.position.z);
      scene.add(testMesh);
      var innerPoint = new THREE.Vector3(-30, 0, -30);
      gfx.showPoint(innerPoint, red);
      gfx.pointInPolygon(innerPoint, geometry);
      self.calculatePolyloop();
    },
    drawConvexFace: function drawConvexFace(geometry, material) {
      var self = this;
      var sortedGeometry = self.sortVerticesClockwise(geometry);

      for (var i = 1; i < sortedGeometry.vertices.length - 1; i += 1) {
        sortedGeometry.faces.push(new THREE.Face3(0, i, i + 1));
      }

      var mesh = new THREE.Mesh(sortedGeometry, material);
      return mesh;
    },
    sortVerticesClockwise: function sortVerticesClockwise(geometry) {
      var self = this;
      var midpoint = new THREE.Vector3(0, 0, 0);
      geometry.vertices.forEach(function (vertex) {
        midpoint.x += vertex.x - .001; // very slight offset for the case where polygon is a quadrilateral so that not all angles are equal

        midpoint.y += vertex.y;
        midpoint.z += vertex.z - .001;
      });
      midpoint.x /= geometry.vertices.length;
      midpoint.y /= geometry.vertices.length;
      midpoint.z /= geometry.vertices.length;
      var sorted = geometry.clone();
      sorted.vertices.forEach(function (vertex) {
        var vec = gfx.createVector(midpoint, vertex);
        var vecNext = gfx.createVector(midpoint, self.next(sorted.vertices, vertex));
        var angle = gfx.getAngleBetweenVectors(vec, vecNext);
        vertex.angle = angle;
      });
      sorted.vertices.sort(function (a, b) {
        return a.angle - b.angle;
      });
      return sorted;
    },
    calculatePolyloop: function calculatePolyloop() {
      var self = this;
      scene.remove(polygonMesh);
      arrows.forEach(function (arrow, i) {
        // line object from input arrows
        arrows[i].line = self.createLine(arrows[i].start, arrows[i].end);
      });
      arrows.forEach(function (arrow, i) {
        self.showArrow(arrows[i].start, arrows[i].end, 0x111111 * i);
        gfx.labelPoint(arrows[i].start, 'arrow' + i.toString(), red);
      }); // polygon.faces.forEach(function(face, i) {
      // 	self.showCorners(face);
      // });

      polygonMesh = new THREE.Mesh(polygon, faceMaterial);
      scene.add(polygonMesh);
    },
    getInfiniteFace1: function getInfiniteFace1() {
      var self = this;
      var arrow = arrows[0];
      var infiniteFaceGeometry = new THREE.Geometry();
      var yAxis = new THREE.Vector3(0, 1, 0);
      var direction = gfx.createVector(arrow.start, arrow.end).setLength(self.settings.infiniteScale);
      var frontLeft = gfx.movePoint(arrow.end.clone(), direction);
      var frontRight = gfx.movePoint(frontLeft, direction.clone().applyAxisAngle(yAxis, -Math.PI / 2));
      var backLeft = gfx.movePoint(arrow.start.clone(), direction.clone().applyAxisAngle(yAxis, Math.PI));
      var backRight = gfx.movePoint(backLeft, direction.clone().applyAxisAngle(yAxis, -Math.PI / 2));
      infiniteFaceGeometry.vertices.push(frontLeft, frontRight, backLeft, backRight);
      return infiniteFaceGeometry;
    },
    getInfiniteFace2: function getInfiniteFace2() {
      var self = this;
      var infiniteFaceGeometry = new THREE.Geometry();
      var corner = polygon.vertices[0];
      var yAxis = new THREE.Vector3(0, 1, 0);
      var arrow0 = gfx.createVector(arrows[0].start, arrows[0].end);
      var arrow1 = gfx.createVector(arrows[1].start, arrows[1].end);
      var planeCornerCandidatesA0 = [];
      var planeCornerCandidatesA1 = [];
      var directionA1 = gfx.createVector(corner, gfx.movePoint(corner, arrow1)).setLength(self.settings.infiniteScale);
      var negativeDirectionA1 = gfx.createVector(corner, gfx.movePoint(corner, arrow1.applyAxisAngle(yAxis, Math.PI))).setLength(self.settings.infiniteScale);
      var directionA0 = gfx.createVector(corner, gfx.movePoint(corner, arrow0)).setLength(self.settings.infiniteScale);
      var negativeDirectionA0 = gfx.createVector(corner, gfx.movePoint(corner, arrow0.applyAxisAngle(yAxis, Math.PI))).setLength(self.settings.infiniteScale);
      planeCornerCandidatesA1.push(gfx.movePoint(corner, directionA1), gfx.movePoint(corner, negativeDirectionA1));
      planeCornerCandidatesA0.push(gfx.movePoint(corner, directionA0), gfx.movePoint(corner, negativeDirectionA0));
      planeCornerCandidatesA1 = planeCornerCandidatesA1.filter(function (candidate) {
        return !gfx.isRightTurn(arrows[0].start, arrows[0].end, candidate);
      });
      planeCornerCandidatesA0 = planeCornerCandidatesA0.filter(function (candidate) {
        return !gfx.isRightTurn(arrows[1].start, arrows[1].end, candidate);
      });
      infiniteFaceGeometry.vertices.push(corner, planeCornerCandidatesA0[0], planeCornerCandidatesA1[0]);
      return infiniteFaceGeometry;
    },
    degrees: function degrees(radians) {
      return radians * 180 / Math.PI;
    },
    nextArrow: function nextArrow(currentArrow) {
      var arrowIndex = arrows.findIndex(function (element) {
        return element === currentArrow;
      });
      return arrows[(arrowIndex + 1) % arrows.length];
    },
    next: function next(array, currentItem) {
      var itemIndex = array.findIndex(function (element) {
        return element === currentItem;
      });
      return array[(itemIndex + 1) % array.length];
    },
    nextVertex: function nextVertex(currentVertex) {
      var vertexIndex = polygon.vertices.findIndex(function (element) {
        return element === currentVertex;
      });
      return polygon.vertices[(vertexIndex + 1) % polygon.vertices.length];
    },
    showCorners: function showCorners(face) {
      var self = this;
      var geometry = new THREE.Geometry();
      var faceVertexIndices = [face.a, face.b, face.c];
      face.corners = [];

      for (var i = 0; i < 3; i++) {
        var corner = polygon.vertices[faceVertexIndices[i]];
        face.corners.push(corner);
        geometry.vertices.push(corner);
      }

      var faceCenter = gfx.getCentroid2D(geometry);

      for (var _i = 0; _i < 3; _i++) {
        var labelDirection = gfx.createVector(face.corners[_i], faceCenter).setLength(8);
        var cornerLabelPosition = gfx.movePoint(face.corners[_i], labelDirection);
        cornerLabelPosition.y += self.settings.zBuffer;
        cornerLabelPosition.x -= 1; // text centering offset

        gfx.labelPoint(cornerLabelPosition, 'c' + faceVertexIndices[_i].toString(), 0xff0000);
      }
    },
    findPointsOnBounds: function findPointsOnBounds(line) {
      var result = [];
      var top = this.intersection(line, bounds.top);
      var bottom = this.intersection(line, bounds.bottom);
      var left = this.intersection(line, bounds.left);
      var right = this.intersection(line, bounds.right);

      if (top.x > -this.settings.floorSize / 2 && top.y > -this.settings.floorSize / 2) {
        result.push(top);
        gfx.showPoint(top);
      }

      if (bottom.x > -this.settings.floorSize / 2 + 1 && bottom.y < this.settings.floorSize / 2 + 1) {
        result.push(bottom);
        gfx.showPoint(bottom);
      }

      if (left.x > -this.settings.floorSize / 2 - 1 && left.y > -this.settings.floorSize / 2 - 1) {
        result.push(left);
        gfx.showPoint(left);
      }

      if (right.x < this.settings.floorSize / 2 + 1 && right.y < this.settings.floorSize / 2 + 1) {
        result.push(right);
        gfx.showPoint(right);
      }

      return result;
    },
    loadFont: function loadFont() {
      var self = this;
      var loader = new THREE.FontLoader();
      var fontPath = '';
      fontPath = 'assets/vendors/js/three.js/examples/fonts/helvetiker_regular.typeface.json';
      loader.load(fontPath, function (font) {
        // success event
        gfx.appSettings.font.fontStyle.font = font;
        self.begin();
        if (gfx.appSettings.axesHelper.activateAxesHelper) gfx.labelAxes();
      }, function (event) {}, // in progress event
      function (event) {
        // error event
        gfx.appSettings.font.enable = false;
        self.begin();
      });
    },
    addArrow: function addArrow(event) {
      var self = this;
      event.preventDefault();
      raycaster.setFromCamera(mouse, camera);
      var objects = [];
      objects.push(floor);
      var intersects = raycaster.intersectObjects(objects, true);

      if (intersects.length > 0) {
        // if point clicked intersects with floor
        intersects[0].point.set(intersects[0].point.x, 0, intersects[0].point.z);
        var clickedPoint = intersects[0].point;
        clickedPoint = new THREE.Vector3(clickedPoint.x, self.settings.zBuffer, clickedPoint.z);

        if (arrows.length !== 0 && typeof arrows[arrows.length - 1].end === 'undefined') {
          if (previousArrowPoint) scene.remove(previousArrowPoint);
          arrows[arrows.length - 1].end = clickedPoint;
        } else {
          previousArrowPoint = gfx.showPoint(clickedPoint, red);
          arrows.push({
            start: clickedPoint,
            end: undefined
          });
        }

        if (typeof arrows[arrows.length - 1].start !== 'undefined' && typeof arrows[arrows.length - 1].end !== 'undefined') {
          self.showArrow(arrows[arrows.length - 1].start, arrows[arrows.length - 1].end);
          self.calculatePolyloop();
          self.updateStructure();
          scene.remove(infiniteFaceMesh);

          if (arrows.length === 1) {
            var infiniteFace = self.getInfiniteFace1();
            infiniteFaceMesh = self.drawConvexFace(infiniteFace, faceMaterial);
            scene.add(infiniteFaceMesh);
          } else if (arrows.length === 2) {
            scene.remove(infiniteFaceMesh);

            var _infiniteFace = self.getInfiniteFace2();

            infiniteFaceMesh = self.drawConvexFace(_infiniteFace, faceMaterial);
            scene.add(infiniteFaceMesh);
          }
        }
      }
    },
    getNextVertexPair: function getNextVertexPair(arrow) {
      // Find vector with smallest positive and greatest negative projection onto infinite line to find the two closest intersecting points
      var self = this;
      var result = [];
      var intersectingPoints = [];
      arrows.forEach(function (otherArrow) {
        if (arrow !== otherArrow) intersectingPoints.push(self.intersection(arrow.line, otherArrow.line));
      });
      var min = 100000000,
          max = -100000000;
      var minIndex = 0,
          maxIndex = 0;
      intersectingPoints.forEach(function (point, index) {
        var unitArrow = gfx.createVector(arrow.start, arrow.end).normalize();
        var pointVec = gfx.createVector(arrow.start, point);
        var dotResult = unitArrow.dot(pointVec, unitArrow);

        if (dotResult > 0 && dotResult < min) {
          min = dotResult;
          minIndex = index;
        }

        if (dotResult < 0 && dotResult > max) {
          max = dotResult;
          maxIndex = index;
        }
      });
      if (intersectingPoints[maxIndex]) result.push(intersectingPoints[maxIndex]);
      if (intersectingPoints[minIndex]) result.push(intersectingPoints[minIndex]);
      if (intersectingPoints.length == 1) result.pop();
      if (result.length) return result;
    },
    updateStructure: function updateStructure() {
      var self = this;
      var newVertices = [];
      newVertices = self.getNextVertexPair(arrows[arrows.length - 1]);
      if (newVertices) newVertices.forEach(function (newVertex) {
        gfx.showPoint(newVertex, 0xff0000);
        gfx.labelPoint(newVertex, 'v' + polygon.vertices.length.toString(), 0xff0000);
        polygon.vertices.push(newVertex);
      });

      if (polygon.vertices.length > 1 && polygon.vertices.length % 3 === 0) {
        console.log('add face');
        var face = new THREE.Face3(0, 1, 2);
        polygon.faces.push(face);
        var customFace = new THREE.Geometry();
        customFace.vertices.push(polygon.vertices[0], polygon.vertices[1], polygon.vertices[2]);
        gfx.showPoints(customFace, red);
        var customFaceMesh = self.drawConvexFace(customFace, faceMaterial);
        console.log(polygon.vertices); // polygon.customFace.geometry.push(customFace);
        // polygon.customFace.mesh.push(customFaceMesh);

        scene.add(customFaceMesh);
      }
    },
    showArrow: function showArrow(start, end) {
      gfx.drawLine(start, end, this.settings.colors.arrowColor); // Draw a triangle on the end

      var arrowDirection = gfx.createVector(start, end);
      arrowDirection.setLength(this.settings.arrowHeadSize);
      var tip = gfx.movePoint(end.clone(), arrowDirection);
      var axis = new THREE.Vector3(0, 1, 0); // rotate a vector around y

      var arrowNormal = arrowDirection.clone().applyAxisAngle(axis, Math.PI / 2);
      arrowNormal.setLength(arrowNormal.length() / 2);
      var left = gfx.movePoint(end.clone(), arrowNormal);
      arrowNormal = arrowNormal.clone().applyAxisAngle(axis, Math.PI);
      var right = gfx.movePoint(end.clone(), arrowNormal);
      var arrowHeadGeometry = gfx.createTriangle(tip, left, right);
      var arrowMaterial = new THREE.MeshBasicMaterial({
        color: this.settings.colors.arrowColor
      });
      var arrowHeadMesh = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
      scene.add(arrowHeadMesh);
    },
    addLine: function addLine(pt1, pt2, color) {
      var lineDashedMaterial = new THREE.LineDashedMaterial({
        color: color,
        linewidth: 1,
        scale: 1,
        dashSize: 1,
        gapSize: 1
      });
      var lineMaterial = new THREE.LineBasicMaterial({
        color: color
      });
      var geometry = this.createLine(pt1, pt2);
      var line = new THREE.Line(geometry, lineMaterial);
      line.computeLineDistances(); // needed for dash material

      scene.add(line);
    },
    createLine: function createLine(pt1, pt2) {
      var geometry = new THREE.Geometry();
      geometry.vertices.push(pt1);
      geometry.vertices.push(pt2);
      return geometry;
    },
    setUpButtons: function setUpButtons() {
      var self = this;
      var message = document.getElementById('message');
      var esc = 27;
      var A = 65;
      document.addEventListener('keydown', function (event) {
        if (event.keyCode === A) {
          adding = true;
          controls.enabled = false;
        }
      });
      document.addEventListener('keyup', function (event) {
        if (event.keyCode === A) {
          adding = false;
          controls.enabled = true;
        }
      });

      var onMouseMove = function onMouseMove(event) {
        mouse.x = event.clientX / window.innerWidth * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener('mousemove', onMouseMove, false);
      document.querySelector('canvas').addEventListener('click', function (event) {
        if (adding) {
          self.addArrow(event);
        }
      });
    },
    intersection: function intersection(line1, line2) {
      var pt1 = line1.vertices[0];
      var pt2 = line1.vertices[1];
      var pt3 = line2.vertices[0];
      var pt4 = line2.vertices[1];
      var lerpLine1 = ((pt4.x - pt3.x) * (pt1.z - pt3.z) - (pt4.z - pt3.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
      var lerpLine2 = ((pt2.x - pt1.x) * (pt1.z - pt3.z) - (pt2.z - pt1.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
      var x = pt1.x + lerpLine1 * (pt2.x - pt1.x);
      var z = pt1.z + lerpLine1 * (pt2.z - pt1.z);
      return new THREE.Vector3(x, 0, z);
    }
  };
};

},{}],2:[function(require,module,exports){
"use strict";

(function () {
  var appSettings;
  var scene;

  window.gfx = function () {
    return {
      appSettings: {
        activateLightHelpers: false,
        axesHelper: {
          activateAxesHelper: false,
          axisLength: 10
        },
        font: {
          enable: true,
          fontStyle: {
            font: null,
            size: 2,
            height: 0,
            curveSegments: 1
          }
        },
        errorLogging: false
      },
      activateAxesHelper: function activateAxesHelper() {
        var self = this;
        var axesHelper = new THREE.AxesHelper(gfx.appSettings.axesHelper.axisLength);
        scene.add(axesHelper);
      },
      activateLightHelpers: function activateLightHelpers(lights) {
        for (var i = 0; i < lights.length; i++) {
          var helper = new THREE.DirectionalLightHelper(lights[i], 5, 0x00000);
          scene.add(helper);
        }
      },
      addFloor: function addFloor(size, worldColor, gridColor) {
        var planeGeometry = new THREE.PlaneBufferGeometry(size, size);
        planeGeometry.rotateX(-Math.PI / 2);
        var planeMaterial = new THREE.ShadowMaterial();
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.y = -1;
        plane.receiveShadow = true;
        scene.add(plane);
        var helper = new THREE.GridHelper(size, 20, gridColor, gridColor);
        helper.material.opacity = .75;
        helper.material.transparent = true;
        scene.add(helper);
        scene.background = worldColor; //scene.fog = new THREE.FogExp2(new THREE.Color('black'), 0.002);

        return plane;
      },
      createVector: function createVector(pt1, pt2) {
        return new THREE.Vector3(pt2.x - pt1.x, pt2.y - pt1.y, pt2.z - pt1.z);
      },
      addVectors: function addVectors(vector1, vector2) {
        return new THREE.Vector3(vector1.x + vector2.x, vector1.y + vector2.y, vector1.z + vector2.z);
      },
      getSharedVertices: function getSharedVertices(geometry1, geometry2) {
        var result = new THREE.Geometry();
        geometry1.vertices.forEach(function (geometry1Vertex) {
          geometry2.vertices.forEach(function (geometry2Vertex) {
            if (utils.roundHundreths(geometry1Vertex.x) === utils.roundHundreths(geometry2Vertex.x) && utils.roundHundreths(geometry1Vertex.y) === utils.roundHundreths(geometry2Vertex.y) && utils.roundHundreths(geometry1Vertex.z) === utils.roundHundreths(geometry2Vertex.z)) {
              result.vertices.push(geometry2Vertex);
            }
          });
        });
        return result;
      },
      getHighestVertex: function getHighestVertex(geometry) {
        var self = this;
        var highest = new THREE.Vector3();
        geometry.vertices.forEach(function (vertex) {
          if (vertex.y > highest.y) {
            highest = vertex;
          }
        });
        return new THREE.Vector3(highest.x, highest.y, highest.z);
      },
      pointInPolygon: function pointInPolygon(pt, geometry) {
        var raycaster = new THREE.Raycaster();
        var rayDirection = new THREE.Vector3(10, 0, 10);
        var testRay = raycaster.set(pt, rayDirection);
        gfx.drawLine(pt, rayDirection.clone().setLength(1000));
      },
      getMagnitude: function getMagnitude(vector) {
        var magnitude = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2) + Math.pow(vector.z, 2));
        return magnitude;
      },
      getMidpoint: function getMidpoint(pt1, pt2) {
        var midpoint = new THREE.Vector3();
        midpoint.x = (pt1.x + pt2.x) / 2;
        midpoint.y = (pt1.y + pt2.y) / 2;
        midpoint.z = (pt1.z + pt2.z) / 2;
        return midpoint;
      },
      isRightTurn: function isRightTurn(startingPoint, turningPoint, endingPoint) {
        // This might only work if vectors are flat on the ground since I am using y-component to determine sign
        var segment1 = gfx.createVector(startingPoint, turningPoint);
        var segment2 = gfx.createVector(turningPoint, endingPoint);
        var result = new THREE.Vector3();
        result.crossVectors(segment1, segment2);
        return result.y > 0;
      },
      rotatePointAboutLine: function rotatePointAboutLine(pt, axisPt1, axisPt2, angle) {
        var self = this; // uncomment to visualize endpoints of rotation axis
        // self.showPoint(axisPt1, new THREE.Color('red'));
        // self.showPoint(axisPt2, new THREE.Color('red'));

        var u = new THREE.Vector3(0, 0, 0),
            rotation1 = new THREE.Vector3(0, 0, 0),
            rotation2 = new THREE.Vector3(0, 0, 0);
        var d = 0.0; // Move rotation axis to origin

        rotation1.x = pt.x - axisPt1.x;
        rotation1.y = pt.y - axisPt1.y;
        rotation1.z = pt.z - axisPt1.z; // Get unit vector equivalent to rotation axis

        u.x = axisPt2.x - axisPt1.x;
        u.y = axisPt2.y - axisPt1.y;
        u.z = axisPt2.z - axisPt1.z;
        u.normalize();
        d = Math.sqrt(u.y * u.y + u.z * u.z); // Rotation onto first plane

        if (d != 0) {
          rotation2.x = rotation1.x;
          rotation2.y = rotation1.y * u.z / d - rotation1.z * u.y / d;
          rotation2.z = rotation1.y * u.y / d + rotation1.z * u.z / d;
        } else {
          rotation2 = rotation1;
        } // Rotation rotation onto second plane


        rotation1.x = rotation2.x * d - rotation2.z * u.x;
        rotation1.y = rotation2.y;
        rotation1.z = rotation2.x * u.x + rotation2.z * d; // Oriented to axis, now perform original rotation

        rotation2.x = rotation1.x * Math.cos(angle) - rotation1.y * Math.sin(angle);
        rotation2.y = rotation1.x * Math.sin(angle) + rotation1.y * Math.cos(angle);
        rotation2.z = rotation1.z; // Undo rotation 1

        rotation1.x = rotation2.x * d + rotation2.z * u.x;
        rotation1.y = rotation2.y;
        rotation1.z = -rotation2.x * u.x + rotation2.z * d; // Undo rotation 2

        if (d != 0) {
          rotation2.x = rotation1.x;
          rotation2.y = rotation1.y * u.z / d + rotation1.z * u.y / d;
          rotation2.z = -rotation1.y * u.y / d + rotation1.z * u.z / d;
        } else {
          rotation2 = rotation1;
        } // Move back into place


        rotation1.x = rotation2.x + axisPt1.x;
        rotation1.y = rotation2.y + axisPt1.y;
        rotation1.z = rotation2.z + axisPt1.z;
        return rotation1;
      },
      rotateGeometryAboutLine: function rotateGeometryAboutLine(geometry, axisPt1, axisPt2, angle) {
        var self = this;

        for (var i = 0; i < geometry.vertices.length; i++) {
          geometry.vertices[i].set(gfx.rotatePointAboutLine(geometry.vertices[i], axisPt1, axisPt2, angle).x, gfx.rotatePointAboutLine(geometry.vertices[i], axisPt1, axisPt2, angle).y, gfx.rotatePointAboutLine(geometry.vertices[i], axisPt1, axisPt2, angle).z);
        }

        return geometry;
      },
      setUpScene: function setUpScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);

        if (gfx.appSettings.axesHelper.activateAxesHelper) {
          gfx.activateAxesHelper();
        }

        return scene;
      },
      setUpRenderer: function setUpRenderer(renderer) {
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        return renderer;
      },
      setUpCamera: function setUpCamera(camera) {
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
        return camera;
      },
      showPoints: function showPoints(geometry, color, opacity) {
        var self = this;

        for (var i = 0; i < geometry.vertices.length; i++) {
          gfx.showPoint(geometry.vertices[i], color, opacity);
        }
      },
      showPoint: function showPoint(pt, color, opacity) {
        color = color || 0xff0000;
        opacity = opacity || 1;
        var dotGeometry = new THREE.Geometry();
        dotGeometry.vertices.push(new THREE.Vector3(pt.x, pt.y, pt.z));
        var dotMaterial = new THREE.PointsMaterial({
          size: 10,
          sizeAttenuation: false,
          color: color,
          opacity: opacity,
          transparent: true
        });
        var dot = new THREE.Points(dotGeometry, dotMaterial);
        scene.add(dot);
        return dot;
      },
      showVector: function showVector(vector, origin, color) {
        color = color || 0xff0000;
        var arrowHelper = new THREE.ArrowHelper(vector, origin, vector.length(), color);
        scene.add(arrowHelper);
      },

      /* 	Inputs: pt - point in space to label, in the form of object with x, y, and z properties; label - text content for label; color - optional */
      labelPoint: function labelPoint(pt, label, color) {
        var self = this;

        if (gfx.appSettings.font.enable) {
          color = color || 0xff0000;
          var textGeometry = new THREE.TextGeometry(label, self.appSettings.font.fontStyle);
          var textMaterial = new THREE.MeshBasicMaterial({
            color: color
          });
          var mesh = new THREE.Mesh(textGeometry, textMaterial);
          textGeometry.rotateX(-Math.PI / 2);
          textGeometry.translate(pt.x, pt.y, pt.z);
          scene.add(mesh);
        }
      },
      drawLine: function drawLine(pt1, pt2, color) {
        color = color || 0x0000ff;
        var material = new THREE.LineBasicMaterial({
          color: color
        });
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(pt1.x, pt1.y, pt1.z));
        geometry.vertices.push(new THREE.Vector3(pt2.x, pt2.y, pt2.z));
        var line = new THREE.Line(geometry, material);
        scene.add(line);
      },
      getDistance: function getDistance(pt1, pt2) {
        // create point class?
        var squirt = Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2) + Math.pow(pt2.z - pt1.z, 2);
        return Math.sqrt(squirt);
      },
      labelAxes: function labelAxes() {
        var self = this;

        if (gfx.appSettings.font.enable) {
          var textGeometry = new THREE.TextGeometry('Y', gfx.appSettings.font.fontStyle);
          var textMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00
          });
          var mesh = new THREE.Mesh(textGeometry, textMaterial);
          textGeometry.translate(0, gfx.appSettings.axesHelper.axisLength, 0);
          scene.add(mesh);
          textGeometry = new THREE.TextGeometry('X', gfx.appSettings.font.fontStyle);
          textMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000
          });
          mesh = new THREE.Mesh(textGeometry, textMaterial);
          textGeometry.translate(gfx.appSettings.axesHelper.axisLength, 0, 0);
          scene.add(mesh);
          textGeometry = new THREE.TextGeometry('Z', gfx.appSettings.font.fontStyle);
          textMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff
          });
          mesh = new THREE.Mesh(textGeometry, textMaterial);
          textGeometry.translate(0, 0, gfx.appSettings.axesHelper.axisLength);
          scene.add(mesh);
        }
      },
      setCameraLocation: function setCameraLocation(camera, pt) {
        camera.position.x = pt.x;
        camera.position.y = pt.y;
        camera.position.z = pt.z;
      },
      resizeRendererOnWindowResize: function resizeRendererOnWindowResize(renderer, camera) {
        window.addEventListener('resize', utils.debounce(function () {
          if (renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
          }
        }, 250));
      },
      resetScene: function resetScene(scope) {
        scope.settings.stepCount = 0;

        for (var i = scene.children.length - 1; i >= 0; i--) {
          var obj = scene.children[i];
          scene.remove(obj);
        }

        gfx.addFloor();
        scope.addTetrahedron();
        gfx.setUpLights();
        gfx.setCameraLocation(camera, self.settings.defaultCameraLocation);
      },
      enableControls: function enableControls(controls, renderer, camera) {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled

        controls.dampingFactor = 0.05;
        controls.zoomSpeed = 2;
        controls.enablePan = !utils.mobile();
        controls.panSpeed = 1.5;
        controls.minDistance = 10;
        controls.maxDistance = 800;
        controls.maxPolarAngle = Math.PI / 2;
        return controls;
      },
      enableStats: function enableStats(stats) {
        document.body.appendChild(stats.dom);
      },
      setUpLights: function setUpLights() {
        var self = this;
        var lights = [];
        var color = 0xFFFFFF;
        var intensity = 1;
        var light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
        lights.push(light);
        var light2 = new THREE.DirectionalLight(color, intensity);
        light2.position.set(0, 2, -8);
        scene.add(light2);
        lights.push(light2);

        if (gfx.appSettings.activateLightHelpers) {
          gfx.activateLightHelpers(lights);
        }
      },
      movePoint: function movePoint(pt, vec) {
        return new THREE.Vector3(pt.x + vec.x, pt.y + vec.y, pt.z + vec.z);
      },
      createTriangle: function createTriangle(pt1, pt2, pt3) {
        // return geometry
        var triangleGeometry = new THREE.Geometry();
        triangleGeometry.vertices.push(new THREE.Vector3(pt1.x, pt1.y, pt1.z));
        triangleGeometry.vertices.push(new THREE.Vector3(pt2.x, pt2.y, pt2.z));
        triangleGeometry.vertices.push(new THREE.Vector3(pt3.x, pt3.y, pt3.z));
        triangleGeometry.faces.push(new THREE.Face3(0, 1, 2));
        triangleGeometry.computeFaceNormals();
        return triangleGeometry;
      },
      getCentroid3D: function getCentroid3D(geometry) {
        // Calculating centroid of a tetrahedron: https://www.youtube.com/watch?v=Infxzuqd_F4
        var result = new THREE.Vector3();
        var x = 0,
            y = 0,
            z = 0;

        for (var i = 0; i < geometry.vertices.length; i++) {
          x += geometry.vertices[i].x;
          y += geometry.vertices[i].y;
          z += geometry.vertices[i].z;
        }

        result.x = x / 4;
        result.y = y / 4;
        result.z = z / 4;
        return result;
      },
      getCentroid2D: function getCentroid2D(geometry) {
        // Calculating centroid of a tetrahedron: https://www.youtube.com/watch?v=Infxzuqd_F4
        var result = new THREE.Vector3();
        var x = 0,
            y = 0,
            z = 0;

        for (var i = 0; i < geometry.vertices.length; i++) {
          x += geometry.vertices[i].x;
          y += geometry.vertices[i].y;
          z += geometry.vertices[i].z;
        }

        result.x = x / 3;
        result.y = y / 3;
        result.z = z / 3;
        return result;
      },
      getAngleBetweenVectors: function getAngleBetweenVectors(vector1, vector2) {
        var dot = vector1.dot(vector2);
        var length1 = vector1.length();
        var length2 = vector2.length();
        var angle = Math.acos(dot / (length1 * length2));
        return angle;
      },
      calculateAngle: function calculateAngle(endpoint1, endpoint2, vertex) {
        var vector1 = new THREE.Vector3(endpoint1.x - vertex.x, endpoint1.y - vertex.y, endpoint1.z - vertex.z);
        var vector2 = new THREE.Vector3(endpoint2.x - vertex.x, endpoint2.y - vertex.y, endpoint2.z - vertex.z);
        var angle = vector1.angleTo(vector2);
        return angle;
      }
    };
  }();

  module.exports = window.gfx;
})();

},{}],3:[function(require,module,exports){
"use strict";

var FaceGraph = require('./components/face-graph.js');

var Utilities = require('./utils.js');

var Graphics = require('./graphics.js');

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    FaceGraph().init();
  });
})();

},{"./components/face-graph.js":1,"./graphics.js":2,"./utils.js":4}],4:[function(require,module,exports){
"use strict";

(function () {
  var appSettings;

  window.utils = function () {
    return {
      appSettings: {
        breakpoints: {
          mobileMax: 767,
          tabletMin: 768,
          tabletMax: 991,
          desktopMin: 992,
          desktopLargeMin: 1200
        }
      },
      mobile: function mobile() {
        return window.innerWidth < this.appSettings.breakpoints.tabletMin;
      },
      tablet: function tablet() {
        return window.innerWidth > this.appSettings.breakpoints.mobileMax && window.innerWidth < this.appSettings.breakpoints.desktopMin;
      },
      desktop: function desktop() {
        return window.innerWidth > this.appSettings.breakpoints.desktopMin;
      },
      getBreakpoint: function getBreakpoint() {
        if (window.innerWidth < this.appSettings.breakpoints.tabletMin) return 'mobile';else if (window.innerWidth < this.appSettings.breakpoints.desktopMin) return 'tablet';else return 'desktop';
      },
      debounce: function debounce(func, wait, immediate) {
        var timeout;
        return function () {
          var context = this,
              args = arguments;

          var later = function later() {
            timeout = null;
            if (!immediate) func.apply(context, args);
          };

          var callNow = immediate && !timeout;
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
          if (callNow) func.apply(context, args);
        };
      },

      /* Purpose: Detect if any of the element is currently within the viewport */
      anyOnScreen: function anyOnScreen(element) {
        var win = $(window);
        var viewport = {
          top: win.scrollTop(),
          left: win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        var bounds = element.offset();
        bounds.right = bounds.left + element.outerWidth();
        bounds.bottom = bounds.top + element.outerHeight();
        return !(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom);
      },

      /* Purpose: Detect if an element is vertically on screen; if the top and bottom of the element are both within the viewport. */
      allOnScreen: function allOnScreen(element) {
        var win = $(window);
        var viewport = {
          top: win.scrollTop(),
          left: win.scrollLeft()
        };
        viewport.right = viewport.left + win.width();
        viewport.bottom = viewport.top + win.height();
        var bounds = element.offset();
        bounds.right = bounds.left + element.outerWidth();
        bounds.bottom = bounds.top + element.outerHeight();
        return !(viewport.bottom < bounds.top && viewport.top > bounds.bottom);
      },
      secondsToMilliseconds: function secondsToMilliseconds(seconds) {
        return seconds * 1000;
      },

      /*
      * Purpose: This method allows you to temporarily disable an an element's transition so you can modify its proprties without having it animate those changing properties.
      * Params:
      * 	-element: The element you would like to modify.
      * 	-cssTransformation: The css transformation you would like to make, i.e. {'width': 0, 'height': 0} or 'border', '1px solid black'
      */
      getTransitionDuration: function getTransitionDuration(element) {
        var $element = $(element);
        return utils.secondsToMilliseconds(parseFloat(getComputedStyle($element[0])['transitionDuration']));
      },
      isInteger: function isInteger(number) {
        return number % 1 === 0;
      },
      rotate: function rotate(array) {
        array.push(array.shift());
        return array;
      },
      randomInt: function randomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      roundHundreths: function roundHundreths(num) {
        return Math.round(num * 100) / 100;
      }
    };
  }();

  module.exports = window.utils;
})();

},{}]},{},[3]);
