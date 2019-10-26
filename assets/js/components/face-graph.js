module.exports = function() {
	
	var renderer, scene, camera, controls, floor;
	var raycaster = new THREE.Raycaster();
	var black = new THREE.Color('black'), white = new THREE.Color('white'), green = new THREE.Color(0x00ff00), red = new THREE.Color('#ED0000');
	
	var faceMaterial = new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: .2, side: THREE.DoubleSide });
	var greenMaterial = new THREE.MeshBasicMaterial({ color: green });
	var polygon = new THREE.Geometry(), polygonMesh;
	var arrows = [];
	var faceGraph = [];
	var mouse = new THREE.Vector2();
	var stats = new Stats();
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
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
			infiniteScale: 50000
		},
		
		init: function() {

			let self = this;
			self.loadFont();
		},
		
		begin: function() {
			
			let self = this;
			
			scene = gfx.setUpScene(scene);
			renderer = gfx.setUpRenderer(renderer);
			camera = gfx.setUpCamera(camera);
			floor = gfx.addFloor(this.settings.floorSize, scene, this.settings.colors.worldColor, this.settings.colors.gridColor);
			controls = gfx.enableControls(controls, renderer, camera);
			gfx.resizeRendererOnWindowResize(renderer, camera);
			gfx.setUpLights(scene);
			gfx.setCameraLocation(camera, self.settings.defaultCameraLocation);
			self.setUpButtons();
			self.sandbox();
			
			var animate = function() {

				requestAnimationFrame(animate);
				renderer.render(scene, camera);
				controls.update();
			};
			
			animate(); 
		},
		
		sandbox: function() {
			
			let self = this;
			bounds.left = this.createLine(new THREE.Vector3(-this.settings.floorSize/2, 0, -this.settings.floorSize/2), new THREE.Vector3(-this.settings.floorSize/2, 0, this.settings.floorSize/2));
			bounds.right = this.createLine(new THREE.Vector3(this.settings.floorSize/2, 0, -this.settings.floorSize/2), new THREE.Vector3(this.settings.floorSize/2, 0, this.settings.floorSize/2));
			bounds.top = this.createLine(new THREE.Vector3(-this.settings.floorSize/2, 0, -this.settings.floorSize/2), new THREE.Vector3(this.settings.floorSize/2, 0, -this.settings.floorSize/2));
			bounds.bottom = this.createLine(new THREE.Vector3(-this.settings.floorSize/2, 0, this.settings.floorSize/2), new THREE.Vector3(this.settings.floorSize/2, 0, this.settings.floorSize/2));
			bounds.bottomRight = new THREE.Vector3(this.settings.floorSize/2, 0, this.settings.floorSize/2);
			bounds.bottomLeft = new THREE.Vector3(-this.settings.floorSize/2, 0, this.settings.floorSize/2);
			bounds.topLeft = new THREE.Vector3(-this.settings.floorSize/2, 0, -this.settings.floorSize/2);
			bounds.topRight = new THREE.Vector3(this.settings.floorSize/2, 0, -this.settings.floorSize/2);
			
			gfx.labelPoint(new THREE.Vector3(-this.settings.floorSize/2 - 5, 0, 0), '-X', scene, red);
			gfx.labelPoint(new THREE.Vector3(this.settings.floorSize/2 + 1.5, 0, 0), '+X', scene, red);
			gfx.labelPoint(new THREE.Vector3(0, 0, -this.settings.floorSize/2 - 2), '-Z', scene, red);
			gfx.labelPoint(new THREE.Vector3(0, 0, this.settings.floorSize/2 + 4.5), '+Z', scene, red);
			
			self.calculatePolyloop();
		},
		
		drawConvexFace: function(geometry, material) {
			
			let self = this;
			let sortedGeometry = self.sortVerticesClockwise(geometry);
			
			for (let i = 1; i < sortedGeometry.vertices.length - 1; i += 1) {
				sortedGeometry.faces.push(new THREE.Face3(0, i, i + 1));
			}
			
			let mesh = new THREE.Mesh(sortedGeometry, material);
			return mesh;
		},
		
		sortVerticesClockwise: function(geometry) {
			
			let self = this;
			let midpoint = new THREE.Vector3(0, 0, 0);
			geometry.vertices.forEach(function(vertex) {
				midpoint.x += vertex.x - .001; // very slight offset for the case where polygon is a quadrilateral so that not all angles are equal
				midpoint.y += vertex.y;
				midpoint.z += vertex.z - .001;
				
			});
			
			midpoint.x /= geometry.vertices.length;
			midpoint.y /= geometry.vertices.length;
			midpoint.z /= geometry.vertices.length;
			
			let sorted = geometry.clone();
			sorted.vertices.forEach(function(vertex) {
				
				let vec = gfx.createVector(midpoint, vertex);
				let vecNext = gfx.createVector(midpoint, self.next(sorted.vertices, vertex));
				let angle = gfx.getAngleBetweenVectors(vec, vecNext);
				vertex.angle = angle;
			});
			
			sorted.vertices.sort((a, b) => a.angle - b.angle);
			return sorted;
		},
		
		calculatePolyloop: function() {
			
			let self = this;
			scene.remove(polygonMesh);
			
			arrows.forEach(function(arrow, i) { // line object from input arrows
				arrows[i].line = self.createLine(arrows[i].start, arrows[i].end);
			});
			
			arrows.forEach(function(arrow, i) {
				
				self.showArrow(arrows[i].start, arrows[i].end, scene, 0x111111 * i);
				gfx.labelPoint(arrows[i].start, 'arrow' + (i).toString(), scene, red);
			});
			
			// polygon.faces.forEach(function(face, i) {
			// 	self.showCorners(face);
			// });
			
			polygonMesh = new THREE.Mesh(polygon, faceMaterial);
			scene.add(polygonMesh);
		},
		
		getInfiniteFace1: function() {
			
			let self = this;
			let arrow = arrows[0];
			
			let infiniteFaceGeometry = new THREE.Geometry();
			let yAxis = new THREE.Vector3(0, 1, 0);
			let direction = gfx.createVector(arrow.start, arrow.end).setLength(self.settings.infiniteScale);
			let frontLeft = gfx.movePoint(arrow.end.clone(), direction);
			let frontRight = gfx.movePoint(frontLeft, direction.clone().applyAxisAngle(yAxis, -Math.PI / 2));
			let backLeft = gfx.movePoint(arrow.start.clone(), direction.clone().applyAxisAngle(yAxis, Math.PI));
			let backRight = gfx.movePoint(backLeft, direction.clone().applyAxisAngle(yAxis, -Math.PI / 2));
			infiniteFaceGeometry.vertices.push(frontLeft, frontRight, backLeft, backRight);
			
			return infiniteFaceGeometry;
		},
		
		getInfiniteFace2: function() {
			
			let self = this;
			let infiniteFaceGeometry = new THREE.Geometry();
			let corner = polygon.vertices[0];
			
			let yAxis = new THREE.Vector3(0, 1, 0);
			let direction1 = gfx.createVector(arrows[0].end, arrows[0].start).setLength(self.settings.infiniteScale);
			let direction2 = gfx.createVector(arrows[1].end, arrows[1].start).setLength(self.settings.infiniteScale);
			let backCorner1 = gfx.movePoint(corner.clone(), direction1);
			let backCorner2 = gfx.movePoint(corner.clone(), direction2);
			
			infiniteFaceGeometry.vertices.push(corner, backCorner1, backCorner2);
			
			return infiniteFaceGeometry;
		},
		
		nextArrow: function(currentArrow) {
			
			let arrowIndex = arrows.findIndex(function(element) {
				return element === currentArrow;
			});
			return arrows[(arrowIndex + 1) % arrows.length];
		},
		
		next: function(array, currentItem) {
			
			let itemIndex = array.findIndex(function(element) {
				return element === currentItem;
			});
			return array[(itemIndex + 1) % array.length];
		},
		
		nextVertex: function(currentVertex) {
			
			let vertexIndex = polygon.vertices.findIndex(function(element) {
				return element === currentVertex;
			});
			return polygon.vertices[(vertexIndex + 1) % polygon.vertices.length];
		},
		
		showCorners: function(face) {

			let self = this;
			let geometry = new THREE.Geometry();
			let faceVertexIndices = [face.a, face.b, face.c];
			face.corners = [];
			for (let i = 0; i < 3; i++) {
				let corner = polygon.vertices[faceVertexIndices[i]];
				face.corners.push(corner);
				geometry.vertices.push(corner);
			}
			
			let faceCenter = gfx.getCentroid2D(geometry);
			
			for (let i = 0; i < 3; i++) {
				
				let labelDirection = gfx.createVector(face.corners[i], faceCenter).setLength(8);
				let cornerLabelPosition = gfx.movePoint(face.corners[i], labelDirection);
				cornerLabelPosition.y += self.settings.zBuffer;
				cornerLabelPosition.x -= 1; // text centering offset
				gfx.labelPoint(cornerLabelPosition, 'c' + faceVertexIndices[i].toString(), scene, 0xff0000);
			}
		},
		
		findPointsOnBounds: function(line) {
			let result = [];
			let top = this.intersection(line, bounds.top);
			let bottom = this.intersection(line, bounds.bottom);
			let left = this.intersection(line, bounds.left);
			let right = this.intersection(line, bounds.right);
			if (top.x > -this.settings.floorSize/2 && top.y > -this.settings.floorSize/2) {
				result.push(top);
				gfx.showPoint(top, scene);
			}
			if (bottom.x > -this.settings.floorSize/2 + 1 && bottom.y < this.settings.floorSize/2 + 1) {
				result.push(bottom);
				gfx.showPoint(bottom, scene);
			}
			if (left.x > -this.settings.floorSize/2 - 1 && left.y > -this.settings.floorSize/2 - 1) {
				result.push(left);
				gfx.showPoint(left, scene);
			}
			if (right.x < this.settings.floorSize/2 + 1 && right.y < this.settings.floorSize/2 + 1) {
				result.push(right);
				gfx.showPoint(right, scene);
			}
			return result;
		},
		
		loadFont: function() {
			
			let self = this;
			let loader = new THREE.FontLoader();
			let fontPath = '';
			fontPath = 'assets/vendors/js/three.js/examples/fonts/helvetiker_regular.typeface.json';

			loader.load(fontPath, function(font) { // success event
				
				gfx.appSettings.font.fontStyle.font = font;
				self.begin();
				if (gfx.appSettings.axesHelper.activateAxesHelper) gfx.labelAxes(scene);
			},
			function(event) {}, // in progress event
			function(event) { // error event
				gfx.appSettings.font.enable = false;
				self.begin();
			});
		},
		
		addArrow: function(event) {
			
			let self = this;
			event.preventDefault();
			raycaster.setFromCamera(mouse, camera);

			let objects = [];
			objects.push(floor);
			var intersects = raycaster.intersectObjects(objects, true);
			
			if (intersects.length > 0) { // if point clicked intersects with floor
				intersects[0].point.set(intersects[0].point.x, 0, intersects[0].point.z);
				let clickedPoint = intersects[0].point;
				clickedPoint = new THREE.Vector3(clickedPoint.x, self.settings.zBuffer, clickedPoint.z);

				if (arrows.length !== 0 && typeof arrows[arrows.length - 1].end === 'undefined') {
					if (previousArrowPoint) scene.remove(previousArrowPoint);
					arrows[arrows.length - 1].end = clickedPoint;
				}
				else {
					previousArrowPoint = gfx.showPoint(clickedPoint, scene, red);
					arrows.push({ start: clickedPoint, end: undefined});
				}
				
				if (typeof arrows[arrows.length - 1].start !== 'undefined' && typeof arrows[arrows.length - 1].end !== 'undefined') {
					
					this.showArrow(arrows[arrows.length - 1].start, arrows[arrows.length - 1].end, scene);
					self.calculatePolyloop();
					self.updateStructure();
					
					
					scene.remove(infiniteFaceMesh);
					if (arrows.length === 1) {
						
						let infiniteFace = self.getInfiniteFace1();
						infiniteFaceMesh = self.drawConvexFace(infiniteFace, faceMaterial)
						scene.add(infiniteFaceMesh);
					}
					else if (arrows.length === 2) {
						
						scene.remove(infiniteFaceMesh);
						let infiniteFace = self.getInfiniteFace2();
						infiniteFaceMesh = self.drawConvexFace(infiniteFace, faceMaterial)
						scene.add(infiniteFaceMesh);
					}
				}
			}
		},
		
		getNextVertexPair: function(arrow) { // Find vector with smallest positive and greatest negative projection onto infinite line to find the two closest intersecting points
			
			let self = this;
			let result = [];
			let intersectingPoints = [];
			
			arrows.forEach(function(otherArrow) {
					
				if (arrow !== otherArrow) intersectingPoints.push(self.intersection(arrow.line, otherArrow.line));
			});
			
			let min = 100000000, max = -100000000;
			let minIndex = 0, maxIndex = 0;
			intersectingPoints.forEach(function(point, index) {
				
				let unitArrow = gfx.createVector(arrow.start, arrow.end).normalize();
				let pointVec = gfx.createVector(arrow.start, point);
				let dotResult = unitArrow.dot(pointVec, unitArrow);
				
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
		
		updateStructure: function() {
			
			let self = this;
			let newVertices = [];
			newVertices = self.getNextVertexPair(arrows[arrows.length - 1]);
			
			if (newVertices) newVertices.forEach(function(newVertex) {
				
				gfx.showPoint(newVertex, scene, 0xff0000);
				gfx.labelPoint(newVertex, 'v' + (polygon.vertices.length).toString(), scene, 0xff0000);
				polygon.vertices.push(newVertex);
			});
			
			if (polygon.vertices.length > 1 && polygon.vertices.length % 3 === 0) {
				console.log('add face');
				let face = new THREE.Face3(0, 1, 2);
				polygon.faces.push(face);
				
				let customFace = new THREE.Geometry();
				customFace.vertices.push(polygon.vertices[0], polygon.vertices[1], polygon.vertices[2]);
				gfx.showPoints(customFace, scene, red);
				let customFaceMesh = self.drawConvexFace(customFace, faceMaterial);
				
				console.log(polygon.vertices);
				
				// polygon.customFace.geometry.push(customFace);
				// polygon.customFace.mesh.push(customFaceMesh);
				scene.add(customFaceMesh);
			}
		},
		
		showArrow: function(start, end, scene) {
			
			gfx.drawLine(start, end, scene, this.settings.colors.arrowColor);
			// Draw a triangle on the end
			let arrowDirection = gfx.createVector(start, end);
			arrowDirection.setLength(this.settings.arrowHeadSize);				
			let tip = gfx.movePoint(end.clone(), arrowDirection);
			let axis = new THREE.Vector3(0, 1, 0); // rotate a vector around y
			let arrowNormal = arrowDirection.clone().applyAxisAngle(axis, Math.PI / 2);
			arrowNormal.setLength(arrowNormal.length() / 2);
			let left = gfx.movePoint(end.clone(), arrowNormal);
			arrowNormal = arrowNormal.clone().applyAxisAngle(axis, Math.PI);
			let right = gfx.movePoint(end.clone(), arrowNormal);
			let arrowHeadGeometry = gfx.createTriangle(tip, left, right);
			let arrowMaterial = new THREE.MeshBasicMaterial({ color: this.settings.colors.arrowColor });
			let arrowHeadMesh = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
			scene.add(arrowHeadMesh);
		},
		
		addLine: function(pt1, pt2, color) {
			var lineDashedMaterial = new THREE.LineDashedMaterial({
				color: color,
				linewidth: 1,
				scale: 1,
				dashSize: 1,
				gapSize: 1,
			});
			let lineMaterial = new THREE.LineBasicMaterial({ color: color });
			let geometry = this.createLine(pt1, pt2)
			let line = new THREE.Line(geometry, lineMaterial);
			line.computeLineDistances(); // needed for dash material
			scene.add(line);
		},
		
		createLine: function(pt1, pt2) {
			let geometry = new THREE.Geometry();
			geometry.vertices.push(pt1);
			geometry.vertices.push(pt2);
			return geometry;
		},
		
		setUpButtons: function() {
			
			let self = this;
			let message = document.getElementById('message');
			
			let esc = 27;
			let A = 65;
			
			document.addEventListener('keydown', function(event) {
				
				if (event.keyCode === A) {
					adding = true;
					controls.enabled = false;
				}
			});
			
			document.addEventListener('keyup', function(event) {

				if (event.keyCode === A) {
					adding = false;
					controls.enabled = true;
				}
			});
			
			let onMouseMove = function(event) {

				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
			};
			window.addEventListener('mousemove', onMouseMove, false);
			
			document.querySelector('canvas').addEventListener('click', function(event) {
				
				if (adding) {
					self.addArrow(event);
				}
			});
		},
		
		intersection: function(line1, line2) {
			
			let pt1 = line1.vertices[0]; let pt2 = line1.vertices[1];
			let pt3 = line2.vertices[0]; let pt4 = line2.vertices[1];
			let lerpLine1 = ((pt4.x - pt3.x) * (pt1.z - pt3.z) - (pt4.z - pt3.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
			let lerpLine2 = ((pt2.x - pt1.x) * (pt1.z - pt3.z) - (pt2.z - pt1.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
			
			let x = pt1.x + lerpLine1 * (pt2.x - pt1.x);
			let z = pt1.z + lerpLine1 * (pt2.z - pt1.z);
			return new THREE.Vector3(x, 0, z);
		}
	}
}